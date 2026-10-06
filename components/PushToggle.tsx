"use client";

import { useEffect, useState } from "react";
import { enablePush, isPushSupported } from "@/lib/push-client";

export default function PushToggle() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "denied" | "error" | "unsupported">("idle");

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus("unsupported");
    } else if (Notification.permission === "granted") {
      // Izin saja tidak cukup: subscription bisa belum pernah dibuat atau belum tersimpan di server.
      // Daftarkan ulang setiap kali halaman dibuka; server mengabaikan endpoint yang sudah ada.
      setStatus("loading");
      enablePush()
        .then((result) => setStatus(result === "granted" ? "enabled" : "error"))
        .catch((error) => {
          console.error(error);
          setStatus("error");
        });
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  const handleEnable = async () => {
    setStatus("loading");
    try {
      const result = await enablePush();
      setStatus(result === "granted" ? "enabled" : result === "denied" ? "denied" : "unsupported");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  if (status === "unsupported") return null;

  if (status === "enabled") {
    return <p className="text-xs text-green-700 dark:text-green-400">Notifikasi aktif.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleEnable}
        disabled={status === "loading" || status === "denied"}
        className="text-sm font-medium px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        {status === "loading" ? "Mengaktifkan..." : "Aktifkan notifikasi"}
      </button>
      {status === "denied" && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Izin notifikasi ditolak. Ubah di pengaturan browser.</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">Gagal mengaktifkan notifikasi.</p>
      )}
    </div>
  );
}
