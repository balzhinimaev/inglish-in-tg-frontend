import React, { useMemo, useState } from 'react';
import { Button, Card } from './index';
import type { Task } from '../types';

interface TaskRendererProps {
  task: Task;
  onAnswer: (answer: any) => void;
  onSkip?: () => void;
}

const shuffle = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const TaskRenderer: React.FC<TaskRendererProps> = ({ task, onAnswer, onSkip }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [textInput, setTextInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  // order task state
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);

  // matching state
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const normalizedType = task.type;

  const matchingPairs = useMemo(() => {
    if (normalizedType !== 'matching' && normalizedType !== 'match') return [];
    const pairs = Array.isArray(task.data?.pairs) ? task.data.pairs : [];
    return pairs.map((p: any) => ({
      left: p?.left ?? p?.english ?? '',
      right: p?.right ?? p?.russian ?? '',
    }));
  }, [normalizedType, task.data]);

  const rightOptions = useMemo(() => {
    return shuffle(matchingPairs.map((p) => p.right));
  }, [matchingPairs]);

  // Flashcard
  if (normalizedType === 'flashcard') {
    const { front, back, example } = task.data;
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold text-telegram-text mb-4 text-center">{isRevealed ? back : front}</h3>
        {isRevealed && example && <p className="text-sm text-telegram-hint mb-4">{example}</p>}

        {!isRevealed ? (
          <Button fullWidth onClick={() => setIsRevealed(true)}>Показать перевод</Button>
        ) : (
          <div className="space-y-2">
            <Button fullWidth onClick={() => onAnswer('correct')}>Знаю</Button>
            <Button fullWidth variant="ghost" onClick={() => onAnswer('incorrect')}>Повторить</Button>
          </div>
        )}
      </Card>
    );
  }

  // Multiple choice / choice / listening with options
  if (normalizedType === 'multiple_choice' || normalizedType === 'choice' || normalizedType === 'listening' || normalizedType === 'listen') {
    const question = task.data?.question || 'Выберите ответ';
    const options: string[] = Array.isArray(task.data?.options) ? task.data.options : [];

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">{question}</h3>
        <div className="space-y-2 mb-4">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(idx)}
              className={`w-full p-3 text-left rounded-lg border ${selectedAnswer === idx ? 'border-telegram-accent bg-telegram-accent/10' : 'border-telegram-hint/30'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <Button fullWidth disabled={selectedAnswer === null} onClick={() => onAnswer(selectedAnswer)}>Ответить</Button>
      </Card>
    );
  }

  // Gap (single input fallback)
  if (normalizedType === 'gap_fill' || normalizedType === 'gap') {
    const text = task.data?.text || 'Введите ответ';

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">Заполните пропуск</h3>
        <p className="text-telegram-text mb-4">{text}</p>
        <input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Ваш ответ"
          className="w-full rounded-lg border border-telegram-hint/30 bg-transparent px-3 py-2 mb-4"
        />
        <Button fullWidth disabled={!textInput.trim()} onClick={() => onAnswer(textInput.trim())}>Проверить</Button>
      </Card>
    );
  }

  // Matching
  if (normalizedType === 'matching' || normalizedType === 'match') {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">Сопоставьте пары</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            {matchingPairs.map((p) => (
              <button
                key={p.left}
                onClick={() => setActiveLeft(p.left)}
                className={`w-full p-2 rounded border text-left ${activeLeft === p.left ? 'border-telegram-accent bg-telegram-accent/10' : 'border-telegram-hint/30'}`}
              >
                {p.left}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {rightOptions.map((right) => (
              <button
                key={right}
                onClick={() => {
                  if (!activeLeft) return;
                  setMatches((prev) => ({ ...prev, [activeLeft]: right }));
                  setActiveLeft(null);
                }}
                className="w-full p-2 rounded border border-telegram-hint/30 text-left"
              >
                {right}
              </button>
            ))}
          </div>
        </div>
        <Button fullWidth disabled={Object.keys(matches).length < matchingPairs.length} onClick={() => onAnswer(matches)}>
          Проверить
        </Button>
      </Card>
    );
  }

  // Order
  if (normalizedType === 'order') {
    const tokens: string[] = Array.isArray(task.data?.tokens) ? task.data.tokens : [];
    const available = tokens.filter((t) => !orderedTokens.includes(t) || orderedTokens.filter(v => v === t).length < tokens.filter(v => v === t).length);

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">Соберите предложение</h3>

        <div className="min-h-12 rounded-lg border border-telegram-hint/30 p-2 mb-3 flex flex-wrap gap-2">
          {orderedTokens.map((token, idx) => (
            <button
              key={`${token}-${idx}`}
              className="px-2 py-1 rounded bg-telegram-accent/10 border border-telegram-accent/30"
              onClick={() => setOrderedTokens((prev) => prev.filter((_, i) => i !== idx))}
            >
              {token}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {available.map((token, idx) => (
            <button
              key={`${token}-pool-${idx}`}
              className="px-2 py-1 rounded border border-telegram-hint/30"
              onClick={() => setOrderedTokens((prev) => [...prev, token])}
            >
              {token}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Button fullWidth disabled={orderedTokens.length !== tokens.length} onClick={() => onAnswer(orderedTokens)}>
            Проверить
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setOrderedTokens([])}>
            Сбросить
          </Button>
        </div>
      </Card>
    );
  }

  // Translate
  if (normalizedType === 'translate') {
    const question = task.data?.question || 'Переведите фразу';
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">{question}</h3>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Введите перевод"
          className="w-full rounded-lg border border-telegram-hint/30 bg-transparent px-3 py-2 mb-4 min-h-24"
        />
        <Button fullWidth disabled={!textInput.trim()} onClick={() => onAnswer(textInput.trim())}>Ответить</Button>
      </Card>
    );
  }

  // Speak (text fallback)
  if (normalizedType === 'speak') {
    const prompt = task.data?.prompt || 'Произнесите/введите ответ';
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-telegram-text mb-4">{prompt}</h3>
        <input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Введите то, что произнесли"
          className="w-full rounded-lg border border-telegram-hint/30 bg-transparent px-3 py-2 mb-4"
        />
        <Button fullWidth disabled={!textInput.trim()} onClick={() => onAnswer(textInput.trim())}>Проверить</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-telegram-hint text-sm mb-3">Неизвестный тип задания: {task.type}</p>
      {onSkip && (
        <Button fullWidth variant="ghost" onClick={onSkip}>Пропустить</Button>
      )}
    </Card>
  );
};
