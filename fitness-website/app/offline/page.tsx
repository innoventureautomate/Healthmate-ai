"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <div className="text-7xl mb-6">📡</div>
      <h1 className="text-3xl font-bold mb-3">You&apos;re Offline</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        No internet connection detected. Connect to the internet and try again,
        or continue using previously visited pages.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
