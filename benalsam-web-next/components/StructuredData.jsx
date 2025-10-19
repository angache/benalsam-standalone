import { useEffect } from 'react';

const StructuredData = ({ type = 'website', data = {} }) => {
  useEffect(() => {
    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Create new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    let structuredData = {};

    switch (type) {
      case 'website':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "BenAlsam",
          "description": "İhtiyacınız olan ürün ve hizmetler için alım ilanı verin, teklifler alın!",
          "url": "https://benalsam.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://benalsam.com/ilanlar?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "BenAlsam",
            "logo": {
              "@type": "ImageObject",
              "url": "https://benalsam.com/logo.png"
            }
          }
        };
        break;

      case 'organization':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "BenAlsam",
          "description": "Modern alım ilanları platformu",
          "url": "https://benalsam.com",
          "logo": "https://benalsam.com/logo.png",
          "sameAs": [
            "https://facebook.com/benalsam",
            "https://twitter.com/benalsam",
            "https://instagram.com/benalsam"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "info@benalsam.com"
          }
        };
        break;

      case 'listing':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.title || "İlan",
          "description": data.description || "Ürün veya hizmet ilanı",
          "image": data.image_url || "https://benalsam.com/default-image.jpg",
          "offers": {
            "@type": "Offer",
            "price": data.price || "0",
            "priceCurrency": "TRY",
            "availability": "https://schema.org/InStock"
          },
          "seller": {
            "@type": "Person",
            "name": data.seller_name || "Satıcı"
          }
        };
        break;

      default:
        structuredData = data;
    }

    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [type, data]);

  return null;
};

export default StructuredData;
