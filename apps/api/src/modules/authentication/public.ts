export { AuthenticationModule } from './authentication.module.js';
export { AdministratorProvisioner } from './infrastructure/administrator-provisioner.service.js';
export { AdministratorValidationError, validateInitialAdministrator, validateInitialPassword, type InitialAdministrator } from './application/initial-administrator.js';

export { AccessService, type Proof } from './application/access.service.js';
export type { AuthorizedOperation, AuthorizedPolicy, AuthorizedScope } from './application/authorized-operation.js';
