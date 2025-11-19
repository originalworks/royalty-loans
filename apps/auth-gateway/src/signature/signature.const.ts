import {
  AddressLike,
  BigNumberish,
  TypedDataDomain,
  TypedDataField,
} from 'ethers';

export const SHAREHOLDER_AUTH_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const EIP712_DOMAIN: TypedDataDomain = {
  name: 'OWAuthGateway',
  version: '1',
};

export const EIP712_SHAREHOLDER_AUTH_TYPES: Record<string, TypedDataField[]> = {
  ShareholderAuth: [
    { name: 'shareholder', type: 'address' },
    { name: 'issuedAt', type: 'uint256' },
    { name: 'chainId', type: 'uint256' },
  ],
};

export interface IShareholderAuthType {
  shareholder: AddressLike;
  issuedAt: BigNumberish;
  chainId: string;
}

export const EIP712_DELEGATED_AUTH_TYPES = {
  DelegatedAuth: [
    { name: 'shareholder', type: 'address' },
    { name: 'delegate', type: 'address' },
    { name: 'chainId', type: 'uint256' },
    { name: 'assets', type: 'address[]' },
    { name: 'startDate', type: 'uint256' },
    { name: 'endDate', type: 'uint256' },
  ],
};

export interface IDelegatedAuthType {
  shareholder: AddressLike;
  delegate: AddressLike;
  chainId: string;
  assets: AddressLike[];
  startDate: BigNumberish;
  endDate: BigNumberish;
}
