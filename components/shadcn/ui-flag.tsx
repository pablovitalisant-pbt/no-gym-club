'use client';

import { createContext, useContext } from 'react';

const UiFlagContext = createContext(false);

export function UiFlagProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <UiFlagContext.Provider value={value}>{children}</UiFlagContext.Provider>;
}

export function useUiFlag() {
  return useContext(UiFlagContext);
}
