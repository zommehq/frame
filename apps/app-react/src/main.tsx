import { frameSDK } from '@micro-fe/fragment-elements/sdk';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

async function bootstrap() {
  await frameSDK.initialize();

  const base = frameSDK.props.base || '/react';

  frameSDK.on('route-change', (data) => {
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
  frameSDK.emit('error', {
    error: error instanceof Error ? error.message : String(error),
    source: 'bootstrap'
  });
});
