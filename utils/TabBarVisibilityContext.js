// TabBarVisibilityContext.js
import React, { createContext, useContext, useState } from 'react';

const TabBarVisibilityContext = createContext({
  tabBarVisible: true,
  setTabBarVisible: (visible: boolean) => {},
});

export const TabBarVisibilityProvider = ({ children }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  return (
    <TabBarVisibilityContext.Provider value={{ tabBarVisible, setTabBarVisible }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
