import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SentryProxyResult = {
  status: number;
  contentType: string | null;
  link: string | null;
  body: Buffer;
  targetUrl: string;
};

@Injectable()
export class SentryProxyService {
  private static readonly logger = new Logger(SentryProxyService.name);

  constructor(private readonly configService: ConfigService) {}

  async forward(
    method: string,
    pathSuffix: string,
    queryString: string,
  ): Promise<SentryProxyResult> {
    const token = this.configService.get<string>('SENTRY_AUTH_TOKEN');
    if (!token) {
      throw new ServiceUnavailableException('Sentry proxy is not configured');
    }

    const host = (
      this.configService.get<string>('SENTRY_HOST') || 'https://us.sentry.io'
    ).replace(/\/$/, '');

    const normalizedPath = pathSuffix.replace(/^\//, '');
    const query = queryString
      ? queryString.startsWith('?')
        ? queryString
        : `?${queryString}`
      : '';
    const targetUrl = `${host}/api/0/${normalizedPath}${query}`;

    SentryProxyService.logger.log(
      `Proxying ${method} pathSuffix="${pathSuffix}" → ${targetUrl}`,
    );

    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = Buffer.from(await upstream.arrayBuffer());

    SentryProxyService.logger.log(
      `Upstream ${method} ${targetUrl} → ${upstream.status} (${body.length} bytes)`,
    );

    if (!upstream.ok) {
      const preview = body.toString('utf8').slice(0, 500);
      SentryProxyService.logger.warn(
        `Upstream error body for ${targetUrl}: ${preview}`,
      );
    }

    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      link: upstream.headers.get('link'),
      body,
      targetUrl,
    };
  }
}
