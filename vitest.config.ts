import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    env: {
      // Never touch the real database from tests: force the in-memory
      // quota/prisma fallbacks regardless of local .env values.
      DATABASE_URL: '',
    },
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
