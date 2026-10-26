import { Injectable } from '@nestjs/common';
import { AccessService, type Proof } from '../../authentication/public.js';
import { DisplaySettingsService } from './display-settings.service.js';
import { DisplaySettingsError, type DisplayView } from './display-settings.js';
@Injectable()
export class BusinessDisplayService {
  constructor(private readonly access: AccessService, private readonly display: DisplaySettingsService) {}
  async read(proof: Proof): Promise<DisplayView> {
    const context = await this.access.me(proof, true);
    if (!('business' in context)) throw new DisplaySettingsError('DISPLAY_SETTINGS_UNAVAILABLE');
    return this.display.read(context);
  }
  update(proof: Proof, body: unknown): Promise<DisplayView> {
    return this.access.runAuthorized(proof, 'administrator', scope => this.display.replace(scope, body));
  }
}
