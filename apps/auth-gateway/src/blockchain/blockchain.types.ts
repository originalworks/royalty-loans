import { AddressLike } from 'ethers';
import { ChainId } from './blockchain.const';

export interface IsERC1155ShareholderParams {
  shareholderAddress: AddressLike;
  erc1155Addresses: AddressLike[];
  chainId: ChainId;
}
