// jsdom (as configured by vitest here) exposes no `localStorage`, and Node's
// own global of that name is inert unless the process was started with
// --localstorage-file. api-client.ts stores the admin token through bare
// `localStorage.*` calls, which every real browser resolves fine, so tests
// get an explicit in-memory Storage double rather than depending on which
// implementation happens to win.
class MemoryStorage implements Storage {
  private entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, String(value));
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

const storage = new MemoryStorage();
globalThis.localStorage = storage;
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
}
