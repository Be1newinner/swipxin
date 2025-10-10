import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Crown, 
  Globe, 
  Bell, 
  Moon, 
  Sun, 
  LogOut,
  Shield,
  HelpCircle,
  Star,
  Edit,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';

export function Settings({ 
  user, 
  updateUser, 
  navigateTo, 
  isDarkMode, 
  toggleDarkMode, 
  onLogout 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    promotions: false,
    updates: true
  });

  if (!user) {
    navigateTo('auth');
    return null;
  }

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      toast.success('Name updated successfully');
      setIsEditing(false);
    }
  };

  const handleCountryChange = (country) => {
    updateUser({ country });
    toast.success('Country updated');
  };

  const handleGenderChange = (gender) => {
    updateUser({ gender });
    toast.success('Gender updated');
  };

  const handleNotificationChange = (type, value) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
    toast.success('Notification preferences updated');
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    onLogout();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateTo('home')}
          className="w-8 h-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Profile Information</h3>
            {user.isPremium && (
              <Badge className="bg-gradient-to-r from-primary to-accent">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          {/* Name Editing */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Display Name</label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                />
                <Button onClick={handleSaveName} size="sm">
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setTempName(user.name);
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>{user.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Select value={user.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">🇮🇳 India</SelectItem>
                <SelectItem value="United States">🇺🇸 United States</SelectItem>
                <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select 
              value={user.gender || 'not-specified'} 
              onValueChange={(value) => {
                if (value === 'not-specified') return;
                handleGenderChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="not-specified">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="glass p-6 space-y-4">
          <h3 className="font-semibold">Preferences</h3>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="glass p-6 space-y-4">
          <h3 className="font-semibold">Notifications</h3>

          {[
            { key: 'matches', icon: Star, label: 'New Matches', desc: 'Get notified when you get a new match' },
            { key: 'messages', icon: Bell, label: 'Messages', desc: 'Notifications for new messages' },
            { key: 'promotions', icon: Crown, label: 'Promotions', desc: 'Special offers and premium deals' },
            { key: 'updates', icon: Globe, label: 'App Updates', desc: 'Feature updates and announcements' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch 
                checked={notifications[item.key]} 
                onCheckedChange={(value) => handleNotificationChange(item.key, value)} 
              />
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigateTo('plans')}
            className="w-full justify-between h-12 glass"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5" />
              <span>Subscription Plans</span>
            </div>
            <span className="text-muted-foreground">
              {user.isPremium ? 'Premium' : 'Free'}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigateTo('wallet')}
            className="w-full justify-between h-12 glass"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <span>Token Wallet</span>
            </div>
            <span className="text-muted-foreground">{user.tokens} tokens</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.info('Help center coming soon!')}
            className="w-full justify-start h-12 glass"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Help & Support
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.info('Privacy settings coming soon!')}
            className="w-full justify-start h-12 glass"
          >
            <Shield className="w-5 h-5 mr-3" />
            Privacy & Safety
          </Button>
        </div>

        {/* Logout */}
        <Card className="glass p-4">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Swipx v1.0.0</p>
          <div className="flex justify-center gap-4">
            <Button variant="link" className="p-0 h-auto text-xs">
              Terms of Service
            </Button>
            <Button variant="link" className="p-0 h-auto text-xs">
              Privacy Policy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}