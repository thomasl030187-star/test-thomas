import { useCallback, useState } from 'react';

const STORAGE_KEY = 'notetaker_preferences';
type PreferenceState = Record<string, boolean>;

function readPreferences(): PreferenceState {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as PreferenceState;
  } catch {
    return {};
  }
}

export function useNotetakerPreferences() {
  const [preferences, setPreferences] = useState<PreferenceState>(() => readPreferences());

  const togglePreference = useCallback((eventId: string) => {
    setPreferences((prev) => {
      const next: PreferenceState = {
        ...prev,
        [eventId]: !prev[eventId]
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { preferences, togglePreference };
}
