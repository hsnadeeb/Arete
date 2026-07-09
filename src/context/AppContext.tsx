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
      await initDatabase();
      await hydrate();
      initNotifications();
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