import { SetMetadata } from '@nestjs/common';

export const AccessEntry = (policy: 'public' | 'staff' | 'administrator' | 'restricted' | 'health') => SetMetadata('access-entry', policy);
