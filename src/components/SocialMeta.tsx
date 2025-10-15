import { useEffect } from "react";

interface SocialMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
}

export const SocialMeta = ({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords
}: SocialMetaProps) => {
  useEffect(() => {
    const currentUrl = url || window.location.href;
    const siteName = "Color Minds";
    
    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, property);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:url', currentUrl);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', siteName);
    
    if (image) {
      setMetaTag('og:image', image);
      setMetaTag('og:image:width', '1200');
      setMetaTag('og:image:height', '630');
      setMetaTag('og:image:alt', title);
    }

    // Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary', false);
    setMetaTag('twitter:title', title, false);
    setMetaTag('twitter:description', description, false);
    
    if (image) {
      setMetaTag('twitter:image', image, false);
      setMetaTag('twitter:image:alt', title, false);
    }

    // Article-specific tags
    if (type === 'article') {
      if (author) {
        setMetaTag('article:author', author);
      }
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime);
      }
    }

    // Keywords meta tag
    if (keywords && keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '), false);
    }

    // Canonical URL
    //let canonical = document.querySelector('link[rel="canonical"]');
    //if (!canonical) {
    //  canonical = document.createElement('link');
    //  canonical.setAttribute('rel', 'canonical');
    //  document.head.appendChild(canonical);
    //}
    //canonical.setAttribute('href', currentUrl);

    // Robots meta
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', false);

  }, [title, description, image, url, type, author, publishedTime, modifiedTime, keywords]);

  return null;
};
