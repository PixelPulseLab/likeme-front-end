import React, { useCallback, useEffect } from 'react';
import * as Linking from 'expo-linking';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import {
  flushPendingDeepLinkNavigation,
  openDeepLinkTarget,
  shareDeepLinkTargetFromUrl,
} from '@/utils/share/shareDeepLink';
import { readDeferredShareUrlOnce } from '@/utils/share/deferredShareUrl';

type Props = {
  activeRouteName: string | undefined;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
};

const DeepLinkRoot: React.FC<Props> = ({ activeRouteName, navigationRef }) => {
  const handleIncomingUrl = useCallback(
    (url: string | null) => {
      if (!url) {
        return;
      }
      void openDeepLinkTarget(navigationRef, url, activeRouteName);
    },
    [activeRouteName, navigationRef],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const initialUrl = await Linking.getInitialURL().catch(() => null);
      if (cancelled) {
        return;
      }

      if (initialUrl && shareDeepLinkTargetFromUrl(initialUrl)) {
        handleIncomingUrl(initialUrl);
        return;
      }

      const deferredUrl = await readDeferredShareUrlOnce();
      if (cancelled) {
        return;
      }

      if (deferredUrl) {
        handleIncomingUrl(deferredUrl);
        return;
      }

      handleIncomingUrl(initialUrl);
    })();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [handleIncomingUrl]);

  useEffect(() => {
    void flushPendingDeepLinkNavigation(navigationRef, activeRouteName);
  }, [activeRouteName, navigationRef]);

  return null;
};

export default DeepLinkRoot;
