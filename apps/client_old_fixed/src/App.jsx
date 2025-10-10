import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorToast } from "./components/ErrorToast";
import { AppRouter } from "./components/AppRouter";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { Toaster } from "./components/ui/sonner";

// Context & Hooks
import { AppProvider } from "./contexts/AppContext";
import { useApp } from "./hooks/useApp";

function AppContent() {
  const {
    state,
    isSupabaseEnabled,
    isLoading,
    error,
    backendConnected,
    // navigateTo,
    updateUser,
    login,
    register,
    logout,
    toggleDarkMode,
    completeOnboarding,
    clearError,
  } = useApp();

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen message="Initializing Swipx..." />;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <AppRouter
        user={state.user}
        isAuthenticated={state.isAuthenticated}
        hasSeenOnboarding={state.hasSeenOnboarding}
        isSupabaseEnabled={isSupabaseEnabled}
        updateUser={updateUser}
        login={login}
        register={register}
        logout={logout}
        toggleDarkMode={toggleDarkMode}
        completeOnboarding={completeOnboarding}
        isDarkMode={state.isDarkMode}
        state={state}
        backendConnected={backendConnected}
      />
      <ErrorToast error={error} onClear={clearError} />
      <PWAInstallBanner />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
