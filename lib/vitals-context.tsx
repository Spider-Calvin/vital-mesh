import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { uploadReading } from './api';
import type { VitalReading } from './types';

const STORAGE_KEY = 'vitalmesh.readings';

interface VitalsContextValue {
  readings: VitalReading[];
  addReading: (reading: VitalReading) => Promise<void>;
  syncPending: () => Promise<{ succeeded: number; failed: number }>;
}

const VitalsContext = createContext<VitalsContextValue | null>(null);

export function VitalsProvider({ children }: { children: React.ReactNode }) {
  const [readings, setReadings] = useState<VitalReading[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setReadings(JSON.parse(raw));
    });
  }, []);

  const persist = async (next: VitalReading[]) => {
    setReadings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addReading = async (reading: VitalReading) => {
    await persist([reading, ...readings]);
  };

  const syncPending = async () => {
    let succeeded = 0;
    let failed = 0;
    const next = [...readings];

    for (let i = 0; i < next.length; i++) {
      if (next[i].synced) continue;
      try {
        await uploadReading(next[i]);
        next[i] = { ...next[i], synced: true };
        succeeded++;
      } catch {
        failed++;
      }
    }

    await persist(next);
    return { succeeded, failed };
  };

  return <VitalsContext.Provider value={{ readings, addReading, syncPending }}>{children}</VitalsContext.Provider>;
}

export function useVitals(): VitalsContextValue {
  const ctx = useContext(VitalsContext);
  if (!ctx) throw new Error('useVitals must be used within a VitalsProvider');
  return ctx;
}
