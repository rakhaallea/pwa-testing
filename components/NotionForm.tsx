"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db";

export default function NotionForm() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const updatePendingCount = async () => {
      const count = await db.pending_submissions.count();
      setPendingCount(count);
    };
    
    updatePendingCount();

    // Auto-sync jika halaman di-refresh dan koneksi sedang online
    if (navigator.onLine) {
      syncPendingData().then(() => updatePendingCount());
    }

    const handleOnline = async () => {
      setIsOnline(true);
      await syncPendingData();
      updatePendingCount();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isSyncingRef = useRef(false);

  const syncPendingData = async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const pendingItems = await db.pending_submissions.toArray();
      if (pendingItems.length === 0) return;

      let successCount = 0;
      for (const item of pendingItems) {
        if (!item.id) continue;

        let claimed = false;
        // Gunakan transaksi atomic Dexie untuk "mengklaim" data agar tidak diproses 2x
        await db.transaction('rw', db.pending_submissions, async () => {
          const exists = await db.pending_submissions.get(item.id!);
          if (exists) {
            await db.pending_submissions.delete(item.id!);
            claimed = true;
          }
        });

        if (!claimed) continue; // Data sudah diproses oleh tab/event lain

        try {
          const res = await fetch("/api/notion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: item.name, desc: item.desc, mediaUrl: item.mediaUrl }),
          });

          if (res.ok) {
            successCount++;
          } else {
            // Jika gagal kirim, kembalikan data ke IndexedDB
            await db.pending_submissions.add(item);
          }
        } catch (error) {
          console.error("Sync failed for item:", item, error);
          // Jika gagal kirim, kembalikan data ke IndexedDB
          await db.pending_submissions.add(item);
        }
      }

      if (successCount > 0) {
        setMessage({ text: `${successCount} data offline berhasil disinkronkan ke Notion!`, type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    const formData = { name, desc, mediaUrl };

    if (isOnline) {
      try {
        const res = await fetch("/api/notion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setMessage({ text: "Data berhasil dikirim ke Notion!", type: "success" });
          setName("");
          setDesc("");
          setMediaUrl("");
        } else {
          setMessage({ text: "Gagal mengirim data ke Notion.", type: "error" });
        }
      } catch (error) {
        setMessage({ text: "Terjadi kesalahan saat mengirim.", type: "error" });
      }
    } else {
      // Offline: Save to IndexedDB
      try {
        await db.pending_submissions.add({
          ...formData,
          createdAt: Date.now(),
        });
        setMessage({ text: "Koneksi offline. Data disimpan lokal dan akan disinkronkan otomatis saat terhubung kembali internet.", type: "warning" });
        setName("");
        setDesc("");
        setMediaUrl("");
        setPendingCount(prev => prev + 1);
      } catch (error) {
        setMessage({ text: "Gagal menyimpan data lokal.", type: "error" });
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 mt-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Laporan Baru</h2>
        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full dark:bg-amber-900 dark:text-amber-300 animate-pulse">
            {pendingCount} Menunggu Sync
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Judul Laporan *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Masukkan judul..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Deskripsi Detail</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Jelaskan secara singkat..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Media (URL Gambar)</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="https://images.unsplash.com/..."
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Gunakan URL eksternal publik. Data ini akan dimasukkan ke kolom <i>Files & media</i> di Notion.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 py-3.5 px-4 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Memproses..." : (isOnline ? "Kirim ke Notion" : "Simpan Offline")}
        </button>

        {message.text && (
          <div className={`p-4 rounded-xl mt-4 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-100 text-green-800' :
            message.type === 'warning' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
