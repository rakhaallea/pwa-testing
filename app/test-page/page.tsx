import Link from "next/link";
import NetworkStatus from "@/components/NetworkStatus";
import NotionForm from "@/components/NotionForm";

export default function TestPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-start bg-zinc-50 font-sans dark:bg-black min-h-screen py-16">
      <NetworkStatus />
      
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-start px-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
          Halaman Uji Coba PWA
        </h1>
        
        <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl">
          Halaman ini digunakan untuk mengetes form integrasi Notion Offline-First. Cobalah matikan koneksi internet via DevTools (Tab Network &gt; Offline), lalu isi dan kirim form di bawah ini.
        </p>

        <NotionForm />

        <div className="mt-12">
          <Link
            href="/"
            className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
