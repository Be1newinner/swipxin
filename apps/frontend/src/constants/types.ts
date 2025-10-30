// Screen types for navigation
export const SCREENS = {
  ONBOARDING: 'onboarding',
  AUTH: 'auth',
  HOME: 'home',
  COUNTRY_SELECT: 'country-select',
  GENDER_SELECT: 'gender-select',
  MATCHING: 'matching',
  VIDEO_CALL: 'video-call',
  WALLET: 'wallet',
  PLANS: 'plans',
  SETTINGS: 'settings',
};

// Gender options
export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

// Default user object
export const DEFAULT_USER = {
  id: '',
  name: '',
  email: '',
  age: 0,
  country: '',
  gender: GENDERS.MALE,
  avatarUrl: null,
  is_premium: false,
  tokens: 0,
  subscriptionExpiresAt: null,
  premiumExpiry: null,
  preferred_gender: null,
  isOnline: false,
  lastSeen: null,
  totalCalls: 0,
  createdAt: null,
};

// Default app state
export const DEFAULT_APP_STATE = {
  currentScreen: SCREENS.ONBOARDING,
  user: null,
  isAuthenticated: false,
  hasSeenOnboarding: false,
  selectedCountry: null,
  isInCall: false,
  callDuration: 0,
  isDarkMode: false,
};