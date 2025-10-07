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

    const accessToken = connection.access_token;
    
    if (!accessToken) {
      throw new Error('No access token found for Reddit connection');
    }
    
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
  console.log('Posting image to Reddit:', { subreddit, title, imageUrl });
  
  // Post as a link to the image URL
  // Reddit doesn't support direct image uploads via OAuth for link posts
  const response = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'ColorMinds/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: 'link',
      title: title,
      url: imageUrl,
      resubmit: 'true',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Reddit post error:', errorText);
    throw new Error(`Failed to post to Reddit: ${errorText}`);
  }

  const data = await response.json();
  
  if (data.json?.errors?.length > 0) {
    throw new Error(`Reddit API error: ${JSON.stringify(data.json.errors)}`);
  }
  
  const postUrl = data.json?.data?.url || `https://reddit.com/r/${subreddit}`;
  const postId = data.json?.data?.name || 'reddit_' + Date.now();
  
  return {
    id: postId,
    url: postUrl,
  };
}

async function postRedditLink(
  accessToken: string,
  subreddit: string,
  title: string,
  url: string,
  text?: string
) {
  console.log('Posting link to Reddit:', { subreddit, title, url });
  
  const response = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'ColorMinds/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: 'link',
      title: title,
      url: url,
      resubmit: 'true',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Reddit post error:', errorText);
    throw new Error(`Failed to post to Reddit: ${errorText}`);
  }

  const data = await response.json();
  
  if (data.json?.errors?.length > 0) {
    throw new Error(`Reddit API error: ${JSON.stringify(data.json.errors)}`);
  }
  
  const postUrl = data.json?.data?.url || `https://reddit.com/r/${subreddit}`;
  const postId = data.json?.data?.name || 'reddit_' + Date.now();
  
  return {
    id: postId,
    url: postUrl,
  };
}

async function postRedditText(
  accessToken: string,
  subreddit: string,
  title: string,
  text: string
) {
  console.log('Posting text to Reddit:', { subreddit, title });
  
  const response = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'ColorMinds/1.0',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: 'self',
      title: title,
      text: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Reddit post error:', errorText);
    throw new Error(`Failed to post to Reddit: ${errorText}`);
  }

  const data = await response.json();
  
  if (data.json?.errors?.length > 0) {
    throw new Error(`Reddit API error: ${JSON.stringify(data.json.errors)}`);
  }
  
  const postUrl = data.json?.data?.url || `https://reddit.com/r/${subreddit}`;
  const postId = data.json?.data?.name || 'reddit_' + Date.now();
  
  return {
    id: postId,
    url: postUrl,
  };
}