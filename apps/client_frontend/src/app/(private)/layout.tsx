import { ReactNode } from "react";

export default function auht_layout({ children }: { children: ReactNode }) {
  const authenticated = true;
  if (!authenticated) {
  }
  return <>{children}</>;
}
