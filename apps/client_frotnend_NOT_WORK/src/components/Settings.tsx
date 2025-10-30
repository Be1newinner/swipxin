import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

export function Settings({
  user,
  updateUser,
  navigateTo,
  isDarkMode,
  toggleDarkMode,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    promotions: false,
    updates: true,
  });

  if (!user) {
    navigateTo("auth");
    return null;
  }

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      toast.success("Name updated successfully");
      setIsEditing(false);
    }
  };

  const handleCountryChange = (country) => {
    updateUser({ country });
    toast.success("Country updated");
  };

  const handleGenderChange = (gender) => {
    updateUser({ gender });
    toast.success("Gender updated");
  };

  const handleNotificationChange = (type, value) => {
    setNotifications((prev) => ({ ...prev, [type]: value }));
    toast.success("Notification preferences updated");
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-accent/5 text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/70 backdrop-blur-md sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo("home")}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your preferences
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-6 max-w-xl mx-auto">
        {/* Profile Section */}
        <Card className="p-6 space-y-4 rounded-2xl border-border/50 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Profile</h3>
            {user.isPremium && (
              <Badge className="bg-gradient-to-r from-primary to-pink-500 text-white shadow-sm">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-inner">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1"
                />
                <Button onClick={handleSaveName} size="sm">
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setTempName(user.name);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>{user.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <Select value={user.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">🇮🇳 India</SelectItem>
                <SelectItem value="United States">🇺🇸 United States</SelectItem>
                <SelectItem value="United Kingdom">
                  🇬🇧 United Kingdom
                </SelectItem>
                <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select
              value={user.gender || "not-specified"}
              onValueChange={(value) =>
                value !== "not-specified" && handleGenderChange(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
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
        <Card className="p-6 space-y-4 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all">
          <h3 className="font-semibold">Preferences</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark
                </p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-4 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all">
          <h3 className="font-semibold">Notifications</h3>
          {[
            { key: "matches", icon: Star, label: "New Matches" },
            { key: "messages", icon: Bell, label: "Messages" },
            { key: "promotions", icon: Crown, label: "Promotions" },
            { key: "updates", icon: Globe, label: "App Updates" },
          ].map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium">{label}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(val) => handleNotificationChange(key, val)}
              />
            </div>
          ))}
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigateTo("plans")}
            className="w-full justify-between h-12 rounded-xl bg-background/70 hover:bg-accent/10"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5" />
              <span>Subscription Plans</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {user.isPremium ? "Premium" : "Free"}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigateTo("wallet")}
            className="w-full justify-between h-12 rounded-xl bg-background/70 hover:bg-accent/10"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <span>Token Wallet</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {user.tokens} tokens
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.info("Help center coming soon!")}
            className="w-full justify-start h-12 rounded-xl bg-background/70 hover:bg-accent/10"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Help & Support
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.info("Privacy settings coming soon!")}
            className="w-full justify-start h-12 rounded-xl bg-background/70 hover:bg-accent/10"
          >
            <Shield className="w-5 h-5 mr-3" />
            Privacy & Safety
          </Button>
        </div>

        {/* Logout */}
        <Card className="p-4 bg-destructive/10 border-destructive/30 rounded-2xl">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full h-11"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          <p>Swipx v1.0.0</p>
          <div className="flex justify-center gap-4 mt-1">
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
