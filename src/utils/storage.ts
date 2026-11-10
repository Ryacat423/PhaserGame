/**
 * localStorage with an in-memory fallback.
 *
 * When the game runs in an iframe on another site, browsers that block third-party storage
 * make `window.localStorage` throw on access. Progress then lasts for the session only,
 * instead of the game failing to start.
 */
const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = '__storage_probe__';
    ls.setItem(probe, probe);
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

const ls = backend();

export const storage = {
  getItem(key: string): string | null {
    try {
      return ls ? ls.getItem(key) : memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
    try {
      ls?.setItem(key, value);
    } catch {
      // Quota or access error: the in-memory copy still works for this session.
    }
  },
  removeItem(key: string): void {
    memory.delete(key);
    try {
      ls?.removeItem(key);
    } catch {
      // Ignore, as above.
    }
  }
};
