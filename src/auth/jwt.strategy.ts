// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { SymmetricKeyService } from './symmetric-key.service';
import { UserService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly symmetricKeyService: SymmetricKeyService,
    private readonly usersService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (_request, _token, done) => {
        symmetricKeyService
          .getKey()
          .then((key) => done(null, key))
          .catch((err) => done(err));
      },
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findOne(payload.sub);
    return user ?? null;
  }
}
