import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationshipType } from '@/constants/data';

export interface Profile {
  id: string;
  name: string;
  gender: string;
  birthDate: string; // ISO string
  birthTime: string; // "HH:MM"
  birthCity: string;
  latitude: number;
  longitude: number;
  relationship: RelationshipType;
  isSelf: boolean;
}

interface ProfileContextType {
  profiles: Profile[];
  selfProfile: Profile | null;
  isFirstTime: boolean;
  addProfile: (profile: Omit<Profile, 'id'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);
const STORAGE_KEY = 'wildflower_profiles';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Profile[];
        setProfiles(parsed);
      }
    } catch (e) {
      console.error('Error loading profiles:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveProfiles = async (updated: Profile[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfiles(updated);
  };

  const addProfile = async (profile: Omit<Profile, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    const newProfile: Profile = { ...profile, id };
    const updated = newProfile.isSelf
      ? [newProfile, ...profiles.filter(p => !p.isSelf)]
      : [...profiles, newProfile];
    await saveProfiles(updated);
  };

  const updateProfile = async (id: string, updates: Partial<Omit<Profile, 'id'>>) => {
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    await saveProfiles(updated);
  };

  const deleteProfile = async (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    await saveProfiles(updated);
  };

  const selfProfile = profiles.find(p => p.isSelf) ?? null;
  const isFirstTime = profiles.length === 0;

  return (
    <ProfileContext.Provider value={{
      profiles,
      selfProfile,
      isFirstTime,
      addProfile,
      updateProfile,
      deleteProfile,
      isLoaded,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfiles must be used within ProfileProvider');
  return ctx;
}
