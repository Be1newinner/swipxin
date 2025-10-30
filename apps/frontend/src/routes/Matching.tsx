import { useState, useEffect } from "react";
import { Loader2, X, Globe, Users, Crown } from "lucide-react";
// import { toast } from "sonner";
import { useAppNavigation } from "@/components/utils/navigateHook";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const matchingTips = [
  "Be respectful and friendly to make great connections!",
  "Make sure you have good lighting for the best video quality.",
  "A stable internet connection ensures smooth video calls.",
  "Smile! It makes you more approachable and friendly.",
  "Keep conversations light and fun to start with.",
  "Remember that everyone is here to meet new people just like you!",
];

export function Matching() {
  const user = useAppStore((s) => s.user);
  const selectedCountry = user?.country,
    selectedGender = user?.preferred_gender;
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [isSearching, setIsSearching] = useState(true);
  const [matchingStarted, setMatchingStarted] = useState(false); // Prevent multiple matching attempts
  const [onlineStats] = useState({
    total: 0,
    byCountry: {},
    byGender: {},
  });

  const { navigate } = useAppNavigation();

  useEffect(() => {
    if (!user) {
      navigate("auth");
      return;
    }

    // Prevent multiple matching attempts
    if (matchingStarted) {
      return;
    }
    setMatchingStarted(true);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(async () => {
            setIsSearching(false);

            // if (true) {
            //   // Find real match using Supabase
            //   try {
            //     console.log("Starting match with preferences:", {
            //       country: selectedCountry,
            //       gender: selectedGender,
            //       useris_premium: user.is_premium,
            //       userpreferred_gender: user.preferred_gender,
            //       userTokens: user.tokens,
            //       willUseCountryFilter: !!(user.is_premium && selectedCountry),
            //       willUseGenderFilter: !!(user.is_premium && selectedGender),
            //     });

            //     // FIXED: Only pass preferences that user has actively selected for premium filtering
            //     // Don't pass null/undefined values that would trigger token deduction
            //     const matchPreferences = {};

            //     // Check if user has enough tokens for premium filtering
            //     const hasEnoughTokens = user.tokens >= 8;

            //     // Only add country filter if user is premium, has selected a country, AND has enough tokens
            //     if (
            //       user.is_premium &&
            //       selectedCountry &&
            //       selectedCountry.trim() !== "" &&
            //       hasEnoughTokens
            //     ) {
            //       matchPreferences.country = selectedCountry;
            //     }

            //     // Only add gender filter if user is premium, has selected a gender, AND has enough tokens
            //     if (
            //       user.is_premium &&
            //       selectedGender &&
            //       selectedGender.trim() !== "" &&
            //       hasEnoughTokens
            //     ) {
            //       matchPreferences.gender = selectedGender;
            //     }

            //     // Show notification if premium user falls back to free mode
            //     if (
            //       user.is_premium &&
            //       (selectedCountry || selectedGender) &&
            //       !hasEnoughTokens
            //     ) {
            //       console.log(
            //         "Premium user falling back to free matching due to insufficient tokens"
            //       );
            //       toast.info(
            //         "Using free matching - add tokens for premium filters"
            //       );
            //     }

            //     console.log("Final preferences being sent:", matchPreferences);

            //     const matchResult = await MatchingService.findMatch(
            //       user.id,
            //       matchPreferences
            //     );

            //     if (matchResult) {
            //       toast.success(
            //         `Matched with ${matchResult.partner.name}! Connecting...`
            //       );

            //       // Show token deduction info if applicable
            //       if (matchResult.tokensDeducted > 0) {
            //         toast.info(
            //           `${matchResult.tokensDeducted} tokens used for premium filtering`
            //         );
            //       }

            //       // Store match data in sessionStorage for VideoCall component
            //       sessionStorage.setItem(
            //         "current-match",
            //         JSON.stringify(matchResult)
            //       );
            //     } else {
            //       toast.info(
            //         "No matches found. Trying with broader filters..."
            //       );
            //     }
            //   } catch (error) {
            //     console.error("Matching failed:", error);
            //     if (error.message.includes("Insufficient tokens")) {
            //       toast.error("Insufficient tokens for premium match");
            //       navigate("wallet");
            //       return;
            //     } else {
            //       toast.error("Matching failed. Using demo mode.");
            //     }
            //   }
            // } else {
            //   toast.success("Match found! Connecting...");
            // }

            setTimeout(() => {
              navigate("video-call");
            }, 1500);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 800);

    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % matchingTips.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []); // Remove selectedCountry and selectedGender from dependencies

  const handleCancel = () => {
    setIsSearching(false);
    setMatchingStarted(false); // Reset matching state
    navigate("home");
  };

  const getFilterText = () => {
    if (user?.is_premium) {
      const hasEnoughTokens = user.tokens >= 8;

      // If premium user doesn't have enough tokens, show free mode
      if (!hasEnoughTokens && (selectedCountry || selectedGender)) {
        return "Global (Free Mode) • All genders (Free Mode)";
      }

      const country = selectedCountry || "Global";
      const gender = selectedGender
        ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)
        : "Any Gender";
      return `${country} • ${gender}`;
    }
    return "Global (India preferred) • Same gender preferred";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-semibold">Finding Your Match</h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we connect you
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="w-8 h-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Animated Loader */}
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
              {isSearching ? (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full animate-bounce" />
              )}
            </div>
          </div>

          {/* Ripple Effect */}
          {isSearching && (
            <>
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-ping animation-delay-1000" />
            </>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold">
            {isSearching ? "Searching for someone..." : "Match found!"}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <Progress value={progress} className="w-48 h-2" />
            {/* <span className="text-sm text-muted-foreground min-w-[3rem]">
              {Math.round(progress)}%
            </span> */}
          </div>
        </div>

        {/* Current Filters */}
        <Card className="glass p-4 w-full max-w-md bg-white border-none">
          <h3 className="font-medium mb-3 text-center">Current Filters</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {user.is_premium ? (
                <Crown className="w-4 h-4 text-primary" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              <Badge
                variant={user.is_premium ? "default" : "secondary"}
                className={
                  user.is_premium
                    ? user.tokens >= 8
                      ? "bg-gradient-to-r from-primary to-accent"
                      : "bg-amber-500"
                    : ""
                }
              >
                {getFilterText()}
              </Badge>
            </div>
            {user.is_premium && (
              <p className="text-xs text-muted-foreground text-center">
                {user.tokens >= 8
                  ? "Premium strict matching active"
                  : "Using free matching (insufficient tokens)"}
              </p>
            )}
          </div>
        </Card>

        {/* Tips */}
        <Card className="glass p-4 w-full max-w-md bg-white border-none">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Pro Tip</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {matchingTips[currentTip]}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <div className="text-lg font-semibold text-primary">
              {`${onlineStats.total}+`}
            </div>
            <div className="text-xs text-muted-foreground">{"Online Now"}</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-lg font-semibold text-accent">
              {`${Object.keys(onlineStats.byCountry || {}).length}+`}
            </div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-lg font-semibold text-primary">{"Live"}</div>
            <div className="text-xs text-muted-foreground">{"Real-time"}</div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-6 bg-white fixed bottom-0 w-full border-t-2 border-slate-300">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full glass cursor-pointer"
        >
          Cancel Search
        </Button>
      </div>
    </div>
  );
}
