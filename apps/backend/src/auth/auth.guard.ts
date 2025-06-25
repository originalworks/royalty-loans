import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Auth0Guard extends AuthGuard('jwt') {
  override handleRequest(err, user, info, context) {
    if (err || !user) {
      console.log('❌ Auth error:', err);
      console.log('❌ Info:', info);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
