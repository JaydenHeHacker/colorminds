import { useEffect } from "react";

interface StructuredDataProps {
  type: 'WebPage' | 'ImageObject' | 'BreadcrumbList' | 'CollectionPage' | 'FAQPage' | 'ItemList';
  data: any;
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  useEffect(() => {
    let structuredData: any = {
      "@context": "https://schema.org",
      "@type": type,
    };

    if (type === 'ImageObject' && data.image) {
      structuredData = {
        ...structuredData,
        name: data.title,
        description: data.description,
        contentUrl: data.image,
        thumbnailUrl: data.image,
        creator: {
          "@type": "Organization",
          name: "Color Minds"
        },
        copyrightNotice: "Color Minds",
        license: "https://creativecommons.org/licenses/by-nc/4.0/",
        acquireLicensePage: window.location.href,
        category: data.category,
        keywords: data.keywords || [data.category, "coloring page", "printable", "free"],
        datePublished: data.datePublished,
        dateModified: data.dateModified,
        // Additional properties for better image search
        width: data.width || "1024px",
        height: data.height || "1024px",
        encodingFormat: "image/png",
        representativeOfPage: true,
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/DownloadAction",
          userInteractionCount: data.downloadCount || 0
        }
      };
    } else if (type === 'BreadcrumbList' && data.items) {
      structuredData = {
        ...structuredData,
        itemListElement: data.items.map((item: any, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: item.href ? `${window.location.origin}${item.href}` : undefined
        }))
      };
    } else if (type === 'CollectionPage' && data.category) {
      structuredData = {
        ...structuredData,
        name: `${data.category} Coloring Pages`,
        description: data.description,
        url: window.location.href,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: data.numberOfItems,
          itemListElement: data.items?.map((item: any, index: number) => ({
            "@type": "ImageObject",
            position: index + 1,
            name: item.title,
            contentUrl: item.image,
            thumbnailUrl: item.image
          })) || []
        }
      };
    } else if (type === 'WebPage') {
      structuredData = {
        ...structuredData,
        name: data.title,
        description: data.description,
        url: window.location.href,
        mainEntity: data.mainEntity
      };
    } else if (type === 'FAQPage' && data.questions) {
      structuredData = {
        ...structuredData,
        mainEntity: data.questions.map((q: any) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer
          }
        }))
      };
    } else if (type === 'ItemList' && data.items) {
      structuredData = {
        ...structuredData,
        name: data.name || 'Series Collection',
        description: data.description,
        numberOfItems: data.numberOfItems || data.items.length,
        itemListElement: data.items.map((item: any, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: item.title,
            image: item.image,
            url: item.url || `${window.location.origin}/coloring-page/${item.slug}`,
            position: item.position || index + 1
          }
        }))
      };
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = `structured-data-${type.toLowerCase()}`;
    
    // Remove existing script if present
    const existing = document.getElementById(script.id);
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.getElementById(script.id);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [type, data]);

  return null;
};
