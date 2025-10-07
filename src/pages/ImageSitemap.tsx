import { useEffect, useState } from "react";

/**
 * Generate Image Sitemap for Google Image Search
 * This helps Google discover and index all coloring page images
 */
const ImageSitemap = () => {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ImageSitemap component mounted, fetching from edge function...');
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-image-sitemap'
        );
        console.log('ImageSitemap response status:', response.status);
        const xmlText = await response.text();
        console.log('ImageSitemap fetched, length:', xmlText.length);
        setXmlContent(xmlText);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching image sitemap:', error);
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        Loading image sitemap...
      </div>
    );
  }

  return (
    <pre style={{ 
      margin: 0, 
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }}>
      {xmlContent}
    </pre>
  );
};

export default ImageSitemap;
