import React from 'react';
import type { ModuleItem, ModuleProgress } from '../types';
import type { SupportedLanguage } from '../utils/constants';
import { SUPPORTED_LANGUAGES } from '../utils/constants';

interface ModuleCardProps {
  module: ModuleItem;
  onClick: () => void;
  language?: SupportedLanguage;
}

// Локализация текста
const getLocalizedText = (value: ModuleItem['title'], lang: SupportedLanguage): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (
    value[lang] ??
    value[SUPPORTED_LANGUAGES.RU] ??
    value[SUPPORTED_LANGUAGES.EN] ??
    Object.values(value)[0] ??
    ''
  );
};

// Иконки для тегов
const TAG_ICONS: Record<string, string> = {
  travel: '✈️',
  airport: '🛫',
  survival: '🆘',
  food: '🍕',
  shopping: '🛒',
  greetings: '👋',
  family: '👨‍👩‍👧',
  work: '💼',
  health: '🏥',
  numbers: '🔢',
  colors: '🎨',
  animals: '🐾',
  weather: '🌤️',
  time: '⏰',
  home: '🏠',
  sports: '⚽',
  music: '🎵',
  technology: '💻',
  nature: '🌿',
  city: '🏙️',
};

// Цвета для уровней
const LEVEL_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  A0: { bg: 'from-emerald-400 to-emerald-600', text: 'text-white', glow: 'shadow-emerald-500/30' },
  A1: { bg: 'from-green-400 to-green-600', text: 'text-white', glow: 'shadow-green-500/30' },
  A2: { bg: 'from-teal-400 to-teal-600', text: 'text-white', glow: 'shadow-teal-500/30' },
  B1: { bg: 'from-blue-400 to-blue-600', text: 'text-white', glow: 'shadow-blue-500/30' },
  B2: { bg: 'from-indigo-400 to-indigo-600', text: 'text-white', glow: 'shadow-indigo-500/30' },
  C1: { bg: 'from-purple-400 to-purple-600', text: 'text-white', glow: 'shadow-purple-500/30' },
  C2: { bg: 'from-pink-400 to-pink-600', text: 'text-white', glow: 'shadow-pink-500/30' },
};

