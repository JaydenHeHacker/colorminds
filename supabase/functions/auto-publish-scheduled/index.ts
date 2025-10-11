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

    // 获取所有到期的发布任务
    const now = new Date().toISOString();
    
    const { data: dueJobs, error: fetchError } = await supabaseClient
      .from('publishing_jobs')
      .select('id, name, next_run_at')
      .eq('is_active', true)
      .lte('next_run_at', now);

    if (fetchError) {
      console.error('Error fetching due jobs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueJobs?.length || 0} due jobs to execute`);

    if (!dueJobs || dueJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No jobs due for execution',
          executedCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // 执行每个到期的任务
    const results = [];
    for (const job of dueJobs) {
      console.log(`Executing job: ${job.name} (${job.id})`);
      
      try {
        const executeResponse = await supabaseClient.functions.invoke('execute-publishing-job', {
          body: { jobId: job.id }
        });

        if (executeResponse.error) {
          console.error(`Error executing job ${job.id}:`, executeResponse.error);
          results.push({ 
            jobId: job.id, 
            jobName: job.name, 
            success: false, 
            error: executeResponse.error.message 
          });
        } else {
          console.log(`Successfully executed job ${job.id}:`, executeResponse.data);
          results.push({ 
            jobId: job.id, 
            jobName: job.name, 
            success: true, 
            ...executeResponse.data 
          });
        }
      } catch (error) {
        console.error(`Exception executing job ${job.id}:`, error);
        results.push({ 
          jobId: job.id, 
          jobName: job.name, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Executed ${successCount}/${dueJobs.length} jobs successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Executed ${successCount}/${dueJobs.length} jobs`,
        executedCount: successCount,
        results
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
