import { useCallback, useMemo, useState } from 'react';

import {
  List,
  DateField,
  TextFieldComponent as TextField,
} from '@refinedev/mui';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { GNOSIS_RPC_URL } from '../../config/config';
import { SENTRY_EVENTS_QUERY } from '../../config/sentry';
import { useValidators } from '../../hooks/useValidatorLookup';
import {
  fetchValidatorCandidatesFromSentry,
  getExplorerTxLink,
  getSentryConfigured,
  type SentryValidatorCandidate,
} from '../../utils';
import { CustomColumnMenu } from '../../components';

function renderLatestIssueTitle(row: {
  status: string;
  latestIssueTitle: string | null;
  latestIssueLink: string | null;
}) {
  if (row.status === 'loading') {
    return <CircularProgress size={20} />;
  }

  if (!row.latestIssueTitle) {
    return <TextField value="None" />;
  }

  if (row.latestIssueLink) {
    return (
      <Link
        href={row.latestIssueLink}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ fontSize: '0.875rem' }}
      >
        {row.latestIssueTitle}
      </Link>
    );
  }

  return <TextField value={row.latestIssueTitle} />;
}

function renderHeartbeatStatus(row: {
  heartbeatStatus: string;
}) {
  if (row.heartbeatStatus === 'loading') {
    return <CircularProgress size={20} />;
  }

  if (row.heartbeatStatus === 'ok') {
    return <Chip label="OK" size="small" color="success" />;
  }

  if (row.heartbeatStatus === 'stale') {
    return <Chip label="Stale" size="small" color="error" />;
  }

  if (row.heartbeatStatus === 'error') {
    return <Chip label="Error" size="small" color="error" variant="outlined" />;
  }

  return <Chip label="Missing" size="small" color="error" variant="outlined" />;
}

