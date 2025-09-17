import React, { Suspense, lazy } from 'react';
import { useUserStore } from './store/user';
import { APP_STATES } from './utils/constants';
import { useYandexMetrika } from './hooks/useYandexMetrika';

const LoaderScreen = lazy(() => import('./features/LoaderScreen').then(m => ({ default: m.LoaderScreen })));
const DesktopBridgeScreen = lazy(() => import('./features/DesktopBridgeScreen').then(m => ({ default: m.DesktopBridgeScreen })));
const OnboardingScreen = lazy(() => import('./features/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const ModulesScreen = lazy(() => import('./features/ModulesScreen').then(m => ({ default: m.ModulesScreen })));
const LessonsListScreen = lazy(() => import('./features/LessonsListScreen').then(m => ({ default: m.LessonsListScreen })));
const LessonScreen = lazy(() => import('./features/LessonScreen').then(m => ({ default: m.LessonScreen })));
const VocabularyTestScreen = lazy(() => import('./features/VocabularyTestScreen').then(m => ({ default: m.VocabularyTestScreen })));
const PaywallScreen = lazy(() => import('./features/PaywallScreen').then(m => ({ default: m.PaywallScreen })));
const ProfileScreen = lazy(() => import('./features/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ErrorScreen = lazy(() => import('./features/ErrorScreen').then(m => ({ default: m.ErrorScreen })));

const App: React.FC = () => {
  const { appState, navigationParams } = useUserStore();
  
  // Track screen changes for Yandex.Metrika
  useYandexMetrika();

  const renderScreen = () => {
    switch (appState) {
      case APP_STATES.LOADING:
        return <LoaderScreen />;
      
      case APP_STATES.DESKTOP_BRIDGE:
        return <DesktopBridgeScreen />;
      
      case APP_STATES.ONBOARDING:
        return <OnboardingScreen />;
      
      case APP_STATES.MODULES:
        return <ModulesScreen />;
      
      case APP_STATES.LESSONS_LIST:
        return <LessonsListScreen 
          moduleRef={navigationParams.moduleRef} 
          moduleTitle={navigationParams.moduleTitle}
        />;
      
      case APP_STATES.LESSON:
        return <LessonScreen />;
      
      case APP_STATES.VOCABULARY_TEST:
        return <VocabularyTestScreen 
          moduleRef={navigationParams.moduleRef} 
          moduleTitle={navigationParams.moduleTitle}
        />;
      
      case APP_STATES.PAYWALL:
        return <PaywallScreen />;
      
      case APP_STATES.PROFILE:
        return <ProfileScreen />;
      
      case APP_STATES.ERROR:
        return <ErrorScreen />;
      
      default:
        // Fallback to loader if unknown state
        return <LoaderScreen />;
    }
  };

  return (
    <div className="miniapp-container min-h-screen bg-telegram-bg">
      <Suspense fallback={<div className="p-6 text-telegram-hint min-h-screen flex items-center justify-center">Загрузка...</div>}>
        {renderScreen()}
      </Suspense>
    </div>
  );
};

export default App;
