import { FEATURE_FLAG_DEFAULTS, type FeatureFlagKey } from '@/constants';
import { logger } from '@/utils/logger';

const REMOTE_CONFIG_FETCH_TIMEOUT_MS = 12_000;

type RemoteConfigInstance = {
  setConfigSettings(settings: { fetchTimeMillis?: number; minimumFetchIntervalMillis?: number }): Promise<void>;
  setDefaults(defaults: Record<string, string | number | boolean>): Promise<void>;
  fetchAndActivate(): Promise<boolean>;
  getBoolean(key: string): boolean;
  getValue(key: string): {
    asBoolean(): boolean;
    getSource?(): 'static' | 'default' | 'remote';
    source?: 'static' | 'default' | 'remote';
  };
};

type FirebaseRemoteConfigModule = () => RemoteConfigInstance;
type FlagsUpdatedListener = () => void;

function getRemoteConfigInstance(): RemoteConfigInstance | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- dependência opcional em runtime
    const remoteConfigModule = require('@react-native-firebase/remote-config').default as FirebaseRemoteConfigModule;
    return remoteConfigModule();
  } catch {
    return null;
  }
}

async function awaitFetchWithTimeout(remoteConfig: RemoteConfigInstance, context: string): Promise<void> {
  const fetchPromise = remoteConfig.fetchAndActivate();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${context} timeout`)), REMOTE_CONFIG_FETCH_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      fetchPromise.finally(() => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }),
      timeoutPromise,
    ]);
  } catch (error) {
    logger.warn(`[FeatureFlags] ${context}:`, error);
    void fetchPromise.catch(() => undefined);
  }
}

class FeatureFlagService {
  private initializationPromise: Promise<void> | null = null;
  private fetchPromise: Promise<void> = Promise.resolve();
  private readonly listeners = new Set<FlagsUpdatedListener>();

  subscribe(listener: FlagsUpdatedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyFlagsUpdated(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  private trackFetch(remoteConfig: RemoteConfigInstance, context: string): Promise<void> {
    this.fetchPromise = awaitFetchWithTimeout(remoteConfig, context);
    return this.fetchPromise;
  }

  private async ensureInitialized(remoteConfig: RemoteConfigInstance): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        try {
          await remoteConfig.setConfigSettings({
            fetchTimeMillis: 10_000,
            minimumFetchIntervalMillis: __DEV__ ? 0 : 3_600_000,
          });
        } catch (error) {
          logger.warn('[FeatureFlags] Erro ao configurar Remote Config:', error);
        }

        try {
          await remoteConfig.setDefaults(FEATURE_FLAG_DEFAULTS);
        } catch (error) {
          logger.warn('[FeatureFlags] Erro ao aplicar defaults locais:', error);
        }

        void this.trackFetch(remoteConfig, 'init');
      })();
    }

    await this.initializationPromise;
  }

  async initialize(): Promise<void> {
    const remoteConfig = getRemoteConfigInstance();
    if (!remoteConfig) {
      return;
    }

    await this.ensureInitialized(remoteConfig);
  }

  async refresh(): Promise<void> {
    const remoteConfig = getRemoteConfigInstance();
    if (!remoteConfig) {
      return;
    }

    await this.ensureInitialized(remoteConfig);
    await this.trackFetch(remoteConfig, 'refresh');
    this.notifyFlagsUpdated();
  }

  async getBoolean(flagKey: FeatureFlagKey): Promise<boolean> {
    const defaultValue = FEATURE_FLAG_DEFAULTS[flagKey];
    const remoteConfig = getRemoteConfigInstance();

    if (!remoteConfig) {
      return defaultValue;
    }

    await this.ensureInitialized(remoteConfig);
    await this.fetchPromise;

    try {
      const value = remoteConfig.getValue(flagKey);
      const source = value.getSource?.() ?? value.source;

      if (source === 'static') {
        return defaultValue;
      }

      return value.asBoolean();
    } catch (error) {
      logger.warn(`[FeatureFlags] Erro ao ler flag "${flagKey}":`, error);
      return defaultValue;
    }
  }

  async getBooleans(flagKeys: FeatureFlagKey[]): Promise<Record<FeatureFlagKey, boolean>> {
    const entries = await Promise.all(
      flagKeys.map(async (flagKey) => [flagKey, await this.getBoolean(flagKey)] as const),
    );
    return entries.reduce((acc, [flagKey, value]) => {
      acc[flagKey] = value;
      return acc;
    }, {} as Record<FeatureFlagKey, boolean>);
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;
