/* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  // useLocation,
} from "react-router-dom";

// Components
import { Onboarding } from "./Onboarding";
import RegisterPage from "../routes/auth/Register";
import Login from "../routes/auth/Login";
// import { AuthSupabase } from "./loginSupabase";
import { Home } from "./Home";
import { CountrySelect } from "./CountrySelect";
import { GenderSelect } from "./GenderSelect";
import { Matching } from "./Matching";
import { VideoCall } from "./VideoCall";
import { Wallet } from "./Wallet";
import { Plans } from "./Plans";
import { Settings } from "./Settings";
import type { User } from "@/store/useAppStore";

// Route wrapper component to sync URL with app state
function RouteWrapper({
  user,
  isAuthenticated,
  hasSeenOnboarding,
  isSupabaseEnabled,
  updateUser,
  logout,
  toggleDarkMode,
  completeOnboarding,
  isDarkMode,
}: {
  user: User;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  isSupabaseEnabled: boolean;
  updateUser: any;
  logout: any;
  toggleDarkMode: any;
  completeOnboarding: any;
  isDarkMode: boolean;
}) {
  const navigate = useNavigate();
  // const location = useLocation();

  // Navigation function that updates URL
  const navigateTo = (screen) => {
    const routeMap = {
      onboarding: "/onboarding",
      auth: "/login",
      "auth-supabase": "/login",
      home: "/",
      "video-call": "/video-call",
      matching: "/matching",
      wallet: "/wallet",
      plans: "/plans",
      settings: "/settings",
      "country-select": "/country-select",
      "gender-select": "/gender-select",
    };

    const route = routeMap[screen] || "/";
    navigate(route);
  };

  // Effect to sync URL changes with component state
  // useEffect(() => {
  //   // This ensures navigation state is properly handled
  //   const currentPath = location.pathname;
  //   const screenMap = {
  //     "/": "home",
  //     "/login": "auth",
  //     "/chat": "auth",
  //     "/video-call": "video-call",
  //     "/matching": "matching",
  //     "/wallet": "wallet",
  //     "/plans": "plans",
  //     "/settings": "settings",
  //     "/country-select": "country-select",
  //     "/gender-select": "gender-select",
  //     "/onboarding": "onboarding",
  //   };
  // }, [location.pathname]);

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
            <Onboarding onComplete={completeOnboarding} />
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
            <Home
              user={user}
              navigateTo={navigateTo}
              updateUser={updateUser}
              isSupabaseEnabled={isSupabaseEnabled}
            />
          )
        }
      />

      {/* Protected routes */}
      <Route
        path="/video-call"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <VideoCall
              user={user}
              navigateTo={navigateTo}
              onDurationUpdate={null}
            />
          )
        }
      />

      <Route
        path="/matching"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Matching
              user={user}
              selectedCountry={user?.country}
              selectedGender={user?.preferred_gender}
              navigateTo={navigateTo}
              isSupabaseEnabled={isSupabaseEnabled}
            />
          )
        }
      />

      <Route
        path="/wallet"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Wallet
              user={user}
              updateUser={updateUser}
              navigateTo={navigateTo}
            />
          )
        }
      />

      <Route
        path="/plans"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Plans
              user={user}
              updateUser={updateUser}
              navigateTo={navigateTo}
            />
          )
        }
      />

      <Route
        path="/settings"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Settings
              user={user}
              updateUser={updateUser}
              navigateTo={navigateTo}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              onLogout={logout}
            />
          )
        }
      />

      <Route
        path="/country-select"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <CountrySelect
              selectedCountry={user?.country}
              onSelect={(country: string) => updateUser({ country })}
              navigateTo={navigateTo}
            />
          )
        }
      />

      <Route
        path="/gender-select"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <GenderSelect
              selectedGender={user?.preferred_gender}
              onSelect={(gender: string) =>
                updateUser({ preferredGender: gender })
              }
              navigateTo={navigateTo}
              user={user}
              updateUser={updateUser}
            />
          )
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
export function AppRouter(props: any) {
  return (
    <BrowserRouter>
      <RouteWrapper {...props} />
    </BrowserRouter>
  );
}
