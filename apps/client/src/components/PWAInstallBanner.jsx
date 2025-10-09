import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, X, Smartphone } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      // Check if running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      return isStandalone || isFullscreen || isMinimalUI || window.navigator.standalone;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Check if user has dismissed the banner before
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember that user dismissed the banner
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't show banner if already installed or no install prompt available
  if (isInstalled || !showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 glass border-primary/20 mx-auto max-w-md">
      <div className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Install Swipx</p>
          <p className="text-xs text-muted-foreground">
            Get the full app experience with offline support
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="text-xs px-3 py-1 h-8"
          >
            <Download className="w-3 h-3 mr-1" />
            Install
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs px-2 py-1 h-8 w-8"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}