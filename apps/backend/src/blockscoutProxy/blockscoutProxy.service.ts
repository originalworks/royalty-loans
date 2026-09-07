import {
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BlockscoutProxyResult = {
  status: number;
  contentType: string | null;
  body: Buffer;
  targetUrl: string;
};

export type LastOutgoingTx = {
  hash: string;
  timestamp: number;
} | null;

/** API Gateway / Lambda sync response limit is 6MB; stay under it. */
const MAX_PROXY_BODY_BYTES = 5_500_000;

type EthTxListResponse = {
  status?: string;
  message?: string;
  result?:
    | Array<{
        hash?: string;
        timeStamp?: string;
        from?: string;
      }>
    | string;
};

@Injectable()
export class BlockscoutProxyService {
  private static readonly logger = new Logger(BlockscoutProxyService.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string {
    const apiKey = this.configService.get<string>('BLOCKSCOUT_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Blockscout proxy is not configured',
      );
    }
    return apiKey;
  }

  private getV2BaseUrl(): string {
    return (
      this.configService.get<string>('BLOCKSCOUT_API_URL') ||
      'https://api.blockscout.com/100/api/v2'
    ).replace(/\/$/, '');
  }

  /** Classic eth explorer API base, e.g. https://api.blockscout.com/100/api */
  private getEthApiBaseUrl(): string {
    return this.getV2BaseUrl().replace(/\/api\/v2$/, '/api');
  }

  async forward(
    method: string,
    pathSuffix: string,
    queryString: string,
  ): Promise<BlockscoutProxyResult> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getV2BaseUrl();

    const normalizedPath = pathSuffix.replace(/^\//, '');
    const pathPart = normalizedPath ? `/${normalizedPath}` : '';

    const params = new URLSearchParams(
      queryString.startsWith('?') ? queryString.slice(1) : queryString,
    );
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

    if (body.length > MAX_PROXY_BODY_BYTES) {
      BlockscoutProxyService.logger.error(
        `Upstream response too large for API Gateway (${body.length} bytes): ${baseUrl}${pathPart}`,
      );
      throw new PayloadTooLargeException(
        `Blockscout response is ${body.length} bytes; exceeds API Gateway limit. Use a slim endpoint instead.`,
      );
    }

    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      body,
      targetUrl: `${baseUrl}${pathPart}${query ? '?…' : ''}`,
    };
  }

  async fetchLastOutgoingTx(address: string): Promise<LastOutgoingTx> {
    const apiKey = this.getApiKey();
    const ethApiBase = this.getEthApiBaseUrl();
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address,
      page: '1',
      offset: '1',
      sort: 'desc',
      filter_by: 'from',
      apikey: apiKey,
    });
    const targetUrl = `${ethApiBase}?${params.toString()}`;
    const logUrl = `${ethApiBase}?module=account&action=txlist&address=${address}&page=1&offset=1&sort=desc&filter_by=from`;

    BlockscoutProxyService.logger.log(
      `Fetching last outgoing tx for ${address} → ${logUrl}`,
    );

    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const body = Buffer.from(await upstream.arrayBuffer());
    BlockscoutProxyService.logger.log(
      `Upstream last-outgoing-tx ${address} → ${upstream.status} (${body.length} bytes)`,
    );

    if (!upstream.ok) {
      const preview = body.toString('utf8').slice(0, 500);
      BlockscoutProxyService.logger.warn(
        `Upstream error for last-outgoing-tx ${address}: ${preview}`,
      );
      return null;
    }

    let payload: EthTxListResponse;
    try {
      payload = JSON.parse(body.toString('utf8')) as EthTxListResponse;
    } catch {
      BlockscoutProxyService.logger.warn(
        `Failed to parse Blockscout JSON for ${address}`,
      );
      return null;
    }

    if (payload.status !== '1' || !Array.isArray(payload.result)) {
      BlockscoutProxyService.logger.log(
        `No outgoing txs for ${address}: ${payload.message ?? payload.status}`,
      );
      return null;
    }

    const tx = payload.result[0];
    if (!tx?.hash || !tx.timeStamp) {
      return null;
    }

    const timestamp = Number.parseInt(tx.timeStamp, 10) * 1000;
    if (!Number.isFinite(timestamp)) {
      return null;
    }

    return { hash: tx.hash, timestamp };
  }
}
