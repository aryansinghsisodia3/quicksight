import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const [globalCounts, setGlobalCounts] = useState({});
  return (
    <GlobalContext.Provider value={{ globalCounts, setGlobalCounts }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobalState = () => useContext(GlobalContext);
