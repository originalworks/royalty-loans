import { ethers } from 'ethers';
import { useState, useMemo } from 'react';
import { useChainId, useChains } from 'wagmi';

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

import { useDataProvider } from '../../hooks';
import { CustomColumnMenu } from '../../components';
import { TRANSACTIONS_LIST_QUERY, STATISTICS_QUERY } from '../queries';

export const TransactionsList = () => {
  const chainId = useChainId();
  const chains = useChains();
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const [contractAddresses, setContractAddresses] = useState('');
  const [tokenAddresses, setTokenAddresses] = useState('');

  const dataProvider = useDataProvider();

  const { data } = useOne({
    id: 'status',
    resource: 'stats',
    meta: {
      gqlQuery: STATISTICS_QUERY,
    },
    dataProviderName: dataProvider,
  });

  const { dataGridProps: searchDataGridProps } = useDataGrid({
    filters: {
      mode: 'off',
    },
    resource: 'expenses',
    meta: {
      gqlQuery: TRANSACTIONS_LIST_QUERY,
      gqlVariables: {
        first: 1000,
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
    dataProviderName: dataProvider,
    syncWithLocation: false,
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
    dataProviderName: dataProvider,
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
        field: 'chainId',
        headerName: 'Network',
        type: 'string',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render() {
          const foundChain = chains.find((chain) => chain.id === chainId);
          if (!foundChain) return null;
          return <TextField value={foundChain.name} />;
        },
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
        sortable: false,
        disableColumnMenu: true,
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
        display: 'flex',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return <ShowButton hideText recordItemId={row.id} />;
        },
      },
    ],
    [chainId, chains],
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
        rowCount={
          contractAddresses === '' && tokenAddresses === ''
            ? Number(data?.data?.expensesCount) || 0
            : searchDataGridProps.rows.length || 0
        }
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
        slots={{ columnMenu: CustomColumnMenu }}
      />
    </List>
  );
};
