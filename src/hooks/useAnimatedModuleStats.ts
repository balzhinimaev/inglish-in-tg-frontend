import { useEffect, useState } from 'react';
import { hapticFeedback } from '../utils/telegram';

interface ModuleStats {
  completed: number;
  total: number;
  totalXP: number;
}

export const useAnimatedModuleStats = (moduleStats: ModuleStats) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedCompleted, setAnimatedCompleted] = useState(0);
  const [animatedXP, setAnimatedXP] = useState(0);

  useEffect(() => {
    const targetProgress = moduleStats.total > 0
      ? (moduleStats.completed / moduleStats.total) * 100
      : 0;
    const targetCompleted = moduleStats.completed;
    const targetXP = moduleStats.totalXP;
    const animationDuration = 1500;
    const steps = 60;

    const progressIncrement = targetProgress / steps;
    const completedIncrement = targetCompleted / steps;
    const xpIncrement = targetXP / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progressValue = Math.min(progressIncrement * currentStep, targetProgress);
      const completedValue = Math.min(Math.round(completedIncrement * currentStep), targetCompleted);
      const xpValue = Math.min(Math.round(xpIncrement * currentStep), targetXP);

      setAnimatedProgress(progressValue);
      setAnimatedCompleted(completedValue);
      setAnimatedXP(xpValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedProgress(targetProgress);
        setAnimatedCompleted(targetCompleted);
        setAnimatedXP(targetXP);
        hapticFeedback.selection();
      }
    }, animationDuration / steps);

    return () => clearInterval(timer);
  }, [moduleStats.completed, moduleStats.total, moduleStats.totalXP]);

  return {
    animatedProgress,
    animatedCompleted,
    animatedXP
  };
};
