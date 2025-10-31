import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import type { FallbackProps } from "./ErrorBoundary";

export default function DefaultErrorFallback({ error, retry }: FallbackProps) {
    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Alert variant="destructive" className="glass">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error?.message || 'An unexpected error occurred'}
                    </AlertDescription>
                </Alert>

                <div className="mt-4 space-y-3">
                    <Button
                        onClick={retry}
                        className="w-full"
                        variant="outline"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>

                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full"
                        variant="secondary"
                    >
                        Reload Page
                    </Button>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        If this problem persists, please try:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Clearing your browser cache</li>
                        <li>• Checking your internet connection</li>
                        <li>• Refreshing the page</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
