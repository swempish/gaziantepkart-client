// TabBarVisibilityContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface TabBarVisibilityContextValue {
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue>({
  tabBarVisible: true,
  setTabBarVisible: () => {},
});

export const TabBarVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  return (
    <TabBarVisibilityContext.Provider value={{ tabBarVisible, setTabBarVisible }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
