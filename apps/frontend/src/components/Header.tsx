import { Coins, Settings, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  user: { name: string; is_premium: boolean; tokens: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: (screen: any) => void;
};

export function AppHeader({ user, navigate }: Props) {
  return (
    <header
      className={cn(
        "w-full sm:max-w-xl",
        "bg-white supports-backdrop-filter:backdrop-blur-md",
        "relative border-b border-transparent",
        "before:content-[''] before:absolute before:inset-x-0 before:bottom-0 before:h-px",
        "before:bg-linear-to-r before:from-sky-500/0 before:via-sky-500/60 before:to-sky-500/0"
      )}
      style={{
        position: "fixed",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative size-10 rounded-xl grid place-items-center",
                // bright, light-first gradient tile
                "bg-linear-to-br from-indigo-500 to-sky-500",
                // soft luminous shadow tuned for light theme
                "shadow-[0_8px_24px_-10px_rgba(2,132,199,0.25)]",
                // crisp edge for light mode surfaces
                "ring-1 ring-white/50"
              )}
              aria-label="Swipx"
            >
              <Video className="size-5 text-white" strokeWidth={2} />
              {/* subtle gloss */}
              <span className="pointer-events-none absolute inset-0 rounded-xl [mask:linear-gradient(#000,transparent_60%)] ring-1 ring-white/30" />
            </div>

            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Swipx
              </h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {user.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user.is_premium && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("wallet")}
                className={cn(
                  "h-8 px-3 gap-1.5 rounded-full",
                  // light, airy pill with gradient tint
                  "bg-linear-to-r from-indigo-500/10 to-sky-500/10",
                  // crisp border for light theme
                  "border border-sky-500/30 hover:border-sky-500/50",
                  // text legibility on light background
                  "text-foreground hover:from-indigo-500/15 hover:to-sky-500/15",
                  // refined elevation for focus/hover
                  "transition-all"
                )}
              >
                <Coins className="size-4 text-sky-600" />
                <span className="font-medium tabular-nums">{user.tokens}</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("settings")}
              className={cn(
                "size-9 rounded-full",
                "hover:bg-foreground/5",
                "transition-colors"
              )}
              aria-label="Settings"
            >
              <Settings className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
