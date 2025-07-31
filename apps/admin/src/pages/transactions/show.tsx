import { ethers } from 'ethers';

import {
  Show,
  DateField,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { Stack, Typography } from '@mui/material';
import { useShow, useParsed } from '@refinedev/core';

import { TRANSACTION_SHOW_QUERY } from '../queries';

export const TransactionShow = () => {
  const { id } = useParsed();

  const { query } = useShow({
    id,
    resource: 'expense',
    meta: {
      gqlQuery: TRANSACTION_SHOW_QUERY,
    },
    dataProviderName: 'graphQl',
  });

  const { data, isLoading } = query;

  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          ID
        </Typography>
        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          Contract Address
        </Typography>
        <TextField value={record?.loanContract.id} />

        <Typography variant="body1" fontWeight="bold">
          Collateral Token
        </Typography>
        <TextField value={record?.loanContract.collateralToken} />

        <Typography variant="body1" fontWeight="bold">
          Type
        </Typography>
        <TextField value={record?.kind} />

        <Typography variant="body1" fontWeight="bold">
          Transaction Hash
        </Typography>
        <TextField value={record?.transactionHash} />

        {record?.gasPrice && (
          <>
            <Typography variant="body1" fontWeight="bold">
              Gas Price (GWEI)
            </Typography>
            <TextField value={ethers.formatUnits(record?.gasPrice, 'gwei')} />
          </>
        )}

        {record?.totalCost && (
          <>
            <Typography variant="body1" fontWeight="bold">
              Total Cost (ETH)
            </Typography>
            <TextField value={ethers.formatEther(record?.totalCost)} />
          </>
        )}

        <Typography variant="body1" fontWeight="bold">
          Created At
        </Typography>
        <DateField value={record?.timestamp * 1000} />
      </Stack>
    </Show>
  );
};
