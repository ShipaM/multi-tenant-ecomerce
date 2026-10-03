/**
 * The runtime hands jsdom a partial localStorage, so tests that touch storage bring their own in-memory one.
 * Returns the installed object so a test can spy on or break individual methods.
 */
export function installStorage() {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
  };

  Object.defineProperty(window, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });

  return storage;
}
