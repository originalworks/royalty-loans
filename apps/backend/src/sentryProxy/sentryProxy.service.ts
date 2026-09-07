import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SentryProxyResult = {
  status: number;
  contentType: string | null;
  link: string | null;
  body: Buffer;
};

@Injectable()
export class SentryProxyService {
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
    const target = `${host}/api/0/${normalizedPath}${query}`;

    const upstream = await fetch(target, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = Buffer.from(await upstream.arrayBuffer());

    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      link: upstream.headers.get('link'),
      body,
    };
  }
}
