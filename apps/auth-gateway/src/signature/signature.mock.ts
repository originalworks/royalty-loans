interface IPaymentByDsp {
  dsp: 'spotify' | 'youTube';
  amount: number;
  adSupportedStreaming: number;
  subscriptionStreaming: number;
  nonInteractiveStreaming: number;
  contractAddress: string;
  txHash: string;
  chainId: number;
  timestamp: number;
  blockNumber: number;
}

export const MOCK_BY_DSP: IPaymentByDsp[] = [
  {
    dsp: 'spotify',
    amount: 20,
    adSupportedStreaming: 10,
    subscriptionStreaming: 10,
    nonInteractiveStreaming: 10,
    contractAddress: '0x00',
    txHash: '0x0',
    chainId: 1,
    timestamp: 12345678,
    blockNumber: 1,
  },
  {
    dsp: 'youTube',
    amount: 20,
    adSupportedStreaming: 10,
    subscriptionStreaming: 10,
    nonInteractiveStreaming: 10,
    contractAddress: '0x00',
    txHash: '0x0',
    chainId: 1,
    timestamp: 12345678,
    blockNumber: 1,
  },
];
