import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, style = "watercolor" } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for cache access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have a cached version
    console.log(`Checking cache for ${style} style of:`, imageUrl);
    const { data: cachedData } = await supabase
      .from('color_inspiration_cache')
      .select('generated_image_data')
      .eq('source_image_url', imageUrl)
      .eq('style', style)
      .maybeSingle();

    if (cachedData) {
      console.log('Cache hit! Returning cached image');
      return new Response(
        JSON.stringify({ 
          imageUrl: cachedData.generated_image_data,
          style,
          cached: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Cache miss. Generating new image...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Define style prompts for different coloring styles
    const stylePrompts: Record<string, string> = {
      watercolor: "Color this coloring page with vibrant watercolor painting style, soft blends and beautiful color transitions",
      pencil: "Color this coloring page with colored pencil style, showing texture and shading with rich colors",
      marker: "Color this coloring page with bright marker colors, bold and vibrant with clear color boundaries",
      pastel: "Color this coloring page with soft pastel colors, gentle and dreamy tones",
      realistic: "Color this coloring page with realistic colors and natural shading",
      cartoon: "Color this coloring page with bold cartoon-style colors, bright and fun"
    };

    const prompt = stylePrompts[style] || stylePrompts.watercolor;

    console.log(`Generating ${style} coloring inspiration for image:`, imageUrl);

    // Call Lovable AI to edit/color the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the generated image
    const coloredImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!coloredImageUrl) {
      throw new Error('No image generated in response');
    }

    // Save to cache for future use
    console.log('Saving to cache...');
    const { error: cacheError } = await supabase
      .from('color_inspiration_cache')
      .insert({
        source_image_url: imageUrl,
        style: style,
        generated_image_data: coloredImageUrl
      });

    if (cacheError) {
      console.error('Failed to save to cache:', cacheError);
      // Don't fail the request if caching fails
    } else {
      console.log('Successfully cached');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: coloredImageUrl,
        style,
        cached: false
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating color inspiration:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate color inspiration' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
