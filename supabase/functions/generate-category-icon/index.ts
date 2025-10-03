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
    const { categoryName, categoryDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating category icon:', { categoryName, categoryDescription });

    // Create prompt for generating category icon using AI
    const prompt = `You are an expert at selecting the perfect emoji or icon for categories.

Category Name: ${categoryName}
Category Description: ${categoryDescription || 'No description provided'}

Task: Select the single most appropriate emoji that represents this category.

Requirements:
- Return ONLY ONE emoji character
- Choose an emoji that visually represents the category theme
- The emoji should be universally recognizable
- Prefer colorful, expressive emojis over simple ones
- Consider the category's context and target audience

Examples:
- "Animals" → 🐾
- "Nature" → 🌿
- "Holiday" → 🎉
- "Fantasy" → ✨
- "Sports" → ⚽
- "Food" → 🍕

Return ONLY the emoji character, nothing else.`;

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
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    // Extract emoji from response (remove any extra text)
    const emojiMatch = aiResponse.match(/[\p{Emoji}\u200d]+/gu);
    const generatedIcon = emojiMatch ? emojiMatch[0] : '📁';

    console.log('Generated icon:', generatedIcon);

    return new Response(
      JSON.stringify({ 
        success: true,
        icon: generatedIcon
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating category icon:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate category icon' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});