/**
 * Guard to ensure test-only properties are only accessed in test environment
 *
 * @throws Error if not in test environment
 */
export function assertTestEnv(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Test-only properties (prefixed with __) can only be accessed in test environment",
    );
  }
}
