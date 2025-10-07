import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

// Helper function to escape XML special characters
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published coloring pages with image details
    const { data: pages, error } = await supabase
      .from('coloring_pages')
      .select(`
        slug,
        title,
        description,
        image_url,
        updated_at,
        categories (
          name,
          slug
        )
      `)
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const baseUrl = 'https://www.colorminds.fun';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    if (pages) {
      pages.forEach(page => {
        const pageUrl = `${baseUrl}/coloring-page/${page.slug}`;
        const lastmod = page.updated_at ? page.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
        const categoryName = page.categories?.name || 'Coloring Page';
        
        xml += `
  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${escapeXml(page.image_url)}</image:loc>
      <image:title>${escapeXml(page.title)}</image:title>
      <image:caption>${escapeXml(page.description || `Free printable ${page.title} coloring page. Perfect for kids and adults who love ${categoryName} coloring pages.`)}</image:caption>
      <image:geo_location>Worldwide</image:geo_location>
      <image:license>https://creativecommons.org/licenses/by-nc/4.0/</image:license>
    </image:image>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`,
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  }
});
