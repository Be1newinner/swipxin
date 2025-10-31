
// User type definition
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    country?: string;
    [key: string]: unknown;
}

// Screen type definition
export type Screen = "home" | "search" | "profile" | "settings" | "call" | string;

// App state interface
export interface AppState {
    user: User | null;
    isAuthenticated: boolean;
    selectedCountry: string;
    isDarkMode: boolean;
    isInCall: boolean;
    callDuration: number;
    currentScreen: Screen;
    isLoading: boolean;
    error: string | null;
}

// Action types as const object
export const ActionTypes = {
    SET_USER: "SET_USER",
    SET_AUTHENTICATED: "SET_AUTHENTICATED",
    SET_SELECTED_COUNTRY: "SET_SELECTED_COUNTRY",
    TOGGLE_DARK_MODE: "TOGGLE_DARK_MODE",
    SET_IN_CALL: "SET_IN_CALL",
    SET_CALL_DURATION: "SET_CALL_DURATION",
    SET_CURRENT_SCREEN: "SET_CURRENT_SCREEN",
    SET_LOADING: "SET_LOADING",
    SET_ERROR: "SET_ERROR",
    CLEAR_ERROR: "CLEAR_ERROR",
    UPDATE_USER: "UPDATE_USER",
    LOGOUT: "LOGOUT",
} as const;

// Action type definitions
export type AppAction =
    | { type: typeof ActionTypes.SET_USER; payload: User | null }
    | { type: typeof ActionTypes.SET_AUTHENTICATED; payload: boolean }
    | { type: typeof ActionTypes.SET_SELECTED_COUNTRY; payload: string }
    | { type: typeof ActionTypes.TOGGLE_DARK_MODE }
    | { type: typeof ActionTypes.SET_IN_CALL; payload: boolean }
    | { type: typeof ActionTypes.SET_CALL_DURATION; payload: number }
    | { type: typeof ActionTypes.SET_CURRENT_SCREEN; payload: Screen }
    | { type: typeof ActionTypes.SET_LOADING; payload: boolean }
    | { type: typeof ActionTypes.SET_ERROR; payload: string | null }
    | { type: typeof ActionTypes.CLEAR_ERROR }
    | { type: typeof ActionTypes.UPDATE_USER; payload: Partial<User> }
    | { type: typeof ActionTypes.LOGOUT };
