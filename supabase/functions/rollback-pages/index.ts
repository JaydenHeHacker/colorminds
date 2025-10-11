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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取需要回滚的页面（12:23-12:24之间发布的）
    const { data: pagesToRollback, error: fetchError } = await supabaseClient
      .from('coloring_pages')
      .select('id, title, published_at')
      .eq('status', 'published')
      .gte('published_at', '2025-10-11T12:23:00.000Z')
      .lt('published_at', '2025-10-11T12:25:00.000Z');

    if (fetchError) {
      throw fetchError;
    }

    if (!pagesToRollback || pagesToRollback.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pages to rollback', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Rolling back ${pagesToRollback.length} pages`);

    // 批量回滚为草稿
    const pageIds = pagesToRollback.map(p => p.id);
    const { error: updateError } = await supabaseClient
      .from('coloring_pages')
      .update({ 
        status: 'draft',
        published_at: null
      })
      .in('id', pageIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully rolled back ${pagesToRollback.length} pages to draft status`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully rolled back ${pagesToRollback.length} pages`,
        count: pagesToRollback.length,
        pages: pagesToRollback.map(p => ({ id: p.id, title: p.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rollback:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
