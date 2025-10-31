// app/providers.tsx (or layout.tsx root)
"use client";

import type { ReactNode } from "react";
import { ErrorToast } from "./Toast/ErrorToast";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/useAppStore";

export function Providers({ children }: { children: ReactNode }) {
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);

  return (
    <>
      {children}
      <ErrorToast error={error} onClear={clearError} />
      <PWAInstallBanner />
      <Toaster />
    </>
  );
}
