import React from 'react';
import { Heart, Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center space-x-2 mb-8">
        <Heart className="h-10 w-10 text-primary animate-pulse" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          SwipX
        </h1>
      </div>

      {/* Spinner */}
      <div className="flex items-center space-x-3 mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-lg text-foreground">{message}</p>
      </div>

      {/* Subtle description */}
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Connecting hearts through video conversations
      </p>

      {/* Loading dots animation */}
      <div className="flex space-x-1 mt-8">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}

export { LoadingScreen };
