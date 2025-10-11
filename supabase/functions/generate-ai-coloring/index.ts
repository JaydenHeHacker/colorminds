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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      prompt, 
      category_id, 
      is_private,
      image_data,
      line_complexity,
      image_style,
      line_weight,
      background_mode,
      difficulty = 'medium' // New parameter for text-to-image difficulty
    } = await req.json();
    
    const isImageToImage = !!image_data;
    
    if (!isImageToImage && (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0)) {
      throw new Error('Invalid prompt');
    }

    if (!category_id || typeof category_id !== 'string') {
      throw new Error('Category is required');
    }

    console.log(`Generation request from user ${user.id}:`, isImageToImage ? 'Image-to-Image' : `Text: ${prompt}`);

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

    const subscription = subResult.data;
    const credits = creditsResult.data;

    // Check if user can generate
    const hasMonthlyQuota = subscription.used_quota < subscription.monthly_quota;
    const hasCredits = credits.balance > 0;

    if (!hasMonthlyQuota && !hasCredits) {
      return new Response(
        JSON.stringify({ error: 'Insufficient quota or credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine cost type
    const costType = hasMonthlyQuota ? 'monthly_quota' : 'credits';
    // Free users cannot set private, premium users can choose
    const finalIsPublic = subscription.tier === 'free' ? true : (is_private === false);

    // Create generation record
    const { data: generation, error: genError } = await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        prompt: isImageToImage ? 'Image-to-Image Conversion' : prompt.trim(),
        category_id: category_id,
        cost_type: costType,
        is_public: finalIsPublic,
        status: 'processing',
      })
      .select()
      .single();

    if (genError || !generation) {
      console.error('Failed to create generation record:', genError);
      throw new Error('Failed to create generation record');
    }

    console.log(`Created generation record: ${generation.id}`);

    // Call Lovable AI to generate image
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let optimizedPrompt = '';
    let aiRequestBody: any = {};

    if (isImageToImage) {
      // Build prompt from user options
      const complexityMap: Record<string, string> = {
        'simple': 'very simple with large areas and minimal details, perfect for ages 3-5',
        'medium': 'moderate complexity with clear sections, suitable for ages 6-8',
        'detailed': 'detailed and intricate with fine elements, ideal for ages 9 and above'
      };

      const styleMap: Record<string, string> = {
        'original': 'Keep the original style and proportions as close as possible',
        'cartoon': 'Transform into a fun cartoon style with exaggerated, playful proportions',
        'cute': 'Make it super cute and kawaii with big eyes, soft features, and adorable characteristics'
      };

      const weightMap: Record<string, string> = {
        'thick': 'Use thick, bold lines that are easy for young children to color within',
        'medium': 'Use medium-weight lines that provide a balanced coloring experience',
        'fine': 'Use fine, thin lines for a detailed and precise coloring experience'
      };

      const bgMap: Record<string, string> = {
        'keep': 'Include the background and all environmental elements from the photo',
        'simplify': 'Keep the background but simplify it with fewer details',
        'remove': 'Remove the background completely, focus only on the main subject with a plain white background'
      };

      optimizedPrompt = `CRITICAL: Convert this photo into a black-and-white coloring page while PRESERVING ALL ORIGINAL FEATURES.

MUST PRESERVE:
- Exact facial expressions, emotions, and gestures from the photo
- Original poses, positions, and body language
- All distinctive features and characteristics of subjects
- The composition and layout of the original image
- Maintain accurate proportions and spatial relationships

CONVERSION SETTINGS:
- Line complexity: ${complexityMap[line_complexity || 'medium']}
- Style: ${styleMap[image_style || 'original']}
- Line thickness: ${weightMap[line_weight || 'medium']}
- Background: ${bgMap[background_mode || 'keep']}

OUTPUT REQUIREMENTS:
- Pure black outlines on white background
- No shading, no gray tones, no colors
- Keep the image as faithful as possible to the original photo
- Only convert to line art, DO NOT reimagine or recreate the scene
- Suitable for printing and coloring

IMPORTANT: This should look like a traced version of the original photo, not a new artistic interpretation.`;

      aiRequestBody = {
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: optimizedPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image_data
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      };
    } else {
      // Text to image - using structured prompt template
      
      // Line art settings based on difficulty
      const lineSettings: Record<string, any> = {
        easy: {
          weight: 'very thick (5-8px), bold outlines',
          complexity: '3-5 main shapes with large areas',
          age_group: '3-5 years old',
          detail_level: 'minimal details, simple clear shapes'
        },
        medium: {
          weight: 'medium (3-4px), balanced detail',
          complexity: '5-8 main shapes with moderate detail',
          age_group: '6-8 years old',
          detail_level: 'moderate complexity with clear sections'
        },
        hard: {
          weight: 'fine (1-2px), intricate patterns',
          complexity: '8+ shapes with fine details',
          age_group: '9+ years old',
          detail_level: 'detailed and intricate with complex patterns'
        }
      };

      const settings = lineSettings[difficulty] || lineSettings.medium;

      // Build structured prompt
      optimizedPrompt = `Generate a black-and-white line art coloring page with the following specifications:

SUBJECT & THEME:
- Main theme: ${prompt}
- Target age: ${settings.age_group}
- Composition: Centered, single focal point with ${settings.complexity}

LINE ART SPECIFICATIONS:
- Line weight: ${settings.weight}
- Line quality: Clean, continuous, no breaks or gaps
- Detail level: ${settings.detail_level}
- All shapes must be closed (no open paths) for easy coloring

STYLE REQUIREMENTS (CRITICAL):
- Pure black lines (#000000) on white background (#FFFFFF)
- Absolutely NO gradients, shading, or gray tones
- NO colors - only black outlines
- High contrast for clear printing
- Large clear spaces suitable for coloring
- Age-appropriate and child-friendly content

TECHNICAL SPECS:
- Square aspect ratio (1:1)
- High resolution for printing (300 DPI equivalent)
- Safe margins: 10% border space around the main subject
- Printable and suitable for coloring books

NEGATIVE PROMPTS (DO NOT INCLUDE):
- No colors, shading, gradients, or gray tones
- No blurry, broken, or disconnected lines
- No photorealistic textures or details
- No small complex details that are hard to color
- No violent, scary, or inappropriate content
- No text, logos, or brand names
- Avoid complexity beyond the ${settings.age_group} skill level

OUTPUT: A clean, professional coloring page ready for printing.`;
      
      aiRequestBody = {
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        modalities: ['image', 'text']
      };
    }

    console.log('Calling Lovable AI...', isImageToImage ? 'Image-to-Image' : 'Text-to-Image');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Update generation status to failed
      await supabase
        .from('ai_generations')
        .update({ 
          status: 'failed', 
          error_message: `AI API error: ${aiResponse.status}` 
        })
        .eq('id', generation.id);
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error('No image in AI response:', JSON.stringify(aiData));
      
      await supabase
        .from('ai_generations')
        .update({ 
          status: 'failed', 
          error_message: 'No image generated by AI' 
        })
        .eq('id', generation.id);
      
      throw new Error('No image generated by AI');
    }

    console.log('Image generated successfully, uploading to R2...');

    // Get R2 credentials
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      console.error('R2 credentials not configured');
      
      await supabase
        .from('ai_generations')
        .update({ 
          status: 'failed', 
          error_message: 'R2 credentials not configured' 
        })
        .eq('id', generation.id);
      
      throw new Error('R2 credentials not configured');
    }

    // Convert base64 to Uint8Array
    const base64Data = imageBase64.split(',')[1];
    const binaryString = atob(base64Data);
    const imageBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      imageBuffer[i] = binaryString.charCodeAt(i);
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

    const fileName = `ai-generations/${generation.id}.png`;
    let imageUrl = '';

    try {
      // Upload to R2
      await s3Client.putObject(fileName, imageBuffer, {
        bucketName: R2_BUCKET_NAME,
        metadata: {
          'Content-Type': 'image/png',
        },
      });

      // Construct public URL
      imageUrl = `https://pub-c60d2f46067e4d25acda5bd5ac88504c.r2.dev/${fileName}`;
      console.log('Image uploaded successfully to R2:', imageUrl);

      // Update generation record with image URL and completed status
      await supabase
        .from('ai_generations')
        .update({
          image_url: imageUrl,
          optimized_prompt: optimizedPrompt,
          status: 'completed',
        })
        .eq('id', generation.id);
    } catch (uploadError) {
      console.error('R2 upload error:', uploadError);
      
      await supabase
        .from('ai_generations')
        .update({ 
          status: 'failed', 
          error_message: `R2 upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` 
        })
        .eq('id', generation.id);
      
      throw new Error(`R2 upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    // Update user quota/credits
    if (costType === 'monthly_quota') {
      await supabase
        .from('user_subscriptions')
        .update({ used_quota: subscription.used_quota + 1 })
        .eq('user_id', user.id);
    } else {
      const newBalance = credits.balance - 1;
      
      await supabase
        .from('user_credits')
        .update({ 
          balance: newBalance,
          total_used: credits.total_used + 1,
        })
        .eq('user_id', user.id);

      // Record credit transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -1,
        transaction_type: 'usage',
        balance_after: newBalance,
        generation_id: generation.id,
        description: 'AI coloring page generation',
      });
    }

    console.log(`Generation completed: ${generation.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        generation_id: generation.id,
        image_url: imageUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-coloring:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
