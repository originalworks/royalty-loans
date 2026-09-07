import {
  All,
  Controller,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Auth0Guard } from '../auth/auth.guard';
import { BlockscoutProxyService } from './blockscoutProxy.service';

@Controller()
@UseGuards(Auth0Guard)
export class BlockscoutProxyController {
  private static readonly logger = new Logger(BlockscoutProxyController.name);

  constructor(private readonly blockscoutProxyService: BlockscoutProxyService) {}

  /** `:path*` matches zero or more segments under /blockscout-api. */
  @All('blockscout-api/:path*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const pathSuffix = req.path.replace(/^\/blockscout-api\/?/, '');
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

    BlockscoutProxyController.logger.log(
      `Incoming ${req.method} ${req.originalUrl || req.url} (path=${req.path}, pathSuffix=${pathSuffix})`,
    );

    const result = await this.blockscoutProxyService.forward(
      req.method,
      pathSuffix,
      queryString,
    );

    if (result.contentType) {
      res.setHeader('Content-Type', result.contentType);
    }

    BlockscoutProxyController.logger.log(
      `Responding ${result.status} for upstream ${result.targetUrl}`,
    );

    return res.status(result.status).send(result.body);
  }
}
