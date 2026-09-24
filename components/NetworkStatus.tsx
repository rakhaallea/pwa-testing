"use client";

import { useState, useEffect } from "react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors ${
        isOnline ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? "animate-pulse bg-green-200" : "bg-red-200"}`}></div>
      {isOnline ? "Anda sedang Online" : "Mode Offline Aktif"}
    </div>
  );
}
