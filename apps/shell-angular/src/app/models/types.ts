/**
 * Type helper for z-frame elements with registered actions.
 *
 * @example
 * ```typescript
 * const frame = event.target as ZFrame<MyActions>;
 * const result = await frame.myAction();
 * ```
 */
export type ZFrame<TActions = Record<string, never>> = HTMLElement & {
  [K in keyof TActions]: TActions[K];
} & {
  /** Emit event to child frame */
  emit(event: string, data?: unknown): void;
};

/**
 * Actions registered by the Angular frame app.
 * These can be called directly on the z-frame element.
 */
export interface AngularFrameActions {
  /** Get current app stats */
  getStats(): Promise<{
    currentRoute: string;
    theme: string;
    timestamp: number;
  }>;

  /** Navigate to a specific route in the child */
  navigateTo(path: string): Promise<{
    navigatedTo: string;
    timestamp: number;
  }>;

  /** Trigger data refresh in the child */
  refreshData(): Promise<{
    refreshedAt: number;
    success: boolean;
  }>;
}
