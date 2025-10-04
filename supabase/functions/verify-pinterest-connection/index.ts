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

    const accessToken = Deno.env.get('PINTEREST_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Pinterest access token not configured. Please add PINTEREST_ACCESS_TOKEN secret.');
    }

    // Verify Pinterest connection by fetching user info
    console.log('Verifying Pinterest connection...');
    const userInfoResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error('Pinterest API error:', errorData);
      throw new Error('Invalid Pinterest access token. Please update your token.');
    }

    const userInfo = await userInfoResponse.json();
    console.log('Pinterest user verified:', userInfo.username);

    // Get boards
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!boardsResponse.ok) {
      throw new Error('Failed to fetch boards');
    }

    const boardsData = await boardsResponse.json();
    const boards = boardsData.items || [];

    // Save connection to database
    const { error: upsertError } = await supabase
      .from('social_media_connections')
      .upsert({
        user_id: user.id,
        platform: 'pinterest',
        access_token: 'CONFIGURED_VIA_ENV',
        username: userInfo.username,
        is_active: true,
        metadata: {
          account_type: userInfo.account_type,
          boards_count: boards.length,
        },
      }, {
        onConflict: 'user_id,platform'
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        success: true,
        username: userInfo.username,
        boardsCount: boards.length,
        boards: boards.map((b: any) => ({
          id: b.id,
          name: b.name,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying Pinterest connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
