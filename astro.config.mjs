// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import svelte from '@astrojs/svelte';

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

  image: {
    service: { entrypoint: 'astro/assets/services/sharp' }
  },

  adapter: cloudflare(),

  integrations: [svelte()]
});