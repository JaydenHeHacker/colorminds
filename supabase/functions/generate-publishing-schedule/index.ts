import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategorySchedule {
  time: string;
  categoryPattern: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isSeries?: boolean;
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

    const { startDate, weeksCount = 1 } = await req.json();

    if (!startDate) {
      return new Response(
        JSON.stringify({ error: 'Start date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Week 1 schedule template based on PUBLISHING_SCHEDULE_ACTION_PLAN.md
    const weekSchedule = [
      // Day 1 (Monday)
      [
        { time: '09:00', categoryPattern: 'butterfly', difficulty: 'easy' },
        { time: '12:00', categoryPattern: 'spongebob', difficulty: 'easy' },
        { time: '15:00', categoryPattern: 'flower', difficulty: 'easy' },
        { time: '18:00', categoryPattern: 'pokemon', difficulty: 'medium' },
        { time: '21:00', categoryPattern: 'dragon', difficulty: 'easy', isSeries: true },
        { time: '22:00', categoryPattern: 'unicorn', difficulty: 'medium' },
      ],
      // Day 2 (Tuesday)
      [
        { time: '09:00', categoryPattern: 'dog', difficulty: 'easy' },
        { time: '12:00', categoryPattern: 'mermaid', difficulty: 'easy' },
        { time: '15:00', categoryPattern: 'heart', difficulty: 'easy' },
        { time: '18:00', categoryPattern: 'sonic', difficulty: 'medium' },
        { time: '21:00', categoryPattern: 'butterfly', difficulty: 'easy', isSeries: true },
        { time: '22:00', categoryPattern: 'dinosaur', difficulty: 'medium' },
      ],
      // Day 3 (Wednesday)
      [
        { time: '09:00', categoryPattern: 'cat', difficulty: 'easy' },
        { time: '12:00', categoryPattern: 'spongebob', difficulty: 'easy' },
        { time: '15:00', categoryPattern: 'rainbow', difficulty: 'easy' },
        { time: '18:00', categoryPattern: 'hello kitty', difficulty: 'medium' },
        { time: '21:00', categoryPattern: 'mermaid', difficulty: 'easy', isSeries: true },
        { time: '22:00', categoryPattern: 'halloween', difficulty: 'medium' },
      ],
      // Day 4 (Thursday)
      [
        { time: '09:00', categoryPattern: 'dragon', difficulty: 'easy' },
        { time: '12:00', categoryPattern: 'princess', difficulty: 'easy' },
        { time: '15:00', categoryPattern: 'flower', difficulty: 'easy' },
        { time: '18:00', categoryPattern: 'pokemon', difficulty: 'medium' },
        { time: '21:00', categoryPattern: 'dog', difficulty: 'easy', isSeries: true },
        { time: '22:00', categoryPattern: 'spiderman', difficulty: 'medium' },
      ],
      // Day 5 (Friday)
      [
        { time: '09:00', categoryPattern: 'butterfly', difficulty: 'easy' },
        { time: '12:00', categoryPattern: 'spongebob', difficulty: 'easy' },
        { time: '15:00', categoryPattern: 'star', difficulty: 'easy' },
        { time: '18:00', categoryPattern: 'sonic', difficulty: 'medium' },
        { time: '21:00', categoryPattern: 'flower', difficulty: 'easy', isSeries: true },
        { time: '22:00', categoryPattern: 'unicorn', difficulty: 'medium' },
      ],
      // Day 6 (Saturday)
      [
        { time: '10:00', categoryPattern: 'dog', difficulty: 'easy' },
        { time: '10:30', categoryPattern: 'dog', difficulty: 'easy' },
        { time: '14:00', categoryPattern: 'dragon', difficulty: 'easy', isSeries: true },
        { time: '14:30', categoryPattern: 'dragon', difficulty: 'easy', isSeries: true },
        { time: '19:00', categoryPattern: 'hello kitty', difficulty: 'medium' },
        { time: '19:30', categoryPattern: 'pokemon', difficulty: 'medium' },
      ],
      // Day 7 (Sunday)
      [
        { time: '10:00', categoryPattern: 'cat', difficulty: 'easy' },
        { time: '10:30', categoryPattern: 'butterfly', difficulty: 'easy' },
        { time: '14:00', categoryPattern: 'butterfly', difficulty: 'easy', isSeries: true },
        { time: '14:30', categoryPattern: 'butterfly', difficulty: 'easy', isSeries: true },
        { time: '19:00', categoryPattern: 'dinosaur', difficulty: 'medium' },
        { time: '19:30', categoryPattern: 'halloween', difficulty: 'medium' },
      ],
    ] as CategorySchedule[][];

    const scheduleItems = [];
    const usedPageIds = new Set<string>();

    // Generate schedule for specified weeks
    for (let week = 0; week < weeksCount; week++) {
      for (let day = 0; day < 7; day++) {
        const daySchedule = weekSchedule[day];
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (week * 7) + day);

        for (const slot of daySchedule) {
          // Build query for this time slot
          // First get category IDs matching the pattern
          const { data: categories, error: catError } = await supabaseClient
            .from('categories')
            .select('id')
            .ilike('name', `%${slot.categoryPattern}%`);

          if (catError || !categories || categories.length === 0) {
            console.warn(`No category found for pattern: ${slot.categoryPattern}`);
            continue;
          }

          const categoryIds = categories.map(c => c.id);
          
          // Build the NOT IN filter for used pages
          let query = supabaseClient
            .from('coloring_pages')
            .select('id, title, category_id, difficulty, series_id, series_order')
            .eq('status', 'draft')
            .eq('difficulty', slot.difficulty)
            .in('category_id', categoryIds)
            .order('created_at', { ascending: true })
            .limit(20); // Get more to filter used ones

          const { data: allPages, error } = await query;

          if (error) {
            console.error(`Error fetching pages for ${slot.categoryPattern}:`, error);
            continue;
          }

          // Filter out used pages
          const pages = allPages?.filter(p => !usedPageIds.has(p.id)).slice(0, 1);

          if (pages && pages.length > 0) {
            const page = pages[0];
            const [hours, minutes] = slot.time.split(':');
            const scheduledTime = new Date(currentDate);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            scheduleItems.push({
              pageId: page.id,
              title: page.title,
              category: slot.categoryPattern,
              scheduledTime: scheduledTime.toISOString(),
              difficulty: slot.difficulty,
              week: week + 1,
              day: day + 1,
              time: slot.time,
            });

            usedPageIds.add(page.id);
          } else {
            console.warn(`No available page found for ${slot.categoryPattern} (${slot.difficulty}) at ${slot.time} on week ${week + 1}, day ${day + 1}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduleItems,
        totalScheduled: scheduleItems.length,
        weeksGenerated: weeksCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-publishing-schedule:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
