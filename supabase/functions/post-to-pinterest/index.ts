import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PinterestPostRequest {
  boardId: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  coloringPageId?: string;
}

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

    const body: PinterestPostRequest = await req.json();
    console.log('Pinterest post request:', { userId: user.id, boardId: body.boardId });

    // Get Pinterest credentials from connections table
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

    const accessToken = connection.access_token || 'PINTEREST_ACCESS_TOKEN_PLACEHOLDER';
    
    // Post to Pinterest API
    const pinResponse = await createPin(
      accessToken,
      body.boardId,
      body.title,
      body.description || '',
      body.imageUrl,
      body.link
    );

    // Save post record
    const { error: insertError } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        coloring_page_id: body.coloringPageId,
        platform: 'pinterest',
        post_id: pinResponse.id,
        post_url: pinResponse.url,
        title: body.title,
        description: body.description,
        image_url: body.imageUrl,
        status: 'published',
        posted_at: new Date().toISOString(),
        metadata: { board_id: body.boardId },
      });

    if (insertError) {
      console.error('Error saving post record:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pinUrl: pinResponse.url,
        pinId: pinResponse.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error posting to Pinterest:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createPin(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  imageUrl: string,
  link?: string
) {
  // Placeholder implementation
  // In production, you would use Pinterest API v5:
  // POST https://api.pinterest.com/v5/pins
  console.log('Creating Pinterest pin:', { boardId, title, imageUrl });
  
  try {
    const pinData: any = {
      board_id: boardId,
      title: title.substring(0, 100), // Pinterest title max 100 chars
      description: description.substring(0, 500), // Pinterest description max 500 chars
      media_source: {
        source_type: 'image_url',
        url: imageUrl,
      },
    };

    if (link) {
      pinData.link = link;
    }

    // Actual API call would be:
    // const response = await fetch('https://api.pinterest.com/v5/pins', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(pinData),
    // });

    return {
      id: 'pin_' + Date.now(),
      url: `https://www.pinterest.com/pin/placeholder`,
    };
  } catch (error) {
    console.error('Pinterest API error:', error);
    throw error;
  }
}