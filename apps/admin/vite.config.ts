/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const blockscoutProxy = {
  '/blockscout-api': {
    target: 'https://api.blockscout.com/100/api/v2',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/blockscout-api/, ''),
  },
};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/admin',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: blockscoutProxy,
  },
  preview: {
    port: 4300,
    host: 'localhost',
    proxy: blockscoutProxy,
  },
  plugins: [react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
