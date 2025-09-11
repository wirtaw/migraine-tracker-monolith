import { Logger } from '@nestjs/common';

export const ErrorExceptionLogging = (
  error: unknown,
  serviceName: string = '',
): void => {
  if (error instanceof Error) {
    Logger.error(error.stack, serviceName);
  } else {
    const errorMessage =
      typeof error === 'string' ? error : JSON.stringify(error);
    Logger.error(`An unknown error occurred: ${errorMessage}`, serviceName);
  }
};
