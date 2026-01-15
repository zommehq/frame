import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { frameSDK } from '@micro-fe/fragment-elements/sdk';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  user: any = null;

  ngOnInit() {
    // Access props from parent
    this.user = frameSDK.props.user;
    console.log('Angular App Component initialized with user:', this.user);

    // Call successCallback if provided
    const successCallback = frameSDK.props.successCallback as ((data: any) => void) | undefined;
    if (typeof successCallback === 'function') {
      successCallback({ message: 'Angular app initialized successfully' });
    }

    // Listen for user updates
    frameSDK.on('attr:user', (newUser) => {
      console.log('User updated:', newUser);
      this.user = newUser;
    });
  }

  triggerAction() {
    console.log('Action triggered');

    // Emit event to parent
    frameSDK.emit('action-clicked', {
      timestamp: Date.now(),
      component: 'AppComponent'
    });

    // Call callback if provided
    const actionCallback = frameSDK.props.actionCallback as ((data: any) => void) | undefined;
    if (typeof actionCallback === 'function') {
      actionCallback({
        type: 'button-click',
        source: 'navigation'
      });
    }
  }

  triggerError() {
    try {
      throw new Error('Test error from Angular AppComponent');
    } catch (error) {
      console.error('Error triggered:', error);

      // Emit error event to parent
      frameSDK.emit('error', {
        error: error instanceof Error ? error.message : String(error),
        component: 'AppComponent',
        timestamp: Date.now()
      });
    }
  }

  ngOnDestroy() {
    // Cleanup SDK on component destroy
    frameSDK.cleanup();
  }
}