// Рендер звёзд сложности
const DifficultyStars: React.FC<{ rating: number; max?: number }> = ({ rating, max = 5 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < rating ? 'text-amber-400' : 'text-telegram-hint/30'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
};

// Рендер прогресс-бара
const ProgressBar: React.FC<{ progress: ModuleProgress }> = ({ progress }) => {
  const total = Math.max(1, progress.total);
  const completedPercent = (progress.completed / total) * 100;
  const inProgressPercent = (progress.inProgress / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-telegram-hint">
          {progress.completed}/{progress.total} уроков
        </span>
        <span className="font-medium text-telegram-accent">
          {Math.round(completedPercent)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-telegram-secondary-bg overflow-hidden border border-white/10">
        <div className="h-full flex">
          {/* Completed */}
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${completedPercent}%` }}
          />
          {/* In Progress */}
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-telegram-accent transition-all duration-500"
            style={{ width: `${inProgressPercent}%` }}
          />
        </div>
      </div>
      {progress.inProgress > 0 && (
        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
            <span className="text-telegram-hint">Завершено</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-telegram-accent" />
            <span className="text-telegram-hint">В процессе</span>
          </span>
        </div>
      )}
    </div>
  );
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onClick,
  language = SUPPORTED_LANGUAGES.RU
}) => {
  const locked = !module.isAvailable;
  const proBadge = module.requiresPro;
  const title = getLocalizedText(module.title, language);
  const description = getLocalizedText(module.description, language);
  const levelColors = LEVEL_COLORS[module.level] || LEVEL_COLORS.A1;

  // Получаем иконки для тегов
  const displayTags = module.tags.slice(0, 3).map(tag => ({
    key: tag,
    icon: TAG_ICONS[tag.toLowerCase()] || '📌',
    label: tag
  }));

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-4 cursor-pointer
        bg-telegram-card-bg border border-white/5
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
        ${locked 
          ? 'opacity-60 bg-telegram-secondary-bg' 
          : 'hover:bg-telegram-card-bg/80 hover:border-telegram-accent/20'
        }
        max-[300px]:p-3 max-[300px]:rounded-xl
      `}
    >
      {/* PRO Badge - Top Right Corner */}
      {proBadge && (
        <div className="absolute -top-2 -right-2 z-10 max-[300px]:-top-1.5 max-[300px]:-right-1.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-sm opacity-60 animate-pulse" />
            <span className="relative flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg max-[300px]:px-2 max-[300px]:py-0.5 max-[300px]:text-[9px]">
              <svg className="w-3 h-3 max-[300px]:w-2.5 max-[300px]:h-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              PRO
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 max-[300px]:gap-3">
        {/* Level Badge / Icon */}
        <div className={`
          relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0
          bg-gradient-to-br ${levelColors.bg} shadow-lg ${levelColors.glow}
          max-[300px]:w-10 max-[300px]:h-10 max-[300px]:rounded-lg
        `}>
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent max-[300px]:rounded-lg" />
          
          {locked ? (
            <svg className="w-6 h-6 text-white/90 relative z-10 max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
            </svg>
          ) : (
            <span className="text-white font-bold text-lg relative z-10 max-[300px]:text-sm">
              {module.level}
            </span>
          )}
          
          {/* Glow effect for unlocked */}
          {!locked && (
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${levelColors.bg} opacity-40 blur-md -z-10`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start gap-2 mb-1 max-[300px]:mb-0.5">
            <h3 className={`
              font-semibold text-lg leading-tight truncate
              ${locked ? 'text-telegram-hint' : 'text-telegram-text'}
              max-[300px]:text-base
            `}>
              {title}
            </h3>
          </div>

          {/* Difficulty Stars */}
          <div className="flex items-center gap-2 mb-2 max-[300px]:mb-1.5">
            <DifficultyStars rating={module.difficultyRating || 1} />
            <span className="text-[10px] text-telegram-hint max-[300px]:text-[9px]">
              Сложность
            </span>
          </div>

          {/* Description */}
          <p className={`
            text-sm mb-3 line-clamp-2
            ${locked ? 'text-telegram-hint/70' : 'text-telegram-hint'}
            max-[300px]:text-xs max-[300px]:mb-2 max-[300px]:line-clamp-2
          `}>
            {description}
          </p>

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 max-[300px]:gap-1 max-[300px]:mb-2">
              {displayTags.map(tag => (
                <span
                  key={tag.key}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]
                    ${locked 
                      ? 'bg-telegram-secondary-bg text-telegram-hint/60' 
                      : 'bg-telegram-accent/10 text-telegram-accent border border-telegram-accent/20'
                    }
                    max-[300px]:px-1.5 max-[300px]:text-[10px]
                  `}
                >
                  <span>{tag.icon}</span>
                  <span className="capitalize">{tag.label}</span>
                </span>
              ))}
              {module.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-telegram-secondary-bg text-telegram-hint max-[300px]:px-1.5 max-[300px]:text-[10px]">
                  +{module.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {module.progress && <ProgressBar progress={module.progress} />}
        </div>

        {/* Right Arrow / Lock Icon */}
        <div className="pt-4 shrink-0 max-[300px]:pt-2">
          {locked ? (
            <div className="w-8 h-8 rounded-full bg-telegram-secondary-bg flex items-center justify-center max-[300px]:w-6 max-[300px]:h-6">
              <svg className="w-4 h-4 text-telegram-hint max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-telegram-accent/10 flex items-center justify-center group-hover:bg-telegram-accent/20 transition-colors max-[300px]:w-6 max-[300px]:h-6">
              <svg className="w-4 h-4 text-telegram-accent max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Locked Overlay Hint */}
      {locked && (
        <div className="mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-telegram-accent/5 border border-telegram-accent/10 max-[300px]:mt-2 max-[300px]:py-1.5">
          <svg className="w-4 h-4 text-telegram-accent max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
          </svg>
          <span className="text-xs text-telegram-accent font-medium max-[300px]:text-[10px]">
            Откройте PRO для доступа
          </span>
        </div>
      )}
    </div>
  );
};

