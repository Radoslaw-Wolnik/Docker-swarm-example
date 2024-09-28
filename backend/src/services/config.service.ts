// src/services/config.service.ts

import { environment } from '../config/environment';

type UpdateableConfig = Pick<typeof environment.app.company, 'name' | 'email' | 'phone' | 'address'>;

export class ConfigService {
  private static updateableKeys: (keyof UpdateableConfig)[] = ['name', 'email', 'phone', 'address'];

  static updateConfiguration(newConfig: Partial<UpdateableConfig>): typeof environment.app.company {
    for (const key of this.updateableKeys) {
      if (key in newConfig) {
        if (key === 'address' && newConfig.address) {
          environment.app.company.address = {
            ...environment.app.company.address,
            ...newConfig.address
          };
        } else {
          (environment.app.company[key] as any) = newConfig[key];
        }
      }
    }

    return environment.app.company;
  }
}