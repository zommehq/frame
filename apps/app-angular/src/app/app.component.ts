import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { microAppSDK } from '@shared/sdk';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-container">
      <nav class="navigation">
        <h2>Angular Micro-App</h2>
        <ul>
          <li>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              Home
            </a>
          </li>
          <li>
            <a routerLink="/users" routerLinkActive="active">
              Users
            </a>
          </li>
          <li>
            <a routerLink="/settings" routerLinkActive="active">
              Settings
            </a>
          </li>
        </ul>
      </nav>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .navigation {
        background: #2c3e50;
        color: white;
        padding: 1rem 2rem;
      }

      .navigation h2 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
      }

      .navigation ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        gap: 1.5rem;
      }

      .navigation a {
        color: #ecf0f1;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .navigation a:hover {
        background-color: #34495e;
      }

      .navigation a.active {
        background-color: #3498db;
      }

      .content {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
      }
    `,
  ],
})
export class AppComponent {
  constructor() {
    const config = microAppSDK.getConfig();
    console.log('Angular App Component initialized with config:', config);
  }
}
