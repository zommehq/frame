import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

async function bootstrap() {
  await microAppSDK.initialize();

  const config = microAppSDK.getConfig();
  const base = config.base || '/react';

  microAppSDK.on('route-change', (data) => {
    const event = data as { path: string };
    const newPath = event.path.replace(base, '') || '/';
    window.history.pushState(null, '', base + newPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap React micro app:', error);
  microAppSDK.reportError(error);
});
