// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: 'server',
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
    }
});
