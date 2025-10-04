import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, theme, difficulty = 'medium', seriesLength = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating story series:', { category, theme, difficulty, seriesLength });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single();

    if (categoryError || !categoryData) {
      throw new Error(`Category not found: ${category}`);
    }

    const categoryId = categoryData.id;

    // Check if this is a user request (requires credit deduction) or admin/system request (free)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    let isUserRequest = false;
    let subscription = null;
    let credits = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try to get user from token (will fail if it's service role key)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && authUser) {
        // This is a regular user request - need to check credits
        isUserRequest = true;
        user = authUser;
        console.log(`User request from: ${user.id}`);

        // Get user subscription and credits
        const [subResult, creditsResult] = await Promise.all([
          supabase.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
          supabase.from('user_credits').select('*').eq('user_id', user.id).single(),
        ]);

        if (subResult.error || !subResult.data) {
          throw new Error('Failed to fetch subscription data');
        }
        if (creditsResult.error || !creditsResult.data) {
          throw new Error('Failed to fetch credits data');
        }

        subscription = subResult.data;
        credits = creditsResult.data;

        // Check if user has enough credits for series (8 pages = 8 credits)
        const requiredCredits = seriesLength;
        const availableMonthlyQuota = subscription.monthly_quota - subscription.used_quota;
        const availableCredits = credits.balance;

        // User needs either enough monthly quota OR enough credits
        if (availableMonthlyQuota < requiredCredits && availableCredits < requiredCredits) {
          return new Response(
            JSON.stringify({ 
              error: `Insufficient quota or credits. Required: ${requiredCredits}, Available quota: ${availableMonthlyQuota}, Available credits: ${availableCredits}` 
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`User has sufficient resources. Required: ${requiredCredits}, Quota: ${availableMonthlyQuota}, Credits: ${availableCredits}`);
      } else {
        // This is an admin/system request (service role key)
        console.log('Admin/system request - no credit deduction');
      }
    }

    // Step 1: Generate story outline (MUST be in English)
    const outlinePrompt = `Create a ${seriesLength}-page story outline for a children's coloring book.

Theme: ${theme}
Category: ${category}
Number of pages: ${seriesLength}

IMPORTANT: All content must be in English for a US/UK market.

Generate a coherent story with ${seriesLength} scenes. Each scene should:
- Be suitable for children
- Progress the story naturally
- Be visually interesting for a coloring page
- Connect to the previous and next scenes
- Have a clear English description

Return ONLY a JSON array of ${seriesLength} scene descriptions in English. Format:
[
  "Scene 1 description...",
  "Scene 2 description...",
  ...
]`;

    const outlineResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: outlinePrompt
          }
        ]
      }),
    });

    if (!outlineResponse.ok) {
      throw new Error(`Failed to generate story outline: ${outlineResponse.status}`);
    }

    const outlineData = await outlineResponse.json();
    const outlineText = outlineData.choices?.[0]?.message?.content;
    
    // Extract JSON array from the response
    const jsonMatch = outlineText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse story outline');
    }
    
    const scenes = JSON.parse(jsonMatch[0]);
    console.log('Story outline generated:', scenes);

    // Difficulty-based prompt adjustments
    const difficultyPrompts = {
      easy: `Simple, bold outlines with large areas to color. Perfect for young children aged 3-5.
- Very thick lines (5-8px)
- Large, clear shapes
- Minimal details
- Big spaces for easy coloring`,
      medium: `Moderate detail level suitable for children aged 6-8.
- Medium line weight (3-4px)
- Balanced detail and simplicity
- Some decorative elements`,
      hard: `Detailed and intricate design for older children (9+) and adults.
- Fine lines (1-2px)
- Complex patterns and textures
- Many small details
- Intricate backgrounds`
    };

    // Get R2 credentials
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      throw new Error('R2 credentials not configured');
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      endPoint: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKey: R2_ACCESS_KEY_ID,
      secretKey: R2_SECRET_ACCESS_KEY,
      useSSL: true,
      port: 443,
    });

    // Step 2: Generate images for each scene (with English titles)
    const imageUrls = [];
    const generationIds = []; // Track generation IDs for user requests
    
    for (let i = 0; i < scenes.length; i++) {
      let generationId = null;
      
      // Create generation record for user requests
      if (isUserRequest && user) {
        const costType = (subscription!.used_quota < subscription!.monthly_quota) ? 'monthly_quota' : 'credits';
        
        const { data: generation, error: genError } = await supabase
          .from('ai_generations')
          .insert({
            user_id: user.id,
            prompt: `${theme} - Scene ${i + 1}`,
            category_id: categoryId,
            cost_type: costType,
            is_public: false, // Series pages are not public by default
            status: 'processing',
          })
          .select()
          .single();

        if (!genError && generation) {
          generationId = generation.id;
          generationIds.push(generationId);
          console.log(`Created generation record ${i + 1}/${seriesLength}: ${generationId}`);
        }
      }
      
      const scenePrompt = `Create a black and white line art coloring page for a children's story.

Story Scene ${i + 1} of ${seriesLength}: ${scenes[i]}
Category: ${category}
Difficulty: ${difficulty}

${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

Requirements:
- Black lines on white background
- No shading or gradients
- High contrast for easy coloring
- Fun and engaging
- This is part ${i + 1} of ${seriesLength} in a story sequence

IMPORTANT: Generate an English title for this scene suitable for US/UK market.
- Title should describe this specific scene clearly

Make it a ${difficulty} level line drawing perfect for printing and coloring.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: scenePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        console.error(`Failed to generate image for scene ${i + 1}`);
        continue;
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        // Upload image to R2
        console.log(`Uploading image ${i + 1} to R2...`);
        
        // Fetch image from data URI
        const imgResponse = await fetch(imageUrl);
        const imageBuffer = await imgResponse.arrayBuffer();
        const imageBytes = new Uint8Array(imageBuffer);

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `series-${category}-${timestamp}-${i + 1}.png`;

        // Upload to R2
        await s3Client.putObject(fileName, imageBytes, {
          bucketName: R2_BUCKET_NAME,
          metadata: {
            'Content-Type': 'image/png',
          },
        });

        // Construct public URL
        const publicUrl = `https://pub-c60d2f46067e4d25acda5bd5ac88504c.r2.dev/${fileName}`;
        
        imageUrls.push({
          imageUrl: publicUrl,
          sceneDescription: scenes[i],
          order: i + 1,
          generationId: generationIds[i] || null
        });
        
        // Update generation record with image URL for user requests
        if (isUserRequest && generationIds[i]) {
          await supabase
            .from('ai_generations')
            .update({
              image_url: publicUrl,
              status: 'completed',
            })
            .eq('id', generationIds[i]);
        }
        
        console.log(`Generated image ${i + 1}/${seriesLength}`);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('No images generated');
    }

    // Deduct credits for user requests
    if (isUserRequest && user && subscription && credits) {
      const creditsUsed = imageUrls.length;
      const hasMonthlyQuota = subscription.used_quota < subscription.monthly_quota;
      
      if (hasMonthlyQuota && subscription.monthly_quota >= subscription.used_quota + creditsUsed) {
        // Use monthly quota
        await supabase
          .from('user_subscriptions')
          .update({ used_quota: subscription.used_quota + creditsUsed })
          .eq('user_id', user.id);
        
        console.log(`Deducted ${creditsUsed} from monthly quota`);
      } else {
        // Use credits
        await supabase
          .from('user_credits')
          .update({ 
            balance: credits.balance - creditsUsed,
            total_used: credits.total_used + creditsUsed,
          })
          .eq('user_id', user.id);

        // Record credit transaction
        for (const genId of generationIds) {
          if (genId) {
            await supabase.from('credit_transactions').insert({
              user_id: user.id,
              amount: -1,
              transaction_type: 'usage',
              generation_id: genId,
              notes: 'Story series generation',
            });
          }
        }
        
        console.log(`Deducted ${creditsUsed} credits from balance`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        seriesTitle: theme,
        images: imageUrls,
        category,
        difficulty
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating story series:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate story series' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