export const ValidatorsList = () => {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<SentryValidatorCandidate[]>([]);
  const {
    rows,
    isRefreshing,
    addValidator,
    removeValidator,
    refreshAll,
    monitoredAddresses,
  } = useValidators();

  const loadCandidates = useCallback(async () => {
    setDiscoverLoading(true);
    setDiscoverError(null);

    try {
      const discovered = await fetchValidatorCandidatesFromSentry();
      setCandidates(discovered);
    } catch (err) {
      setDiscoverError(
        err instanceof Error ? err.message : 'Failed to load Sentry events',
      );
      setCandidates([]);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  const handleOpenDiscover = () => {
    setDiscoverOpen(true);
    void loadCandidates();
  };

  const handleAddCandidate = useCallback(
    (candidate: SentryValidatorCandidate) => {
      const error = addValidator(candidate.address, candidate.username);
      if (error) {
        setDiscoverError(error);
      }
    },
    [addValidator],
  );

  const availableCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) => !monitoredAddresses.includes(candidate.address),
      ),
    [candidates, monitoredAddresses],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'username',
        headerName: 'Username',
        minWidth: 160,
        flex: 0.6,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ row }) => (
          <TextField value={row.username ?? '-'} />
        ),
      },
      {
        field: 'heartbeatStatus',
        headerName: 'Status',
        minWidth: 110,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => renderHeartbeatStatus(row),
      },
      {
        field: 'lastHeartbeatAt',
        headerName: 'Status Confirmed At',
        minWidth: 180,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => {
          if (row.heartbeatStatus === 'loading') {
            return <CircularProgress size={20} />;
          }
          if (!row.lastHeartbeatAt) {
            return <TextField value="-" />;
          }
          return (
            <DateField
              value={row.lastHeartbeatAt}
              format={'YYYY-MM-DD HH:mm:ss'}
            />
          );
        },
      },
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
          return <DateField value={row.lastTxTimestamp} format={'YYYY-MM-DD HH:mm:ss'}/>;
        },
      },
      {
        field: 'latestIssueTitle',
        headerName: 'Latest Issue',
        flex: 1,
        minWidth: 280,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => renderLatestIssueTitle(row),
      },
      {
        field: 'latestIssueLastSeen',
        headerName: 'Latest Issue At',
        minWidth: 180,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => {
          if (row.status === 'loading' || !row.latestIssueLastSeen) return null;
          return <DateField value={row.latestIssueLastSeen} format={'YYYY-MM-DD HH:mm:ss'}/>;
        },
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

  const candidateColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'username',
        headerName: 'Username',
        minWidth: 160,
        flex: 0.6,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ row }) => (
          <TextField value={row.username ?? '-'} />
        ),
      },
      {
        field: 'address',
        headerName: 'Address (user.id)',
        flex: 1,
        minWidth: 380,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ value }) => <TextField value={value} />,
      },
      {
        field: 'latestIssueTitle',
        headerName: 'Latest Issue',
        flex: 1,
        minWidth: 260,
        display: 'flex',
        align: 'left',
        headerAlign: 'left',
        sortable: false,
        valueGetter: (_value, row: SentryValidatorCandidate) =>
          row.latestIssue?.title ?? 'None',
        renderCell: ({ row }) => {
          const title = row.latestIssue?.title;
          const link = row.latestIssue?.permalink;

          if (!title) {
            return <TextField value="None" />;
          }

          if (link) {
            return (
              <Link
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: '0.875rem' }}
              >
                {title}
              </Link>
            );
          }

          return <TextField value={title} />;
        },
      },
      {
        field: 'latestIssueLevel',
        headerName: 'Level',
        minWidth: 100,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        valueGetter: (_value, row: SentryValidatorCandidate) =>
          row.latestIssue?.level ?? '',
        renderCell: ({ row }) => {
          const level = row.latestIssue?.level;
          if (!level) return null;

          return (
            <Chip
              label={level}
              size="small"
              color={level === 'warning' ? 'warning' : 'error'}
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'latestIssueTimestamp',
        headerName: 'Latest Issue At',
        minWidth: 180,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        valueGetter: (_value, row: SentryValidatorCandidate) =>
          row.latestIssue?.timestamp ?? null,
        renderCell: ({ row }) => {
          const timestamp = row.latestIssue?.timestamp;
          if (!timestamp) return <TextField value="-" />;
          return <DateField value={timestamp} />;
        },
      },
      {
        field: 'eventCount',
        headerName: `Events (${SENTRY_EVENTS_QUERY.statsPeriod})`,
        minWidth: 140,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 90,
        display: 'flex',
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: ({ row }) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleAddCandidate(row)}
            disabled={!GNOSIS_RPC_URL}
          >
            Add
          </Button>
        ),
      },
    ],
    [handleAddCandidate],
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
            VITE_SENTRY_PROJECT to discover validators from Sentry logs. The
            auth token needs org:read (Explore logs) and event:read (issues).
          </Alert>
        )}

        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDiscover}
            disabled={!getSentryConfigured()}
          >
            Discover from Sentry
          </Button>
          <Typography variant="body2" color="text.secondary">
            Loads recent Sentry events, groups them by validator address
            (user.id), and lets you add them to the monitoring list.
          </Typography>
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

      <Dialog
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Discover validators from Sentry</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              Validators are identified by Sentry user.id values that look like
              0x addresses. Each row shows the most recent issue seen for that
              validator in the last {SENTRY_EVENTS_QUERY.statsPeriod}.
            </Typography>

            {discoverError && <Alert severity="error">{discoverError}</Alert>}

            {discoverLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : availableCandidates.length === 0 ? (
              <Alert severity="info">
                {candidates.length === 0
                  ? 'No validator addresses were found in recent Sentry events.'
                  : 'All discovered validators are already on the monitoring list.'}
              </Alert>
            ) : (
              <DataGrid
                rows={availableCandidates}
                columns={candidateColumns}
                getRowId={(row) => row.address}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableColumnFilter
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={
              discoverLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            onClick={() => void loadCandidates()}
            disabled={discoverLoading}
          >
            Reload
          </Button>
          <Button onClick={() => setDiscoverOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </List>
  );
};
