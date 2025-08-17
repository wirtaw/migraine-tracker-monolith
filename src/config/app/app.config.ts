export interface AppConfig {
  version: string;
  env: Environment;
  port: number;
  requestTimeoutSeconds: number;
  responseTimeoutSeconds: number;
  logLevels: { [key: string]: number };
}

export enum Environment {
  Workspace = 'workspace',
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export const currentEnvironment = (): Environment => {
  if (!process.env.NODE_ENV) {
    return Environment.Workspace;
  }

  // Get the keys of the Environment enum as an array of strings
  const environmentKeys = Object.values(Environment) as string[];

  if (environmentKeys.includes(process.env.NODE_ENV)) {
    // Assert that process.env.NODE_ENV is a valid key of Environment
    return Environment[process.env.NODE_ENV as keyof typeof Environment];
  }

  return Environment.Workspace;
};

export const logLevels = (): AppConfig['logLevels'] => {
  const levels: { [key: string]: number } = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };
  const logLevelList: string[] = ['info', 'debug', 'error', 'http', 'warn'];

  const disabledLogLevels =
    (process.env.APP_DISABLED_LOGGER_LEVELS &&
      process.env.APP_DISABLED_LOGGER_LEVELS.split(',')) ||
    [];
  const filteredLevels: string[] = logLevelList.filter(
    (logLevel) => !disabledLogLevels.includes(logLevel),
  );
  const allowedLevels: { [key: string]: number } = {};

  for (const levelKey of filteredLevels) {
    allowedLevels[levelKey] = levels[levelKey];
  }

  return allowedLevels;
};

export default (): AppConfig => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) || 8080 : 8080,
  env: currentEnvironment(),
  version: process.env.VERSION ? process.env.VERSION : '0.0.1',
  requestTimeoutSeconds: process.env.APP_REQUEST_TIMEOUT_SECONDS
    ? parseInt(process.env.APP_REQUEST_TIMEOUT_SECONDS, 10)
    : 10000,
  responseTimeoutSeconds: process.env.APP_RESPONSE_TIMEOUT_SECONDS
    ? parseInt(process.env.APP_RESPONSE_TIMEOUT_SECONDS, 10)
    : 10000,
  logLevels: logLevels(),
});
