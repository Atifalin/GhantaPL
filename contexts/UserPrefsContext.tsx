import React, { createContext, useContext, useState } from 'react';

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

const UserPrefsContext = createContext<UserPrefsContextType>({
  preferences: defaultPreferences,
  updatePreferences: () => {},
});

export function UserPrefsProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  return (
    <UserPrefsContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export const useUserPrefs = () => useContext(UserPrefsContext);
