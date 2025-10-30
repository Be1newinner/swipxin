/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Routes
import { Onboarding } from "./Onboarding";
import RegisterPage from "./auth/Register";
import Login from "./auth/Login";
import { Home } from "./Home";
import { CountrySelect } from "./CountrySelect";
import { GenderSelect } from "./GenderSelect";
import { Matching } from "./Matching";
import { VideoCall } from "./VideoCall";
import { Wallet } from "./Wallet";
import { Plans } from "./Plans";
import { Settings } from "./Settings";
import { useAppStore } from "@/store/useAppStore";
import { useAppInit } from "@/hooks/useAppInit";
import LoadingScreen from "@/components/LoadingScreen";

function RouteWrapper() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);

  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
      />
      <Route
        path="/chat"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          hasSeenOnboarding ? (
            <Navigate to={isAuthenticated ? "/" : "/login"} replace />
          ) : (
            <Onboarding />
          )
        }
      />

      {/* Home route */}
      <Route
        path="/"
        element={
          !hasSeenOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Home />
          )
        }
      />

      {/* Protected routes */}
      <Route
        path="/video-call"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <VideoCall />
        }
      />

      <Route
        path="/matching"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <Matching />
        }
      />

      <Route
        path="/wallet"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <Wallet />
        }
      />

      <Route
        path="/plans"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <Plans />
        }
      />

      <Route
        path="/settings"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <Settings />
        }
      />

      <Route
        path="/country-select"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <CountrySelect />
          )
        }
      />

      <Route
        path="/gender-select"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> : <GenderSelect />
        }
      />

      {/* Catch all routes */}
      <Route
        path="*"
        element={
          !hasSeenOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

// Main router component
export function RoutesSetup(props: any) {
  useAppInit();

  const isLoading = useAppStore((s) => s.isLoading);

  if (isLoading) {
    return <LoadingScreen message="Initializing Swipx..." />;
  }

  return (
    <div className="sm:max-w-xl mx-auto">
      <BrowserRouter>
        <RouteWrapper {...props} />
      </BrowserRouter>
    </div>
  );
}
