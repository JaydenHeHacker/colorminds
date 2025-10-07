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

    const clientId = Deno.env.get('REDDIT_CLIENT_ID');
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Reddit credentials not configured');
    }

    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      throw new Error('Missing code or redirect_uri');
    }

    console.log('Exchanging Reddit code for access token');

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Reddit token error:', errorText);
      throw new Error(`Failed to get Reddit access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Got Reddit access token');

    // Get user info
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ColorMinds/1.0',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Reddit user info error:', errorText);
      throw new Error(`Failed to get Reddit user info: ${errorText}`);
    }

    const userData = await userResponse.json();
    console.log('Got Reddit user info:', userData.name);

    // Save connection to database
    const { error: upsertError } = await supabase
      .from('social_media_connections')
      .upsert({
        user_id: user.id,
        platform: 'reddit',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        is_active: true,
        metadata: {
          username: userData.name,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        },
      }, {
        onConflict: 'user_id,platform',
      });

    if (upsertError) {
      console.error('Error saving Reddit connection:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: userData.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying Reddit connection:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
