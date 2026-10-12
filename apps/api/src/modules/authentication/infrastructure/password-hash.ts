import { argon2, randomBytes } from 'node:crypto';
import { validateInitialPassword } from '../application/initial-administrator.js';

// Node's maintained Argon2 API is experimental. Keep it isolated for replacement.
// OWASP baseline: Argon2id, 19 MiB, 2 passes, one lane; benchmark before release.
export async function hashInitialPassword(password: string): Promise<string> {
  validateInitialPassword(password);
  const salt = randomBytes(16);
  const digest = await new Promise<Buffer>((resolve, reject) => {
    argon2('argon2id', { message: password, nonce: salt, memory: 19456, passes: 2, parallelism: 1, tagLength: 32 },
      (error, result) => error ? reject(error) : resolve(result));
  });
  return `$argon2id$v=19$m=19456,t=2,p=1$${salt.toString('base64').replace(/=+$/, '')}$${digest.toString('base64').replace(/=+$/, '')}`;
}
