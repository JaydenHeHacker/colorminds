import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Pinterest verification...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const accessToken = Deno.env.get('PINTEREST_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Pinterest access token not configured');
    }

    console.log('Fetching Pinterest user info...');
    
    // Verify Pinterest connection
    const userInfoResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('Pinterest API error:', userInfoResponse.status, errorText);
      throw new Error(`Invalid Pinterest token: ${userInfoResponse.status}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('Pinterest user verified:', userInfo.username);

    // Get boards
    console.log('Fetching Pinterest boards...');
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    let boards = [];
    if (boardsResponse.ok) {
      const boardsData = await boardsResponse.json();
      boards = boardsData.items || [];
    }

    console.log('Saving connection to database...');
    
    // Save connection
    const { error: upsertError } = await supabase
      .from('social_media_connections')
      .upsert({
        user_id: user.id,
        platform: 'pinterest',
        access_token: 'CONFIGURED_VIA_ENV',
        username: userInfo.username,
        is_active: true,
        metadata: {
          account_type: userInfo.account_type || 'business',
          boards_count: boards.length,
        },
      }, {
        onConflict: 'user_id,platform'
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      throw upsertError;
    }

    console.log('Success!');

    return new Response(
      JSON.stringify({
        success: true,
        username: userInfo.username,
        boardsCount: boards.length,
        boards: boards.slice(0, 5).map((b: any) => ({
          id: b.id,
          name: b.name,
        })),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in verify-pinterest-connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
