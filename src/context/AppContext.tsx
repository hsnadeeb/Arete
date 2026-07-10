import React, { createContext, useEffect, ReactNode, useRef } from 'react';
import { useStore, type AppStore } from '../store';
import { initDatabase } from '../db/service';
import { initNotifications } from '../services/notifications';

interface AppContextValue {
  loaded: boolean;
  hydrating: boolean;
  error: string | null;
  forceRehydrate: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const loaded = useStore(s => s.loaded);
  const hydrating = useStore(s => s.hydrating);
  const error = useStore(s => s.error);
  const hydrate = useStore(s => s.hydrate);
  const hydrationRef = useRef(false);

  const doHydrate = async () => {
    console.log('Starting hydration...');
    try {
      await initDatabase();
      await hydrate();
      console.log('Hydration completed');
    } catch (e) {
      console.error('Hydration failed:', e);
    }
    try {
      initNotifications();
    } catch (e) {
      console.warn('Notifications init failed:', e);
    }
  };

  const forceRehydrate = () => {
    console.log('Force rehydrate called');
    hydrationRef.current = false;
    doHydrate();
  };

  useEffect(() => {
    if (!hydrationRef.current) {
      hydrationRef.current = true;
      doHydrate();
    }
  }, []);

  return (
    <AppContext.Provider value={{ loaded, hydrating, error, forceRehydrate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppStore {
  return useStore();
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}