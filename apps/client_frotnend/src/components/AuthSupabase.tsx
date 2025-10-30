import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert } from './ui/alert';
import { 
  Video, 
  Mail, 
  Lock, 
  UserIcon, 
  Calendar,
  Globe,
  Users,
  ArrowLeft,
  Eye,
  EyeOff,
  Computer
} from 'lucide-react';
import { toast } from 'sonner';

// Simple validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'South Korea', 'Brazil', 'Mexico',
  'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark'
];

export function AuthSupabase({ onLogin, navigateTo }) {
  const [mode, setMode] = useState('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    country: 'India',
    gender: 'male',
    preferredGender: 'any'
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Basic validation
    const newErrors = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (mode === 'signup') {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0];
      }
      
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      const age = parseInt(formData.age);
      if (!age || age < 18 || age > 100) {
        newErrors.age = 'Age must be between 18 and 100';
      }
    } else {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mode === 'signin') {
        // Local sign in - check if user exists in localStorage
        console.log('Attempting local sign in for:', formData.email);
        
        const savedUsers = JSON.parse(localStorage.getItem('swipx-users') || '{}');
        const user = savedUsers[formData.email];
        
        if (!user || user.password !== formData.password) {
          throw new Error('Invalid email or password');
        }
        
        console.log('Sign in successful:', user);
        toast.success('Welcome back!');
        onLogin(user);
      } else {
        // Local sign up - save user to localStorage
        console.log('Attempting local sign up for:', formData.email);
        
        const savedUsers = JSON.parse(localStorage.getItem('swipx-users') || '{}');
        
        if (savedUsers[formData.email]) {
          throw new Error('An account with this email already exists');
        }
        
        const newUser = {
          id: Date.now().toString(),
          email: formData.email,
          password: formData.password, // In a real app, this would be hashed
          name: formData.name.trim(),
          age: parseInt(formData.age),
          country: formData.country,
          gender: formData.gender,
          preferredGender: formData.preferredGender,
          isPremium: false,
          tokens: 50,
          isOnline: true,
          totalCalls: 0,
          createdAt: new Date().toISOString(),
        };
        
        // Save user to localStorage
        savedUsers[formData.email] = newUser;
        localStorage.setItem('swipx-users', JSON.stringify(savedUsers));
        
        console.log('Sign up successful:', newUser);
        toast.success('Account created successfully! Welcome to Swipx!');
        onLogin(newUser);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ general: error.message });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast.error('Google Sign In is not available in local mode');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateTo('onboarding')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Computer className="w-3 h-3" />
          Local Mode
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold">
              {mode === 'signin' ? 'Welcome Back' : 'Join Swipx'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' 
                ? 'Sign in to continue your video chat journey'
                : 'Create your account and start meeting new people'
              }
            </p>
          </div>

          {/* Auth Form */}
          <Card className="glass p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <Alert className="border-destructive/50 text-destructive bg-destructive/10">
                  {errors.general}
                </Alert>
              )}

              {/* Local Mode Notice */}
              {mode === 'signin' && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Running in Local Mode</p>
                      <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                        Your data is stored locally in your browser. Create an account to get started or sign in with existing credentials.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Sign Up Only Fields */}
              {mode === 'signup' && (
                <>
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="age"
                        type="number"
                        placeholder="Your age (18+)"
                        min="18"
                        max="100"
                        value={formData.age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.age && (
                      <p className="text-sm text-destructive">{errors.age}</p>
                    )}
                  </div>

                  {/* Country & Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <select
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full h-10 pl-10 pr-3 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          disabled={isLoading}
                        >
                          {countries.map(country => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full h-10 pl-10 pr-3 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preference Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="preferred-gender">Who would you like to meet?</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <select
                        id="preferred-gender"
                        value={formData.preferredGender}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredGender: e.target.value }))}
                        className="w-full h-10 pl-10 pr-3 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <option value="any">Anyone (Free)</option>
                        <option value="male">Males Only (Premium)</option>
                        <option value="female">Females Only (Premium)</option>
                        <option value="other">Other Gender (Premium)</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Specific gender preferences require a premium subscription
                    </p>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting to Google...
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Mode Switch */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <Button
                variant="link"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="p-0 h-auto text-primary hover:text-primary/80"
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}