import { ethers } from 'ethers';
import React, { useState, useMemo } from 'react';

import {
  List,
  DateField,
  ShowButton,
  useDataGrid,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { useOne } from '@refinedev/core';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Stack, TextField as InputField } from '@mui/material';

import { TRANSACTIONS_LIST_QUERY, STATISTICS_QUERY } from '../queries';

export const TransactionsList = () => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const [contractAddresses, setContractAddresses] = React.useState('');
  const [tokenAddresses, setTokenAddresses] = React.useState('');

  const { data } = useOne({
    id: 'status',
    resource: 'stats',
    meta: {
      gqlQuery: STATISTICS_QUERY,
    },
    dataProviderName: 'graphQl',
  });

  const { dataGridProps } = useDataGrid({
    filters: {
      mode: 'off',
    },
    resource: 'expenses',
    meta: {
      gqlQuery: TRANSACTIONS_LIST_QUERY,
      gqlVariables: {
        first: pageSize,
        skip: page * pageSize,
        where: {
          loanContract_: {
            ...(contractAddresses.length > 0
              ? {
                  loanContract_in: contractAddresses
                    .replace(/ /g, '')
                    .split(','),
                }
              : {}),
            ...(tokenAddresses.length > 0
              ? {
                  collateralToken_in: tokenAddresses
                    .replace(/ /g, '')
                    .split(','),
                }
              : {}),
          },
        },
      },
    },
    dataProviderName: 'graphQl',
    syncWithLocation: false,
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'string',
        minWidth: 50,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'loanContract__id',
        headerName: 'Contract Address',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
        renderCell: function render({ row }) {
          return <TextField value={row.loanContract.id} />;
        },
      },
      {
        field: 'loanContract__collateralToken',
        headerName: 'Collateral Token',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
        renderCell: function render({ row }) {
          return <TextField value={row.loanContract.collateralToken} />;
        },
      },
      {
        field: 'kind',
        headerName: 'Type',
        type: 'string',
        minWidth: 150,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'transactionHash',
        headerName: 'Transaction Hash',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'gasPrice',
        headerName: 'Gas Price (GWEI)',
        type: 'number',
        minWidth: 150,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        renderCell: function render({ value }) {
          if (!value) return null;
          return <TextField value={ethers.formatUnits(value, 'gwei')} />;
        },
      },
      {
        field: 'totalCost',
        headerName: 'Total Cost (ETH)',
        type: 'number',
        minWidth: 250,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        renderCell: function render({ value }) {
          if (!value) return null;
          return <TextField value={ethers.formatEther(value)} />;
        },
      },
      {
        field: 'timestamp',
        headerName: 'Created at',
        minWidth: 120,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        renderCell: function render({ value }) {
          return <DateField value={value * 1000} />;
        },
      },
      {
        field: 'loanContract',
        headerName: 'Actions',
        align: 'center',
        headerAlign: 'center',
        minWidth: 100,
        sortable: false,
        display: 'flex',
        renderCell: function render({ row }) {
          return <ShowButton hideText recordItemId={row.id} />;
        },
      },
    ],
    [],
  );

  return (
    <List>
      <Stack direction="row" gap={1}>
        <InputField
          sx={{ flex: 1, marginTop: 0 }}
          margin="normal"
          type="text"
          label="Loan Contract Addresses"
          name="loanContractAddress"
          onChange={(event) =>
            setContractAddresses(event.target.value.toLowerCase())
          }
        />

        <InputField
          sx={{ flex: 1, marginTop: 0 }}
          margin="normal"
          type="text"
          label="Collateral Token Addresses"
          name="collateralTokenAddresses"
          onChange={(event) =>
            setTokenAddresses(event.target.value.toLowerCase())
          }
        />
      </Stack>

      <DataGrid
        {...dataGridProps}
        rowCount={Number(data?.data?.expensesCount) || 0}
        pageSizeOptions={[10, 25, 50, 100]}
        onPaginationModelChange={({ pageSize, page }) => {
          setPageSize(pageSize);
          setPage(page);
        }}
        paginationModel={{
          page: page,
          pageSize: pageSize,
        }}
        columns={columns}
        disableColumnFilter
      />
    </List>
  );
};
