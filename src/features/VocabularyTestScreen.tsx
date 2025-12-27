import React, { useState, useEffect } from 'react';
import { Screen, Button, Loader } from '../components';
import { Breadcrumbs } from './LessonsListScreen/Breadcrumbs';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useModuleVocabulary } from '../services/content';
import { APP_STATES } from '../utils/constants';
import { hapticFeedback } from '../utils/telegram';
import { tracking } from '../services/tracking';
import { useAudioPlayback } from '../utils/audio';

interface VocabularyTestScreenProps {
  moduleRef?: string;
  moduleTitle?: string;
}

type TestQuestion = {
  id: string;
  word: string;
  translation: string;
  options: string[];
  correctAnswer: string;
  difficulty?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  audioKey?: string;
};

type TestResult = {
  correct: number;
  total: number;
  score: number;
  timeSpent: number;
  wrongAnswers: Array<{
    question: TestQuestion;
    userAnswer: string;
    correctAnswer: string;
  }>;
};

export const VocabularyTestScreen: React.FC<VocabularyTestScreenProps> = ({
  moduleRef = '',
  moduleTitle = 'Модуль'
}) => {
  const { navigateTo, setupBackButton, navigationParams } = useAppNavigation();
  const level = navigationParams?.level as string | undefined;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [testResults, setTestResults] = useState<TestResult>({
    correct: 0,
    total: 0,
    score: 0,
    timeSpent: 0,
    wrongAnswers: []
  });
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const { playingAudio, playAudio } = useAudioPlayback();
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    question: TestQuestion;
    userAnswer: string;
    correctAnswer: string;
  }>>([]);

  const { data, isLoading } = useModuleVocabulary({ 
    moduleRef, 
    lang: 'ru' 
  });

  const vocabularyItems = data?.vocabulary || [];

  // Generate test questions from vocabulary
  const generateTestQuestions = (vocabulary: any[]): TestQuestion[] => {
    if (vocabulary.length === 0) return [];

    const questions: TestQuestion[] = [];
    const shuffledVocabulary = [...vocabulary].sort(() => Math.random() - 0.5);
    
    // Take up to 10 words for the test
    const testWords = shuffledVocabulary.slice(0, Math.min(10, vocabulary.length));
    
    testWords.forEach((word, index) => {
      // Generate wrong options from other words
      const wrongOptions = vocabulary
        .filter(w => w.id !== word.id)
        .map(w => w.translation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const allOptions = [word.translation, ...wrongOptions].sort(() => Math.random() - 0.5);
      
      questions.push({
        id: `q${index + 1}`,
        word: word.word,
        translation: word.translation,
        options: allOptions,
        correctAnswer: word.translation,
        difficulty: word.difficulty,
        partOfSpeech: word.partOfSpeech,
        pronunciation: word.pronunciation,
        audioKey: word.audioKey
      });
    });
    
    return questions;
  };

  // Initialize test when vocabulary loads
  useEffect(() => {
    if (vocabularyItems.length > 0 && testQuestions.length === 0) {
      const questions = generateTestQuestions(vocabularyItems);
      setTestQuestions(questions);
      setTestStartTime(Date.now());
    }
  }, [vocabularyItems, testQuestions.length]);

  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

  const currentQuestion = testQuestions[currentQuestionIndex];
  const progress = testQuestions.length > 0 ? ((currentQuestionIndex + 1) / testQuestions.length) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    hapticFeedback.selection();
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Save wrong answer if incorrect
    if (!correct) {
      setWrongAnswers(prev => [...prev, {
        question: currentQuestion,
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer
      }]);
    }
    
    // Update results
    setTestResults(prev => ({
      ...prev,
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    hapticFeedback.impact(correct ? 'light' : 'medium');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < testQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // Test completed
      const timeSpent = Math.round((Date.now() - testStartTime) / 1000);
      const finalScore = Math.round((testResults.correct + (isCorrect ? 1 : 0)) / testQuestions.length * 100);
      
      setTestResults(prev => ({
        ...prev,
        score: finalScore,
        timeSpent,
        wrongAnswers: wrongAnswers
      }));
      
      setIsTestComplete(true);
      
      // Track test completion
      tracking.custom('vocabulary_test_completed', {
        moduleRef,
        score: finalScore,
        timeSpent,
        questionsCount: testQuestions.length
      });
    }
  };

  const handleRestartTest = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setIsTestComplete(false);
    setTestResults({ correct: 0, total: 0, score: 0, timeSpent: 0, wrongAnswers: [] });
    setWrongAnswers([]);
    setTestStartTime(Date.now());
    
    // Regenerate questions
    const questions = generateTestQuestions(vocabularyItems);
    setTestQuestions(questions);
  };

  const handleBackToLessons = () => {
    hapticFeedback.selection();
    navigateTo(APP_STATES.LESSONS_LIST, { 
      moduleRef, 
      moduleTitle,
      level,
      _overridePreviousScreen: APP_STATES.MODULES,
      _overridePreviousScreenParams: { level }
    });
  };

  const handleNavigateToModules = () => {
    hapticFeedback.selection();
    navigateTo(APP_STATES.MODULES, { level });
  };

  // Helper function to get audio URL from pronunciation or audioKey
  const getAudioUrl = (question: { pronunciation?: string; audioKey?: string }): string | undefined => {
    // If pronunciation is a valid URL (starts with http:// or https://), use it
    if (question.pronunciation && (question.pronunciation.startsWith('http://') || question.pronunciation.startsWith('https://'))) {
      return question.pronunciation;
    }
    
    // Otherwise, try to build URL from audioKey
    if (question.audioKey) {
      return `https://englishintg.ru/audio/${question.audioKey}${question.audioKey.endsWith('.mp3') ? '' : '.mp3'}`;
    }
    
    return undefined;
  };

  const handleAudioPlay = (wordId: string) => {
    hapticFeedback.selection();
    
    let question: TestQuestion | undefined;
    
    // Handle different types of wordId
    if (wordId.startsWith('wrong-')) {
      // For wrong answers section - get pronunciation from the wrong answer question
      const wrongIndex = parseInt(wordId.replace('wrong-', ''));
      const wrongAnswer = testResults.wrongAnswers[wrongIndex];
      question = wrongAnswer?.question;
    } else {
      // For current question or regular questions
      question = testQuestions.find(q => q.id === wordId) || 
                 testQuestions[currentQuestionIndex];
    }
    
    const audioUrl = question ? getAudioUrl(question) : undefined;
    
    if (!audioUrl) {
      console.warn('No audio URL available for word:', wordId);
      return;
    }
    
    // Use the audio playback utility
    playAudio(audioUrl, wordId);
  };

  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка словаря..." />
      </Screen>
    );
  }

  if (vocabularyItems.length === 0) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-telegram-text text-lg mb-4">
            Словарь пуст
          </p>
          <p className="text-telegram-hint text-sm mb-6">
            Сначала изучите слова в уроках
          </p>
          <Button onClick={handleBackToLessons}>
            Вернуться к урокам
          </Button>
        </div>
      </Screen>
    );
  }

  if (testQuestions.length === 0) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Подготовка теста..." />
      </Screen>
    );
  }

  if (isTestComplete) {
    // Calculate additional metrics
    const averageTimePerQuestion = Math.round(testResults.timeSpent / testResults.total);
    const speedRating = averageTimePerQuestion < 10 ? 'Быстро' : averageTimePerQuestion < 20 ? 'Средне' : 'Медленно';
    
    // Determine performance level and motivational message
    const getPerformanceData = (score: number) => {
      if (score >= 90) {
        return {
          level: 'Отлично',
          emoji: '🏆',
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'from-yellow-900/20 to-orange-900/20',
          borderColor: 'border-yellow-500/30',
          message: 'Превосходно! Вы отлично знаете слова этого модуля!',
          subMessage: 'Продолжайте в том же духе!'
        };
      } else if (score >= 70) {
        return {
          level: 'Хорошо',
          emoji: '🎯',
          color: 'from-green-400 to-telegram-accent',
          bgColor: 'from-green-900/20 to-telegram-accent/20',
          borderColor: 'border-green-500/30',
          message: 'Хороший результат! Есть над чем поработать.',
          subMessage: 'Повторите сложные слова и попробуйте снова!'
        };
      } else if (score >= 50) {
        return {
          level: 'Удовлетворительно',
          emoji: '📚',
          color: 'from-blue-400 to-indigo-500',
          bgColor: 'from-blue-900/20 to-indigo-900/20',
          borderColor: 'border-blue-500/30',
          message: 'Неплохо для начала! Рекомендуем повторить материал.',
          subMessage: 'Изучите слова внимательнее и попробуйте еще раз!'
        };
      } else {
        return {
          level: 'Нужно подтянуться',
          emoji: '💪',
          color: 'from-purple-400 to-pink-500',
          bgColor: 'from-purple-900/20 to-pink-900/20',
          borderColor: 'border-purple-500/30',
          message: 'Не расстраивайтесь! Каждый эксперт когда-то был новичком.',
          subMessage: 'Вернитесь к урокам и изучите слова более внимательно!'
        };
      }
    };

    const performance = getPerformanceData(testResults.score);

    return (
      <Screen>
        <div className="max-w-md mx-auto min-w-0">
          {/* Breadcrumbs */}
          <Breadcrumbs
            moduleTitle={moduleTitle}
            onModulesClick={handleNavigateToModules}
            lessonTitle="Результаты"
            onLessonsClick={handleBackToLessons}
          />

          {/* Animated Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="text-8xl mb-4 animate-bounce">
                {performance.emoji}
              </div>
              {/* Celebration particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-telegram-accent rounded-full animate-ping"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-telegram-text mb-2">
              Тест завершен!
            </h1>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${performance.color} text-white`}>
              {performance.level}
            </div>
          </div>

          {/* Main Results Card */}
          <div className={`bg-gradient-to-br ${performance.bgColor} rounded-3xl p-6 mb-6 border ${performance.borderColor} shadow-xl`}>
            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className={`text-6xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent mb-2`}>
                  {testResults.score}%
                </div>
                <div className="text-sm text-telegram-hint font-medium">Общий результат</div>
                
                {/* Circular Progress Ring */}
                <div className="absolute -inset-4 rounded-full border-4 border-telegram-accent/20">
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{
                      borderTopColor: testResults.score >= 70 ? '#10b981' : testResults.score >= 50 ? '#3b82f6' : '#ef4444',
                      transform: `rotate(${(testResults.score / 100) * 360 - 90}deg)`,
                      transition: 'transform 2s ease-out'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-telegram-card-bg/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {testResults.correct}
                </div>
                <div className="text-xs text-telegram-hint font-medium">Правильно</div>
                <div className="w-full bg-telegram-secondary-bg rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(testResults.correct / testResults.total) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-telegram-card-bg/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-red-500/20">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {testResults.total - testResults.correct}
                </div>
                <div className="text-xs text-telegram-hint font-medium">Неправильно</div>
                <div className="w-full bg-telegram-secondary-bg rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((testResults.total - testResults.correct) / testResults.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Message */}
            <div className="text-center mb-6">
              <p className="text-telegram-text font-medium mb-2">
                {performance.message}
              </p>
              <p className="text-sm text-telegram-hint">
                {performance.subMessage}
              </p>
            </div>
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Time Stats */}
            <div className="bg-telegram-card-bg/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-blue-500/20">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="text-lg font-bold text-blue-400 mb-1">
                {Math.floor(testResults.timeSpent / 60)}:{(testResults.timeSpent % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-telegram-hint">Общее время</div>
              <div className="text-xs text-blue-400 font-medium mt-1">
                {speedRating}
              </div>
            </div>

            {/* Speed Stats */}
            <div className="bg-telegram-card-bg/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-500/20">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-lg font-bold text-purple-400 mb-1">
                {averageTimePerQuestion}с
              </div>
              <div className="text-xs text-telegram-hint">На вопрос</div>
              <div className="text-xs text-purple-400 font-medium mt-1">
                Средняя скорость
              </div>
            </div>
          </div>

          {/* Achievements */}
          {testResults.score >= 90 && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏅</div>
                <div>
                  <div className="font-semibold text-yellow-400">Достижение разблокировано!</div>
                  <div className="text-sm text-yellow-300">Мастер словаря</div>
                </div>
              </div>
            </div>
          )}

          {/* Wrong Answers Section */}
          {testResults.wrongAnswers.length > 0 && (
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">❌</div>
                <h3 className="text-lg font-semibold text-red-400">Неправильные ответы</h3>
                <div className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full">
                  {testResults.wrongAnswers.length}
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {testResults.wrongAnswers.map((wrongAnswer, index) => (
                  <div key={index} className="bg-telegram-card-bg/80 rounded-xl p-4 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-telegram-text text-lg">
                        {wrongAnswer.question.word}
                      </div>
                      {wrongAnswer.question.pronunciation && (
                        <button
                          onClick={() => handleAudioPlay(`wrong-${index}`)}
                          className={`
                            p-2 rounded-full transition-all duration-200
                            ${playingAudio === `wrong-${index}` 
                              ? 'bg-telegram-accent text-white scale-110' 
                              : 'bg-telegram-secondary-bg text-telegram-hint hover:bg-telegram-accent hover:text-white hover:scale-105'
                            }
                          `}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            {playingAudio === `wrong-${index}` ? (
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            ) : (
                              <path d="M8 5v14l11-7z"/>
                            )}
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-400 font-medium">Ваш ответ:</span>
                        <span className="text-sm text-red-300 bg-red-900/30 px-2 py-1 rounded">
                          {wrongAnswer.userAnswer}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-400 font-medium">Правильно:</span>
                        <span className="text-sm text-green-300 bg-green-900/30 px-2 py-1 rounded">
                          {wrongAnswer.correctAnswer}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRestartTest}
              className="w-full bg-gradient-to-r from-telegram-accent to-blue-600 hover:from-telegram-accent/90 hover:to-blue-600/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span>Пройти тест заново</span>
            </Button>
            
            <Button
              onClick={handleBackToLessons}
              variant="ghost"
              className="w-full py-4 px-6 rounded-xl transition-all duration-300 hover:bg-telegram-secondary-bg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              <span>Вернуться к урокам</span>
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="max-w-md mx-auto min-w-0">
        {/* Breadcrumbs */}
        <Breadcrumbs
          moduleTitle={moduleTitle}
          onModulesClick={handleNavigateToModules}
          lessonTitle="Словарь"
          onLessonsClick={handleBackToLessons}
        />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-telegram-accent/10 text-telegram-accent rounded-full text-xs font-medium mb-3">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Тест словаря
          </div>
          <h1 className="text-xl font-bold text-telegram-text">
            {moduleTitle}
          </h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-telegram-hint mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {testQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-telegram-accent to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-telegram-card-bg rounded-2xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-3xl font-bold text-telegram-text">
                {currentQuestion?.word}
              </div>
              {/* Audio Button */}
              {currentQuestion?.pronunciation && (
                <button
                  onClick={() => handleAudioPlay(currentQuestion.id)}
                  className={`
                    p-2 rounded-full transition-all duration-200
                    ${playingAudio === currentQuestion.id 
                      ? 'bg-telegram-accent text-white scale-110' 
                      : 'bg-telegram-secondary-bg text-telegram-hint hover:bg-telegram-accent hover:text-white hover:scale-105'
                    }
                  `}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    {playingAudio === currentQuestion.id ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    ) : (
                      <path d="M8 5v14l11-7z"/>
                    )}
                  </svg>
                </button>
              )}
            </div>
            {currentQuestion?.partOfSpeech && (
              <div className="text-sm text-telegram-hint bg-telegram-secondary-bg px-3 py-1 rounded-full inline-block">
                {currentQuestion.partOfSpeech}
              </div>
            )}
          </div>

          <div className="text-center text-telegram-hint text-sm mb-6">
            Выберите правильный перевод:
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`
                  w-full p-4 rounded-xl text-left transition-all duration-200
                  ${selectedAnswer === option
                    ? showResult
                      ? isCorrect && option === currentQuestion.correctAnswer
                        ? 'bg-green-500 text-white shadow-lg'
                        : !isCorrect && option === selectedAnswer
                          ? 'bg-red-500 text-white shadow-lg'
                          : option === currentQuestion.correctAnswer
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-telegram-accent text-white shadow-lg'
                      : 'bg-telegram-accent text-white shadow-lg'
                    : showResult && option === currentQuestion.correctAnswer
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-telegram-secondary-bg text-telegram-text hover:bg-telegram-card-bg'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showResult && option === currentQuestion.correctAnswer && (
                    <span className="text-lg">✅</span>
                  )}
                  {showResult && !isCorrect && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                    <span className="text-lg">❌</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {selectedAnswer && !showResult && (
          <Button
            onClick={handleSubmitAnswer}
            className="w-full mb-4"
          >
            Проверить ответ
          </Button>
        )}

        {/* Next Button */}
        {showResult && (
          <Button
            onClick={handleNextQuestion}
            className="w-full"
          >
            {currentQuestionIndex < testQuestions.length - 1 ? 'Следующий вопрос' : 'Завершить тест'}
          </Button>
        )}
      </div>
    </Screen>
  );
};
