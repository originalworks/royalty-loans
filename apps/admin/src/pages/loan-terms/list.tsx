import React, { useState } from 'react';
import { useChainId, useChains } from 'wagmi';

import {
  List,
  DateField,
  EditButton,
  ShowButton,
  useDataGrid,
  DeleteButton,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Autocomplete, Stack, TextField as InputField } from '@mui/material';

import { CustomColumnMenu } from '../../components';

export const LoanTermsList = () => {
  const chains = useChains();
  const chainId = useChainId();

  const [chain, setChain] = useState<string>(chainId.toString());

  const { dataGridProps } = useDataGrid({
    sorters: {
      initial: [
        {
          field: 'id',
          order: 'desc',
        },
      ],
    },
    filters: {
      initial: [
        {
          field: 'chainId',
          operator: 'eq',
          value: chain,
        },
      ],
    },
    syncWithLocation: false,
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
        field: 'collateralTokenAddress',
        headerName: 'Collateral Token',
        type: 'string',
        minWidth: 300,
        display: 'flex',
        flex: 1,
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
        renderCell: function render({ value }) {
          if (!value) return null;
          const foundChain = chains.find((chain) => chain.id === Number(value));
          if (!foundChain) return null;
          return <TextField value={foundChain.name} />;
        },
        sortable: false,
        filterable: false,
        hideable: false,
        disableColumnMenu: true,
      },
      {
        field: 'feePercentagePpm',
        headerName: 'Fee Ppm',
        type: 'number',
        minWidth: 200,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        description: '1% = 10000',
      },
      {
        field: 'maxLoanAmount',
        headerName: 'Max Loan Amount',
        type: 'number',
        minWidth: 200,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'ratio',
        headerName: 'Ratio',
        type: 'string',
        minWidth: 100,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'createdAt',
        headerName: 'Created at',
        minWidth: 120,
        display: 'flex',
        renderCell: function render({ value }) {
          return <DateField value={value} />;
        },
      },
      {
        field: 'updatedAt',
        headerName: 'Updated at',
        minWidth: 120,
        display: 'flex',
        renderCell: function render({ value }) {
          return <DateField value={value} />;
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        align: 'center',
        headerAlign: 'center',
        minWidth: 220,
        display: 'flex',
        sortable: false,
        disableColumnMenu: true,
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.id} />
              <ShowButton hideText recordItemId={row.id} />
              <DeleteButton hideText recordItemId={row.id} />
            </>
          );
        },
      },
    ],
    [chains],
  );

  return (
    <List>
      <Stack direction="row" gap={1}>
        <Autocomplete
          id="chainId"
          sx={{ flex: 1, marginTop: 0 }}
          disableClearable
          defaultValue={
            chains.find((chain) => chain.id === chainId)?.id.toString() ||
            chains[0].id.toString()
          }
          options={chains.map((chain) => chain.id.toString())}
          onChange={(_, value) => {
            setChain(value);
            dataGridProps.onFilterModelChange({
              items: [
                {
                  field: 'chainId',
                  operator: 'eq',
                  value,
                },
              ],
            });
          }}
          getOptionLabel={(item) =>
            chains.find((chain) => chain.id.toString() === item)?.name || ''
          }
          isOptionEqualToValue={(option, value) =>
            value === undefined || option?.toString() === value?.toString()
          }
          renderInput={(params) => (
            <InputField
              {...params}
              label="Network"
              margin="normal"
              variant="outlined"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          )}
        />
      </Stack>

      <DataGrid
        {...dataGridProps}
        columns={columns}
        slots={{ columnMenu: CustomColumnMenu }}
      />
    </List>
  );
};
