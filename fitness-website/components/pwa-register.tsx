"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[SW] Registration failed:", err));
    }

    // Capture install prompt so we can trigger it on our own button
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setInstallPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background shadow-lg px-4 py-3 max-w-sm w-full mx-4">
      <span className="text-2xl">📱</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Install PostureSense</p>
        <p className="text-xs text-muted-foreground">
          Add to home screen for the best experience
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowBanner(false)}
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
