import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import {
  useAccount,
  useCallsStatus,
  useConfig,
  useReadContract,
  useSendCalls,
} from 'wagmi';
import { agreementErc1155Abi } from '../../generated/smart-contracts';
import { Address } from 'viem';

const assetA: Address = '0x25C9d504Eeb933D300394B7Fd2d7eeB57aAf5BC5';
const assetB: Address = '0x2AA18475e2312Ae6A49F94598a54fEA5351235Cb';
const factory: Address = '0x7F089CB03A9Ad6e89F2a42A186059Dce29FC2360';

export const AAList = () => {
  const config = useConfig();
  const { address, isConnected } = useAccount();

  const {
    data: isApproved,
    error: approvalError,
    isError: isApprovalError,
    isLoading: isApprovalLoading,
    isSuccess: isApprovalSuccess,
  } = useReadContract({
    abi: agreementErc1155Abi,
    config,
    address: assetA,
    functionName: 'isApprovedForAll',
    args: [address!, factory],
    query: {
      enabled: !!address,
    },
  });

  const {
    data,
    sendCalls,
    error: callsError,
    isError: isCallsError,
    isPending: isCallsPending,
    isSuccess: isCallsSuccess,
    isIdle: isCallStatusIdle,
  } = useSendCalls({ config });

  // status hook
  const {
    data: status,
    error: statusError,
    isError: isStatusError,
    isPending: isStatusPending,
    isLoading: isStatusLoading,
    isSuccess: isStatusSuccess,
    isFetched: isStatusFetched,
  } = useCallsStatus({
    config,
    id: data?.id || '',
    query: {
      enabled: !!data?.id && isCallsSuccess,
      refetchInterval: (res) => {
        if (res.state.data?.status === 'pending') {
          return 1000;
        }
        return false;
      },
    },
  });

  const handleClick = async () => {
    if (!isApprovalSuccess) {
      console.log('still fetching');
      return;
    }

    sendCalls({
      calls: [
        {
          to: assetA,
          abi: agreementErc1155Abi,
          functionName: 'setApprovalForAll',
          args: [factory, !!isApproved],
        },
        {
          to: assetB,
          abi: agreementErc1155Abi,
          functionName: 'setApprovalForAll',
          args: [factory, !!isApproved],
        },
      ],
      forceAtomic: true, // if user rejects to use smart wallet and value is true then everything is reverted
    });
  };

  if (!isConnected) {
    return <div>Not connected</div>;
  }

  return (
    <div className="p-6 grid place-items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardContent className="space-y-6 p-6">
          <Typography width="100%" display="flex">
            {`Batch Id: ${data?.id}`}
          </Typography>
          <Box display="flex" width="100%" justifyContent="space-between">
            <Box>
              <Typography color="info">{`isApprovalError: ${isApprovalError ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isApprovalLoading: ${isApprovalLoading ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isApprovalSuccess: ${isApprovalSuccess ? '🟢' : '🔴'}`}</Typography>
            </Box>
            <Box>
              <Typography color="info">{`isCallsError: ${isCallsError ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isCallsIdle: ${isCallStatusIdle ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isCallsPending: ${isCallsPending ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isCallsSuccess: ${isCallsSuccess ? '🟢' : '🔴'}`}</Typography>
            </Box>
            <Box>
              <Typography color="info">{`isStatusError: ${isStatusError ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isStatusPending: ${isStatusPending ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isStatusLoading: ${isStatusLoading ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isStatusSuccess: ${isStatusSuccess ? '🟢' : '🔴'}`}</Typography>
              <Typography color="info">{`isStatusFetched: ${isStatusFetched ? '🟢' : '🔴'}`}</Typography>
            </Box>
          </Box>
          <Button
            onClick={handleClick}
            disabled={isCallsPending}
            variant="outlined"
          >
            {isCallsPending ? 'Sending Calls…' : 'Send Calls'}
          </Button>
          {data?.id && (
            <Typography className="text-sm text-gray-600">
              Batch ID: {data?.id}
            </Typography>
          )}
          {status && (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                status,
                (_, v) => (typeof v === 'bigint' ? v.toString() : v),
                2,
              )}
            </pre>
          )}
          {isCallsError && (
            <Typography color="error">
              {JSON.stringify(callsError, null, 2)}
            </Typography>
          )}
          {isStatusError && (
            <Typography color="error">
              {JSON.stringify(statusError, null, 2)}
            </Typography>
          )}
          {isApprovalError && (
            <Typography color="error">
              {JSON.stringify(approvalError, null, 2)}
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
