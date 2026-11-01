import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer as createHttpServer, get as httpGet } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveListen(server.address().port));
  });
}
function close(server) { return new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose())); }
function request(options, transport) {
  return new Promise((resolveRequest, reject) => {
    const req = transport(options, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolveRequest({ status: response.statusCode, body }));
    });
    req.on('error', reject);
    if (transport === httpsRequest) req.end();
  });
}

test('development API fails closed without TLS and forwards trusted HTTPS metadata with TLS', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pos-dev-proxy-'));
  const original = { ...process.env };
  let api, plain, secure;
  try {
    delete process.env.WEB_DEV_HTTPS_CERT;
    delete process.env.WEB_DEV_HTTPS_KEY;
    plain = await createViteServer({ configFile: resolve('vite.config.ts'), cacheDir: join(directory, 'cache-plain'), server: { host: '127.0.0.1', port: 0, strictPort: true } });
    await plain.listen();
    const plainPort = plain.httpServer.address().port;
    const unavailable = await request({ hostname: '127.0.0.1', port: plainPort, path: '/api/v1/auth/me' }, httpGet);
    assert.equal(unavailable.status, 503);
    assert.match(unavailable.body, /proxy is not configured/);
    await plain.close(); plain = undefined;

    const cert = join(directory, 'cert.pem');
    const key = join(directory, 'key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
    let received;
    api = createHttpServer((req, res) => { received = req.headers; res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"statusCode":401}'); });
    const apiPort = await listen(api);
    const reservation = createHttpServer();
    const webPort = await listen(reservation);
    await close(reservation);
    process.env.WEB_DEV_HTTPS_CERT = cert;
    process.env.WEB_DEV_HTTPS_KEY = key;
    process.env.WEB_DEV_PORT = String(webPort);
    process.env.WEB_DEV_API_PORT = String(apiPort);
    secure = await createViteServer({ configFile: resolve('vite.config.ts'), cacheDir: join(directory, 'cache-secure') });
    await secure.listen();
    const origin = `https://127.0.0.1:${webPort}`;
    const result = await request({ hostname: '127.0.0.1', port: webPort, path: '/api/v1/auth/me', ca: readFileSync(cert), headers: { origin, 'x-forwarded-proto': 'http', 'x-forwarded-for': '192.0.2.1', forwarded: 'for=192.0.2.1' } }, httpsRequest);
    assert.equal(result.status, 401);
    assert.equal(received.host, `127.0.0.1:${webPort}`);
    assert.equal(received.origin, origin);
    assert.equal(received['x-forwarded-proto'], 'https');
    assert.equal(received['x-forwarded-for'], undefined);
    assert.equal(received.forwarded, undefined);
  } finally {
    if (plain) await plain.close();
    if (secure) await secure.close();
    if (api) await close(api);
    for (const name of ['WEB_DEV_HTTPS_CERT', 'WEB_DEV_HTTPS_KEY', 'WEB_DEV_PORT', 'WEB_DEV_API_PORT']) {
      if (original[name] === undefined) delete process.env[name]; else process.env[name] = original[name];
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
