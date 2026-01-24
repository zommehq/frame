/**
 * Guard to ensure test-only properties are only accessed in test environment
 *
 * @throws Error if not in test environment
 */
export function assertTestEnv(): void {
  // Check if running in test environment (works in both Node and browser)
  const isTest =
    (typeof (globalThis as any).process !== "undefined" &&
      (globalThis as any).process?.env?.NODE_ENV === "test") ||
    (globalThis as any).__TEST_ENV__ === true;

  if (!isTest) {
    throw new Error(
      "Test-only properties (prefixed with __) can only be accessed in test environment",
    );
  }
}
