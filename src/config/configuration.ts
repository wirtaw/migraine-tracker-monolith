import appConfig, { AppConfig, currentEnvironment } from './app/app.config';

export interface Config {
  app: AppConfig;
}

export const getEnvFilePaths = () => {
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
});
