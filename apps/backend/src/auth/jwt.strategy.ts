import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../config/config';
import { AUTH0_OW_JWT } from './auth.const';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH0_OW_JWT) {
  constructor(private readonly configService: ConfigService<IConfig>) {
    const auth0IssuerUrl = configService.get('AUTH0_ISSUER');
    const auth0Audience = configService.get('AUTH0_AUDIENCE');

    super({
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${auth0IssuerUrl}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: auth0Audience,
      issuer: `${auth0IssuerUrl}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    console.log(payload);

    return payload;
  }
}
