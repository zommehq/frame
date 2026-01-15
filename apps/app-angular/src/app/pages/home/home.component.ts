import { Component } from '@angular/core';
import { frameSDK } from '@micro-fe/fragment-elements/sdk';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  propsJson: string;

  constructor() {
    this.propsJson = JSON.stringify(frameSDK.props, null, 2);
  }

  emitCustomEvent() {
    frameSDK.emit('angular-custom-event', {
      message: 'Hello from Angular!',
      timestamp: new Date().toISOString(),
    });
    console.log('Custom event emitted');
  }
}
