import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CommunityEventJitsiJoinPayload } from '@/types/event';
import { EventJitsiLiveSession } from '@/components/infrastructure/live/EventJitsiLiveSession';

type LiveJitsiSessionContextValue = {
  openLiveJitsiSession: (session: CommunityEventJitsiJoinPayload) => void;
  closeLiveJitsiSession: () => void;
};

const LiveJitsiSessionContext = createContext<LiveJitsiSessionContextValue | null>(null);
const LiveJitsiSessionOpenContext = createContext(false);

export const LiveJitsiSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<CommunityEventJitsiJoinPayload | null>(null);
  const isLiveJitsiSessionOpen = session !== null;

  const openLiveJitsiSession = useCallback((payload: CommunityEventJitsiJoinPayload) => {
    setSession(payload);
  }, []);

  const closeLiveJitsiSession = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ openLiveJitsiSession, closeLiveJitsiSession }),
    [openLiveJitsiSession, closeLiveJitsiSession],
  );

  return (
    <LiveJitsiSessionContext.Provider value={value}>
      <LiveJitsiSessionOpenContext.Provider value={isLiveJitsiSessionOpen}>
        <View style={styles.root}>
          {children}
          {session ? <EventJitsiLiveSession session={session} onClose={closeLiveJitsiSession} /> : null}
        </View>
      </LiveJitsiSessionOpenContext.Provider>
    </LiveJitsiSessionContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export function useLiveJitsiSession(): LiveJitsiSessionContextValue {
  const context = useContext(LiveJitsiSessionContext);
  if (!context) {
    throw new Error('useLiveJitsiSession must be used within LiveJitsiSessionProvider');
  }
  return context;
}

export function useIsLiveJitsiSessionOpen(): boolean {
  return useContext(LiveJitsiSessionOpenContext);
}
