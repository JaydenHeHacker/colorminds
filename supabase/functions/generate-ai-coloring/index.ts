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

    const { prompt, category_id, is_private } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt');
    }

    if (!category_id || typeof category_id !== 'string') {
      throw new Error('Category is required');
    }

    console.log(`Generation request from user ${user.id}: ${prompt}`);

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
        prompt: prompt.trim(),
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

    const optimizedPrompt = `Create a simple, child-friendly coloring page with clear black outlines on white background. Theme: ${prompt}. Style: Simple line art suitable for coloring, no shading, no colors, just clean black lines.`;

    console.log('Calling Lovable AI with optimized prompt...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: optimizedPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
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
      await supabase
        .from('user_credits')
        .update({ 
          balance: credits.balance - 1,
          total_used: credits.total_used + 1,
        })
        .eq('user_id', user.id);

      // Record credit transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -1,
        transaction_type: 'usage',
        generation_id: generation.id,
        notes: 'AI generation',
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
