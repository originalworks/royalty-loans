import { useMemo, useState } from 'react';

import {
  List,
  DateField,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  TextField as InputField,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { GNOSIS_RPC_URL } from '../../config/config';
import { SENTRY_ISSUE_QUERY } from '../../config/sentry';
import { useValidators } from '../../hooks/useValidatorLookup';
import { getExplorerTxLink, getSentryConfigured } from '../../utils';
import { CustomColumnMenu } from '../../components';

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function renderSentryCount(
  row: { status: string },
  count: number | null,
  link: string | null,
) {
  if (row.status === 'loading') {
    return <CircularProgress size={20} />;
  }

  if (count === null) {
    return <TextField value="-" />;
  }

  if (count === 0) {
    return <TextField value="0" />;
  }

  if (link) {
    return (
      <Link
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ fontWeight: 600 }}
      >
        {count}
      </Link>
    );
  }

  return <TextField value={String(count)} />;
}

export const ValidatorsList = () => {
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { rows, isRefreshing, addValidator, removeValidator, refreshAll } =
    useValidators();

  const handleAdd = () => {
    const normalized = address.trim().toLowerCase();

    if (!ADDRESS_PATTERN.test(normalized)) {
      setValidationError('Enter a valid 0x address');
      return;
    }

    const error = addValidator(normalized);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setAddress('');
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'address',
        headerName: 'Address',
        flex: 1,
        minWidth: 380,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ value }) => <TextField value={value} />,
      },
      {
        field: 'balance',
        headerName: 'Balance (xDAI)',
        minWidth: 180,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => {
          if (row.status === 'loading') {
            return <CircularProgress size={20} />;
          }
          if (row.status === 'error') {
            return <TextField value={row.error ?? 'Error'} />;
          }
          return <TextField value={row.balance ?? '-'} />;
        },
      },
      {
        field: 'lastTxHash',
        headerName: 'Last TX Sent',
        flex: 1,
        minWidth: 320,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => {
          if (row.status === 'loading') return null;
          if (!row.lastTxHash) {
            return <TextField value="None" />;
          }

          const txLink = getExplorerTxLink(row.lastTxHash);
          if (txLink) {
            return (
              <Link
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {row.lastTxHash}
              </Link>
            );
          }

          return (
            <TextField
              value={row.lastTxHash}
              sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
          );
        },
      },
      {
        field: 'lastTxTimestamp',
        headerName: 'Last TX At',
        minWidth: 180,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => {
          if (row.status === 'loading' || !row.lastTxTimestamp) return null;
          return <DateField value={row.lastTxTimestamp} />;
        },
      },
      {
        field: 'sentryErrors',
        headerName: `Sentry Errors (${SENTRY_ISSUE_QUERY.statsPeriod})`,
        minWidth: 160,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) =>
          renderSentryCount(row, row.sentryErrorCount, row.sentryErrorLink),
      },
      {
        field: 'sentryWarnings',
        headerName: `Sentry Warnings (${SENTRY_ISSUE_QUERY.statsPeriod})`,
        minWidth: 180,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) =>
          renderSentryCount(row, row.sentryWarningCount, row.sentryWarningLink),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 80,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            aria-label="Remove validator"
            onClick={() => removeValidator(row.id)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [removeValidator],
  );

  return (
    <List
      title="Validators"
      headerButtons={
        <Button
          startIcon={
            isRefreshing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={() => void refreshAll()}
          disabled={isRefreshing || rows.length === 0}
        >
          Refresh
        </Button>
      }
    >
      <Stack gap={2}>
        {!GNOSIS_RPC_URL && (
          <Alert severity="warning">
            Set VITE_GNOSIS_RPC_URL in your environment to enable validator
            lookups.
          </Alert>
        )}

        {!getSentryConfigured() && (
          <Alert severity="info">
            Set VITE_SENTRY_HOST, VITE_SENTRY_API_URL, VITE_SENTRY_ORG, and
            VITE_SENTRY_PROJECT to enable Sentry error and warning lookups. The
            auth token must include the event:read scope.
          </Alert>
        )}

        <Box display="flex" gap={2} alignItems="flex-start">
          <InputField
            label="Validator address (Gnosis)"
            placeholder="0x..."
            value={address}
            onChange={(event) =>
              setAddress(event.target.value.toLowerCase())
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleAdd();
              }
            }}
            error={!!validationError}
            helperText={validationError}
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!address.trim() || !GNOSIS_RPC_URL}
            sx={{ mt: 1, minWidth: 80 }}
          >
            Add
          </Button>
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableColumnFilter
          slots={{ columnMenu: CustomColumnMenu }}
        />
      </Stack>
    </List>
  );
};
