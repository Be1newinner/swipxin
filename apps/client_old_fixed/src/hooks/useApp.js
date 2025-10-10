import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import socketService from '../lib/socket';

const INITIAL_STATE = {
  user: null,
  isAuthenticated: false,
  hasSeenOnboarding: false,
  selectedCountry: null,
  isInCall: false,
  callDuration: 0,
  isDarkMode: false,
  isLoading: true,
  error: null,
  backendConnected: false,
};

export function useApp() {
  const [state, setState] = useState(INITIAL_STATE);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('swipx-app-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          hasSeenOnboarding: parsed.hasSeenOnboarding || false,
          isDarkMode: parsed.isDarkMode || false
        }));
      }
    } catch (err) {
      console.warn('Failed to load saved state:', err);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swipx-app-state', JSON.stringify({
        hasSeenOnboarding: state.hasSeenOnboarding,
        isDarkMode: state.isDarkMode
      }));
    } catch (err) {
      console.warn('Failed to save state:', err);
    }
  }, [state.hasSeenOnboarding, state.isDarkMode]);

  // Apply dark mode
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  const initializeApp = async () => {
    try {
      // Check if we have a stored token
      const token = localStorage.getItem('swipx-token');
      
      if (token) {
        // Verify token with backend
        await checkAuthStatus();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getProfile();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isAuthenticated: true,
          backendConnected: true,
          hasSeenOnboarding: true,
          isLoading: false
        }));
        
        // Connect to Socket.IO with token
        const token = localStorage.getItem('swipx-token');
        if (token) {
          socketService.connect(token);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem('swipx-token');
        localStorage.removeItem('swipx-user');
      }
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        backendConnected: false,
        isLoading: false
      }));
    }
  };

  // Navigation function (now handled by React Router)
  const navigateTo = useCallback((screen) => {
    // This is now handled by React Router, but keeping for backwards compatibility
    setState(prev => ({ 
      ...prev, 
      isInCall: screen === 'video-call'
    }));
  }, []);

  // User management functions
  const updateUser = useCallback(async (updates) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authAPI.updateProfile(updates);
      
      if (response.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('swipx-user', JSON.stringify(updatedUser));
        
        setState(prev => ({
          ...prev,
          user: updatedUser,
          isLoading: false
        }));
        
        toast.success('Profile updated successfully');
        return updatedUser;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      
      throw error;
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('swipx-token', response.data.token);
        localStorage.setItem('swipx-user', JSON.stringify(response.data.user));
        
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isAuthenticated: true,
          backendConnected: true,
          hasSeenOnboarding: true,
          isLoading: false
        }));
        
        // Connect to Socket.IO
        socketService.connect(response.data.token);
        
        toast.success(`Welcome back, ${response.data.user.name}!`);
        
        return response;
      }
    } catch (error) {
      console.error('Error during login:', error);
      
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        backendConnected: false,
        isLoading: false 
      }));
      
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Sending registration data:', userData);
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('swipx-token', response.data.token);
        localStorage.setItem('swipx-user', JSON.stringify(response.data.user));
        
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isAuthenticated: true,
          backendConnected: true,
          hasSeenOnboarding: true,
          isLoading: false
        }));
        
        // Connect to Socket.IO
        socketService.connect(response.data.token);
        
        toast.success(`Welcome to SwipX, ${response.data.user.name}!`);
        
        return response;
      }
    } catch (error) {
      console.error('Error during registration:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Validation errors:', error.response?.data?.errors);
      // Log each validation error individually
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err, index) => {
          console.error(`Validation error ${index + 1}:`, err);
        });
      }
      
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        backendConnected: false,
        isLoading: false 
      }));
      
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Call logout API
      await authAPI.logout();
      
      // Disconnect socket
      socketService.disconnect();
      
      // Clear local data
      localStorage.removeItem('swipx-token');
      localStorage.removeItem('swipx-user');
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        backendConnected: false,
        isLoading: false
      }));
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Clear local data anyway
      localStorage.removeItem('swipx-token');
      localStorage.removeItem('swipx-user');
      socketService.disconnect();
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        backendConnected: false,
        isLoading: false
      }));
    }
  }, []);

  // Theme management
  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  // Onboarding completion
  const completeOnboarding = useCallback((onboardingData) => {
    if (onboardingData) {
      updateUser(onboardingData);
    }
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true
    }));
    toast.success('Profile setup complete!');
  }, [updateUser]);

  // Error management
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshUserStats = useCallback(async () => {
    try {
      const response = await authAPI.getUserStats();
      
      if (response.success) {
        const updatedUser = { ...state.user, ...response.data.stats };
        localStorage.setItem('swipx-user', JSON.stringify(updatedUser));
        setState(prev => ({ ...prev, user: updatedUser }));
        
        return response.data.stats;
      }
    } catch (error) {
      console.error('Error refreshing user stats:', error);
      throw error;
    }
  }, [state.user]);

  return {
    // State
    state,
    isSupabaseEnabled: false, // Supabase is disabled
    isLoading: state.isLoading,
    error: state.error,
    backendConnected: state.backendConnected,
    
    // Actions
    navigateTo,
    updateUser,
    login,
    register,
    logout,
    toggleDarkMode,
    completeOnboarding,
    clearError,
    refreshUserStats,
    checkAuthStatus,
  };
}

