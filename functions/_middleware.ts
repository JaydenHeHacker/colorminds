export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  
  // Handle image-sitemap.xml
  if (url.pathname === '/image-sitemap.xml') {
    try {
      const response = await fetch(
        'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-image-sitemap'
      );
      
      const xml = await response.text();
      
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>',
        {
          status: 500,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        }
      );
    }
  }
  
  // Handle sitemap.xml
  if (url.pathname === '/sitemap.xml') {
    try {
      const response = await fetch(
        'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-sitemap'
      );
      
      const xml = await response.text();
      
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
        {
          status: 500,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        }
      );
    }
  }
  
  // Pass through to next handler
  return context.next();
}
