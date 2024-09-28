import { getEnvValue } from './get-env-value';

export interface AuthConfig {
    jwtSecret: string;
    encryptionKey: string;
    oldEncryptionKey: string;
}

export const authConfig: AuthConfig = {
    jwtSecret: getEnvValue('JWT_SECRET'),
    encryptionKey: getEnvValue('ENCRYPTION_KEY'),
    oldEncryptionKey: getEnvValue('OLD_ENCRYPTION_KEY', ''),
}