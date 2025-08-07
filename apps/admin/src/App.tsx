import axios from 'axios';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router';

import {
  ErrorComponent,
  ThemedLayoutV2,
  RefineSnackbarProvider,
  useNotificationProvider,
} from '@refinedev/mui';
import {
  Refine,
  AuthProvider,
  Authenticated,
  GetListParams,
} from '@refinedev/core';
import routerBindings, {
  CatchAllNavigate,
  NavigateToResource,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from '@refinedev/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import CssBaseline from '@mui/material/CssBaseline';
import createDataProvider from '@refinedev/graphql';
import GlobalStyles from '@mui/material/GlobalStyles';
import nestjsxCrudDataProvider from '@refinedev/nestjsx-crud';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { Client, fetchExchange, OperationResult } from '@urql/core';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';

import {
  BACKEND_URL,
  BASE_SUBGRAPH_URL,
  POLYGON_SUBGRAPH_URL,
} from './config/config';
import {
  LoanTermEdit,
  LoanTermsList,
  LoanTermsShow,
  LoanTermCreate,
} from './pages/loan-terms';
import { Login } from './pages/login';
import { Header } from './components';
import { AppIcon } from './components/app-icon';
import { ColorModeContextProvider } from './contexts/color-mode';
import { LoanOfferShow, LoanOffersList } from './pages/loan-offers';
import { TransactionShow, TransactionsList } from './pages/transactions';

const gqlBaseClient = new Client({
  url: BASE_SUBGRAPH_URL,
  exchanges: [fetchExchange],
});

const gqlPolygonClient = new Client({
  url: POLYGON_SUBGRAPH_URL,
  exchanges: [fetchExchange],
});

const gqlDataProvider = (client: Client) =>
  createDataProvider(client, {
    getOne: {
      dataMapper: (response: OperationResult, params: GetListParams) => {
        if (params.resource) return response.data?.[params.resource];
        return response.data;
      },
    },
    getList: {
      dataMapper: (response: OperationResult, params: GetListParams) => {
        if (params.resource) return response.data?.[params.resource];
        return response.data;
      },
      buildVariables: (params) => {
        const sorter = params.sorters?.[0];
        return {
          ...params.meta?.gqlVariables,
          orderBy: sorter?.field || 'timestamp',
          orderDirection: sorter?.order?.toLowerCase() || 'desc',
        };
      },
    },
  });

function App() {
  const { isLoading, user, logout, getAccessTokenSilently } = useAuth0();

  const authProvider: AuthProvider = {
    login: async () => {
      return {
        success: true,
      };
    },
    logout: async () => {
      logout({ returnTo: window.location.origin });
      return {
        success: true,
      };
    },
    onError: async (error) => {
      console.error(error);
      return { error };
    },
    check: async () => {
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          axios.defaults.headers.common = {
            Authorization: `Bearer ${token}`,
          };
          return {
            authenticated: true,
          };
        } else {
          return {
            authenticated: false,
            error: {
              message: 'Check failed',
              name: 'Token not found',
            },
            redirectTo: '/login',
            logout: true,
          };
        }
      } catch (error: any) {
        return {
          authenticated: false,
          error: new Error(error),
          redirectTo: '/login',
          logout: true,
        };
      }
    },
    getPermissions: async () => null,
    getIdentity: async () => {
      if (user) {
        return {
          ...user,
          avatar: user.picture,
        };
      }
      return null;
    },
  };

  if (isLoading) {
    return <span>loading...</span>;
  }

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={{
                  default: nestjsxCrudDataProvider(BACKEND_URL, axios),
                  graphQlBase: gqlDataProvider(gqlBaseClient),
                  graphQlPolygon: gqlDataProvider(gqlPolygonClient),
                }}
                notificationProvider={useNotificationProvider}
                authProvider={authProvider}
                routerProvider={routerBindings}
                resources={[
                  {
                    name: 'loan-terms',
                    list: '/loan-terms',
                    create: '/loan-terms/create',
                    edit: '/loan-terms/edit/:id',
                    show: '/loan-terms/show/:id',
                    meta: {
                      canDelete: true,
                    },
                  },
                  {
                    name: 'loan-offers',
                    list: '/loan-offers',
                    show: '/loan-offers/show/:id',
                  },
                  {
                    name: 'transactions',
                    list: '/transactions',
                    show: '/transactions/show/:id',
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: '8GuJaC-Rnp2Zt-um5Kow',
                  title: { text: 'OW Admin', icon: <AppIcon /> },
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayoutV2 Header={Header}>
                          <Outlet />
                        </ThemedLayoutV2>
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="loan-terms" />}
                    />
                    <Route path="/loan-terms">
                      <Route index element={<LoanTermsList />} />
                      <Route path="create" element={<LoanTermCreate />} />
                      <Route path="edit/:id" element={<LoanTermEdit />} />
                      <Route path="show/:id" element={<LoanTermsShow />} />
                    </Route>
                    <Route path="/loan-offers">
                      <Route index element={<LoanOffersList />} />
                      <Route path="show/:id" element={<LoanOfferShow />} />
                    </Route>
                    <Route path="/transactions">
                      <Route index element={<TransactionsList />} />
                      <Route path="show/:id" element={<TransactionShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </RefineSnackbarProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
