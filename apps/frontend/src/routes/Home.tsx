import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Video, Crown, Globe, Users, Coins, Zap, Heart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAppNavigation } from "@/components/utils/navigateHook";
import { AppHeader } from "@/components/Header";
import { Link } from "react-router-dom";

const elevation =
  "transition-all duration-300 shadow-[0_0_10px_-4px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_-4px_rgba(99,102,241,0.45)]";
const cardBase = `rounded-xl bg-white border-none`;

export function Home() {
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  const { navigate } = useAppNavigation();
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      navigate("auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleStartChat = () => {
    if (isStartingMatch) return;
    setIsStartingMatch(true);

    try {
      const hasSpecificFilters = user.is_premium && user.preferred_gender;
      const hasEnoughTokens = user.tokens >= 8;

      if (hasSpecificFilters && !hasEnoughTokens) {
        console.log(
          "Premium user has insufficient tokens, will use free matching"
        );
      }

      navigate("matching");
    } finally {
      setTimeout(() => setIsStartingMatch(false), 2000);
    }
  };

  const genderLabel =
    user.preferred_gender === "male"
      ? "Male"
      : user.preferred_gender === "female"
      ? "Female"
      : user.preferred_gender === "other"
      ? "Other"
      : "Any gender";

  return (
    <div className="min-h-screen">
      <AppHeader user={user} navigate={navigate} />

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-20 space-y-6">
        {/* Free User Welcome Banner */}
        {!user.is_premium && (
          <Card className={`${cardBase}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center">
                <Heart className="size-5" />
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
        {!user.is_premium && (
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
                onClick={() => navigate("plans")}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-medium shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
              >
                Upgrade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className={`${cardBase}`}>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge className="gap-1.5 rounded-full border border-primary/40 text-primary-foreground/90">
              <Globe className="size-3.5" />
              Country filter available
            </Badge>
            <Badge className="gap-1.5 rounded-full bg-accent/10 border border-accent/40 text-accent-foreground/90">
              <Users className="size-3.5" />
              {user.is_premium
                ? user.preferred_gender
                  ? user.tokens >= 8
                    ? `Selected: ${genderLabel}`
                    : "Free Mode: All genders"
                  : "Selected: Any gender"
                : "All genders"}
            </Badge>
            {user.is_premium ? (
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
            className="w-full h-14 text-base sm:text-lg rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-all duration-300  cursor-pointer"
          >
            <Video className="size-5 sm:size-6 mr-3" />
            {isStartingMatch
              ? "Starting..."
              : user.is_premium
              ? user.tokens >= 8
                ? "Start Premium Video Chat"
                : "Start Video Chat (Free Mode)"
              : "Start Free Video Chat"}
          </Button>

          {user.is_premium && user.preferred_gender && user.tokens < 8 && (
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
                      onClick={() => navigate("wallet")}
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
            <CardContent className="space-y-3">
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
                onClick={() => navigate("country-select")}
                className="w-full rounded-lg border-primary/30 hover:bg-primary/10 cursor-pointer"
              >
                {user?.country}
              </Button>
            </CardContent>
          </Card>

          <Card className={`${cardBase}`}>
            <CardContent className="space-y-3">
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="size-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium">Gender Filter</h4>
                <p className="text-sm text-muted-foreground">
                  {user.is_premium ? "Available" : "Premium feature"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  user.is_premium
                    ? navigate("gender-select")
                    : navigate("plans")
                }
                disabled={!user.is_premium}
                className="w-full rounded-lg border-accent/30 hover:bg-accent/10 disabled:opacity-50"
              >
                {user.is_premium ? "Select" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 gap-3">
          {user.is_premium && (
            <Button
              variant="outline"
              onClick={() => navigate("wallet")}
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

          <Link
            to="/plans"
            className={`${elevation} flex p-4 items-center justify-between h-12 rounded-xl border-primary/40 bg-white`}
          >
            <div className="flex items-center gap-3">
              <Crown className="size-5 text-primary" />
              <span>
                {user.is_premium ? "Manage Subscription" : "View Premium Plans"}
              </span>
            </div>
            <span className="text-muted-foreground">
              {user.is_premium ? "Premium" : "Free"}
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
