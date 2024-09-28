import { getEnvValue } from './get-env-value';

export interface AppConfig {
    port: number;
    nodeEnv: 'development' | 'production';
    frontend: string;
    backend: string; 
    rotationInProgress: boolean;
    company: {
        name: string;
        email: string;
        phone: string;
        address: {
            street: string;
            buildingNumber: string;
            city: string;
            postCode: string;
            country: string;
            countryCode: string;
        };
    };
}

export const appConfig: AppConfig = {
    port: parseInt(getEnvValue('PORT', '5000'), 10),
    nodeEnv: getEnvValue('NODE_ENV', 'development') as 'development' | 'production',
    frontend: getEnvValue('FRONTEND', 'https://localhost:5173'),
    rotationInProgress: getEnvValue('ROTATION_IN_PROGRESS', 'false') === 'true',
    backend: getEnvValue('BACKEND', 'stack_name_backend'),
    company: {
        name: getEnvValue('COMPANY_NAME', 'Your Company Name'),
        email: getEnvValue('COMPANY_EMAIL', 'your@email.com'),
        phone: getEnvValue('COMPANY_PHONE', '123456789'),
        address: {
            street: getEnvValue('COMPANY_STREET', 'Your Street'),
            buildingNumber: getEnvValue('COMPANY_BUILDING_NUMBER', 'Your Building Number'),
            city: getEnvValue('COMPANY_CITY', 'Your City'),
            postCode: getEnvValue('COMPANY_POST_CODE', 'Your Post Code'),
            country: getEnvValue('COMPANY_COUNTRY', 'Poland'),
            countryCode: getEnvValue('COMPANY_COUNTRY_CODE', 'PL'),
        },
    },
}
