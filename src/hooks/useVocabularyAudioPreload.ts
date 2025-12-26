import { useEffect, useState } from 'react';
import type { ModuleVocabularyResponse } from '../types';
import { useAudioPreload } from '../utils/audio';

interface UseVocabularyAudioPreloadParams {
  activeTab: 'lessons' | 'vocabulary';
  vocabularyData?: ModuleVocabularyResponse;
}

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
      .map(item => item.pronunciation)
      .filter(Boolean) as string[];

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
