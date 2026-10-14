import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { validateInitialPassword } from '../application/initial-administrator.js';

export class HashCapacityError extends Error {
  constructor() { super('Credential processing capacity reached'); }
}
let active = 0;
async function bounded<T>(work: () => Promise<T>): Promise<T> {
  if (active >= 2) throw new HashCapacityError();
  active++;
  try { return await work(); } finally { active--; }
}
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2('argon2id', { message: password, nonce: salt, memory: 19456, passes: 2, parallelism: 1, tagLength: 32 },
      (error, result) => error ? reject(error) : resolve(result));
  });
}
const encode = (value: Buffer): string => value.toString('base64').replace(/=+$/, '');
const prefix = '$argon2id$v=19$m=19456,t=2,p=1$';
function parse(phc: string): { salt: Buffer; digest: Buffer } | undefined {
  if (typeof phc !== 'string' || phc.length !== 97 || !phc.startsWith(prefix)) return;
  const match = /^([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/.exec(phc.slice(prefix.length));
  if (!match) return;
  const salt = Buffer.from(match[1]!, 'base64');
  const digest = Buffer.from(match[2]!, 'base64');
  if (salt.length !== 16 || digest.length !== 32 || encode(salt) !== match[1] || encode(digest) !== match[2]) return;
  return { salt, digest };
}
// Experimental Node API stays isolated. Pinned-runtime and target-host gates apply.
export async function hashInitialPassword(password: string): Promise<string> {
  validateInitialPassword(password);
  return bounded(async () => {
    const salt = randomBytes(16);
    return `${prefix}${encode(salt)}$${encode(await derive(password, salt))}`;
  });
}
export async function verifyPassword(password: string, phc: string): Promise<boolean> {
  try { validateInitialPassword(password); } catch { return false; }
  const parsed = parse(phc);
  if (!parsed) return false;
  return bounded(async () => timingSafeEqual(await derive(password, parsed.salt), parsed.digest));
}
const dummy = `${prefix}${encode(Buffer.alloc(16, 47))}$ILsnY8e2S1/NtWSzZo4WbCOqOX83JjQA3tg21QCpxt8`;
export async function verifyDummyPassword(password: string): Promise<boolean> {
  await verifyPassword(password, dummy);
  return false;
}
