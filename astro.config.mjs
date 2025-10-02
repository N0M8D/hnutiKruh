import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import lit from '@astrojs/lit';
import astroIcon from 'astro-icon';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: 'https://www.hnutikruh.cz', // sjednoceno s robots.txt (použij apex nebo www konzistentně)
  integrations: [
    astroIcon({
      collections: {
        'simple-icons': async () => import('@iconify-json/simple-icons/icons.json'),
      },
    }),
    sitemap({
      filter: (page) => {
        // page může být objekt { url } nebo string; normalizujeme
        const urlPath = typeof page === 'string' ? page : (page?.url || '');
        const blocked = [
          '/thank-you', '/thank-you-donation', '/admin', '/login', '/registrace', '/uzivatele', '/kosik', '/objednavka', '/soukrome'
        ];
        if (!urlPath) return false;
        if (blocked.some(b => urlPath === b || urlPath.startsWith(b + '/'))) return false;
        if (urlPath.startsWith('/api/')) return false;
        return true;
      },
      serialize: (entry) => {
        const urlPath = typeof entry === 'string' ? entry : (entry?.url || '');
        let priority = 0.6;
        if (urlPath === '/') priority = 1.0;
        else if (urlPath.startsWith('/program')) priority = 0.9;
        else if (urlPath.startsWith('/volby')) priority = 0.85;
        else if (urlPath.startsWith('/people')) priority = 0.8;
        else if (urlPath.startsWith('/blog/posts')) priority = 0.7;
        return {
          url: urlPath,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority
        };
      }
    }),
    mdx(),
    lit(),
    icon(),
  ],
});