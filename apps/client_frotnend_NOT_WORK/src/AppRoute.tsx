// App.tsx
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorToast } from "./components/ErrorToast";
import { AppRouter } from "./components/AppRouter";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { Toaster } from "./components/ui/sonner";
import { useAppStore } from "./store/useAppStore";
import { useAppInit } from "./hooks/useAppInit";

export function AppContent() {
  useAppInit();

  // IMPORTANT: select each field separately to avoid returning a new object every render
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const isSupabaseEnabled = useAppStore((s) => s.isSupabaseEnabled);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);
  const backendConnected = useAppStore((s) => s.backendConnected);

  const updateUser = useAppStore((s) => s.updateUser);
  const register = useAppStore((s) => s.register);
  const logout = useAppStore((s) => s.logout);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const clearError = useAppStore((s) => s.clearError);

  if (isLoading) {
    return <LoadingScreen message="Initializing Swipx..." />;
  }

  return (
    <>
      <AppRouter
        user={user}
        isAuthenticated={isAuthenticated}
        hasSeenOnboarding={hasSeenOnboarding}
        isSupabaseEnabled={isSupabaseEnabled}
        updateUser={updateUser}
        register={register}
        logout={logout}
        toggleDarkMode={toggleDarkMode}
        completeOnboarding={completeOnboarding}
        isDarkMode={isDarkMode}
        state={{
          user,
          isAuthenticated,
          hasSeenOnboarding,
          isDarkMode,
          backendConnected,
        }}
        backendConnected={backendConnected}
      />
      <ErrorToast error={error} onClear={clearError} />
      <PWAInstallBanner />
      <Toaster />
    </>
  );
}
