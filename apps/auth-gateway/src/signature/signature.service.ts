import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GetDelegatedPaymentDataDto,
  GetShareholderPaymentDataDto,
} from './signature.dto';
import {
  EIP712_DELEGATED_AUTH_TYPES,
  EIP712_DOMAIN,
  EIP712_SHAREHOLDER_AUTH_TYPES,
} from './signature.const';
import { verifyMessage, verifyTypedData } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ChainId, isChainSupported } from '../blockchain/blockchain.const';
import { PinoLoggerDecorator } from '../pinoLogger/logger';

@Injectable()
export class SignatureService {
  private static readonly logger = new Logger(SignatureService.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  @PinoLoggerDecorator(SignatureService.logger)
  async handleShareholderPaymentData({
    message,
    signature,
    assets,
  }: GetShareholderPaymentDataDto) {
    let recoveredAddress: string;

    try {
      recoveredAddress = verifyTypedData(
        EIP712_DOMAIN,
        EIP712_SHAREHOLDER_AUTH_TYPES,
        message,
        signature,
      );
    } catch {
      throw new UnauthorizedException('Signature malformed');
    }

    if (recoveredAddress.toLowerCase() !== message.shareholder.toLowerCase()) {
      throw new UnauthorizedException(
        'Signature does not match claimed address',
      );
    }

    if (!isChainSupported(message.chainId)) {
      throw new ForbiddenException(`Unsupported chain: ${message.chainId}`);
    }

    const diffMs = Date.now() - message.issuedAt;
    const isExpired = diffMs < 0 || diffMs > 24 * 60 * 60 * 1000;

    if (isExpired) {
      throw new UnauthorizedException('Signature expired');
    }

    await this.blockchainService.isERC1155Shareholder({
      chainId: message.chainId as ChainId,
      erc1155Addresses: assets,
      shareholderAddress: message.shareholder,
    });

    return 'Eloszki!';
  }

  // TODO: startDate & endDate implementation - once we are integrated with revelator backend
  @PinoLoggerDecorator(SignatureService.logger)
  async handleDelegatedPaymentData({
    delegateSignature,
    shareholderMessage,
    shareholderSignature,
  }: GetDelegatedPaymentDataDto) {
    let delegateRecoveredAddress: string;

    try {
      delegateRecoveredAddress = verifyMessage(
        shareholderSignature,
        delegateSignature,
      );
    } catch {
      throw new UnauthorizedException('Delegate signature malformed');
    }

    if (
      delegateRecoveredAddress.toLowerCase() !==
      shareholderMessage.delegate.toLowerCase()
    ) {
      throw new UnauthorizedException(
        'Delegate signature does not match delegate address from shareholder message',
      );
    }

    let shareholderRecoveredAddress: string;

    try {
      shareholderRecoveredAddress = verifyTypedData(
        EIP712_DOMAIN,
        EIP712_DELEGATED_AUTH_TYPES,
        shareholderMessage,
        shareholderSignature,
      );
    } catch {
      throw new UnauthorizedException('Shareholder signature malformed');
    }

    if (
      shareholderRecoveredAddress.toLowerCase() !==
      shareholderMessage.shareholder.toLowerCase()
    ) {
      throw new UnauthorizedException(
        'Shareholder signature does not match shareholder address from shareholder message',
      );
    }

    if (!isChainSupported(shareholderMessage.chainId)) {
      throw new ForbiddenException(
        `Unsupported chain: ${shareholderMessage.chainId}`,
      );
    }

    await this.blockchainService.isERC1155Shareholder({
      chainId: shareholderMessage.chainId as ChainId,
      erc1155Addresses: shareholderMessage.assets,
      shareholderAddress: shareholderMessage.shareholder,
    });

    return 'Eloszki!';
  }
}
