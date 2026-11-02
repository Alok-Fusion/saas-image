import React, { useEffect } from 'react';
import { ToolSeo, SITE_URL, SITE_NAME, OG_IMAGE, titleFor } from './site';

export interface FaqItem {
  q: string;
  a: string;
}

export const ToolSeoHead: React.FC<{ tool: ToolSeo }> = ({ tool }) => {
  const fullTitle = titleFor(tool.title);
  const canonicalUrl = `${SITE_URL}/${tool.slug}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (nameOrProp: 'name' | 'property', key: string, val: string) => {
      let el = document.querySelector(`meta[${nameOrProp}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameOrProp, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    setMeta('name', 'description', tool.description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', tool.description);
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', tool.description);
    setMeta('name', 'twitter:image', OG_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [tool, fullTitle, canonicalUrl]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#app`,
        name: tool.name,
        url: canonicalUrl,
        description: tool.description,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
        author: {
          '@id': `${SITE_URL}/#person`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: tool.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export const FaqSchema: React.FC<{ faqs: FaqItem[]; toolSlug: string }> = ({ faqs, toolSlug }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/${toolSlug}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

