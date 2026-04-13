/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // eslint-disable-next-line prettier/prettier
      secretOrKey: config.get<string>('JWT_SECRET', 'pickles_jwt_secret_change_me'),
    });
  }

  async validate(payload: any) {
    return { sub: payload.sub, mobile: payload.mobile, role: payload.role };
  }
}
