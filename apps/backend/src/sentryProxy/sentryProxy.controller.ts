import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { Auth0Guard } from '../auth/auth.guard';
import { SentryProxyService } from './sentryProxy.service';

@Controller()
@UseGuards(Auth0Guard)
export class SentryProxyController {
  constructor(private readonly sentryProxyService: SentryProxyService) {}

  /** `:path*` matches zero or more segments under /sentry-api. */
  @All('sentry-api/:path*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const pathSuffix = req.path.replace(/^\/sentry-api\/?/, '');
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

    const result = await this.sentryProxyService.forward(
      req.method,
      pathSuffix,
      queryString,
    );

    if (result.link) {
      res.setHeader('Link', result.link);
    }
    if (result.contentType) {
      res.setHeader('Content-Type', result.contentType);
    }

    return res.status(result.status).send(result.body);
  }
}
