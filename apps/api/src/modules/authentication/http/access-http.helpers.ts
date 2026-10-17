import { type Proof } from '../application/access.service.js';
import { AccessError } from '../application/access-policy.js';

export interface AccessRequest {
  method: string; protocol: string; ip: string; body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
export interface AccessReply {
  header(name: string, value: string | string[]): AccessReply;
  status(code: number): AccessReply;
  send(body?: unknown): unknown;
}
export function header(request: AccessRequest, name: string): string | undefined {
  const value = request.headers[name]; return typeof value === 'string' ? value : undefined;
}
export function proof(request: AccessRequest): Proof {
  const cookies = header(request, 'cookie') ?? '';
  if (cookies.length > 4096) throw new AccessError(400, 'Invalid cookies');
  const result: Proof = { csrf: header(request, 'x-csrf-token') };
  for (const [name, key] of [['__Host-session', 'session'], ['__Host-prelogin', 'prelogin']] as const) {
    const values = cookies.split(';').map((item) => item.trim()).filter((item) => item.startsWith(`${name}=`));
    if (values.length > 1) throw new AccessError(400, 'Invalid cookies');
    if (values[0]) result[key] = values[0].slice(name.length + 1);
  }
  return result;
}
export function cookie(name: '__Host-session' | '__Host-prelogin', value: string, clear = false): string {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict${clear ? '; Max-Age=0' : ''}`;
}
