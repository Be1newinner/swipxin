import { useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import { AppDispatchContext, AppStateContext } from "./useAppState";
import { ActionTypes, type AppAction, type AppState, type User } from "./types";

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  selectedCountry: "US",
  isDarkMode: false,
  isInCall: false,
  callDuration: 0,
  currentScreen: "home",
  isLoading: false,
  error: null,
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
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
        user: state.user
          ? { ...state.user, ...action.payload }
          : (action.payload as User),
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isDarkMode: state.isDarkMode,
      };

    default:
      return state;
  }
}


// Provider props interface
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = (): void => {
      try {
        const savedUser = localStorage.getItem("swipx-user");
        if (savedUser) {
          const user = JSON.parse(savedUser) as User;
          dispatch({ type: ActionTypes.SET_USER, payload: user });
        }

        const savedDarkMode = localStorage.getItem("swipx-dark-mode");
        if (savedDarkMode === "true") {
          dispatch({ type: ActionTypes.TOGGLE_DARK_MODE });
        }

        const savedCountry = localStorage.getItem("swipx-country");
        if (savedCountry) {
          dispatch({
            type: ActionTypes.SET_SELECTED_COUNTRY,
            payload: savedCountry,
          });
        }
      } catch (error) {
        console.error("Error loading persisted data:", error);
      }
    };

    loadPersistedData();
  }, []);

  // Persist data when state changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem("swipx-user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("swipx-user");
    }
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem("swipx-dark-mode", state.isDarkMode.toString());
    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.isDarkMode]);

  useEffect(() => {
    localStorage.setItem("swipx-country", state.selectedCountry);
  }, [state.selectedCountry]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
