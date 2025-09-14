import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Entitlement, AppState, AuthState } from '../types';
import { APP_STATES } from '../utils/constants';
import { jwtUtils } from '../services/auth';

interface UserState extends AuthState {
  // User data
  user: User | null;
  entitlement: Entitlement | null;
  
  // App state
  appState: AppState;
  isLoading: boolean;
  error: string | null;
  
  // Navigation
  previousScreen: AppState | null;
  previousScreenParams: Record<string, any>;
  navigationParams: Record<string, any>;
  
  // Actions
  setUser: (user: User | null) => void;
  setEntitlement: (entitlement: Entitlement | null) => void;
  setAppState: (state: AppState, params?: Record<string, any>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPreviousScreen: (screen: AppState | null) => void;
  setPreviousScreenParams: (params: Record<string, any>) => void;
  setNavigationParams: (params: Record<string, any>) => void;
  
  // Auth actions
  setAuthState: (authState: Partial<AuthState>) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  checkAuthStatus: () => boolean;
  
  // Computed
  hasActiveSubscription: () => boolean;
  isFirstTime: () => boolean;
  needsOnboarding: () => boolean;
  getOnboardingInfo: () => {
    completed: boolean;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | null;
    completedAt: Date | undefined;
  };
  
  // Reset
  reset: () => void;
}

const initialState = {
  // Auth state
  isAuthenticated: false,
  accessToken: null,
  user: null,
  entitlement: null,
  
  // App state
  appState: APP_STATES.LOADING as AppState,
  isLoading: true,
  error: null,
  previousScreen: null,
  previousScreenParams: {},
  navigationParams: {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setEntitlement: (entitlement) => set({ entitlement }),
      
      // Auth actions
      setAuthState: (authState) => set(authState),
      
      login: (user, accessToken) => {
        jwtUtils.storeToken(accessToken);
        set({ 
          user, 
          accessToken, 
          isAuthenticated: true,
          error: null 
        });
      },
      
      logout: () => {
        jwtUtils.removeToken();
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false,
          entitlement: null,
          error: null 
        });
      },
      
      checkAuthStatus: () => {
        const token = jwtUtils.getStoredToken();
        if (!token || jwtUtils.isTokenExpired(token)) {
          get().logout();
          return false;
        }
        return true;
      },
      
      setAppState: (appState, params = {}) => {
        const currentState = get().appState;
        const currentParams = get().navigationParams;
        set({ 
          appState,
          previousScreen: currentState !== appState ? currentState : get().previousScreen,
          previousScreenParams: currentState !== appState ? currentParams : get().previousScreenParams,
          navigationParams: params,
        });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setPreviousScreen: (previousScreen) => set({ previousScreen }),
      
      setPreviousScreenParams: (previousScreenParams) => set({ previousScreenParams }),
      
      setNavigationParams: (navigationParams) => set({ navigationParams }),
      
      // Computed getters
      hasActiveSubscription: () => {
        const { entitlement } = get();
        if (!entitlement) return false;
        
        const now = new Date();
        const endsAt = new Date(entitlement.endsAt);
        
        return entitlement.status === 'active' && endsAt > now;
      },
      
      isFirstTime: () => {
        const { user } = get();
        return user?.isFirstOpen ?? true;
      },
      
      getOnboardingInfo: () => {
        const { user } = get();
        return {
          completed: Boolean(user?.onboardingCompletedAt),
          proficiencyLevel: user?.proficiencyLevel ?? null,
          completedAt: user?.onboardingCompletedAt,
        };
      },
      
      needsOnboarding: () => {
        const { user } = get();
        // Проверяем наличие даты завершения онбординга
        return Boolean(user && !user?.onboardingCompletedAt);
      },
      
      // Reset store
      reset: () => {
        jwtUtils.removeToken();
        set(initialState);
      },
    }),
    {
      name: 'user-store',
      // Only persist essential user data, not UI state
      partialize: (state) => ({
        user: state.user,
        entitlement: state.entitlement,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
