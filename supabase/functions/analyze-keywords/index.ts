import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, topN = 1000 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Parse CSV and get top keywords by volume
    const lines = csvData.split('\n').slice(1); // Skip header
    const keywords = lines
      .map((line: string) => {
        const match = line.match(/^"([^"]*)",([^,]*),([^,]*),(\d+),/);
        if (!match) return null;
        return {
          groups: match[1],
          keyword: match[2],
          intent: match[3],
          volume: parseInt(match[4])
        };
      })
      .filter((k: any) => k && k.volume > 0)
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, topN);

    const totalVolume = keywords.reduce((sum: number, k: any) => sum + k.volume, 0);
    const keywordSummary = keywords.map((k: any) => `${k.keyword} (${k.volume})`).join(', ');

    console.log(`Analyzing ${keywords.length} keywords with total volume: ${totalVolume}`);

    // Call Lovable AI to analyze and create category structure
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
            content: `You are an expert SEO and taxonomy specialist for a coloring pages website. 
Your task is to analyze keyword data and create an optimal multi-level category structure.

CRITICAL REQUIREMENTS:
1. Create a 3-level hierarchy: Level 1 (main categories) → Level 2 (sub-categories) → Level 3 (specific topics)
2. Prioritize high-volume keywords (>10,000 searches/month) for main categories
3. Group related keywords logically (e.g., all Disney characters together)
4. Each category should have:
   - English name (e.g., "Animals")
   - URL-friendly slug (e.g., "animals")
   - Suitable emoji icon
   - Brief description
5. Maximum 12 level-1 categories, 8 level-2 categories per parent, 10 level-3 categories per parent
6. Consider search intent and user browsing patterns

Return a JSON structure with this format:
{
  "categories": [
    {
      "name": "Animals",
      "slug": "animals",
      "icon": "🐾",
      "description": "Cute animal coloring pages for kids",
      "level": 1,
      "subcategories": [
        {
          "name": "Cats",
          "slug": "cats",
          "icon": "🐱",
          "description": "Cat coloring pages",
          "level": 2,
          "subcategories": [
            {
              "name": "Cute Cats",
              "slug": "cute-cats",
              "icon": "😻",
              "description": "Adorable cute cat designs",
              "level": 3
            }
          ]
        }
      ]
    }
  ],
  "insights": {
    "totalVolume": 1234567,
    "topCategories": ["Animals", "Characters"],
    "recommendations": ["Consider creating..."]
  }
}`
          },
          {
            role: 'user',
            content: `Analyze these top ${keywords.length} coloring page keywords (total search volume: ${totalVolume}/month) and create an optimal category structure:

${keywordSummary}

Focus on:
- High-volume categories first
- Logical grouping (IP/characters, themes, seasons)
- User-friendly navigation
- SEO optimization`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_category_structure',
              description: 'Return the optimized multi-level category structure',
              parameters: {
                type: 'object',
                properties: {
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        icon: { type: 'string' },
                        description: { type: 'string' },
                        level: { type: 'number' },
                        subcategories: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              slug: { type: 'string' },
                              icon: { type: 'string' },
                              description: { type: 'string' },
                              level: { type: 'number' },
                              subcategories: { type: 'array' }
                            }
                          }
                        }
                      },
                      required: ['name', 'slug', 'icon', 'description', 'level']
                    }
                  },
                  insights: {
                    type: 'object',
                    properties: {
                      totalVolume: { type: 'number' },
                      topCategories: { type: 'array', items: { type: 'string' } },
                      recommendations: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                required: ['categories', 'insights']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_category_structure' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        keywordsAnalyzed: keywords.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-keywords:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});