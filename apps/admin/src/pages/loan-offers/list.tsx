import React from 'react';
import { useAccount } from 'wagmi';

import { Button } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { List, ShowButton, useDataGrid, DateField } from '@refinedev/mui';

import { useProvideLoan } from '../../hooks';
import { ConnectButton } from '../../components';
import { LOAN_OFFERS_LIST_QUERY } from './queries';

export const LoanOffersList = () => {
  const { isConnected } = useAccount();
  const { isLoading, provideLoanFn } = useProvideLoan();

  const { dataGridProps } = useDataGrid({
    resource: 'loanContracts',
    meta: {
      gqlQuery: LOAN_OFFERS_LIST_QUERY,
    },
    dataProviderName: 'graphQl',
  });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'string',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'loanContract',
        headerName: 'Contract Address',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'collateralToken',
        headerName: 'Collateral Token',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'collateralAmount',
        headerName: 'Collateral Amount',
        type: 'number',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'loanAmount',
        headerName: 'Loan Amount',
        type: 'number',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'feePpm',
        headerName: 'Fee Ppm',
        type: 'number',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        description: '1% = 10000',
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'string',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'timestamp',
        headerName: 'Created at',
        minWidth: 120,
        display: 'flex',
        renderCell: function render({ value }) {
          return <DateField value={value * 1000} />;
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        align: 'center',
        headerAlign: 'center',
        minWidth: 220,
        sortable: false,
        display: 'flex',
        renderCell: function render({ row }) {
          return (
            <>
              <ShowButton hideText recordItemId={row.id} />
              {row.status === 'pending' &&
                (isConnected ? (
                  <Button
                    size="large"
                    variant="contained"
                    loading={isLoading === row.loanContract}
                    onClick={() => provideLoanFn(row.loanContract)}
                  >
                    Provide Loan
                  </Button>
                ) : (
                  <ConnectButton />
                ))}
            </>
          );
        },
      },
    ],
    [isConnected, isLoading, provideLoanFn],
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} />
    </List>
  );
};
