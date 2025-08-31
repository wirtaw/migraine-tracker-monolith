// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithSecret } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UserService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    } as StrategyOptionsWithSecret);
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findOne(payload.sub);
  }
}
