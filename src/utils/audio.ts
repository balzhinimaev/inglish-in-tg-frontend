// Audio utility functions for consistent audio playback across the app

export interface AudioPlaybackOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export const playAudio = (
  audioUrl: string, 
  options: AudioPlaybackOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!audioUrl) {
      const error = new Error('No audio URL provided');
      options.onError?.(error);
      reject(error);
      return;
    }

    const audio = new Audio(audioUrl);
    
    // Set up event listeners
    audio.onloadstart = () => {
      console.log('Audio loading started:', audioUrl);
      options.onLoadStart?.();
    };
    
    audio.oncanplay = () => {
      console.log('Audio can start playing:', audioUrl);
      options.onCanPlay?.();
    };
    
    audio.onplay = () => {
      console.log('Audio started playing:', audioUrl);
      options.onStart?.();
    };
    
    audio.onended = () => {
      console.log('Audio playback ended:', audioUrl);
      options.onEnd?.();
      resolve();
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', audioUrl, error);
      options.onError?.(new Error('Audio playback failed'));
      reject(new Error('Audio playback failed'));
    };
    
    // Attempt to play audio
    audio.play().catch((error) => {
      console.error('Audio play() failed:', audioUrl, error);
      options.onError?.(error);
      reject(error);
    });
  });
};

export const getAudioErrorMessage = (error: Error): string => {
  if (error.name === 'NotAllowedError') {
    return 'Разрешите воспроизведение аудио в браузере и попробуйте снова.';
  } else if (error.name === 'NotSupportedError') {
    return 'Ваш браузер не поддерживает воспроизведение этого аудио файла.';
  } else {
    return 'Не удалось воспроизвести аудио. Проверьте подключение к интернету.';
  }
};

// Hook for audio playback with state management
export const useAudioPlayback = () => {
  const [playingAudio, setPlayingAudio] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const playAudioWithState = async (audioUrl: string, audioId: string) => {
    if (playingAudio === audioId) {
      // If already playing this audio, stop it
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(audioId);
    setIsLoading(true);

    try {
      await playAudio(audioUrl, {
        onStart: () => {
          setIsLoading(false);
        },
        onEnd: () => {
          setPlayingAudio(null);
        },
        onError: (error) => {
          setPlayingAudio(null);
          setIsLoading(false);
          alert(getAudioErrorMessage(error));
        }
      });
    } catch (error) {
      setPlayingAudio(null);
      setIsLoading(false);
      alert(getAudioErrorMessage(error as Error));
    }
  };

  return {
    playingAudio,
    isLoading,
    playAudio: playAudioWithState,
    stopAudio: () => setPlayingAudio(null)
  };
};

// Import React for the hook
import React from 'react';

// Audio preloading functionality
export interface AudioPreloadOptions {
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// Cache for preloaded audio elements
const audioCache = new Map<string, HTMLAudioElement>();

export const preloadAudio = (
  audioUrl: string,
  options: AudioPreloadOptions = {}
): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    if (!audioUrl) {
      const error = new Error('No audio URL provided');
      options.onError?.(error);
      reject(error);
      return;
    }

    // Check if already cached
    if (audioCache.has(audioUrl)) {
      const cachedAudio = audioCache.get(audioUrl)!;
      if (cachedAudio.readyState >= 3) { // HAVE_FUTURE_DATA or higher
        options.onComplete?.();
        resolve(cachedAudio);
        return;
      }
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    
    // Set up event listeners
    audio.onloadstart = () => {
      console.log('Audio preload started:', audioUrl);
    };
    
    audio.onprogress = () => {
      if (audio.buffered.length > 0) {
        const loaded = audio.buffered.end(audio.buffered.length - 1);
        const total = audio.duration || 1;
        options.onProgress?.(loaded, total);
      }
    };
    
    audio.oncanplay = () => {
      console.log('Audio preload can play:', audioUrl);
      audioCache.set(audioUrl, audio);
      options.onComplete?.();
      resolve(audio);
    };
    
    audio.oncanplaythrough = () => {
      console.log('Audio preload can play through:', audioUrl);
      audioCache.set(audioUrl, audio);
      options.onComplete?.();
      resolve(audio);
    };
    
    audio.onerror = (error) => {
      console.error('Audio preload error:', audioUrl, error);
      options.onError?.(new Error('Audio preload failed'));
      reject(new Error('Audio preload failed'));
    };

    // Start loading
    audio.load();
  });
};

export const preloadMultipleAudio = async (
  audioUrls: string[],
  options: AudioPreloadOptions = {}
): Promise<HTMLAudioElement[]> => {
  const results: HTMLAudioElement[] = [];
  let loaded = 0;
  const total = audioUrls.length;
  const batchSize = 3; // Load 3 audio files at a time to avoid overwhelming the browser

  const updateProgress = () => {
    loaded++;
    options.onProgress?.(loaded, total);
    if (loaded === total) {
      options.onComplete?.();
    }
  };

  try {
    // Process audio URLs in batches
    for (let i = 0; i < audioUrls.length; i += batchSize) {
      const batch = audioUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          const audio = await preloadAudio(url, {
            onComplete: updateProgress,
            onError: (error) => {
              console.warn('Failed to preload audio:', url, error);
              updateProgress(); // Still count as processed
            }
          });
          return audio;
        } catch (error) {
          console.warn('Failed to preload audio:', url, error);
          updateProgress(); // Still count as processed
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as HTMLAudioElement[]);
      
      // Small delay between batches to be gentle on the browser
      if (i + batchSize < audioUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    options.onError?.(error as Error);
    return results;
  }
};

// Hook for audio preloading with state management
export const useAudioPreload = () => {
  const [isPreloading, setIsPreloading] = React.useState(false);
  const [preloadProgress, setPreloadProgress] = React.useState({ loaded: 0, total: 0 });
  const [preloadedAudio, setPreloadedAudio] = React.useState<Map<string, HTMLAudioElement>>(new Map());

  const preloadAudioFiles = React.useCallback(async (audioUrls: string[]) => {
    if (audioUrls.length === 0) return;

    setIsPreloading(true);
    setPreloadProgress({ loaded: 0, total: audioUrls.length });

    try {
      const audioElements = await preloadMultipleAudio(audioUrls, {
        onProgress: (loaded, total) => {
          setPreloadProgress({ loaded, total });
        },
        onComplete: () => {
          setIsPreloading(false);
        },
        onError: (error) => {
          console.error('Audio preload error:', error);
          setIsPreloading(false);
        }
      });

      // Update preloaded audio map
      setPreloadedAudio(prevMap => {
        const newMap = new Map(prevMap);
        audioUrls.forEach((url, index) => {
          if (audioElements[index]) {
            newMap.set(url, audioElements[index]);
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error('Audio preload failed:', error);
      setIsPreloading(false);
    }
  }, []);

  const getPreloadedAudio = React.useCallback((audioUrl: string): HTMLAudioElement | null => {
    return preloadedAudio.get(audioUrl) || audioCache.get(audioUrl) || null;
  }, [preloadedAudio]);

  const clearPreloadedAudio = React.useCallback(() => {
    setPreloadedAudio(new Map());
    audioCache.clear();
  }, []);

  return {
    isPreloading,
    preloadProgress,
    preloadAudioFiles,
    getPreloadedAudio,
    clearPreloadedAudio
  };
};