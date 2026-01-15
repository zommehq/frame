import { A, useLocation, useNavigate } from '@solidjs/router';
import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { Component, createEffect } from 'solid-js';
import { AppRoutes } from './router';

const App: Component = () => {
  const location = useLocation();
  const navigate = useNavigate();

  createEffect(() => {
    const currentPath = location.pathname;
    microAppSDK.navigate(currentPath);
  });

  microAppSDK.on('route-change', (data) => {
    const { path } = data as { path: string };
    if (path !== location.pathname) {
      navigate(path);
    }
  });

  return (
    <div class="app-solid">
      <header class="header">
        <nav class="nav">
          <h1>SolidJS Micro App</h1>
          <ul class="nav-list">
            <li>
              <A href="/" class="nav-link">
                Home
              </A>
            </li>
            <li>
              <A href="/dashboard" class="nav-link">
                Dashboard
              </A>
            </li>
            <li>
              <A href="/profile" class="nav-link">
                Profile
              </A>
            </li>
          </ul>
        </nav>
      </header>

      <main class="main-content">
        <AppRoutes />
      </main>

      <style>
        {`
          .app-solid {
            min-height: 100vh;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .header {
            background: linear-gradient(135deg, #2c7a7b 0%, #2d3748 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .nav h1 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            gap: 1.5rem;
          }

          .nav-link {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .nav-link.active {
            background-color: rgba(255, 255, 255, 0.2);
          }

          .main-content {
            padding: 2rem;
          }
        `}
      </style>
    </div>
  );
};

export default App;
