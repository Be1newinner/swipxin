import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Crown,
  Check,
  Clock,
  Star,
  Sparkles,
  Video,
  Heart,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAppNavigation } from "@/components/utils/navigateHook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";

const plans = [
  {
    id: "free",
    name: "Free",
    duration: 0, // unlimited
    price: 0,
    description: "Enjoy unlimited video chats with country filtering",
    features: [
      "Unlimited video chats",
      "Global user matching",
      "Country filter available",
      "Basic swipe controls",
      "Report & safety features",
      "No tokens required",
      "No time limits",
    ],
  },
  {
    id: "test",
    name: "Test Premium",
    duration: 1,
    price: 0,
    description: "Try premium features for 1 minute",
    features: [
      "1 minute premium access",
      "Gender filter preview",
      "Priority matching",
      "Premium badge",
      "No token deduction during test",
      "Country filter (always available)",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    duration: 20,
    price: 100,
    description: "Enhanced video chat experience with filters",
    isPopular: true,
    features: [
      "All free features included",
      "Gender filter (strict matching)",
      "Priority in matching queue",
      "Premium badge display",
      "Token system (8 tokens per premium swipe)",
      "150 tokens included (₹100 value)",
      "Advanced reporting options",
      "Premium user priority",
    ],
  },
];

export function Plans() {
  const updateUser = useAppStore((s) => s.updateUser);
  const [isLoading, setIsLoading] = useState(false);
  const { navigate } = useAppNavigation();
  const user = useAppStore((s) => s.user);

  // Handle authentication check in useEffect to avoid setState during render
  useEffect(() => {
    if (!user) {
      navigate("auth");
    }
  }, [user, navigate]);

  // Return null if user is not authenticated to prevent rendering
  if (!user) {
    return null;
  }

  const handlePurchase = async (plan: { price: number, id: string }) => {
    if (plan.id === "free") {
      toast.info("You are already enjoying free video chats!");
      return;
    }

    if (plan.price === 0 && plan.id === "test") {
      // Free test
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update user to premium for test period
      updateUser({
        is_premium: true,
        // premiumExpiry: new Date(Date.now() + 60000), // 1 minute from now
      });

      toast.success(
        "Test drive activated! You have 1 minute of premium filters."
      );

      // Auto-expire after 1 minute (for demo purposes, in real app this would be server-side)
      setTimeout(() => {
        updateUser({
          is_premium: false,
          // premiumExpiry: null,
        });
        toast.info("Test drive expired. Video chats continue as free user!");
      }, 60000);

      setIsLoading(false);
      navigate("home");
      return;
    }

    // Premium purchase
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update user to premium status with tokens
    updateUser({
      is_premium: true,
      tokens: (user.tokens || 0) + 150, // Add 150 tokens
      // premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    toast.success(`Premium activated! Enhanced filtering + 150 tokens added.`);
    setIsLoading(false);
    navigate("home");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b border-slate-300 bg-white w-full z-10"
        style={{
          position: "fixed",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("home")}
          className="w-8 h-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Choose Your Experience</h1>
          <p className="text-sm text-muted-foreground">
            Video chats are always free
          </p>
        </div>
      </div>

      <main className="pt-20">
        <div className="p-4 space-y-6">
          {/* Current Status */}
          <Card
            className={`glass px-4 ${user.is_premium ? "bg-red-400" : "bg-white"
              } border-none`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.is_premium
                  ? "bg-gradient-to-br from-primary to-accent"
                  : "bg-gradient-to-br from-red-500 to-blue-500"
                  }`}
              >
                {user.is_premium ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Heart className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {user.is_premium ? "Premium Active" : "Free Plan Active"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user.is_premium
                    ? "You have gender filtering and priority matching"
                    : "Enjoying unlimited free video chats with country filtering"}
                </p>
              </div>
            </div>
          </Card>

          {/* Plans */}
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`glass relative overflow-hidden ${plan.isPopular
                  ? "border-primary bg-gradient-to-br from-primary/5 to-accent/5"
                  : ""
                  } ${(plan.id === "free" && !user.is_premium) ||
                    (plan.id === "premium" && user.is_premium)
                    ? "ring-2 ring-primary/50"
                    : ""
                  } bg-white border-none`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-xs px-3 py-1 rounded-bl-lg">
                    <Star className="w-3 h-3 inline mr-1" />
                    Most Popular
                  </div>
                )}

                {((plan.id === "free" && !user.is_premium) ||
                  (plan.id === "premium" && user.is_premium)) && (
                    <div className="absolute top-0 left-0 bg-red-500 text-xs px-4 py-2 rounded-br-lg font-semibold">
                      Current Plan
                    </div>
                  )}

                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.id === "free"
                          ? "bg-gradient-to-br from-red-500 to-blue-500"
                          : plan.price === 0
                            ? "bg-accent/10"
                            : "bg-gradient-to-br from-primary to-accent"
                          }`}
                      >
                        {plan.id === "free" ? (
                          <Heart className="w-6 h-6 text-white" />
                        ) : plan.price === 0 ? (
                          <Clock className="w-6 h-6 text-accent" />
                        ) : (
                          <Crown className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {plan.price === 0 ? "Free" : `₹${plan.price}`}
                      </div>
                      {plan.duration > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {plan.duration} minute{plan.duration > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* CTA */}
                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={
                      isLoading ||
                      (plan.id === "free" && !user.is_premium) ||
                      (plan.id === "premium" && user.is_premium)
                    }
                    className={`w-full ${plan.id === "free"
                      ? "bg-gray-500"
                      : plan.price === 0
                        ? "bg-accent hover:bg-accent/90"
                        : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      }`}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : plan.id === "free" && !user.is_premium ? (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : plan.id === "premium" && user.is_premium ? (
                      "Currently Active"
                    ) : plan.price === 0 && plan.id === "test" ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Try Premium Filters
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Features Comparison */}
          <Card className="glass p-6 space-y-4 bg-white border-none">
            <h3 className="font-semibold text-center">
              Free vs Premium Comparison
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium">Feature</div>
                <div className="font-medium text-center">Free</div>
                <div className="font-medium text-center">Premium</div>
              </div>

              <Separator />

              {[
                {
                  feature: "Video Chats",
                  free: "✓ Unlimited",
                  premium: "✓ Unlimited",
                },
                { feature: "Global Matching", free: "✓", premium: "✓" },
                { feature: "Swipe Controls", free: "✓", premium: "✓" },
                { feature: "Country Filter", free: "✓", premium: "✓" },
                {
                  feature: "Gender Filter",
                  free: <X className="w-4 h-4 text-destructive mx-auto" />,
                  premium: "✓",
                },
                {
                  feature: "Priority Queue",
                  free: <X className="w-4 h-4 text-destructive mx-auto" />,
                  premium: "✓",
                },
                {
                  feature: "Premium Badge",
                  free: <X className="w-4 h-4 text-destructive mx-auto" />,
                  premium: "✓",
                },
                {
                  feature: "Token Cost",
                  free: "Always Free",
                  premium: "8 tokens/premium match",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 text-sm py-2 items-center"
                >
                  <div>{item.feature}</div>
                  <div className="text-center">
                    {typeof item.free === "string" ? item.free : item.free}
                  </div>
                  <div className="text-center">
                    {typeof item.premium === "string"
                      ? item.premium
                      : item.premium}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Message */}
          <Card className="glass p-4 bg-white border-none">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  Video Chats Are Always Free
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Connect with people worldwide without any cost</p>
                  <p>• No time limits or chat restrictions</p>
                  <p>
                    • Premium adds gender filtering for more targeted matches
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
