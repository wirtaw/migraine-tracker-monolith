import appConfig, { AppConfig, currentEnvironment } from './app/app.config';
import authConfig, { AuthConfig } from './auth/auth.config';
import integrationConfig, { IntegrationConfig } from './integration.config';

export interface Config {
  app: AppConfig;
  auth: AuthConfig;
  integration: IntegrationConfig;
}

export const getEnvFilePaths = (): string[] => {
  const environment = currentEnvironment();
  return [
    `.env.${environment}.local`,
    '.env.local',
    `.env.${environment}`,
    '.env',
  ];
};

export default (): Config => ({
  app: appConfig(),
  auth: authConfig(),
  integration: integrationConfig(),
});
