import { useEffect } from "react";

/**
 * Generate Image Sitemap for Google Image Search
 * This helps Google discover and index all coloring page images
 */
const ImageSitemap = () => {
  useEffect(() => {
    const fetchAndDisplaySitemap = async () => {
      try {
        const response = await fetch(
          'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/generate-image-sitemap'
        );
        const xmlText = await response.text();
        
        // Replace entire document with XML
        document.open();
        document.write(xmlText);
        document.close();
      } catch (error) {
        console.error('Error fetching image sitemap:', error);
      }
    };

    fetchAndDisplaySitemap();
  }, []);

  return null;
};

export default ImageSitemap;
