import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Sitemap = () => {
  const { data: pages } = useQuery({
    queryKey: ['sitemap-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['sitemap-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('slug, created_at');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (pages && categories) {
      const baseUrl = window.location.origin;
      const today = new Date().toISOString().split('T')[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      // Add category pages
      categories.forEach(category => {
        xml += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${category.created_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      // Add coloring pages
      pages.forEach(page => {
        xml += `
  <url>
    <loc>${baseUrl}/coloring-page/${page.slug}</loc>
    <lastmod>${page.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      xml += `
</urlset>`;

      // Display the sitemap
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; padding: 20px;">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
  }, [pages, categories]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating Sitemap...</h1>
        <p className="text-muted-foreground">Please wait while we generate your sitemap.</p>
      </div>
    </div>
  );
};

export default Sitemap;
