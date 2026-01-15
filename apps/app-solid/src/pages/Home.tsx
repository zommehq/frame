import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { Component } from 'solid-js';

const Home: Component = () => {
  const handleEmitEvent = () => {
    microAppSDK.emit('user-action', {
      action: 'button-clicked',
      page: 'home',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div class="page">
      <h2>Home Page</h2>
      <p>Welcome to the SolidJS micro application!</p>

      <div class="card">
        <h3>About This App</h3>
        <p>
          This is a SolidJS-based micro-frontend application that demonstrates seamless integration
          with the parent application using the Micro App SDK.
        </p>

        <ul>
          <li>Built with SolidJS and TypeScript</li>
          <li>Uses @solidjs/router for routing</li>
          <li>Communicates with parent via postMessage</li>
          <li>Supports dynamic theme and configuration</li>
        </ul>
      </div>

      <div class="card">
        <h3>SDK Integration</h3>
        <p>Click the button below to emit a custom event to the parent application:</p>
        <button onClick={handleEmitEvent} class="btn">
          Emit Custom Event
        </button>
      </div>

      <style>
        {`
          .page {
            max-width: 800px;
            margin: 0 auto;
          }

          .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .card h3 {
            margin-top: 0;
            color: #2c7a7b;
          }

          .card ul {
            line-height: 1.8;
          }

          .btn {
            background: #2c7a7b;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.2s;
          }

          .btn:hover {
            background: #234e52;
          }

          .btn:active {
            transform: translateY(1px);
          }
        `}
      </style>
    </div>
  );
};

export default Home;
