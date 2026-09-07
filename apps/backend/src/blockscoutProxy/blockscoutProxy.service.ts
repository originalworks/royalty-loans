import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BlockscoutProxyResult = {
  status: number;
  contentType: string | null;
  body: Buffer;
  targetUrl: string;
};

@Injectable()
export class BlockscoutProxyService {
  private static readonly logger = new Logger(BlockscoutProxyService.name);

  constructor(private readonly configService: ConfigService) {}

  async forward(
    method: string,
    pathSuffix: string,
    queryString: string,
  ): Promise<BlockscoutProxyResult> {
    const apiKey = this.configService.get<string>('BLOCKSCOUT_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Blockscout proxy is not configured',
      );
    }

    const baseUrl = (
      this.configService.get<string>('BLOCKSCOUT_API_URL') ||
      'https://api.blockscout.com/100/api/v2'
    ).replace(/\/$/, '');

    const normalizedPath = pathSuffix.replace(/^\//, '');
    const pathPart = normalizedPath ? `/${normalizedPath}` : '';

    const params = new URLSearchParams(
      queryString.startsWith('?') ? queryString.slice(1) : queryString,
    );
    // Prefer Bearer; keep apikey as Blockscout Pro fallback.
    if (!params.has('apikey')) {
      params.set('apikey', apiKey);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const targetUrl = `${baseUrl}${pathPart}${query}`;

    BlockscoutProxyService.logger.log(
      `Proxying ${method} pathSuffix="${pathSuffix}" → ${baseUrl}${pathPart}${query ? '?…' : ''}`,
    );

    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const body = Buffer.from(await upstream.arrayBuffer());

    BlockscoutProxyService.logger.log(
      `Upstream ${method} ${baseUrl}${pathPart} → ${upstream.status} (${body.length} bytes)`,
    );

    if (!upstream.ok) {
      const preview = body.toString('utf8').slice(0, 500);
      BlockscoutProxyService.logger.warn(
        `Upstream error body for ${baseUrl}${pathPart}: ${preview}`,
      );
    }

    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      body,
      targetUrl: `${baseUrl}${pathPart}${query ? '?…' : ''}`,
    };
  }
}
