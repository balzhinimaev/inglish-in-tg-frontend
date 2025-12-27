import { useEffect, useState } from 'react';
import type { ModuleVocabularyResponse } from '../types';
import { useAudioPreload } from '../utils/audio';

interface UseVocabularyAudioPreloadParams {
  activeTab: 'lessons' | 'vocabulary';
  vocabularyData?: ModuleVocabularyResponse;
}

// Helper function to get audio URL from pronunciation or audioKey
const getAudioUrl = (word: { pronunciation?: string; audioKey?: string }): string | undefined => {
  // If pronunciation is a valid URL (starts with http:// or https://), use it
  if (word.pronunciation && (word.pronunciation.startsWith('http://') || word.pronunciation.startsWith('https://'))) {
    return word.pronunciation;
  }
  
  // Otherwise, try to build URL from audioKey
  if (word.audioKey) {
    return `https://englishintg.ru/audio/${word.audioKey}${word.audioKey.endsWith('.mp3') ? '' : '.mp3'}`;
  }
  
  return undefined;
};

export const useVocabularyAudioPreload = ({
  activeTab,
  vocabularyData
}: UseVocabularyAudioPreloadParams) => {
  const { isPreloading, preloadAudioFiles, getPreloadedAudio } = useAudioPreload();
  const [preloadedAudioMap, setPreloadedAudioMap] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [loadedAudioUrls, setLoadedAudioUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab !== 'vocabulary' || !vocabularyData?.vocabulary || isPreloading) {
      return;
    }

    const audioUrls = vocabularyData.vocabulary
      .map(item => getAudioUrl(item))
      .filter((url): url is string => Boolean(url));

    const newAudioUrls = audioUrls.filter(url => !loadedAudioUrls.has(url));

    if (newAudioUrls.length === 0) {
      return;
    }

    console.log('Silently preloading audio for vocabulary tab:', newAudioUrls.length, 'files');
    setLoadedAudioUrls(prev => new Set([...prev, ...newAudioUrls]));

    preloadAudioFiles(newAudioUrls).then(() => {
      setPreloadedAudioMap(prevMap => {
        const newMap = new Map(prevMap);
        newAudioUrls.forEach(url => {
          const audio = getPreloadedAudio(url);
          if (audio) {
            newMap.set(url, audio);
          }
        });
        return newMap;
      });
    });
  }, [activeTab, vocabularyData, preloadAudioFiles, getPreloadedAudio, isPreloading, loadedAudioUrls]);

  return { preloadedAudioMap, isPreloading };
};
