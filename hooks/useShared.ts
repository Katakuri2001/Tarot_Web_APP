import { useState, useEffect, useCallback, useRef } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Start from initialValue on both server and client so the first client
  // render matches the server HTML. The stored value is read in an effect
  // below, after hydration has completed.
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStored(JSON.parse(item));
      }
    } catch {
      // Silently fall back to initialValue
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStored((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch {
        // Silently fail
      }
    },
    [key]
  );

  return [stored, setValue];
}

export function useSoundEnabled(): [boolean, () => void] {
  const [enabled, setEnabled] = useLocalStorage<boolean>("velora_sound", false);
  return [enabled, () => setEnabled(!enabled)];
}
