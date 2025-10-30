import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Video,
  Crown,
  Globe,
  Users,
  Coins,
  Settings,
  Zap,
  Heart,
} from "lucide-react";

const elevation =
  "transition-all duration-300 shadow-[0_0_10px_-4px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_-4px_rgba(99,102,241,0.45)]";
const cardBase = `${elevation} rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 hover:border-primary/40`;

export function Home({
  user,
  navigateTo,
  isSupabaseEnabled = false,
}: {
  user: {
    name: string;
    isPremium: boolean;
    tokens: number;
    preferredGender?: "male" | "female" | "other";
  } | null;
  navigateTo: (route: string) => void;
  isSupabaseEnabled?: boolean;
}) {
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  useEffect(() => {
    if (!user) {
      navigateTo(isSupabaseEnabled ? "auth-supabase" : "auth");
    }
  }, [user, navigateTo, isSupabaseEnabled]);

  if (!user) {
    return null;
  }

  const handleStartChat = () => {
    if (isStartingMatch) return;
    setIsStartingMatch(true);

    try {
      const hasSpecificFilters = user.isPremium && user.preferredGender;
      const hasEnoughTokens = user.tokens >= 8;

      if (hasSpecificFilters && !hasEnoughTokens) {
        console.log(
          "Premium user has insufficient tokens, will use free matching"
        );
      }

      navigateTo("matching");
    } finally {
      setTimeout(() => setIsStartingMatch(false), 2000);
    }
  };

  const genderLabel =
    user.preferredGender === "male"
      ? "Male"
      : user.preferredGender === "female"
        ? "Female"
        : user.preferredGender === "other"
          ? "Other"
          : "Any gender";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0c] via-[#111115] to-[#1a1a1f] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md shadow-[0_0_20px_-8px_rgba(99,102,241,0.35)]">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.6)]">
              <Video className="size-5 text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-semibold tracking-tight">Swipx</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {user.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.isPremium && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo("wallet")}
                className="h-8 px-3 gap-1.5 rounded-full border-primary/40 bg-primary/10 text-primary-foreground hover:bg-primary/20 transition-all"
              >
                <Coins className="size-4 text-accent" />
                <span className="font-medium tabular-nums">{user.tokens}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo("settings")}
              className="size-9 hover:bg-primary/10"
            >
              <Settings className="size-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-6 space-y-6">
        {/* Free User Welcome Banner */}
        {!user.isPremium && (
          <Card className={`${cardBase}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                <Heart className="size-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">
                  Free Video Chats Available!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enjoy unlimited global video matches instantly
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Upsell Banner */}
        {!user.isPremium && (
          <Card className={`${cardBase}`}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                  <Crown className="size-5 text-amber-50" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Upgrade to Premium
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Unlock gender filters & token-based matching
                  </CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigateTo("plans")}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-medium shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
              >
                Upgrade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className={`${cardBase}`}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-medium">
              Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 flex flex-wrap gap-2">
            <Badge className="gap-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary-foreground/90">
              <Globe className="size-3.5" />
              Country filter available
            </Badge>
            <Badge className="gap-1.5 rounded-full bg-accent/10 border border-accent/40 text-accent-foreground/90">
              <Users className="size-3.5" />
              {user.isPremium
                ? user.preferredGender
                  ? user.tokens >= 8
                    ? `Selected: ${genderLabel}`
                    : "Free Mode: All genders"
                  : "Selected: Any gender"
                : "All genders"}
            </Badge>
            {user.isPremium ? (
              <Badge
                className={`gap-1.5 rounded-full ${
                  user.tokens >= 8
                    ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    : "bg-amber-500/80 text-white"
                }`}
              >
                <Crown className="size-3.5" />
                {user.tokens >= 8 ? "Premium" : "Premium (Free Mode)"}
              </Badge>
            ) : (
              <Badge className="gap-1.5 rounded-full bg-rose-500/10 border border-rose-400/40 text-rose-300">
                <Heart className="size-3.5" />
                Free
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Main CTA */}
        <section className="space-y-4">
          <Button
            onClick={handleStartChat}
            size="lg"
            disabled={isStartingMatch}
            className="w-full h-14 text-base sm:text-lg rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-all duration-300"
          >
            <Video className="size-5 sm:size-6 mr-3" />
            {isStartingMatch
              ? "Starting..."
              : user.isPremium
                ? user.tokens >= 8
                  ? "Start Premium Video Chat"
                  : "Start Video Chat (Free Mode)"
                : "Start Free Video Chat"}
          </Button>

          {user.isPremium && user.preferredGender && user.tokens < 8 && (
            <Card
              className={`${cardBase} ring-1 ring-amber-400/50 bg-amber-950/20`}
            >
              <CardContent className="p-3 flex items-start gap-3 text-amber-200">
                <Zap className="size-4 mt-0.5 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Insufficient tokens for premium filtering
                  </p>
                  <p className="text-xs text-amber-300/90 mt-1">
                    Using free matching instead. Add tokens to enable filters.
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigateTo("wallet")}
                      className="text-xs rounded-full bg-amber-900/40 border-amber-700/60 hover:bg-amber-800/60"
                    >
                      Add Tokens
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Action Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={`${cardBase}`}>
            <CardContent className="p-4 space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="size-5 text-primary" />
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
                onClick={() => navigateTo("country-select")}
                className="w-full rounded-lg border-primary/30 hover:bg-primary/10"
              >
                Select Country
              </Button>
            </CardContent>
          </Card>

          <Card className={`${cardBase}`}>
            <CardContent className="p-4 space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="size-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium">Gender Filter</h4>
                <p className="text-sm text-muted-foreground">
                  {user.isPremium ? "Available" : "Premium feature"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  user.isPremium
                    ? navigateTo("gender-select")
                    : navigateTo("plans")
                }
                disabled={!user.isPremium}
                className="w-full rounded-lg border-accent/30 hover:bg-accent/10 disabled:opacity-50"
              >
                {user.isPremium ? "Select" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 gap-3">
          {user.isPremium && (
            <Button
              variant="outline"
              onClick={() => navigateTo("wallet")}
              className={`${elevation} justify-between h-12 rounded-xl border-primary/40 hover:bg-primary/10`}
            >
              <div className="flex items-center gap-3">
                <Coins className="size-5 text-accent" />
                <span>Manage Wallet</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {user.tokens} tokens
              </span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => navigateTo("plans")}
            className={`${elevation} justify-between h-12 rounded-xl border-primary/40 hover:bg-primary/10`}
          >
            <div className="flex items-center gap-3">
              <Crown className="size-5 text-primary" />
              <span>
                {user.isPremium ? "Manage Subscription" : "View Premium Plans"}
              </span>
            </div>
            <span className="text-muted-foreground">
              {user.isPremium ? "Premium" : "Free"}
            </span>
          </Button>
        </section>
      </main>
    </div>
  );
}
