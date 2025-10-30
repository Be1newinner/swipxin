/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/useAppStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import socketService from '../lib/socket';

export type User = {
  "id": string,
  "email": string,
  "name": string,
  "age": number,
  "country": string,
  "gender": string,
  "preferred_gender": string | null,
  "avatar_url": string | null,
  "is_premium": boolean,
  "tokens": number,
  "is_online": boolean,
  "last_seen": string,
  "total_calls": number,
  "created_at": string
};
type AppState = {
  user: User | null;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  selectedCountry: string | null;
  isInCall: boolean;
  callDuration: number;
  isLoading: boolean;
  error: string | null;
  backendConnected: boolean;

  checkAuthStatus: () => Promise<void>;
  navigateTo: (screen: string) => void;
  updateUser: (updates: Partial<User>) => Promise<User>;
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  completeOnboarding: (onboardingData?: Partial<User>) => void;
  clearError: () => void;
  refreshUserStats: () => Promise<any>;
};

const INITIAL: Omit<AppState,
  | 'checkAuthStatus'
  | 'navigateTo'
  | 'updateUser'
  | 'login'
  | 'register'
  | 'logout'
  | 'completeOnboarding'
  | 'clearError'
  | 'refreshUserStats'
> = {
  user: null,
  isAuthenticated: false,
  hasSeenOnboarding: false,
  selectedCountry: null,
  isInCall: false,
  callDuration: 0,
  isLoading: true,
  error: null,
  backendConnected: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL,

        clearError: () => set({ error: null }),

        navigateTo: (screen) => set({ isInCall: screen === 'video-call' }),

        checkAuthStatus: async () => {
          try {
            const response = await authAPI.getProfile();
            if (response.success) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                backendConnected: true,
                hasSeenOnboarding: true,
                isLoading: false,
                error: null,
              });
              const token = localStorage.getItem('swipx-token');
              if (token) socketService.connect(token);
            }
          } catch (error: any) {
            if (error.response?.status === 401) {
              localStorage.removeItem('swipx-token');
              localStorage.removeItem('swipx-user');
            }
            set({
              user: null,
              isAuthenticated: false,
              backendConnected: false,
              isLoading: false,
              error: error?.message ?? 'Auth check failed',
            });
          }
        },

        updateUser: async (updates) => {
          try {
            set({ isLoading: true });
            const response = await authAPI.updateProfile(updates);
            if (response.success) {
              const updatedUser = response.data.user;
              localStorage.setItem('swipx-user', JSON.stringify(updatedUser));
              set({ user: updatedUser, isLoading: false, error: null });
              toast.success('Profile updated successfully');
              return updatedUser;
            }
            throw new Error('Update failed');
          } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update profile';
            toast.error(message);
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        login: async (credentials: { email: string; password: string }) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.login(credentials);
            if (response.success) {
              localStorage.setItem('swipx-token', response.data.token);
              localStorage.setItem('swipx-user', JSON.stringify(response.data.user));
              set({
                user: response.data.user,
                isAuthenticated: true,
                backendConnected: true,
                hasSeenOnboarding: true,
                isLoading: false,
                error: null,
              });
              socketService.connect(response.data.token);
              toast.success(`Welcome back, ${response.data.user.name}!`);
              return response;
            }
            throw new Error('Login failed');
          } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            set({ error: error.message, backendConnected: false, isLoading: false });
            throw error;
          }
        },

        register: async (userData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.register(userData);
            if (response.success) {
              localStorage.setItem('swipx-token', response.data.token);
              localStorage.setItem('swipx-user', JSON.stringify(response.data.user));
              set({
                user: response.data.user,
                isAuthenticated: true,
                backendConnected: true,
                hasSeenOnboarding: true,
                isLoading: false,
                error: null,
              });
              socketService.connect(response.data.token);
              toast.success(`Welcome to SwipX, ${response.data.user.name}!`);
              return response;
            }
            throw new Error('Registration failed');
          } catch (error: any) {
            console.error('Error during registration:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            console.error('Validation errors:', error.response?.data?.errors);
            error.response?.data?.errors?.forEach((err: any, i: number) =>
              console.error(`Validation error ${i + 1}:`, err)
            );
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            set({ error: error.message, backendConnected: false, isLoading: false });
            throw error;
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true });
            await authAPI.logout();
            socketService.disconnect();
            localStorage.removeItem('swipx-token');
            localStorage.removeItem('swipx-user');
            set({
              user: null,
              isAuthenticated: false,
              backendConnected: false,
              isLoading: false,
              error: null,
            });
            toast.success('Logged out successfully');
          } catch {
            localStorage.removeItem('swipx-token');
            localStorage.removeItem('swipx-user');
            socketService.disconnect();
            set({
              user: null,
              isAuthenticated: false,
              backendConnected: false,
              isLoading: false,
            });
          }
        },

        completeOnboarding: (onboardingData) => {
          if (onboardingData) {
            get().updateUser(onboardingData).catch(() => undefined);
          }
          set({ hasSeenOnboarding: true });
          toast.success('Profile setup complete!');
        },

        refreshUserStats: async () => {
          const { user } = get();
          const response = await authAPI.getUserStats();
          if (response.success) {
            const updatedUser = { ...user, ...response.data.stats };
            localStorage.setItem('swipx-user', JSON.stringify(updatedUser));
            set({ user: updatedUser as User });
            return response.data.stats;
          }
          throw new Error('Failed to fetch stats');
        },
      }),
      {
        name: 'swipx-app-state',
        partialize: (s) => ({ hasSeenOnboarding: s.hasSeenOnboarding }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
        },
      }
    )
  ));
