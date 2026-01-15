/* @refresh reload */
import { Router } from '@solidjs/router';
import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { render } from 'solid-js/web';
import App from './App';
import './styles.css';

const base = '/solid';

async function bootstrap() {
  try {
    await microAppSDK.initialize();

    const config = microAppSDK.getConfig();
    console.log('[SolidJS] Micro app initialized with config:', config);

    const root = document.getElementById('root');

    if (!root) {
      throw new Error('Root element not found');
    }

    render(
      () => (
        <Router base={base}>
          <App />
        </Router>
      ),
      root
    );

    console.log('[SolidJS] App rendered successfully');
  } catch (error) {
    console.error('[SolidJS] Failed to initialize micro app:', error);
    microAppSDK.reportError(error instanceof Error ? error : new Error(String(error)));
  }
}

bootstrap();
