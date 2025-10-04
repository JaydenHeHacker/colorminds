import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { platform, count = 1 } = await req.json();
    console.log('Auto-posting request:', { userId: user.id, platform, count });

    // Get Pinterest connection and access token
    const { data: connection, error: connError } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'pinterest')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('Pinterest not connected. Please connect your Pinterest account first.');
    }

    const accessToken = Deno.env.get('PINTEREST_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Pinterest access token not configured');
    }

    // Get user's Pinterest boards
    const boards = await getUserBoards(accessToken);
    console.log('Pinterest boards:', boards);
    
    if (!boards || boards.length === 0) {
      throw new Error('No Pinterest boards found. Please create at least one board on Pinterest first.');
    }

    // Use the first board (or you can add logic to select a specific board)
    const targetBoard = boards[0];
    console.log('Using board:', targetBoard.name, targetBoard.id);

    // Get unpublished coloring pages
    const { data: coloringPages, error: pagesError } = await supabase
      .from('coloring_pages')
      .select('*')
      .eq('status', 'published')
      .is('last_posted_at', null)
      .limit(count);

    if (pagesError) throw pagesError;

    if (!coloringPages || coloringPages.length === 0) {
      throw new Error('No unpublished coloring pages available');
    }

    const results = [];

    for (const page of coloringPages) {
      try {
        // Generate marketing content using AI
        const content = await generateMarketingContent(page);

        // Post to Pinterest
        const pinResponse = await createPin(
          accessToken,
          targetBoard.id,
          content.title,
          content.description,
          page.image_url,
          `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/coloring/${page.slug}`
        );

        // Save post record
        await supabase.from('social_posts').insert({
          user_id: user.id,
          coloring_page_id: page.id,
          platform: 'pinterest',
          post_id: pinResponse.id,
          post_url: pinResponse.url,
          title: content.title,
          description: content.description,
          image_url: page.image_url,
          status: 'published',
          posted_at: new Date().toISOString(),
          metadata: { board_id: targetBoard.id, board_name: targetBoard.name },
        });

        // Update coloring page last_posted_at
        await supabase
          .from('coloring_pages')
          .update({ last_posted_at: new Date().toISOString() })
          .eq('id', page.id);

        results.push({
          success: true,
          pageId: page.id,
          pageTitle: page.title,
          pinUrl: pinResponse.url,
        });

        console.log('Successfully posted:', page.title);
      } catch (error) {
        console.error('Error posting page:', page.id, error);
        results.push({
          success: false,
          pageId: page.id,
          pageTitle: page.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalPosted: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getUserBoards(accessToken: string) {
  console.log('Fetching user boards from Pinterest');

  try {
    const response = await fetch('https://api.pinterest.com/v5/boards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Pinterest boards API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinterest boards API error:', response.status, errorText);
      throw new Error(`Pinterest API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Pinterest boards API response:', JSON.stringify(data));
    
    return data.items || [];
  } catch (error) {
    console.error('Pinterest boards API error:', error);
    throw error;
  }
}

async function generateMarketingContent(page: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    // Fallback to simple content generation
    return {
      title: `${page.title} - Free Printable Coloring Page`,
      description: `Download and print this beautiful ${page.title} coloring page for free! Perfect for kids and adults who love coloring. #coloringpages #printable #freeprintables`,
    };
  }

  try {
    const prompt = `Create engaging Pinterest marketing content for a coloring page:

Title: ${page.title}
Description: ${page.description || 'A beautiful coloring page'}
Category: ${page.category || 'General'}

Generate:
1. A catchy, SEO-optimized title (max 100 characters)
2. An engaging description with relevant hashtags (max 500 characters)

The content should appeal to parents, teachers, and coloring enthusiasts. Focus on benefits like stress relief, creativity, and fun.

Return JSON format:
{
  "title": "...",
  "description": "..."
}`;

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
            content: 'You are a social media marketing expert specializing in Pinterest. Always return valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_content',
              description: 'Generate Pinterest marketing content',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Catchy Pinterest title (max 100 chars)',
                  },
                  description: {
                    type: 'string',
                    description: 'Engaging description with hashtags (max 500 chars)',
                  },
                },
                required: ['title', 'description'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_content' } },
      }),
    });

    if (!response.ok) {
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const content = JSON.parse(toolCall.function.arguments);
      return {
        title: content.title.substring(0, 100),
        description: content.description.substring(0, 500),
      };
    }

    throw new Error('No content generated');
  } catch (error) {
    console.error('AI content generation error:', error);
    // Fallback
    return {
      title: `${page.title} - Free Printable Coloring Page`,
      description: `Download this ${page.title} coloring page! Perfect for creative fun. #coloringpages #printable #kids #art`,
    };
  }
}

async function createPin(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  imageUrl: string,
  link?: string
) {
  console.log('Creating Pinterest pin:', { boardId, title, imageUrl });

  try {
    const pinData: any = {
      board_id: boardId,
      title: title.substring(0, 100),
      description: description.substring(0, 500),
      media_source: {
        source_type: 'image_url',
        url: imageUrl,
      },
    };

    if (link) {
      pinData.link = link;
    }

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinterest API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: `https://www.pinterest.com/pin/${data.id}`,
    };
  } catch (error) {
    console.error('Pinterest pin creation error:', error);
    throw error;
  }
}
