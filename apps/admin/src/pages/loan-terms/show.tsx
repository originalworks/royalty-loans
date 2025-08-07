import { useChains } from 'wagmi';

import {
  Show,
  DateField,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { useShow } from '@refinedev/core';
import { Stack, Typography } from '@mui/material';

export const LoanTermsShow = () => {
  const chains = useChains();
  const { query } = useShow({});
  const { data, isLoading } = query;

  const record = data?.data;
  const foundChain = chains.find(
    (chain) => chain.id === Number(record?.chainId),
  );

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          ID
        </Typography>
        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          Collateral Token
        </Typography>
        <TextField value={record?.collateralTokenAddress} />

        {foundChain && (
          <>
            <Typography variant="body1" fontWeight="bold">
              Network
            </Typography>
            <TextField value={foundChain.name} />
          </>
        )}

        <Typography variant="body1" fontWeight="bold">
          Fee Ppm (1% = 10000)
        </Typography>
        <TextField value={record?.feePercentagePpm} />

        <Typography variant="body1" fontWeight="bold">
          Max Loan Amount
        </Typography>
        <TextField value={record?.maxLoanAmount} />

        <Typography variant="body1" fontWeight="bold">
          Ratio
        </Typography>
        <TextField value={record?.ratio} />

        <Typography variant="body1" fontWeight="bold">
          Created At
        </Typography>
        <DateField value={record?.createdAt} />

        <Typography variant="body1" fontWeight="bold">
          Updated At
        </Typography>
        <DateField value={record?.updatedAt} />
      </Stack>
    </Show>
  );
};
