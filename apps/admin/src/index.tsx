import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import { Web3Provider } from './Web3Provider';
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_ISSUER } from './config/config';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_ISSUER}
      clientId={AUTH0_CLIENT_ID}
      audience={AUTH0_AUDIENCE}
      redirectUri={window.location.origin}
    >
      <Web3Provider>
        <App />
      </Web3Provider>
    </Auth0Provider>
  </React.StrictMode>,
);
