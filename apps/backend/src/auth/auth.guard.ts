import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH0_OW_JWT } from './auth.const';

@Injectable()
export class Auth0Guard extends AuthGuard(AUTH0_OW_JWT) {}
