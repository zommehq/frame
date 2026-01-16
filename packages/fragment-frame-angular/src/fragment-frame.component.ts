import "@zomme/fragment-frame";
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

/**
 * Angular component wrapper for <fragment-frame> custom element
 *
 * @example
 * ```ts
 * \@Component({
 *   template: `
 *     <fragment-frame-component
 *       name="my-app"
 *       src="http://localhost:3000/"
 *       [user]="{ id: 1, name: 'John' }"
 *       theme="dark"
 *       (ready)="onReady($event)"
 *       (navigate)="onNavigate($event)"
 *     />
 *   `
 * })
 * export class MyComponent {
 *   onReady(event: CustomEvent) {
 *     console.log('Ready:', event.detail);
 *   }
 *
 *   onNavigate(event: CustomEvent) {
 *     console.log('Navigate:', event.detail);
 *   }
 * }
 * ```
 */
@Component({
  selector: "fragment-frame-component",
  standalone: true,
  template: `
    <fragment-frame
      #frameElement
      [attr.name]="name"
      [attr.src]="src"
      [attr.sandbox]="sandbox"
    ></fragment-frame>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      fragment-frame {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class FragmentFrameComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("frameElement", { static: true }) frameElement!: ElementRef<HTMLElement>;

  /** Name of the fragment (used for identification) */
  @Input() name!: string;

  /** URL to load in the iframe */
  @Input() src!: string;

  /** Sandbox permissions for the iframe */
  @Input() sandbox = "allow-scripts allow-same-origin";

  /** Props to pass to the child frame (any complex objects) */
  @Input() props: Record<string, unknown> = {};

  /** Ready event - emitted when frame is initialized */
  @Output() ready = new EventEmitter<CustomEvent>();

  /** Navigate event - emitted when frame navigates */
  @Output() navigate = new EventEmitter<CustomEvent>();

  /** Error event - emitted when frame encounters error */
  @Output() error = new EventEmitter<CustomEvent>();

  private eventListeners: Array<[string, EventListener]> = [];

  ngOnInit(): void {
    const element = this.frameElement.nativeElement;

    // Setup event listeners
    this.addListener("ready", (event) => this.ready.emit(event as CustomEvent));
    this.addListener("navigate", (event) => this.navigate.emit(event as CustomEvent));
    this.addListener("error", (event) => this.error.emit(event as CustomEvent));

    // Set initial props
    this.updateProps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["props"] && !changes["props"].firstChange) {
      this.updateProps();
    }
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    const element = this.frameElement.nativeElement;
    this.eventListeners.forEach(([event, handler]) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  private addListener(eventName: string, handler: EventListener): void {
    const element = this.frameElement.nativeElement;
    element.addEventListener(eventName, handler);
    this.eventListeners.push([eventName, handler]);
  }

  private updateProps(): void {
    const element = this.frameElement.nativeElement;
    Object.entries(this.props).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }
}
