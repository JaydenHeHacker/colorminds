import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedditPostRequest {
  subreddit: string;
  title: string;
  url?: string;
  text?: string;
  imageUrl?: string;
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

    const body: RedditPostRequest = await req.json();
    console.log('Reddit post request:', { userId: user.id, subreddit: body.subreddit });

    // Get Reddit credentials from connections table
    const { data: connection, error: connError } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'reddit')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      throw new Error('Reddit not connected. Please connect your Reddit account first.');
    }

    // TODO: Implement actual Reddit API posting
    // For now, we'll use a placeholder
    const accessToken = connection.access_token || 'REDDIT_ACCESS_TOKEN_PLACEHOLDER';
    
    let postResponse;
    if (body.imageUrl) {
      // Post image
      postResponse = await postRedditImage(
        accessToken,
        body.subreddit,
        body.title,
        body.imageUrl
      );
    } else if (body.url) {
      // Post link
      postResponse = await postRedditLink(
        accessToken,
        body.subreddit,
        body.title,
        body.url,
        body.text
      );
    } else {
      // Post text
      postResponse = await postRedditText(
        accessToken,
        body.subreddit,
        body.title,
        body.text || ''
      );
    }

    // Save post record
    const { error: insertError } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        coloring_page_id: body.coloringPageId,
        platform: 'reddit',
        post_id: postResponse.id,
        post_url: postResponse.url,
        title: body.title,
        description: body.text,
        image_url: body.imageUrl,
        status: 'published',
        posted_at: new Date().toISOString(),
        metadata: { subreddit: body.subreddit },
      });

    if (insertError) {
      console.error('Error saving post record:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        postUrl: postResponse.url,
        postId: postResponse.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error posting to Reddit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function postRedditImage(
  accessToken: string,
  subreddit: string,
  title: string,
  imageUrl: string
) {
  // Placeholder implementation
  // In production, you would:
  // 1. Upload image to Reddit
  // 2. Create a post with the uploaded image
  console.log('Posting image to Reddit:', { subreddit, title, imageUrl });
  
  return {
    id: 'reddit_' + Date.now(),
    url: `https://reddit.com/r/${subreddit}/comments/placeholder`,
  };
}

async function postRedditLink(
  accessToken: string,
  subreddit: string,
  title: string,
  url: string,
  text?: string
) {
  // Placeholder implementation
  console.log('Posting link to Reddit:', { subreddit, title, url });
  
  return {
    id: 'reddit_' + Date.now(),
    url: `https://reddit.com/r/${subreddit}/comments/placeholder`,
  };
}

async function postRedditText(
  accessToken: string,
  subreddit: string,
  title: string,
  text: string
) {
  // Placeholder implementation
  console.log('Posting text to Reddit:', { subreddit, title });
  
  return {
    id: 'reddit_' + Date.now(),
    url: `https://reddit.com/r/${subreddit}/comments/placeholder`,
  };
}