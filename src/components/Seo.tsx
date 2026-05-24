import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://barmixhub.ru';
const DEFAULT_IMAGE_URL = `${SITE_URL}/og-image.svg`;
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  imageUrl?: string;
  noindex?: boolean;
  structuredData?: StructuredData;
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra?.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => element?.setAttribute(key, value));
  }
}

export function Seo({
  title,
  description,
  canonicalPath,
  imageUrl = DEFAULT_IMAGE_URL,
  noindex = false,
  structuredData,
}: SeoProps) {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = new URL(canonicalPath ?? location.pathname, SITE_URL).toString();
    const fullTitle = title.includes('BarMixHub') ? title : `${title} | BarMixHub`;
    const robots = noindex ? 'noindex,follow' : DEFAULT_ROBOTS;

    document.title = fullTitle;
    document.documentElement.lang = 'ru';

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:locale', 'ru_RU');
    upsertMeta('property', 'og:site_name', 'BarMixHub');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    upsertLink('canonical', canonicalUrl);
    upsertLink('alternate', canonicalUrl, { hreflang: 'ru-RU' });

    const scriptId = 'seo-structured-data';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [canonicalPath, description, imageUrl, location.pathname, noindex, structuredData, title]);

  return null;
}
