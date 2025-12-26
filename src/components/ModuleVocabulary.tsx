import React, { useState, useMemo } from 'react';
import { useModuleVocabulary } from '../services/content';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { Loader } from './Loader';
import { hapticFeedback } from '../utils/telegram';
import { APP_STATES } from '../utils/constants';
import { useAudioPlayback } from '../utils/audio';

interface ModuleVocabularyProps {
  moduleRef: string;
  moduleTitle?: string;
  preloadedAudio?: Map<string, HTMLAudioElement>;
}

type VocabularyFilter = 'all' | 'learned' | 'not_learned';
type VocabularySortBy = 'alphabetical' | 'difficulty' | 'learned_status';

export const ModuleVocabulary: React.FC<ModuleVocabularyProps> = ({
  moduleRef,
  moduleTitle,
  preloadedAudio
}) => {
  const { navigateTo, navigationParams } = useAppNavigation();
  const level = navigationParams?.level as string | undefined;
  const [selectedFilter, setSelectedFilter] = useState<VocabularyFilter>('all');
  const [sortBy, setSortBy] = useState<VocabularySortBy>('alphabetical');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const { playingAudio, playAudio } = useAudioPlayback();

  const { data, isLoading } = useModuleVocabulary({ 
    moduleRef, 
    lang: 'ru' 
  });

  const vocabularyItems = data?.vocabulary || [];

  // Filter and sort vocabulary
  const { filteredVocabulary, stats } = useMemo(() => {
    let filtered = vocabularyItems;

    // Apply filter
    if (selectedFilter === 'learned') {
      filtered = filtered.filter(item => item.isLearned);
    } else if (selectedFilter === 'not_learned') {
      filtered = filtered.filter(item => !item.isLearned);
    }

    // Apply sorting (avoid mutating original array)
    filtered = [...filtered].sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'alphabetical':
          result = a.word.localeCompare(b.word);
          break;
        case 'difficulty':
          const difficultyOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3, undefined: 0 };
          const aDiff = a.difficulty || 'undefined';
          const bDiff = b.difficulty || 'undefined';
          result = (difficultyOrder[aDiff] || 0) - (difficultyOrder[bDiff] || 0);
          break;
        case 'learned_status':
          result = Number(a.isLearned) - Number(b.isLearned);
          break;
        default:
          result = 0;
          break;
      }
      
      return sortDirection === 'desc' ? -result : result;
    });

    const learnedCount = vocabularyItems.filter(item => item.isLearned).length;
    const stats = {
      total: vocabularyItems.length,
      learned: learnedCount,
      notLearned: vocabularyItems.length - learnedCount,
      progressPercentage: vocabularyItems.length > 0 ? Math.round((learnedCount / vocabularyItems.length) * 100) : 0
    };

    return { filteredVocabulary: filtered, stats };
  }, [vocabularyItems, selectedFilter, sortBy, sortDirection]);

  const handleWordClick = (wordId: string) => {
    hapticFeedback.selection();
    setExpandedWord(expandedWord === wordId ? null : wordId);
  };

  const handleAudioPlay = (wordId: string, audioUrl?: string) => {
    if (!audioUrl) {
      console.warn('No audio URL provided for word:', wordId);
      return;
    }
    
    hapticFeedback.selection();
    
    // Check if we have a preloaded audio element
    const preloadedAudioElement = preloadedAudio?.get(audioUrl);
    
    if (preloadedAudioElement) {
      // Use preloaded audio for instant playback
      console.log('Using preloaded audio for:', audioUrl);
      try {
        preloadedAudioElement.currentTime = 0; // Reset to beginning
        preloadedAudioElement.play().catch((error) => {
          console.warn('Failed to play preloaded audio:', error);
          // Fallback to regular audio playback
          playAudio(audioUrl, wordId);
        });
      } catch (error) {
        console.warn('Error with preloaded audio:', error);
        // Fallback to regular audio playback
        playAudio(audioUrl, wordId);
      }
    } else {
      // Use the regular audio playback utility
      playAudio(audioUrl, wordId);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    const colors = {
      easy: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      hard: "text-red-600 bg-red-50"
    };
    return colors[difficulty as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  const getDifficultyText = (difficulty?: string) => {
    const texts = {
      easy: "Легко",
      medium: "Средне", 
      hard: "Сложно"
    };
    return texts[difficulty as keyof typeof texts] || "Неизвестно";
  };

  const getPartOfSpeechText = (partOfSpeech?: string) => {
    const texts = {
      noun: "сущ.",
      verb: "глаг.",
      adjective: "прил.",
      adverb: "нареч.",
      preposition: "предл.",
      conjunction: "союз",
      interjection: "межд.",
      other: "другое"
    };
    return texts[partOfSpeech as keyof typeof texts] || "";
  };

  const filterOptions: Array<{key: VocabularyFilter, label: string, icon: string}> = [
    { key: 'all', label: 'Все', icon: '📚' },
    { key: 'learned', label: 'Изученные', icon: '✅' },
    { key: 'not_learned', label: 'Не изученные', icon: '📖' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" text="Загрузка словаря..." />
      </div>
    );
  }

  if (vocabularyItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-telegram-text text-lg mb-2">
          Словарь пуст
        </p>
        <p className="text-telegram-hint text-sm">
          Слова появятся после прохождения уроков
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-gradient-to-r from-telegram-accent/10 to-blue-500/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-telegram-text">Прогресс изучения</h3>
          <div className="text-2xl">📊</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-telegram-accent">{stats.total}</div>
            <div className="text-xs text-telegram-hint">Всего слов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.learned}</div>
            <div className="text-xs text-telegram-hint">Изучено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.notLearned}</div>
            <div className="text-xs text-telegram-hint">Осталось</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-telegram-accent h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-telegram-hint">
          {stats.progressPercentage}% изучено
        </div>

        {/* Vocabulary Test Button */}
        {stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-telegram-accent/20">
            <button
              onClick={() => {
                hapticFeedback.selection();
                navigateTo(APP_STATES.VOCABULARY_TEST, { moduleRef, moduleTitle, level });
              }}
              className="w-full bg-gradient-to-r from-telegram-accent to-blue-600 hover:from-telegram-accent/90 hover:to-blue-600/90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M13 12h3"/>
                <path d="M8 12h3"/>
              </svg>
              <span>Начать тестирование словаря</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filterOptions.map(option => (
            <button
              key={option.key}
              onClick={() => {
                hapticFeedback.selection();
                setSelectedFilter(option.key);
              }}
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                ${selectedFilter === option.key 
                  ? 'bg-telegram-accent text-white shadow-lg' 
                  : 'bg-telegram-secondary-bg text-telegram-hint hover:bg-telegram-card-bg'
                }
              `}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-telegram-hint">Сортировка:</span>
          {[
            { key: 'alphabetical', label: 'По алфавиту' },
            { key: 'difficulty', label: 'По сложности' },
            { key: 'learned_status', label: 'По статусу' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => {
                hapticFeedback.selection();
                if (sortBy === option.key) {
                  // Toggle direction if same sort option
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  // Change sort option and reset to ascending
                  setSortBy(option.key as VocabularySortBy);
                  setSortDirection('asc');
                }
              }}
              className={`
                flex items-center gap-1 px-2 py-1 rounded transition-all
                ${sortBy === option.key 
                  ? 'text-telegram-accent font-medium' 
                  : 'text-telegram-hint hover:text-telegram-text'
                }
              `}
            >
              <span>{option.label}</span>
              {sortBy === option.key && (
                <svg 
                  className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M7 14l5-5 5 5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="space-y-3">
        {filteredVocabulary.map((word) => {
          const isExpanded = expandedWord === word.id;
          const isPlaying = playingAudio === word.id;
          
          return (
            <div
              key={word.id}
              className={`
                bg-telegram-card-bg rounded-2xl p-4 transition-all duration-200
                ${isExpanded ? 'shadow-lg ring-2 ring-telegram-accent/20' : 'shadow-sm hover:shadow-md'}
              `}
            >
              {/* Main word info */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleWordClick(word.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-telegram-text">
                      {word.word}
                    </h4>
                    {word.isLearned && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-telegram-text font-medium">
                      {word.translation}
                    </span>
                    {word.partOfSpeech && (
                      <span className="text-xs text-telegram-hint bg-telegram-secondary-bg px-2 py-0.5 rounded">
                        {getPartOfSpeechText(word.partOfSpeech)}
                      </span>
                    )}
                  </div>
                  
                  {word.transcription && (
                    <div className="text-sm text-telegram-hint">
                      {word.transcription}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Audio button */}
                  {word.pronunciation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAudioPlay(word.id, word.pronunciation);
                      }}
                      className={`
                        p-2 rounded-full transition-all
                        ${isPlaying 
                          ? 'bg-telegram-accent text-white' 
                          : 'bg-telegram-secondary-bg text-telegram-hint hover:bg-telegram-accent hover:text-white'
                        }
                      `}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        {isPlaying ? (
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        ) : (
                          <path d="M8 5v14l11-7z"/>
                        )}
                      </svg>
                    </button>
                  )}

                  {/* Difficulty badge */}
                  {word.difficulty && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(word.difficulty)}`}>
                      {getDifficultyText(word.difficulty)}
                    </span>
                  )}

                  {/* Expand indicator */}
                  <svg 
                    className={`w-5 h-5 text-telegram-hint transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-telegram-secondary-bg space-y-3">
                  {/* Examples */}
                  {word.examples && word.examples.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-telegram-text mb-2">Примеры:</h5>
                      <div className="space-y-2">
                        {word.examples.map((example, index) => (
                          <div key={index} className="bg-telegram-secondary-bg rounded-lg p-3">
                            <div className="text-sm text-telegram-text mb-1">
                              "{example.original}"
                            </div>
                            <div className="text-sm text-telegram-hint">
                              "{example.translation}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {word.tags && word.tags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-telegram-text mb-2">Теги:</h5>
                      <div className="flex flex-wrap gap-1">
                        {word.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs bg-telegram-accent/10 text-telegram-accent rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related lessons */}
                  {word.lessonRefs && word.lessonRefs.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-telegram-text mb-2">Встречается в уроках:</h5>
                      <div className="text-sm text-telegram-hint">
                        {word.lessonRefs.length} урок{word.lessonRefs.length === 1 ? '' : word.lessonRefs.length < 5 ? 'а' : 'ов'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredVocabulary.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-telegram-hint">
            Нет слов, соответствующих выбранному фильтру
          </p>
        </div>
      )}
    </div>
  );
};
