import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

console.log('Generate Image Sitemap Edge Function v1.2 - Starting...');

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
  console.log('=== IMAGE SITEMAP REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    console.log('Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published coloring pages with image details
    console.log('Fetching published coloring pages with images...');
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

    if (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }
    
    console.log(`Found ${pages?.length || 0} published pages`);

    const baseUrl = 'https://www.colorminds.fun';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    if (pages && pages.length > 0) {
      console.log('Building image sitemap XML...');
      pages.forEach(page => {
        // Skip if no image URL
        if (!page.image_url) {
          console.log(`Skipping page ${page.slug} - no image URL`);
          return;
        }

        const pageUrl = `${baseUrl}/coloring-page/${page.slug}`;
        const lastmod = page.updated_at ? page.updated_at.split('T')[0] : new Date().toISOString().split('T')[0];
        
        // Handle categories - it might be an object or null
        const categoryName = page.categories && typeof page.categories === 'object' && 'name' in page.categories
          ? (page.categories as any).name
          : 'Coloring Page';
        
        const caption = page.description || `Free printable ${page.title} coloring page. Perfect for kids and adults who love ${categoryName} coloring pages.`;
        
        xml += `
  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <image:image>
      <image:loc>${escapeXml(page.image_url)}</image:loc>
      <image:title>${escapeXml(page.title)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:geo_location>Worldwide</image:geo_location>
      <image:license>https://creativecommons.org/licenses/by-nc/4.0/</image:license>
    </image:image>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    } else {
      console.log('No pages found for image sitemap');
    }

    xml += `
</urlset>`;

    console.log('Image sitemap generated successfully');
    console.log('XML length:', xml.length);
    console.log('Total images:', pages.length);
    console.log('First 500 chars:', xml.substring(0, 500));

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('!!! ERROR GENERATING IMAGE SITEMAP !!!');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', (error as Error)?.message);
    console.error('Full error:', error);
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
