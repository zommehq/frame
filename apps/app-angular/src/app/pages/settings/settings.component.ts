import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h1>Settings</h1>
      <p>Configure your Angular fragment-frame preferences.</p>

      <form class="settings-form" (submit)="onSubmit($event)">
        <div class="form-group">
          <label for="appName">Application Name</label>
          <input
            type="text"
            id="appName"
            [(ngModel)]="settings.appName"
            name="appName"
          />
        </div>

        <div class="form-group">
          <label for="language">Language</label>
          <select id="language" [(ngModel)]="settings.language" name="language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" [(ngModel)]="settings.theme" name="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div class="form-group checkbox">
          <label>
            <input
              type="checkbox"
              [(ngModel)]="settings.notifications"
              name="notifications"
            />
            Enable notifications
          </label>
        </div>

        <div class="form-actions">
          <button type="submit">Save Settings</button>
          <button type="button" (click)="onReset()">Reset</button>
        </div>
      </form>

      <div class="info-message" *ngIf="saveMessage">
        {{ saveMessage }}
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 600px;
      }

      h1 {
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
      }

      .settings-form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #495057;
        font-weight: 500;
      }

      .form-group input[type='text'],
      .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 1rem;
      }

      .form-group input[type='text']:focus,
      .form-group select:focus {
        outline: none;
        border-color: #3498db;
      }

      .form-group.checkbox label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .form-group.checkbox input[type='checkbox'] {
        width: auto;
        cursor: pointer;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s;
      }

      button[type='submit'] {
        background: #3498db;
        color: white;
      }

      button[type='submit']:hover {
        background: #2980b9;
      }

      button[type='button'] {
        background: #6c757d;
        color: white;
      }

      button[type='button']:hover {
        background: #5a6268;
      }

      .info-message {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        border-radius: 4px;
        color: #0c5460;
      }
    `,
  ],
})
export class SettingsComponent {
  settings = {
    appName: 'Angular Micro-App',
    language: 'en',
    notifications: true,
    theme: 'light',
  };

  saveMessage = '';

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Settings saved:', this.settings);
    this.saveMessage = 'Settings saved successfully!';
    setTimeout(() => {
      this.saveMessage = '';
    }, 3000);
  }

  onReset() {
    this.settings = {
      appName: 'Angular Micro-App',
      language: 'en',
      notifications: true,
      theme: 'light',
    };
    this.saveMessage = 'Settings reset to defaults';
    setTimeout(() => {
      this.saveMessage = '';
    }, 3000);
  }
}
