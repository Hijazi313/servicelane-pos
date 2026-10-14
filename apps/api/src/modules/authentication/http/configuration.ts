import { isIP } from 'node:net';
import { ConfigurationError } from '../../../infrastructure/configuration.js';
export class AccessHttpConfiguration {
  constructor(readonly origin: string, readonly authority: string, readonly trustedProxies: string[]) {}
}
export function readAccessHttpConfiguration(env: NodeJS.ProcessEnv): AccessHttpConfiguration {
  try {
    const value = env.CLIENT_ORIGIN;
    if (!value) throw new Error();
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.origin !== value || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
    const trustedProxies = env.TRUSTED_PROXY_ADDRESSES ? env.TRUSTED_PROXY_ADDRESSES.split(',') : [];
    if (trustedProxies.some((ip) => !isIP(ip))) throw new Error();
    return new AccessHttpConfiguration(parsed.origin, parsed.host, trustedProxies);
  } catch { throw new ConfigurationError('CLIENT_ORIGIN must be a canonical HTTPS origin; TRUSTED_PROXY_ADDRESSES must contain only explicit IP addresses'); }
}
export function canonicalSource(ip: string): string {
  if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) === 6) return new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  throw new Error('Invalid source address');
}
