import React from 'react';

import {
  List,
  DateField,
  EditButton,
  ShowButton,
  useDataGrid,
  DeleteButton,
} from '@refinedev/mui';
import { useList, useMany } from '@refinedev/core';
import { Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { POSTS_LIST_QUERY } from './queries';

export const BlogPostList = () => {
  const { data } = useList({
    resource: 'blogPosts',
    meta: {
      gqlQuery: POSTS_LIST_QUERY,
    },
    dataProviderName: 'graphQl',
    queryOptions: {
      retry(failureCount, error) {
        console.log('error', error);
        if (error?.message.includes('Network Error') && failureCount <= 3)
          return true;
        return false;
      },
    },
  });

  console.log('data', data);

  const { dataGridProps } = useDataGrid({});

  const { data: categoryData, isLoading: categoryIsLoading } = useMany({
    resource: 'categories',
    ids:
      dataGridProps?.rows
        ?.map((item: any) => item?.category?.id)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataGridProps?.rows,
    },
  });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        minWidth: 50,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'title',
        headerName: 'Title',
        minWidth: 200,
        display: 'flex',
      },
      {
        field: 'content',
        flex: 1,
        headerName: 'Content',
        minWidth: 250,
        display: 'flex',
        renderCell: function render({ value }) {
          if (!value) return '-';
          return (
            <Typography
              component="p"
              whiteSpace="pre"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {value}
            </Typography>
          );
        },
      },
      {
        field: 'category',
        headerName: 'Category',
        minWidth: 160,
        display: 'flex',
        valueGetter: (_, row) => {
          return row?.category;
        },
        renderCell: function render({ value }) {
          return categoryIsLoading ? (
            <>Loading...</>
          ) : (
            categoryData?.data?.find((item) => item.id === value?.id)?.title
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 80,
        display: 'flex',
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
        field: 'actions',
        headerName: 'Actions',
        align: 'right',
        headerAlign: 'right',
        minWidth: 120,
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
    [categoryData, categoryIsLoading],
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} />
    </List>
  );
};
