import { ConfigurationError } from '../../../infrastructure/configuration.js';

/** A stable random key shared by API instances for this installation. */
export function readOrderCursorKey(env: NodeJS.ProcessEnv): Buffer {
  const value = env.ORDER_CURSOR_SIGNING_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new ConfigurationError('ORDER_CURSOR_SIGNING_KEY must be a 32-byte random key encoded as 64 hexadecimal characters');
  }
  return Buffer.from(value, 'hex');
}
