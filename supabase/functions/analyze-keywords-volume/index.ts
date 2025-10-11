import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordData {
  keyword: string;
  volume: number;
  kd: number;
  intent: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, minVolume = 500 } = await req.json();

    console.log('Starting keyword analysis...');

    // Parse CSV
    const lines = csvData.split('\n').slice(1); // Skip header
    const keywords: KeywordData[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted fields)
      const match = line.match(/^"([^"]*)",([^,]*),([^,]*),(\d+),(\d+)/);
      if (!match) continue;

      const volume = parseInt(match[4]);
      const kd = parseInt(match[5]);

      if (volume >= minVolume) {
        keywords.push({
          keyword: match[2].trim(),
          volume,
          kd,
          intent: match[3].trim()
        });
      }
    }

    // Sort by volume descending
    keywords.sort((a, b) => b.volume - a.volume);

    // Group by volume ranges
    const ultraHigh = keywords.filter(k => k.volume >= 20000);
    const veryHigh = keywords.filter(k => k.volume >= 10000 && k.volume < 20000);
    const high = keywords.filter(k => k.volume >= 5000 && k.volume < 10000);
    const medium = keywords.filter(k => k.volume >= 2000 && k.volume < 5000);
    const low = keywords.filter(k => k.volume >= 1000 && k.volume < 2000);
    const veryLow = keywords.filter(k => k.volume >= 500 && k.volume < 1000);

    // Extract unique categories (simple extraction from keywords)
    const categories = new Set<string>();
    keywords.forEach(k => {
      const words = k.keyword.toLowerCase().split(' ');
      // Extract potential category names
      const categoryWords = words.filter(w => 
        w !== 'coloring' && 
        w !== 'pages' && 
        w !== 'page' && 
        w !== 'printable' &&
        w !== 'free' &&
        w !== 'cute' &&
        w.length > 2
      );
      categoryWords.forEach(w => categories.add(w));
    });

    const totalVolume = keywords.reduce((sum, k) => sum + k.volume, 0);
    const avgKD = keywords.reduce((sum, k) => sum + k.kd, 0) / keywords.length;

    // Find low-competition opportunities (KD < 25 and Volume > 2000)
    const opportunities = keywords.filter(k => k.kd < 25 && k.volume >= 2000)
      .slice(0, 50);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalKeywords: keywords.length,
          totalVolume,
          avgKD: Math.round(avgKD),
          uniqueCategories: categories.size
        },
        byVolume: {
          ultraHigh: { count: ultraHigh.length, keywords: ultraHigh.slice(0, 20) },
          veryHigh: { count: veryHigh.length, keywords: veryHigh.slice(0, 30) },
          high: { count: high.length, keywords: high.slice(0, 50) },
          medium: { count: medium.length, keywords: medium.slice(0, 100) },
          low: { count: low.length, keywords: low.slice(0, 100) },
          veryLow: { count: veryLow.length, keywords: veryLow.slice(0, 100) }
        },
        opportunities,
        topCategories: Array.from(categories).slice(0, 100)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing keywords:', error);
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
