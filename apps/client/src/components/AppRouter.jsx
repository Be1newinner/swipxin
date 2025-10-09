import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Components
import { Onboarding } from "./Onboarding";
import Auth from "./Auth";
import { AuthSupabase } from "./AuthSupabase";
import { Home } from "./Home";
import { CountrySelect } from "./CountrySelect";
import { GenderSelect } from "./GenderSelect";
import { Matching } from "./Matching";
import { VideoCall } from "./VideoCall";
import { Wallet } from "./Wallet";
import { Plans } from "./Plans";
import { Settings } from "./Settings";

// Route wrapper component to sync URL with app state
function RouteWrapper({
  user,
  isAuthenticated,
  hasSeenOnboarding,
  isSupabaseEnabled,
  updateUser,
  login,
  register,
  logout,
  toggleDarkMode,
  completeOnboarding,
  isDarkMode,
  state,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation function that updates URL
  const navigateTo = (screen) => {
    const routeMap = {
      onboarding: "/onboarding",
      auth: "/auth",
      "auth-supabase": "/auth",
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
  //     '/': 'home',
  //     '/auth': 'auth',
  //     '/chat': 'auth',
  //     '/video-call': 'video-call',
  //     '/matching': 'matching',
  //     '/wallet': 'wallet',
  //     '/plans': 'plans',
  //     '/settings': 'settings',
  //     '/country-select': 'country-select',
  //     '/gender-select': 'gender-select',
  //     '/onboarding': 'onboarding'
  //   };
  // }, [location.pathname]);

  return (
    <Routes>
      {/* Auth routes */}
      {/* <Route
        path="/auth"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Auth login={login} register={register} state={state} />
          )
        }
      />
      <Route
        path="/chat"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Auth login={login} register={register} state={state} />
          )
        }
      /> */}

      {/* Onboarding */}
      {/* <Route
        path="/onboarding"
        element={
          hasSeenOnboarding ? (
            <Navigate to={isAuthenticated ? "/" : "/auth"} replace />
          ) : (
            <Onboarding onComplete={completeOnboarding} />
          )
        }
      /> */}

      {/* Home route */}
      {/* <Route
        path="/"
        element={
          !hasSeenOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <Home
              user={user}
              navigateTo={navigateTo}
              updateUser={updateUser}
              isSupabaseEnabled={isSupabaseEnabled}
            />
          )
        }
      /> */}

      {/* Protected routes */}
      {/* <Route
        path="/video-call"
        element={
          !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <VideoCall
              user={user}
              updateUser={updateUser}
              navigateTo={navigateTo}
              isSupabaseEnabled={isSupabaseEnabled}
            />
          )
        }
      />

      <Route
        path="/matching"
        element={
          !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <Matching
              user={user}
              selectedCountry={user?.country}
              selectedGender={user?.preferredGender}
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
            <Navigate to="/auth" replace />
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
            <Navigate to="/auth" replace />
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
            <Navigate to="/auth" replace />
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
      /> */}

      {/* <Route
        path="/country-select"
        element={
          !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <CountrySelect
              selectedCountry={user?.country}
              onSelect={(country) => updateUser({ country })}
              navigateTo={navigateTo}
            />
          )
        }
      /> */}
      {/* 
      <Route
        path="/gender-select"
        element={
          !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <GenderSelect
              selectedGender={user?.preferredGender}
              onSelect={(gender) => updateUser({ preferredGender: gender })}
              navigateTo={navigateTo}
              user={user}
              updateUser={updateUser}
            />
          )
        }
      /> */}

      {/* Catch all routes */}
      {/* <Route
        path="*"
        element={
          !hasSeenOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      /> */}
    </Routes>
  );
}

// Main router component
export function AppRouter(props) {
  return (
    <BrowserRouter>
      <RouteWrapper {...props} />
    </BrowserRouter>
  );
}
