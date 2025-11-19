import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IConfig } from '../config/config';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerDecorator } from '../pinoLogger/logger';
import { AlchemyRpcUrls, MULTICALL3_ADDRESS } from './blockchain.const';
import type { ChainId } from './blockchain.const';
import { Multicall3__factory } from '@royalty-loans/contracts-shared';
import { AgreementERC1155__factory } from '@royalty-loans/contracts-agreements';
import { JsonRpcProvider } from 'ethers';
import type { IsERC1155ShareholderParams } from './blockchain.types';

@Injectable()
export class BlockchainService {
  private static readonly logger = new Logger(BlockchainService.name);

  private providers: Map<ChainId, JsonRpcProvider> = new Map();

  constructor(private readonly configService: ConfigService<IConfig>) {}

  @PinoLoggerDecorator(BlockchainService.logger)
  getRpcUrl(chainId: ChainId) {
    const alchemyApiKey = this.configService.get('ALCHEMY_API_KEY');
    const baseUrl = AlchemyRpcUrls[chainId];

    if (!baseUrl) {
      throw new NotFoundException(
        `ChainId ${chainId} has no associated rpcUrl`,
      );
    }

    return `${baseUrl}${alchemyApiKey}`;
  }

  @PinoLoggerDecorator(BlockchainService.logger)
  getProvider(chainId: ChainId) {
    let provider = this.providers.get(chainId);

    if (!provider) {
      const rpcUrl = this.getRpcUrl(chainId);
      provider = new JsonRpcProvider(rpcUrl);
      this.providers.set(chainId, provider);
    }

    return provider;
  }

  @PinoLoggerDecorator(BlockchainService.logger)
  async isERC1155Shareholder({
    shareholderAddress,
    erc1155Addresses,
    chainId,
  }: IsERC1155ShareholderParams): Promise<boolean> {
    const provider = this.getProvider(chainId);

    const multicall = Multicall3__factory.connect(MULTICALL3_ADDRESS, provider);

    const IAgreementERC1155 = AgreementERC1155__factory.createInterface();

    const results = await multicall.aggregate3.staticCall(
      erc1155Addresses.map((addr) => {
        return {
          allowFailure: true,
          target: addr,
          callData: IAgreementERC1155.encodeFunctionData('balanceOf', [
            shareholderAddress,
            1n,
          ]),
        };
      }),
    );

    const unownedTokens = results
      .map(({ success, returnData }, i) => {
        const tokenAddress = erc1155Addresses[i];

        if (!success || returnData === '0x') {
          throw new NotFoundException(
            `Failed to query contract at ${tokenAddress}`,
          );
        }
        const balance = IAgreementERC1155.decodeFunctionResult(
          'balanceOf',
          returnData,
        )[0] as bigint;

        return {
          tokenAddress,
          isShareholder: balance > 0n,
        };
      })
      .filter(({ isShareholder }) => !isShareholder);

    if (unownedTokens.length > 0) {
      throw new UnauthorizedException({
        message: `Address ${shareholderAddress} has no shares in assets on chain ${chainId}`,
        unownedTokens: unownedTokens.map((t) => t.tokenAddress),
      });
    }

    return true;
  }
}
