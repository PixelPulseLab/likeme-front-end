type SoundLoadProps = {
  duration?: number;
  numberOfChannels?: number;
};

type SoundLoadCallback = (error: string | null, props?: SoundLoadProps) => void;

export default class Sound {
  constructor(_filename: string, basePath?: string | SoundLoadCallback, onError?: SoundLoadCallback) {
    const onLoad = typeof basePath === 'function' ? basePath : onError;
    if (onLoad) {
      queueMicrotask(() => {
        onLoad(null, { duration: 0, numberOfChannels: 1 });
      });
    }
  }

  setNumberOfLoops(_loops: number) {}

  play(onEnd?: (success: boolean) => void) {
    onEnd?.(true);
  }

  stop() {}

  release() {}

  pause(_callback?: () => void) {}
}
