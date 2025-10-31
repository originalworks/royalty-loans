import { AddressLike, BigNumberish, TypedDataDomain } from 'ethers';

export const SHAREHOLDER_AUTH_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const EIP712_DOMAIN: TypedDataDomain = {
  name: 'OWAuthGateway',
  version: '1',
};

export const EIP712_SHAREHOLDER_AUTH_TYPES = {
  ShareholderAuth: [
    { name: 'shareholder', type: 'address' },
    { name: 'issuedAt', type: 'uint256' },
  ],
};

export interface IShareholderAuthType {
  shareholder: AddressLike;
  issuedAt: BigNumberish;
}

export const EIP712_EXTERNAL_AUTH_TYPES = {
  ExternalAuth: [
    { name: 'shareholder', type: 'address' },
    { name: 'delegate', type: 'address' },
    { name: 'assets', type: 'address[]' },
    { name: 'startDate', type: 'uint256' },
    { name: 'endDate', type: 'uint256' },
    { name: 'expirationDate', type: 'uint256' },
  ],
};

export interface IExternalAuthType {
  shareholder: AddressLike;
  delegate: AddressLike;
  assets: AddressLike[];
  startDate: BigNumberish;
  endDate: BigNumberish;
  expirationDate: BigNumberish;
}
