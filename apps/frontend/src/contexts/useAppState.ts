import { createContext, useContext, type Dispatch } from "react";
import type { AppAction, AppState } from "./types";

// Create contexts with proper typing
export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);


// Custom hooks with proper type guards
export function useAppState(): AppState {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error("useAppState must be used within an AppProvider");
    }
    return context;
}

export function useAppDispatch(): Dispatch<AppAction> {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error("useAppDispatch must be used within an AppProvider");
    }
    return context;
}
