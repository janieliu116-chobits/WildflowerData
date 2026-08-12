import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wildflower_reading_count';

interface ReadingCountContextType {
  readingCount: number;
  incrementReadingCount: () => void;
}

const ReadingCountContext = createContext<ReadingCountContextType | null>(null);

export function ReadingCountProvider({ children }: { children: React.ReactNode }) {
  const [readingCount, setReadingCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setReadingCount(parseInt(raw, 10) || 0);
    }).catch(console.error);
  }, []);

  const incrementReadingCount = () => {
    setReadingCount(prev => {
      const next = prev + 1;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(console.error);
      return next;
    });
  };

  return (
    <ReadingCountContext.Provider value={{ readingCount, incrementReadingCount }}>
      {children}
    </ReadingCountContext.Provider>
  );
}

export function useReadingCount() {
  const ctx = useContext(ReadingCountContext);
  if (!ctx) throw new Error('useReadingCount must be used within ReadingCountProvider');
  return ctx;
}
