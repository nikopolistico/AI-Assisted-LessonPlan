/**
 * Small localStorage helper so the prototype keeps its data across reloads.
 * Every read falls back to the seed value when storage is empty or unreadable.
 */
export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveState(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — ignore.
  }
}

export function clearState(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
