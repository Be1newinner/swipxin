import { ErrorBoundary } from "./components/ErrorBoundary";
import { Providers } from "./components/Providers";
import { RoutesSetup } from "./routes/Routes";

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RoutesSetup />
      </Providers>
    </ErrorBoundary>
  );
}
