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
    const { category, generationType, difficulty, seriesLength } = await req.json();
    
    if (!category) {
      throw new Error('Category is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating theme for:', { category, generationType, difficulty, seriesLength });

    // Build system prompt based on generation type
    let systemPrompt = 'You are a creative assistant for generating coloring page themes for children. ';
    let userPrompt = '';

    if (generationType === 'series') {
      systemPrompt += `Generate a story-based theme suitable for a ${seriesLength}-page coloring book series. `;
      systemPrompt += 'The theme should have:\n';
      systemPrompt += '- A clear narrative arc with beginning, middle, and end\n';
      systemPrompt += '- Age-appropriate content for children\n';
      systemPrompt += '- Visual variety across scenes\n';
      systemPrompt += '- Engaging characters or subjects that can develop through the story\n';
      
      if (difficulty === 'easy') {
        systemPrompt += '- Simple, clear storylines suitable for young children (ages 3-5)\n';
      } else if (difficulty === 'medium') {
        systemPrompt += '- Moderate complexity suitable for children ages 6-8\n';
      } else {
        systemPrompt += '- More detailed storylines suitable for older children (ages 9-12)\n';
      }
      
      systemPrompt += '\nReturn ONLY the theme title in English (10-30 words). No explanations, no descriptions, just the theme title.';
      userPrompt = `Generate a story series theme for the category "${category}" with ${seriesLength} chapters, difficulty level: ${difficulty}`;
      
    } else {
      systemPrompt += 'Generate a fun, specific theme for a single coloring page. ';
      systemPrompt += 'The theme should be:\n';
      systemPrompt += '- Visual and concrete\n';
      systemPrompt += '- Age-appropriate for children\n';
      systemPrompt += '- Suitable for the specified difficulty level\n';
      
      if (difficulty === 'easy') {
        systemPrompt += '- Simple subjects with clear shapes (ages 3-5)\n';
      } else if (difficulty === 'medium') {
        systemPrompt += '- Moderate detail level (ages 6-8)\n';
      } else {
        systemPrompt += '- More intricate designs (ages 9-12)\n';
      }
      
      systemPrompt += '\nReturn ONLY the theme description in English (5-15 words). No explanations, just the theme.';
      userPrompt = `Generate a coloring page theme for the category "${category}", difficulty: ${difficulty}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const theme = data.choices?.[0]?.message?.content?.trim();

    if (!theme) {
      throw new Error('Failed to generate theme');
    }

    console.log('Generated theme:', theme);

    return new Response(
      JSON.stringify({ success: true, theme }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating theme:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate theme'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});