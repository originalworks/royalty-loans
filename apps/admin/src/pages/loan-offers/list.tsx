import { ethers } from 'ethers';
import { readContract } from 'wagmi/actions';
import { useEffect, useState, useMemo } from 'react';
import { useAccount, useChainId, useChains, useConfig } from 'wagmi';

import {
  List,
  DateField,
  ShowButton,
  useDataGrid,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { Button } from '@mui/material';
import { useOne } from '@refinedev/core';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { ConnectButton } from '../../components';
import { useLoanOffers, useDataProvider } from '../../hooks';
import { erc20Abi, royaltyLoanAbi } from '../../generated/smart-contracts';
import { LOAN_OFFERS_LIST_QUERY, STATISTICS_QUERY } from '../queries';

export const LoanOffersList = () => {
  const config = useConfig();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const chains = useChains();

  const [results, setResults] = useState<
    Array<{ contract: string; active: boolean; canRepay: boolean }>
  >([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const dataProvider = useDataProvider();
  const { isLoading, provideLoanFn, processRepaymentFn } = useLoanOffers();

  const { data } = useOne({
    id: 'status',
    resource: 'stats',
    meta: {
      gqlQuery: STATISTICS_QUERY,
    },
    dataProviderName: dataProvider,
  });

  const { dataGridProps } = useDataGrid({
    filters: {
      mode: 'off',
    },
    resource: 'loanContracts',
    meta: {
      gqlQuery: LOAN_OFFERS_LIST_QUERY,
      gqlVariables: {
        first: pageSize,
        skip: page * pageSize,
      },
    },
    dataProviderName: dataProvider,
    syncWithLocation: false,
  });

  useEffect(() => {
    async function fetchData() {
      if (!dataGridProps.rows || dataGridProps.rows.length === 0) return;
      const contracts: Array<`0x${string}`> = dataGridProps.rows.map(
        (row) => row.loanContract,
      );

      try {
        contracts.map(async (contract) => {
          const data = await readContract(config, {
            address: contract,
            abi: royaltyLoanAbi,
            functionName: 'loanActive',
          });
          const paymentToken = await readContract(config, {
            abi: royaltyLoanAbi,
            address: contract,
            functionName: 'paymentToken',
            args: [],
          });
          if (!paymentToken)
            setResults((prevState) => [
              ...prevState,
              { contract, active: data, canRepay: false },
            ]);
          else {
            const amount = await readContract(config, {
              abi: erc20Abi,
              address: paymentToken,
              functionName: 'balanceOf',
              args: [contract],
            });
            if (amount > 0)
              setResults((prevState) => [
                ...prevState,
                { contract, active: data, canRepay: true },
              ]);
            else
              setResults((prevState) => [
                ...prevState,
                { contract, active: data, canRepay: false },
              ]);
          }
        });
      } catch (error) {
        console.error('Error reading contracts:', error);
      }
    }

    fetchData();
  }, [config, dataGridProps.rows]);

  const columns = useMemo<GridColDef[]>(
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
        field: 'chainId',
        headerName: 'Network',
        type: 'string',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        renderCell: function render() {
          const foundChain = chains.find((chain) => chain.id === chainId);
          if (!foundChain) return null;
          return <TextField value={foundChain.name} />;
        },
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
        field: 'cumulatedGasPrice',
        headerName: 'Cumulated Gas Price (GWEI)',
        type: 'number',
        minWidth: 150,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: function render({ row }) {
          const expenses = row.expenses as Array<{
            gasPrice: string;
            totalCost: string;
          }>;
          if (!expenses) return null;

          const cumulatedGasPrice = expenses.reduce(
            (accumulator, currentValue) =>
              accumulator + Number(currentValue.gasPrice),
            0,
          );
          return (
            <TextField value={ethers.formatUnits(cumulatedGasPrice, 'gwei')} />
          );
        },
      },
      {
        field: 'cumulatedTotalCost',
        headerName: 'Cumulated Total Cost (ETH)',
        type: 'number',
        minWidth: 250,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: function render({ row }) {
          const expenses = row.expenses as Array<{
            gasPrice: string;
            totalCost: string;
          }>;
          if (!expenses) return null;

          const cumulatedTotalCost = expenses.reduce(
            (accumulator, currentValue) =>
              accumulator + Number(currentValue.totalCost),
            0,
          );
          return <TextField value={ethers.formatEther(cumulatedTotalCost)} />;
        },
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
        field: 'expenses',
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
              {row.status === 'active' &&
                results.find(({ contract }) => contract === row.loanContract)
                  ?.canRepay &&
                (isConnected ? (
                  <Button
                    size="large"
                    variant="contained"
                    loading={isLoading === row.loanContract}
                    onClick={() => processRepaymentFn(row.loanContract)}
                  >
                    Process Repayment
                  </Button>
                ) : (
                  <ConnectButton />
                ))}

              {(row.status === 'pending' ||
                (row.status === 'pending' &&
                  !results.find(({ contract }) => contract === row.loanContract)
                    ?.active)) &&
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
    [isConnected, isLoading, results, chains, chainId],
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        rowCount={Number(data?.data?.contractsCount) || 0}
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
