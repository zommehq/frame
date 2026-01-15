import { Component } from '@angular/core';
import { microAppSDK } from '@shared/sdk';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="page">
      <h1>Welcome to Angular Micro-App</h1>
      <p>This is the home page of the Angular micro-frontend application.</p>

      <div class="info-card">
        <h3>App Configuration</h3>
        <pre>{{ configJson }}</pre>
      </div>

      <div class="actions">
        <button (click)="emitCustomEvent()">Emit Custom Event</button>
        <button (click)="notifyStateChange()">Notify State Change</button>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 800px;
      }

      h1 {
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        line-height: 1.6;
      }

      .info-card {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 2rem 0;
      }

      .info-card h3 {
        margin-top: 0;
        color: #495057;
      }

      .info-card pre {
        background: white;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.875rem;
      }

      .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
      }

      button:hover {
        background: #2980b9;
      }
    `,
  ],
})
export class HomeComponent {
  configJson: string;

  constructor() {
    const config = microAppSDK.getConfig();
    this.configJson = JSON.stringify(config, null, 2);
  }

  emitCustomEvent() {
    microAppSDK.emit('angular-custom-event', {
      message: 'Hello from Angular!',
      timestamp: new Date().toISOString(),
    });
    console.log('Custom event emitted');
  }

  notifyStateChange() {
    microAppSDK.notifyStateChange({
      page: 'home',
      updated: new Date().toISOString(),
    });
    console.log('State change notified');
  }
}
