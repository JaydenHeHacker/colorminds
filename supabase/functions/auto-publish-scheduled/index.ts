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

    // 获取所有应该发布的定时内容（scheduled_publish_at <= 现在）
    const now = new Date().toISOString();
    
    const { data: scheduledPages, error: fetchError } = await supabaseClient
      .from('coloring_pages')
      .select('id, title, scheduled_publish_at')
      .eq('status', 'scheduled')
      .lte('scheduled_publish_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled pages:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledPages?.length || 0} pages to publish`);

    if (!scheduledPages || scheduledPages.length === 0) {
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
    const pageIds = scheduledPages.map(p => p.id);
    
    const { error: updateError } = await supabaseClient
      .from('coloring_pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        scheduled_publish_at: null
      })
      .in('id', pageIds);

    if (updateError) {
      console.error('Error updating pages:', updateError);
      throw updateError;
    }

    console.log(`Successfully published ${scheduledPages.length} pages:`, 
      scheduledPages.map(p => `${p.title} (${p.id})`).join(', ')
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully published ${scheduledPages.length} pages`,
        publishedCount: scheduledPages.length,
        publishedPages: scheduledPages.map(p => ({ id: p.id, title: p.title }))
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
