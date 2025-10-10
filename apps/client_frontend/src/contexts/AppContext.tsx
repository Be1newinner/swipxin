import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  selectedCountry: 'US',
  isDarkMode: false,
  isInCall: false,
  callDuration: 0,
  currentScreen: 'home',
  isLoading: false,
  error: null,
  isSupabaseEnabled: false,
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_SELECTED_COUNTRY: 'SET_SELECTED_COUNTRY',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_IN_CALL: 'SET_IN_CALL',
  SET_CALL_DURATION: 'SET_CALL_DURATION',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  LOGOUT: 'LOGOUT',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    case ActionTypes.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    
    case ActionTypes.SET_SELECTED_COUNTRY:
      return {
        ...state,
        selectedCountry: action.payload,
      };
    
    case ActionTypes.TOGGLE_DARK_MODE:
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
      };
    
    case ActionTypes.SET_IN_CALL:
      return {
        ...state,
        isInCall: action.payload,
      };
    
    case ActionTypes.SET_CALL_DURATION:
      return {
        ...state,
        callDuration: action.payload,
      };
    
    case ActionTypes.SET_CURRENT_SCREEN:
      return {
        ...state,
        currentScreen: action.payload,
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : action.payload,
      };
    
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isDarkMode: state.isDarkMode, // Preserve dark mode preference
      };
    
    default:
      return state;
  }
}

// Create contexts
const AppStateContext = createContext();
const AppDispatchContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        // Load user data from localStorage
        const savedUser = localStorage.getItem('swipx-user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          dispatch({ type: ActionTypes.SET_USER, payload: user });
        }

        // Load dark mode preference
        const savedDarkMode = localStorage.getItem('swipx-dark-mode');
        if (savedDarkMode === 'true') {
          dispatch({ type: ActionTypes.TOGGLE_DARK_MODE });
        }

        // Load selected country
        const savedCountry = localStorage.getItem('swipx-country');
        if (savedCountry) {
          dispatch({ type: ActionTypes.SET_SELECTED_COUNTRY, payload: savedCountry });
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  // Persist data when state changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('swipx-user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('swipx-user');
    }
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem('swipx-dark-mode', state.isDarkMode.toString());
    // Apply dark mode class to document
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  useEffect(() => {
    localStorage.setItem('swipx-country', state.selectedCountry);
  }, [state.selectedCountry]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Custom hooks
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}

// Export action types for use in components
export { ActionTypes };
