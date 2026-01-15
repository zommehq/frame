import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
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
