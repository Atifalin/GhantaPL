import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserPreferences = {
  avatar: string;
};

type UserPrefsContextType = {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
};

const defaultPreferences: UserPreferences = {
  avatar: "😊",
};

const PREFS_STORAGE_KEY = '@user_preferences';

const UserPrefsContext = createContext<UserPrefsContextType>({
  preferences: defaultPreferences,
  updatePreferences: () => {},
});

export function UserPrefsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  // Load preferences from storage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...prefs };
    setPreferences(newPrefs);
    
    try {
      await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  if (!loaded) {
    return null; // Or a loading indicator if you prefer
  }

  return (
    <UserPrefsContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export const useUserPrefs = () => useContext(UserPrefsContext);
