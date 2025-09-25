import React, { createContext, useContext, useState } from 'react';

interface ApiContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  apiUrl: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('zebux_token');
  });

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('zebux_token', newToken);
    } else {
      localStorage.removeItem('zebux_token');
    }
  };

  const apiUrl = window.location.origin + '/api';

  return (
    <ApiContext.Provider value={{ token, setToken, apiUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
