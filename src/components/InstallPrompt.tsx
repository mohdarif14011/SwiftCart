'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS prompt after a short delay if not standalone
    if (isIosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Install SwiftCart App</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fast & Fresh access from home screen</p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-white/5 rounded-2xl p-3 flex flex-col gap-2">
            <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
              To install: Tap the <Share className="inline h-3 w-3 mx-1 text-primary" /> button below and then select <span className="text-white font-bold">"Add to Home Screen"</span> <PlusSquare className="inline h-3 w-3 mx-1 text-slate-300" />.
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleInstallClick} 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-12 shadow-lg shadow-primary/20"
          >
            Install Now
          </Button>
        )}
      </div>
    </div>
  );
}
