import { useEffect, useState } from "react";

const Sitemap = () => {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Sitemap component mounted, fetching from edge function...');
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-sitemap'
        );
        console.log('Sitemap response status:', response.status);
        const xmlText = await response.text();
        console.log('Sitemap fetched, length:', xmlText.length);
        setXmlContent(xmlText);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        Loading sitemap...
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

export default Sitemap;
