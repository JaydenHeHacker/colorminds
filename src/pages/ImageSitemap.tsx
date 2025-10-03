import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate Image Sitemap for Google Image Search
 * This helps Google discover and index all coloring page images
 */
const ImageSitemap = () => {
  const { data: pages } = useQuery({
    queryKey: ['image-sitemap-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (pages) {
      const baseUrl = window.location.origin;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

      pages.forEach(page => {
        const pageUrl = `${baseUrl}/coloring-page/${page.slug}`;
        const categoryName = page.categories?.name || 'Coloring Page';
        const difficulty = page.description?.includes('easy') ? 'Easy' : 
                          page.description?.includes('hard') ? 'Hard' : 'Medium';
        
        xml += `
  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${page.image_url}</image:loc>
      <image:title>${escapeXml(page.title)}</image:title>
      <image:caption>${escapeXml(page.description || `Free printable ${page.title} coloring page for kids and adults`)}</image:caption>
      <image:geo_location>Worldwide</image:geo_location>
      <image:license>https://creativecommons.org/licenses/by-nc/4.0/</image:license>
    </image:image>
    <lastmod>${page.updated_at?.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      xml += `
</urlset>`;

      // Display the sitemap
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; padding: 20px;">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
  }, [pages]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating Image Sitemap...</h1>
        <p className="text-muted-foreground">Please wait while we generate your image sitemap for Google Image Search.</p>
      </div>
    </div>
  );
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

export default ImageSitemap;
