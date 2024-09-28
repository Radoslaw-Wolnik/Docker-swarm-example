// src/config/environment.ts

import { databaseConfig, DatabaseConfig } from './database.config';
import { authConfig, AuthConfig } from './auth.config';
import { emailConfig, EmailConfig } from './email.config';
import { appConfig, AppConfig } from './app.config';
import { EmailService } from '../services/email.service';

interface Enviorement {
  database: DatabaseConfig;
  auth: AuthConfig;
  email: EmailConfig & {
    service: EmailService
  }
  app: AppConfig;
}

export const environment: Enviorement = {
  database: databaseConfig,
  auth: authConfig,
  email: { 
    ...emailConfig,
    service: EmailService.getInstance(), 
  },
  app: appConfig,
};

export default environment;