import { getEnvValue } from './get-env-value';

export interface DatabaseConfig {
    host: string;
    name: string;
    user: string;
    password: string;
    uri: string;
}

export const databaseConfig: DatabaseConfig = {
  host: getEnvValue('DB_HOST', 'mongo'),
  name: getEnvValue('DB_NAME'),
  user: getEnvValue('DB_USER'),
  password: getEnvValue('DB_PASSWORD'),
  get uri() {
    return `mongodb://${this.user}:${this.password}@${this.host}:27017/${this.name}?authMechanism=SCRAM-SHA-256`;
  },
};