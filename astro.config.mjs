// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',

  i18n: {
      locales: ['en', 'nl', 'es'],
      defaultLocale: 'es'
  },

  vite: {
      resolve: {
          alias: {
              '@': '/src',
          }
      }
  },

  adapter: cloudflare()
});