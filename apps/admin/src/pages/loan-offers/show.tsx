import {
  Show,
  DateField,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { Stack, Typography } from '@mui/material';
import { useShow, useParsed } from '@refinedev/core';

import { LOAN_OFFER_SHOW_QUERY } from './queries';

export const LoanOfferShow = () => {
  const { id } = useParsed();

  const { query } = useShow({
    id,
    resource: 'loanContract',
    meta: {
      gqlQuery: LOAN_OFFER_SHOW_QUERY,
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
        <TextField value={record?.loanContract} />

        <Typography variant="body1" fontWeight="bold">
          Collateral Token
        </Typography>
        <TextField value={record?.collateralToken} />

        <Typography variant="body1" fontWeight="bold">
          Collateral Amount
        </Typography>
        <TextField value={record?.collateralAmount} />

        <Typography variant="body1" fontWeight="bold">
          Loan Amount
        </Typography>
        <TextField value={record?.loanAmount} />

        <Typography variant="body1" fontWeight="bold">
          Fee Ppm (1% = 10000)
        </Typography>
        <TextField value={record?.feePpm} />

        <Typography variant="body1" fontWeight="bold">
          Status
        </Typography>
        <TextField value={record?.status} />

        <Typography variant="body1" fontWeight="bold">
          Created At
        </Typography>
        <DateField value={record?.timestamp * 1000} />
      </Stack>
    </Show>
  );
};
