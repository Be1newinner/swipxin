import { AppContent } from "./AppRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <div className="bg-gradient-to-b from-[#0a0a0c] via-[#111115] to-[#1a1a1f] text-foreground h-screen">
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </div>
  );
}
