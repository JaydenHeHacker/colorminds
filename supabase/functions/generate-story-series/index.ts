import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Step 1: Generate story outline
    const outlinePrompt = `Create a ${seriesLength}-page story outline for a children's coloring book.

Theme: ${theme}
Category: ${category}
Number of pages: ${seriesLength}

Generate a coherent story with ${seriesLength} scenes. Each scene should:
- Be suitable for children
- Progress the story naturally
- Be visually interesting for a coloring page
- Connect to the previous and next scenes

Return ONLY a JSON array of ${seriesLength} scene descriptions. Format:
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

    // Step 2: Generate images for each scene
    const imageUrls = [];
    for (let i = 0; i < scenes.length; i++) {
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
        imageUrls.push({
          imageUrl,
          sceneDescription: scenes[i],
          order: i + 1
        });
        console.log(`Generated image ${i + 1}/${seriesLength}`);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('No images generated');
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
