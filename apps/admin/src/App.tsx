import Web3 from "web3";
import Web3Modal from "web3modal";
import {
  Refine,
  GitHubBanner,
  Authenticated,
  AuthProvider,
} from '@refinedev/core';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';

import {
  ErrorComponent,
  useNotificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
} from '@refinedev/mui';

import nestjsxCrudDataProvider from '@refinedev/nestjsx-crud';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router';
import routerBindings, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router';
import {
  BlogPostList,
  BlogPostCreate,
  BlogPostEdit,
  BlogPostShow,
} from './pages/blog-posts';
import {
  CategoryList,
  CategoryCreate,
  CategoryEdit,
  CategoryShow,
} from './pages/categories';
import { AppIcon } from './components/app-icon';
import { ColorModeContextProvider } from './contexts/color-mode';
import { Header } from './components/header';
import { Login } from './pages/login';

export const TOKEN_KEY = "refine-auth";

const providerOptions = {};
const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions,
});

let provider: any | null = null;

function App() {
  const { isLoading, user, logout, getIdTokenClaims } = useAuth0();

  const API_URL = 'https://api.nestjsx-crud.refine.dev';
  const dataProvider = nestjsxCrudDataProvider(API_URL);

  if (isLoading) {
    return <span>loading...</span>;
  }

  const authProvider: AuthProvider = {
    login: async () => {
      if (window.ethereum) {
        provider = await web3Modal.connect();
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        localStorage.setItem(TOKEN_KEY, accounts[0]);
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: new Error(
            'Not set ethereum wallet or invalid. You need to install Metamask',
          ),
        };
      }
    },
    logout: async () => {
      localStorage.removeItem(TOKEN_KEY);
      if (provider && provider.close) {
        await provider.close;

        provider = null;
        await web3Modal.clearCachedProvider();
      }
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
      const web3Token = localStorage.getItem(TOKEN_KEY);
      try {
        const token = await getIdTokenClaims();
        if (token && web3Token) {
          axios.defaults.headers.common = {
            Authorization: `Bearer ${token.__raw}`,
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

  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider}
                notificationProvider={useNotificationProvider}
                authProvider={authProvider}
                routerProvider={routerBindings}
                resources={[
                  {
                    name: 'blog_posts',
                    list: '/blog-posts',
                    create: '/blog-posts/create',
                    edit: '/blog-posts/edit/:id',
                    show: '/blog-posts/show/:id',
                    meta: {
                      canDelete: true,
                    },
                  },
                  {
                    name: 'categories',
                    list: '/categories',
                    create: '/categories/create',
                    edit: '/categories/edit/:id',
                    show: '/categories/show/:id',
                    meta: {
                      canDelete: true,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: '8GuJaC-Rnp2Zt-um5Kow',
                  title: { text: 'Refine Project', icon: <AppIcon /> },
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
                      element={<NavigateToResource resource="blog_posts" />}
                    />
                    <Route path="/blog-posts">
                      <Route index element={<BlogPostList />} />
                      <Route path="create" element={<BlogPostCreate />} />
                      <Route path="edit/:id" element={<BlogPostEdit />} />
                      <Route path="show/:id" element={<BlogPostShow />} />
                    </Route>
                    <Route path="/categories">
                      <Route index element={<CategoryList />} />
                      <Route path="create" element={<CategoryCreate />} />
                      <Route path="edit/:id" element={<CategoryEdit />} />
                      <Route path="show/:id" element={<CategoryShow />} />
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
