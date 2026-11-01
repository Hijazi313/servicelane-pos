import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function unavailableApi(): Plugin {
  return {
    name: 'unconfigured-api',
    configureServer(server) {
      server.middlewares.use('/api', (_request, response) => {
        response.statusCode = 503;
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({ message: 'Local HTTPS API proxy is not configured.' }));
      });
    },
  };
}

export default defineConfig(({ command }) => {
  if (command !== 'serve') return { plugins: [react()] };

  const certPath = process.env.WEB_DEV_HTTPS_CERT;
  const keyPath = process.env.WEB_DEV_HTTPS_KEY;
  if (Boolean(certPath) !== Boolean(keyPath)) {
    throw new Error('Set both WEB_DEV_HTTPS_CERT and WEB_DEV_HTTPS_KEY, or neither.');
  }
  if (!certPath || !keyPath) return { plugins: [react(), unavailableApi()] };

  const port = Number(process.env.WEB_DEV_PORT ?? '5173');
  const apiPort = Number(process.env.WEB_DEV_API_PORT ?? '3000');
  if (![port, apiPort].every(value => Number.isInteger(value) && value > 0 && value <= 65535) || port === apiPort) {
    throw new Error('WEB_DEV_PORT and WEB_DEV_API_PORT must be different valid TCP ports.');
  }

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      cors: false,
      https: { cert: readFileSync(certPath), key: readFileSync(keyPath) },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: false,
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest, request) => {
              // Never let callers supply headers trusted by the backend proxy boundary.
              for (const name of Object.keys(request.headers)) {
                if (name === 'forwarded' || name.startsWith('x-forwarded-')) proxyRequest.removeHeader(name);
              }
              proxyRequest.setHeader('X-Forwarded-Proto', 'https');
            });
          },
        },
      },
    },
  };
});
