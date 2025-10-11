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
    const { imageUrl, style = "rainbow" } = await req.json();

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

    // Structured prompt templates for color inspiration
    // These generate COLORED reference images (not coloring pages)
    const stylePrompts: Record<string, string> = {
      rainbow: `Transform this coloring page into a vibrant colored illustration with the following specifications:

COLOR PALETTE (CRITICAL - Rainbow Theme):
- Use full rainbow spectrum: red, orange, yellow, green, blue, indigo, violet
- Bright, highly saturated colors with maximum vibrancy
- Distribute rainbow colors across major elements
- Each significant part should use different spectrum colors
- Cheerful, joyful color harmonies

ARTISTIC RENDERING:
- Style: Bright cartoon/children's book illustration
- Shading: Soft cel-shading with gentle gradients
- Lighting: Even, cheerful lighting with soft highlights
- Quality: Professional, polished digital art

COMPOSITION:
- Maintain original line art composition and structure
- Fill all white areas with appropriate colors
- Create visual interest through rainbow color distribution
- Age-appropriate and appealing to children

OUTPUT: A fully colored rainbow-themed reference image.`,

      pastel: `Transform this coloring page into a soft pastel colored illustration with the following specifications:

COLOR PALETTE (CRITICAL - Pastel Theme):
- Gentle tones: light pink, baby blue, mint green, lavender, peach, cream
- Low saturation, high brightness colors (pastel range)
- Harmonious, soothing color combinations
- Soft color transitions and gentle blending
- Dreamy, calming atmosphere

ARTISTIC RENDERING:
- Style: Soft watercolor or gentle digital painting effect
- Shading: Minimal, subtle gradients maintaining softness
- Lighting: Diffused, gentle daylight creating calm mood
- Quality: Elegant, refined nursery art style

COMPOSITION:
- Maintain original structure with soft color fills
- Create peaceful, harmonious visual balance
- All elements should feel gentle and soothing
- Perfect for young children and nurseries

OUTPUT: A fully colored pastel reference image.`,

      warm: `Transform this coloring page into a warm sunset colored illustration with the following specifications:

COLOR PALETTE (CRITICAL - Warm Sunset Theme):
- Sunset colors: vibrant oranges, reds, yellows, golden tones
- Warm temperature palette throughout
- Rich, glowing warm hues with depth
- Gradient transitions between warm tones
- Cozy, inviting atmosphere

ARTISTIC RENDERING:
- Style: Warm digital illustration with glowing quality
- Shading: Warm-toned shadows and golden highlights
- Lighting: Golden hour/sunset lighting creating warmth
- Quality: Professional sunset photography-inspired art

COMPOSITION:
- Maintain original structure with warm color emphasis
- Create cozy, inviting visual mood
- All elements should feel warm and welcoming
- Evoke feelings of comfort and happiness

OUTPUT: A fully colored warm sunset reference image.`,

      cool: `Transform this coloring page into a cool ocean colored illustration with the following specifications:

COLOR PALETTE (CRITICAL - Cool Ocean Theme):
- Ocean colors: various shades of blue, green, teal, aqua, purple
- Cool temperature palette throughout
- Refreshing, calming blue-green harmonies
- Depth through tonal variations of cool colors
- Peaceful, serene atmosphere

ARTISTIC RENDERING:
- Style: Cool digital illustration with aquatic quality
- Shading: Cool-toned shadows with cyan highlights
- Lighting: Underwater or cool daylight creating calm
- Quality: Professional ocean/nature photography-inspired

COMPOSITION:
- Maintain original structure with cool color emphasis
- Create refreshing, peaceful visual mood
- All elements should feel cool and calming
- Evoke feelings of tranquility and serenity

OUTPUT: A fully colored cool ocean reference image.`,

      earth: `Transform this coloring page into a natural earth-toned illustration with the following specifications:

COLOR PALETTE (CRITICAL - Earth Tone Theme):
- Natural colors: browns, tans, olive greens, terracotta, warm neutrals
- Organic, nature-inspired harmonies
- Muted saturation with authentic natural variations
- Grounded, realistic color relationships
- Warm, natural atmosphere

ARTISTIC RENDERING:
- Style: Semi-realistic nature illustration
- Shading: Natural form-based shading with organic light
- Lighting: Warm natural daylight from nature
- Quality: Nature documentary or botanical art style

COMPOSITION:
- Maintain original structure with earth tone fills
- Create authentic, grounded visual mood
- All elements should feel natural and organic
- Evoke connection with nature and outdoors

OUTPUT: A fully colored earth-toned reference image.`,

      neon: `Transform this coloring page into a bold neon colored illustration with the following specifications:

COLOR PALETTE (CRITICAL - Neon Theme):
- Electric colors: fluorescent pink, electric blue, lime green, hot orange
- Maximum saturation with glowing quality
- High contrast neon combinations
- Bold, eye-catching color choices
- Energetic, exciting atmosphere

ARTISTIC RENDERING:
- Style: Bold pop art with neon glow effect
- Shading: Strong cel-shading with glowing highlights
- Lighting: Electric, dramatic with neon glow
- Quality: Modern graphic design/arcade aesthetic

COMPOSITION:
- Maintain original structure with neon emphasis
- Create energetic, attention-grabbing visual
- All elements should pop with neon intensity
- Evoke excitement and modern energy

OUTPUT: A fully colored neon reference image.`
    };

    const prompt = stylePrompts[style] || stylePrompts.rainbow;

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
