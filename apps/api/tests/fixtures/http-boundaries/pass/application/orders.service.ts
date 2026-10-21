import { Injectable as Service } from '@nestjs/common';
import type { Account } from '../domain/capture.js';
@Service()
export class OrdersService {
  validate(account: Account) { return account.status === 'active'; }
}
