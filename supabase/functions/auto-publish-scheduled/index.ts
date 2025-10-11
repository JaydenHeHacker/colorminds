import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-publish scheduled content job...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 获取所有草稿状态的内容，每次发布一定数量
    const BATCH_SIZE = 10; // 每次发布10个
    
    const { data: draftPages, error: fetchError } = await supabaseClient
      .from('coloring_pages')
      .select('id, title')
      .eq('status', 'draft')
      .order('created_at', { ascending: true }) // 先发布最早创建的
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching scheduled pages:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${draftPages?.length || 0} draft pages to publish`);

    if (!draftPages || draftPages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pages to publish',
          publishedCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // 批量更新状态为已发布
    const pageIds = draftPages.map(p => p.id);
    
    const { error: updateError } = await supabaseClient
      .from('coloring_pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .in('id', pageIds);

    if (updateError) {
      console.error('Error updating pages:', updateError);
      throw updateError;
    }

    console.log(`Successfully published ${draftPages.length} pages:`, 
      draftPages.map(p => `${p.title} (${p.id})`).join(', ')
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully published ${draftPages.length} pages`,
        publishedCount: draftPages.length,
        publishedPages: draftPages.map(p => ({ id: p.id, title: p.title }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in auto-publish function:', error);
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
