import { useCallback, useMemo } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

export const routeMap = {
    onboarding: "/onboarding",
    auth: "/login",
    home: "/",
    "video-call": "/video-call",
    matching: "/matching",
    wallet: "/wallet",
    plans: "/plans",
    settings: "/settings",
    "country-select": "/country-select",
    "gender-select": "/gender-select",
} as const;

export type RouteKey = keyof typeof routeMap;

export const navigateRoute = (screen: RouteKey) => routeMap[screen] ?? "/";

type NavigateTo = (screen: RouteKey, options?: NavigateOptions) => void;

export function useAppNavigation() {
    const navigateRaw = useNavigate();

    const routeFor = useCallback((screen: RouteKey) => navigateRoute(screen), []);

    const navigate = useCallback<NavigateTo>(
        (screen, options) => {
            navigateRaw(routeFor(screen), options);
        },
        [navigateRaw, routeFor]
    );

    const helpers = useMemo(
        () => ({
            goHome: () => navigate("home"),
            goAuth: () => navigate("auth", { replace: true }),
            goWallet: () => navigate("wallet"),
            goVideoCall: () => navigate("video-call"),
            goSettings: () => navigate("settings"),
        }),
        [navigate]
    );

    return {
        routeMap,
        navigateRoute: routeFor,
        navigate,
        ...helpers,
    };
}
