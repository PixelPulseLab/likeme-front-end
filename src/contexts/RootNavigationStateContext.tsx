import React, { createContext, useContext } from 'react';
import type { NavigationState } from '@react-navigation/native';

const RootNavigationStateContext = createContext<NavigationState | undefined>(undefined);

type RootNavigationStateProviderProps = {
  value: NavigationState | undefined;
  children: React.ReactNode;
};

export const RootNavigationStateProvider: React.FC<RootNavigationStateProviderProps> = ({ value, children }) => (
  <RootNavigationStateContext.Provider value={value}>{children}</RootNavigationStateContext.Provider>
);

export function useRootNavigationState(): NavigationState | undefined {
  return useContext(RootNavigationStateContext);
}
