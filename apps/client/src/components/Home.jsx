import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Video, Crown, Globe, Users, Coins, Settings, Zap, Heart } from 'lucide-react';

export function Home({ user, navigateTo, updateUser, isSupabaseEnabled = false }) {
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  
  // Handle authentication check in useEffect to avoid setState during render
  useEffect(() => {
    if (!user) {
      navigateTo(isSupabaseEnabled ? 'auth-supabase' : 'auth');
    }
  }, [user, navigateTo, isSupabaseEnabled]);

  // Return null if user is not authenticated to prevent rendering
  if (!user) {
    return null;
  }

  const handleStartChat = () => {
    // Prevent multiple rapid clicks
    if (isStartingMatch) {
      console.log('Already starting match, ignoring click');
      return;
    }
    
    setIsStartingMatch(true);
    
    try {
      // Premium users only pay tokens when using specific filters AND have sufficient tokens
      const hasSpecificFilters = user.isPremium && user.preferredGender;
      const hasEnoughTokens = user.tokens >= 8;
      
      console.log('Starting chat:', {
        isPremium: user.isPremium,
        preferredGender: user.preferredGender,
        hasSpecificFilters,
        hasEnoughTokens,
        tokens: user.tokens,
        willUseFreeMode: hasSpecificFilters && !hasEnoughTokens
      });
      
      // If premium user wants to use filters but doesn't have tokens, show wallet
      // But also give option to continue with free matching
      if (hasSpecificFilters && !hasEnoughTokens) {
        // For now, just proceed with free matching - user can choose
        console.log('Premium user has insufficient tokens, will use free matching');
      }
      
      navigateTo('matching');
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        setIsStartingMatch(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Swipx</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Token Wallet Pill - Only show for premium users */}
          {user.isPremium && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('wallet')}
              className="glass h-8 px-3 gap-2"
            >
              <Coins className="w-4 h-4 text-accent" />
              <span className="font-medium">{user.tokens}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('settings')}
            className="w-8 h-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-4 space-y-6">
        {/* Free User Welcome Banner */}
        {!user.isPremium && (
          <Card className="glass bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 p-4 border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-900 dark:text-green-100">Free Video Chats Available!</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Enjoy unlimited video chats with global matching
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Premium Upsell Banner */}
        {!user.isPremium && (
          <Card className="glass bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Upgrade to Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Add gender filters & token-based matching
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigateTo('plans')}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Upgrade
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className="glass p-4">
          <h3 className="font-medium mb-3">Your Experience</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Globe className="w-3 h-3" />
              Country filtering available
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {user.isPremium 
                ? user.preferredGender 
                  ? user.tokens >= 8
                    ? `Selected: ${user.preferredGender === 'male' ? 'Male' : user.preferredGender === 'female' ? 'Female' : user.preferredGender === 'other' ? 'Other' : 'Any gender'}`
                    : 'Free Mode: All genders' // Show when insufficient tokens
                  : 'Selected: Any gender'
                : 'All genders'
              }
            </Badge>
            {user.isPremium ? (
              <Badge className={`gap-1 ${user.tokens >= 8 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-amber-500'}`}>
                <Crown className="w-3 h-3" />
                {user.tokens >= 8 ? 'Premium' : 'Premium (Free Mode)'}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" />
                Free
              </Badge>
            )}
          </div>
        </Card>

        {/* Main CTA */}
        <div className="space-y-4">
          <Button
            onClick={handleStartChat}
            size="lg"
            disabled={isStartingMatch}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50"
          >
            <Video className="w-6 h-6 mr-3" />
            {isStartingMatch 
              ? 'Starting...' 
              : user.isPremium 
                ? user.tokens >= 8 
                  ? 'Start Premium Video Chat'
                  : 'Start Video Chat (Free Mode)'
                : 'Start Free Video Chat'
            }
          </Button>

          {user.isPremium && user.preferredGender && user.tokens < 8 && (
            <Card className="glass bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50 p-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Zap className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Insufficient tokens for premium filtering
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Will use free matching instead, or add tokens for premium filters
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateTo('wallet')}
                  className="text-xs bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700"
                >
                  Add Tokens
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass p-4 space-y-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Country Filter</h4>
              <p className="text-sm text-muted-foreground">
                Available for all users
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('country-select')}
              className="w-full"
            >
              Select Country
            </Button>
          </Card>

          <Card className="glass p-4 space-y-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium">Gender Filter</h4>
              <p className="text-sm text-muted-foreground">
                {user.isPremium ? 'Available' : 'Premium feature'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => user.isPremium ? navigateTo('gender-select') : navigateTo('plans')}
              disabled={!user.isPremium}
              className="w-full"
            >
              {user.isPremium ? 'Select' : 'Upgrade'}
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          {user.isPremium && (
            <Button
              variant="outline"
              onClick={() => navigateTo('wallet')}
              className="glass justify-between h-12"
            >
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-accent" />
                <span>Manage Wallet</span>
              </div>
              <span className="text-muted-foreground">{user.tokens} tokens</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => navigateTo('plans')}
            className="glass justify-between h-12"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <span>{user.isPremium ? 'Manage Subscription' : 'View Premium Plans'}</span>
            </div>
            <span className="text-muted-foreground">
              {user.isPremium ? 'Premium' : 'Free'}
            </span>
          </Button>
        </div>

      </div>
    </div>
  );
}