import { useEffect } from "react";

const Sitemap = () => {
  useEffect(() => {
    const fetchAndDisplaySitemap = async () => {
      try {
        const response = await fetch(
          'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-sitemap'
        );
        const xmlText = await response.text();
        
        // Replace entire document with XML
        document.open();
        document.write(xmlText);
        document.close();
      } catch (error) {
        console.error('Error fetching sitemap:', error);
      }
    };

    fetchAndDisplaySitemap();
  }, []);

  return null;
};

export default Sitemap;
