/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const blockscoutProxy = {
    '/blockscout-api': {
      target: 'https://api.blockscout.com/100/api/v2',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/blockscout-api/, ''),
      configure: (proxy: { on: (event: string, listener: (...args: unknown[]) => void) => void }) => {
        proxy.on('proxyReq', (...args: unknown[]) => {
          const proxyReq = args[0] as {
            setHeader: (name: string, value: string) => void;
          };
          const token = env.VITE_GNOSIS_EXPLORER_API_KEY;
          if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          }
        });
      },
    },
  };

  const sentryHost = (env.VITE_SENTRY_HOST ?? 'https://sentry.io').replace(
    /\/$/,
    '',
  );

  const sentryProxy = {
    '/sentry-api': {
      target: `${sentryHost}/api/0`,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/sentry-api/, ''),
      configure: (proxy: { on: (event: string, listener: (...args: unknown[]) => void) => void }) => {
        proxy.on('proxyReq', (...args: unknown[]) => {
          const proxyReq = args[0] as {
            path?: string;
            setHeader: (name: string, value: string) => void;
          };
          const token = env.VITE_SENTRY_AUTH_TOKEN;
          if (token) {
            proxyReq.setHeader('Authorization', `Bearer ${token}`);
          }
        });
      },
    },
  };

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/admin',
    server: {
      port: 4200,
      host: 'localhost',
      proxy: {
        ...blockscoutProxy,
        ...sentryProxy,
      },
    },
    preview: {
      port: 4300,
      host: 'localhost',
      proxy: {
        ...blockscoutProxy,
        ...sentryProxy,
      },
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
  };
});
