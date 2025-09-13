import React from 'react';
import { hapticFeedback } from '../utils/telegram';

interface TabOption {
  key: string;
  label: string;
  icon: string;
  count?: number;
}

interface TabSwitchProps {
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
}

export const TabSwitch: React.FC<TabSwitchProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`bg-telegram-secondary-bg rounded-2xl p-1 ${className}`}>
      <div className="flex">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => {
              hapticFeedback.selection();
              onTabChange(tab.key);
            }}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.key 
                ? 'bg-white text-telegram-text shadow-sm' 
                : 'text-telegram-hint hover:text-telegram-text'
              }
              ${index === 0 ? 'rounded-l-xl' : ''}
              ${index === tabs.length - 1 ? 'rounded-r-xl' : ''}
            `}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`
                px-2 py-0.5 text-xs rounded-full
                ${activeTab === tab.key 
                  ? 'bg-telegram-accent text-white' 
                  : 'bg-telegram-hint/20 text-telegram-hint'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
