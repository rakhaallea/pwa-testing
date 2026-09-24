import Link from "next/link";
import NetworkStatus from "@/components/NetworkStatus";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <NetworkStatus />
      
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-16 px-8 bg-white dark:bg-zinc-900 sm:rounded-2xl sm:shadow-lg sm:my-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            PWA Testing App
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Selamat datang! Halaman ini otomatis disimpan ke dalam cache oleh Service Worker. 
            Silakan matikan koneksi internet Anda dan coba *refresh* halaman ini.
          </p>
        </div>
        
        <div className="mt-12 flex flex-col gap-4 text-base font-medium sm:flex-row w-full sm:w-auto">
          <Link
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-white transition-all hover:bg-blue-700 hover:scale-105"
            href="/test-page"
          >
            Buka Halaman Baru
          </Link>
          <a
            className="flex h-12 items-center justify-center rounded-xl border-2 border-zinc-200 px-8 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pelajari PWA
          </a>
        </div>
      </main>
    </div>
  );
}
