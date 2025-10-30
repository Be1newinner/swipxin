import { API_CONFIG, isApiConfigured } from './api-config.js';

// Google Authentication
export const initializeGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Auth can only be initialized in browser'));
      return;
    }

    // Check if Google auth is disabled or not configured
    if (!API_CONFIG.GOOGLE_CLIENT_ID || !isApiConfigured.google) {
      reject(new Error('Google authentication is not configured for this environment'));
      return;
    }

    // Check if Google API is already loaded
    if (window.gapi) {
      resolve(window.gapi);
      return;
    }

    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: API_CONFIG.GOOGLE_CLIENT_ID
        }).then(() => {
          resolve(window.gapi);
        }).catch(reject);
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const signInWithGoogle = async () => {
  // Check if Google auth is configured
  if (!isApiConfigured.google) {
    throw new Error('Google authentication is not configured. Please set up your Google Client ID in the API configuration.');
  }

  try {
    await initializeGoogleAuth();
    const authInstance = window.gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn();
    const profile = googleUser.getBasicProfile();
    
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      avatar: profile.getImageUrl(),
      provider: 'google'
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw new Error('Failed to sign in with Google. Please check your configuration and try again.');
  }
};

// Facebook Authentication
export const initializeFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Facebook SDK can only be initialized in browser'));
      return;
    }

    // Check if Facebook auth is disabled or not configured
    if (!API_CONFIG.FACEBOOK_APP_ID || !isApiConfigured.facebook) {
      reject(new Error('Facebook authentication is not configured for this environment'));
      return;
    }

    // Check if Facebook SDK is already loaded
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: API_CONFIG.FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(window.FB);
    };

    // Load the SDK asynchronously
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onload = () => {
      if (!window.FB) {
        reject(new Error('Facebook SDK failed to load'));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const signInWithFacebook = async () => {
  // Check if Facebook auth is configured
  if (!isApiConfigured.facebook) {
    throw new Error('Facebook authentication is not configured. Please set up your Facebook App ID in the API configuration.');
  }

  try {
    await initializeFacebookSDK();
    
    return new Promise((resolve, reject) => {
      window.FB.login((response) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
            resolve({
              id: userInfo.id,
              name: userInfo.name,
              email: userInfo.email,
              avatar: userInfo.picture?.data?.url,
              provider: 'facebook'
            });
          });
        } else {
          reject(new Error('Facebook login was cancelled'));
        }
      }, { scope: 'email' });
    });
  } catch (error) {
    console.error('Facebook sign-in error:', error);
    throw new Error('Failed to sign in with Facebook. Please check your configuration and try again.');
  }
};

// Sign out functions
export const signOutFromGoogle = async () => {
  try {
    const authInstance = window.gapi?.auth2?.getAuthInstance();
    if (authInstance) {
      await authInstance.signOut();
    }
  } catch (error) {
    console.error('Google sign-out error:', error);
  }
};

export const signOutFromFacebook = () => {
  return new Promise((resolve) => {
    if (window.FB) {
      window.FB.logout(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
};

// Mock social login functions for development
export const createDemoSocialUser = (provider) => {
  const demoUsers = {
    google: {
      id: 'google_user_' + Math.random().toString(36).substr(2, 9),
      name: 'Alex Kumar',
      email: 'alex.kumar@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      provider: 'google'
    },
    facebook: {
      id: 'facebook_user_' + Math.random().toString(36).substr(2, 9), 
      name: 'Sarah Johnson',
      email: 'sarah.johnson@facebook.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      provider: 'facebook'
    }
  };
  
  return demoUsers[provider];
};

export const mockSocialLogin = async (provider) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return demo user data
  return createDemoSocialUser(provider);
};

// Check if we should use mock login (development environment or unconfigured APIs)
export const shouldUseMockLogin = (provider) => {
  if (API_CONFIG.IS_DEVELOPMENT) {
    return true;
  }
  
  if (provider === 'google' && !isApiConfigured.google) {
    return true;
  }
  
  if (provider === 'facebook' && !isApiConfigured.facebook) {
    return true;
  }
  
  return false;
};