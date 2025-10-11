import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing publishing job: ${jobId}`);

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from('publishing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!job.is_active) {
      console.log('Job is not active, skipping execution');
      return new Response(
        JSON.stringify({ error: 'Job is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query to find draft pages
    let query = supabaseClient
      .from('coloring_pages')
      .select('id, title, category_id')
      .eq('status', 'draft')
      .limit(job.publish_count);

    // Filter by category if specified
    if (job.category_id) {
      query = query.eq('category_id', job.category_id);
    }

    const { data: drafts, error: draftsError } = await query;

    if (draftsError) {
      console.error('Error fetching drafts:', draftsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch drafts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!drafts || drafts.length === 0) {
      console.log('No drafts found matching criteria');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No drafts available to publish',
          published: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${drafts.length} drafts to publish`);

    // Publish the drafts
    const draftIds = drafts.map(d => d.id);
    const { error: publishError } = await supabaseClient
      .from('coloring_pages')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .in('id', draftIds);

    if (publishError) {
      console.error('Error publishing drafts:', publishError);
      return new Response(
        JSON.stringify({ error: 'Failed to publish drafts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate next run time for recurring jobs
    let nextRunAt = null;
    let shouldDeactivate = false;
    
    if (job.is_recurring && job.schedule_days && job.schedule_days.length > 0) {
      const now = new Date();
      const [hours, minutes] = job.schedule_time.split(':').map(Number);
      
      // Find next occurrence
      for (let i = 1; i <= 7; i++) {
        const testDate = new Date(now);
        testDate.setDate(testDate.getDate() + i);
        testDate.setHours(hours, minutes, 0, 0);
        
        // Check if next run is after end_date
        if (job.end_date) {
          const endDate = new Date(job.end_date);
          endDate.setHours(23, 59, 59, 999);
          
          if (testDate > endDate) {
            shouldDeactivate = true;
            break;
          }
        }
        
        if (job.schedule_days.includes(testDate.getDay())) {
          nextRunAt = testDate.toISOString();
          break;
        }
      }
      
      // If no valid next run found and has end_date, deactivate
      if (!nextRunAt && job.end_date) {
        shouldDeactivate = true;
      }
    }

    // Update job execution info
    const updateData: any = {
      last_run_at: new Date().toISOString(),
    };

    if (job.is_recurring) {
      updateData.next_run_at = nextRunAt;
      // Deactivate if reached end date or no more runs
      if (shouldDeactivate) {
        updateData.is_active = false;
      }
    } else {
      // Deactivate one-time jobs after execution
      updateData.is_active = false;
    }

    await supabaseClient
      .from('publishing_jobs')
      .update(updateData)
      .eq('id', jobId);

    console.log(`Successfully published ${drafts.length} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        published: drafts.length,
        pages: drafts.map(d => ({ id: d.id, title: d.title })),
        nextRunAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in execute-publishing-job:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});