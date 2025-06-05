// src/context/AppContext.js
import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export function UserProvider({ children }) {
  const [globalUser, setGlobalUser] = useState(null);

  return (
    <AppContext.Provider value={{ globalUser, setGlobalUser }}>
      {children}
    </AppContext.Provider>
  );
}
