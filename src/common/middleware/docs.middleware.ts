import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomJwtService } from '../../auth/jwt.service';

@Injectable()
export class DocsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DocsMiddleware.name);

  constructor(private readonly jwtService: CustomJwtService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const environment = process.env.NODE_ENV;
    const isDevelopment =
      environment === 'development' || environment === 'test';

    if (isDevelopment) {
      return next();
    }

    const token =
      req.query.token ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      req.headers['token'];

    if (!token) {
      this.logger.warn(
        `Access to /docs denied from ${req.ip}. No token provided.`,
      );
      throw new ForbiddenException({
        message: 'You have no accesss',
      });
    }

    try {
      this.logger.log(`Access to /docs granted from ${req.ip}.`);
      await this.jwtService.verifyToken(token as string);
      next();
    } catch {
      this.logger.warn(`Access to /docs denied from ${req.ip}. Invalid token.`);
      throw new ForbiddenException({
        message: 'You have no accesss',
      });
    }
  }
}
