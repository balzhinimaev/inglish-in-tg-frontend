import React, { useState, useEffect } from 'react';
import { Button, Card } from './index';
import type { Task } from '../types';

interface TaskRendererProps {
  task: Task;
  onAnswer: (answer: any) => void;
  onSkip?: () => void;
}

export const TaskRenderer: React.FC<TaskRendererProps> = ({ 
  task, 
  onAnswer, 
  onSkip 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userInput] = useState('');
  
  // All useState hooks must be at the top level - not inside conditions!
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedBlanks, setSelectedBlanks] = useState<string[]>([]);
  const [matches, setMatches] = useState<{[key: string]: string}>({});

  // Reset state when task changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsRevealed(false);
    setShowTranscript(false);
    setMatches({});
    
    // Initialize selectedBlanks based on task data
    if (task.type === 'gap_fill' && task.data.blanks) {
      setSelectedBlanks(new Array(task.data.blanks.length).fill(''));
    } else {
      setSelectedBlanks([]);
    }
  }, [task]);

  const handleAnswer = () => {
    if (selectedAnswer !== null || userInput) {
      onAnswer(selectedAnswer !== null ? selectedAnswer : userInput);
    }
  };

  // Flashcard Task
  if (task.type === 'flashcard') {
    const { front, back, pronunciation, example, audio } = task.data;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <div className="text-center">
          <div className="mb-6">
            <div className={`min-h-[120px] flex items-center justify-center p-4 rounded-xl transition-all duration-500 cursor-pointer hover:shadow-md ${
              isRevealed 
                ? 'bg-gradient-to-br from-telegram-accent/10 to-telegram-accent/5 border border-telegram-accent/20' 
                : 'bg-telegram-secondary-bg hover:bg-telegram-secondary-bg/80'
            }`}>
              <div className={`transition-all duration-500 ${isRevealed ? 'animate-pulse' : ''}`}>
                <h3 className={`text-2xl font-bold text-telegram-text mb-2 transition-all duration-300 ${
                  isRevealed ? 'scale-105' : ''
                }`}>
                  {isRevealed ? back : front}
                </h3>
                {isRevealed && pronunciation && (
                  <p className="text-telegram-hint text-sm mb-2 animate-fade-in">
                    {pronunciation}
                  </p>
                )}
                {isRevealed && example && (
                  <p className="text-telegram-hint text-sm italic animate-fade-in">
                    "{example}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {audio && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // TODO: Play audio
                console.log('Playing audio:', audio);
              }}
              className="mb-4"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Прослушать
            </Button>
          )}

          <div className="space-y-3">
            {!isRevealed ? (
              <Button
                fullWidth
                onClick={() => setIsRevealed(true)}
                className="bg-telegram-accent hover:bg-telegram-accent/90 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Показать перевод</span>
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </span>
              </Button>
            ) : (
              <div className="animate-fade-in space-y-3">
                <Button
                  fullWidth
                  onClick={() => onAnswer('correct')}
                  className="bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg transform"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">✓</span>
                    <span>Знаю</span>
                  </span>
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => onAnswer('incorrect')}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:scale-105 transition-all duration-200"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">⏱</span>
                    <span>Повторить позже</span>
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Multiple Choice Task
  if (task.type === 'multiple_choice') {
    const { question, options, audio } = task.data;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-telegram-text mb-4 transition-colors duration-200">
            {question}
          </h3>
          
          {audio && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // TODO: Play audio
                console.log('Playing audio:', audio);
              }}
              className="mb-4"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Прослушать
            </Button>
          )}
          
          <div className="space-y-3">
            {options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(index)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md group ${
                  selectedAnswer === index 
                    ? 'border-telegram-accent bg-gradient-to-r from-telegram-accent/10 to-telegram-accent/5 text-telegram-accent scale-[1.02] shadow-md' 
                    : 'border-telegram-hint/20 bg-telegram-secondary-bg text-telegram-text hover:border-telegram-accent/50 hover:bg-telegram-secondary-bg/80'
                }`}
              >
                <span className={`font-medium mr-3 transition-all duration-200 ${
                  selectedAnswer === index ? 'text-telegram-accent' : 'text-telegram-hint group-hover:text-telegram-accent'
                }`}>
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="transition-colors duration-200">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleAnswer}
            disabled={selectedAnswer === null}
            className="bg-telegram-accent hover:bg-telegram-accent/90 text-white disabled:opacity-50 hover:scale-105 transition-all duration-200 hover:shadow-lg disabled:hover:scale-100"
          >
            <span className="flex items-center justify-center gap-2">
              <span>Ответить</span>
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </Button>
          
          {onSkip && (
            <Button
              fullWidth
              variant="ghost"
              onClick={onSkip}
              className="text-telegram-hint hover:text-telegram-text hover:bg-telegram-secondary-bg/50 hover:scale-105 transition-all duration-200"
            >
              Пропустить
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Listening Task
  if (task.type === 'listening') {
    const { audio, transcript, question, options } = task.data;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-telegram-text mb-4 transition-colors duration-200">
            Прослушайте аудио и ответьте на вопрос
          </h3>
          
          <div className="bg-gradient-to-br from-telegram-secondary-bg to-telegram-secondary-bg/70 rounded-xl p-4 mb-4 border border-telegram-hint/10 hover:border-telegram-accent/20 transition-all duration-300">
            <Button
              fullWidth
              onClick={() => {
                // TODO: Play audio
                console.log('Playing audio:', audio);
              }}
              className="bg-telegram-accent hover:bg-telegram-accent/90 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg group"
            >
              <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Воспроизвести аудио
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="mt-2 w-full hover:bg-telegram-accent/10 hover:text-telegram-accent transition-all duration-200 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className={`w-4 h-4 transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                {showTranscript ? 'Скрыть' : 'Показать'} транскрипцию
              </span>
            </Button>
            
            {showTranscript && (
              <div className="mt-3 p-3 bg-telegram-bg rounded-lg border border-telegram-hint/20 text-sm text-telegram-hint animate-fade-in shadow-sm">
                {transcript}
              </div>
            )}
          </div>
          
          {question && (
            <h4 className="text-lg font-semibold text-telegram-text mb-3">
              {question}
            </h4>
          )}
          
          {options && options.length > 0 && (
            <div className="space-y-2">
              {options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index 
                      ? 'border-telegram-accent bg-telegram-accent/10 text-telegram-accent' 
                      : 'border-telegram-hint/20 bg-telegram-secondary-bg text-telegram-text hover:border-telegram-accent/50'
                  }`}
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          fullWidth
          onClick={handleAnswer}
          disabled={options && options.length > 0 ? selectedAnswer === null : false}
          className="bg-telegram-accent hover:bg-telegram-accent/90 text-white disabled:opacity-50 hover:scale-105 transition-all duration-200 hover:shadow-lg disabled:hover:scale-100"
        >
          <span className="flex items-center justify-center gap-2">
            <span>{options && options.length > 0 ? 'Ответить' : 'Продолжить'}</span>
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </Button>
      </Card>
    );
  }

  // Gap Fill Task
  if (task.type === 'gap_fill') {
    const { text, blanks, options, translation } = task.data;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-telegram-text mb-4 transition-colors duration-200">
            Заполните пропуски
          </h3>
          
          <div className="bg-gradient-to-br from-telegram-secondary-bg to-telegram-secondary-bg/70 rounded-xl p-4 mb-4 border border-telegram-hint/10 hover:border-telegram-accent/20 transition-all duration-300">
            <div className="text-lg text-telegram-text mb-2">
              {text.split('{{}}').map((part: string, index: number) => (
                <React.Fragment key={index}>
                  {part}
                  {index < blanks.length && (
                    <select
                      value={selectedBlanks[index]}
                      onChange={(e) => {
                        const newBlanks = [...selectedBlanks];
                        newBlanks[index] = e.target.value;
                        setSelectedBlanks(newBlanks);
                      }}
                      className="mx-2 px-3 py-1 border border-telegram-hint/30 rounded-lg bg-telegram-bg text-telegram-text hover:border-telegram-accent/50 focus:border-telegram-accent focus:ring-2 focus:ring-telegram-accent/20 transition-all duration-200"
                    >
                      <option value="">---</option>
                      {options[index]?.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {translation && (
              <p className="text-sm text-telegram-hint italic mt-3">
                Перевод: {translation}
              </p>
            )}
          </div>
        </div>

        <Button
          fullWidth
          onClick={() => onAnswer(selectedBlanks)}
          disabled={selectedBlanks.some(blank => blank === '')}
          className="bg-telegram-accent hover:bg-telegram-accent/90 text-white disabled:opacity-50 hover:scale-105 transition-all duration-200 hover:shadow-lg disabled:hover:scale-100"
        >
          <span className="flex items-center justify-center gap-2">
            <span>Проверить</span>
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </span>
        </Button>
      </Card>
    );
  }

  // Matching Task
  if (task.type === 'matching') {
    const { pairs, instructions } = task.data;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-telegram-text mb-2 transition-colors duration-200">
            Сопоставление
          </h3>
          <p className="text-telegram-hint mb-4 transition-colors duration-200">{instructions}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-telegram-text mb-3">Английский</h4>
              <div className="space-y-2">
                {pairs.map((pair: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-md group ${
                      matches[pair.english] 
                        ? 'border-telegram-accent bg-gradient-to-r from-telegram-accent/10 to-telegram-accent/5 scale-105 shadow-md' 
                        : 'border-telegram-hint/20 bg-telegram-secondary-bg hover:border-telegram-accent/50 hover:bg-telegram-secondary-bg/80'
                    }`}
                    onClick={() => {
                      // Reset all matches for this english word
                      const newMatches = { ...matches };
                      if (newMatches[pair.english]) {
                        delete newMatches[pair.english];
                      }
                      setMatches(newMatches);
                    }}
                  >
                    <span className={`transition-colors duration-200 ${
                      matches[pair.english] ? 'text-telegram-accent' : 'group-hover:text-telegram-accent'
                    }`}>
                      {pair.english}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-telegram-text mb-3">Русский</h4>
              <div className="space-y-2">
                {pairs.map((pair: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-md group ${
                      Object.values(matches).includes(pair.russian)
                        ? 'border-telegram-accent bg-gradient-to-r from-telegram-accent/10 to-telegram-accent/5 scale-105 shadow-md' 
                        : 'border-telegram-hint/20 bg-telegram-secondary-bg hover:border-telegram-accent/50 hover:bg-telegram-secondary-bg/80'
                    }`}
                    onClick={() => {
                      // Find english word for this russian
                      const englishWord = pairs.find((p: any) => p.russian === pair.russian)?.english;
                      if (englishWord) {
                        setMatches(prev => ({
                          ...prev,
                          [englishWord]: pair.russian
                        }));
                      }
                    }}
                  >
                    <span className={`transition-colors duration-200 ${
                      Object.values(matches).includes(pair.russian) ? 'text-telegram-accent' : 'group-hover:text-telegram-accent'
                    }`}>
                      {pair.russian}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button
          fullWidth
          onClick={() => onAnswer(matches)}
          disabled={Object.keys(matches).length !== pairs.length}
          className="bg-telegram-accent hover:bg-telegram-accent/90 text-white disabled:opacity-50 hover:scale-105 transition-all duration-200 hover:shadow-lg disabled:hover:scale-100"
        >
          <span className="flex items-center justify-center gap-2">
            <span>Проверить соответствия</span>
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 18l4-4 4 4"/>
              <path d="M8 6l4 4 4-4"/>
            </svg>
          </span>
        </Button>
      </Card>
    );
  }

  // Default fallback for unknown task types
  return (
    <Card className="p-6">
      <div className="text-center">
        <p className="text-telegram-hint">
          Неизвестный тип задания: {task.type}
        </p>
        <pre className="text-xs text-telegram-hint bg-telegram-secondary-bg p-3 rounded mt-3">
          {JSON.stringify(task.data, null, 2)}
        </pre>
        <Button
          fullWidth
          onClick={() => onAnswer('skip')}
          className="mt-4"
        >
          Пропустить
        </Button>
      </div>
    </Card>
  );
};
