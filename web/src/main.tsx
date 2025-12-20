import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');

Sentry.init({
  dsn: 'https://256b8f4c66275b4497181d0a484a7aaf@o4510389719203840.ingest.us.sentry.io/4510569633546240',
  environment: isDev ? 'development' : 'production',
  sendDefaultPii: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
