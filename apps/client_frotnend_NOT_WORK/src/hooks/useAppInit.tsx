// src/hooks/useAppInit.tsx
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useAppInit() {
  const checkAuthStatus = useAppStore((s) => s.checkAuthStatus);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("swipx-token");
        if (token) {
          await checkAuthStatus();
        } else {
          // turn off loading just like original mount branch
          useAppStore.setState({ isLoading: false });
        }
      } catch {
        useAppStore.setState({ isLoading: false });
      }
    })();
  }, [checkAuthStatus]);
}
