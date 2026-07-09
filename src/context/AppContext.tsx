import React, { createContext, useEffect, ReactNode } from 'react';
import { useStore, type AppStore } from '../store';
import { initDatabase } from '../db/service';
import { initNotifications } from '../services/notifications';

interface AppContextValue {
  loaded: boolean;
  hydrating: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const loaded = useStore(s => s.loaded);
  const hydrating = useStore(s => s.hydrating);
  const error = useStore(s => s.error);
  const hydrate = useStore(s => s.hydrate);

  useEffect(() => {
    const doHydrate = async () => {
      try {
        await initDatabase();
        await hydrate();
      } catch (e) {
        console.error('Hydration failed:', e);
      }
      try {
        initNotifications();
      } catch (e) {
        console.warn('Notifications init failed:', e);
      }
    };
    doHydrate();
  }, [hydrate]);

  return (
    <AppContext.Provider value={{ loaded, hydrating, error }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppStore {
  return useStore();
}