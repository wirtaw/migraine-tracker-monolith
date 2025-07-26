import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /**
   * Performs a basic health check.
   * In a more complex application, this could check database connections,
   * external service availability, etc.
   * @returns an object indicating the application is up.
   */
  check(): { status: string } {
    return { status: 'up' };
  }
}
