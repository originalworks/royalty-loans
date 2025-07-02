import React from 'react';

import {
  List,
  DateField,
  EditButton,
  ShowButton,
  useDataGrid,
  DeleteButton,
} from '@refinedev/mui';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

export const LoanTermsList = () => {
  const { dataGridProps } = useDataGrid({
    pagination: {
      mode: 'off',
    },
    filters: {
      mode: 'off',
    },
    sorters: {
      mode: 'off',
    },
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
        field: 'feePercentagePpm',
        headerName: 'Fee Ppm',
        type: 'number',
        minWidth: 200,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
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
        sortable: false,
        display: 'flex',
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
    [],
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} />
    </List>
  );
};
