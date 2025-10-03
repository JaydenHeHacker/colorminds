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
    const { category, theme, difficulty = 'medium' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating coloring page:', { category, theme, difficulty });

    // Difficulty-based prompt adjustments
    const difficultyPrompts = {
      easy: `Simple, bold outlines with large areas to color. Perfect for young children aged 3-5.
- Very thick lines (5-8px)
- Large, clear shapes
- Minimal details
- Big spaces for easy coloring
- Simple subjects`,
      medium: `Moderate detail level suitable for children aged 6-8.
- Medium line weight (3-4px)
- Balanced detail and simplicity
- Some decorative elements
- Mix of large and small areas`,
      hard: `Detailed and intricate design for older children (9+) and adults.
- Fine lines (1-2px)
- Complex patterns and textures
- Many small details
- Intricate backgrounds
- Suitable for advanced coloring`
    };

    // Create detailed prompt for coloring page (MUST generate in English)
    const prompt = `Create a black and white line art coloring page suitable for children. 
Theme: ${theme}
Category: ${category}
Difficulty: ${difficulty}

${difficultyPrompts[difficulty as keyof typeof difficultyPrompts]}

Requirements:
- Black lines on white background
- No shading or gradients
- High contrast for easy coloring
- Fun and engaging subject matter

IMPORTANT: Generate an English title and description for this coloring page that will be used in a US/UK market.
- Title should be clear and descriptive (e.g., "Cute Cat Playing with Yarn")
- Description should be engaging for parents/children (1-2 sentences)

Make it a ${difficulty} level line drawing perfect for printing and coloring.`;

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
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    // Extract English title from AI response
    const aiText = data.choices?.[0]?.message?.content || '';
    let suggestedTitle = theme;
    let suggestedDescription = '';
    
    // Try to extract title from AI response
    const titleMatch = aiText.match(/Title:\s*([^\n]+)/i);
    if (titleMatch) {
      suggestedTitle = titleMatch[1].trim().replace(/["""]/g, '');
    }
    
    // Try to extract description from AI response
    const descMatch = aiText.match(/Description:\s*([^\n]+)/i);
    if (descMatch) {
      suggestedDescription = descMatch[1].trim().replace(/["""]/g, '');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        category,
        theme,
        suggestedTitle,
        suggestedDescription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating coloring page:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate coloring page' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});