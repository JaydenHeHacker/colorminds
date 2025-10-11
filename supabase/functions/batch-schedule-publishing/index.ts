import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  pageId: string;
  scheduledTime: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scheduleItems } = await req.json() as { scheduleItems: ScheduleItem[] };

    if (!scheduleItems || scheduleItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No schedule items provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scheduling ${scheduleItems.length} pages...`);

    // Update each page with its scheduled time
    const updates = await Promise.all(
      scheduleItems.map(async (item) => {
        const { data, error } = await supabaseClient
          .from('coloring_pages')
          .update({ 
            scheduled_publish_at: item.scheduledTime,
            status: 'scheduled'
          })
          .eq('id', item.pageId)
          .select();

        if (error) {
          console.error(`Error scheduling page ${item.pageId}:`, error);
          return { pageId: item.pageId, success: false, error: error.message };
        }

        return { pageId: item.pageId, success: true, data };
      })
    );

    const successCount = updates.filter(u => u.success).length;
    const failedCount = updates.filter(u => !u.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: successCount,
        failed: failedCount,
        details: updates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in batch-schedule-publishing:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
