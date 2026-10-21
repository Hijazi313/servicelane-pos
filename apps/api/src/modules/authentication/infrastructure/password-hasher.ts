import { Injectable } from '@nestjs/common';
import { AccessError, PasswordHasher } from '../application/access-policy.js';
import { hashInitialPassword, verifyPassword, verifyDummyPassword, HashCapacityError } from './password-hash.js';
@Injectable()
export class NodePasswordHasher extends PasswordHasher {
  private async bounded<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch (error) { if (error instanceof HashCapacityError) throw new AccessError('RATE_LIMITED', 'Try again later', 1); throw error; }
  }
  hash(password: string) { return this.bounded(() => hashInitialPassword(password)); }
  verify(password: string, phc: string) { return this.bounded(() => verifyPassword(password, phc)); }
  dummy(password: string) { return this.bounded(() => verifyDummyPassword(password)); }
}
