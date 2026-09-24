Berikut adalah **Product Requirement Document (**PRD**)** berformat Markdown yang telah diperbarui secara lengkap, termasuk spesifikasi teknis, arsitektur folder, serta contoh implementasi kode konfigurasi (`next.config.ts`, `manifest.ts`, dan setup *Service Worker*):

```markdown # Product Requirement Document (PRD): Simple Next.js PWA (App Router)

## 1. Overview & Context

Dokumen ini mendefinisikan kebutuhan dan implementasi teknis untuk *Proof of Concept* (PoC) Progressive Web App (**PWA**) sederhana menggunakan **Next.js (App Router)**. Tujuannya adalah menguji instalabilitas aplikasi ke perangkat pengguna, efektivitas caching aset statis, serta ketersediaan halaman saat koneksi offline.

---

## 2. Objectives & Goals

- **Installability:** Memastikan web dapat dipasang (*Add to Home Screen*) di Android, iOS (Safari), dan Desktop (Chrome/Edge).
- **Offline Resilience:** Menyediakan akses fallback offline ketika perangkat kehilangan koneksi internet.
- **Asset Caching:** Mengotomatiskan caching shell aplikasi, script, dan aset statis menggunakan *Service Worker*.
- ****PWA** Audit Standards:** Lolos validasi kriteria **PWA** pada audit Google Lighthouse.

---

## 3. Tech Stack & Library Selection

- **Framework:** Next.js (App Router, TypeScript)
- ****PWA** Library:** `@serwist/next` (atau `@ducanh2912/next-pwa` - *zero-config wrapper Workbox terkini*)
- **Styling:** Tailwind **CSS** (opsional / minimal)
- **Hosting/Local Testing:** Localhost via **HTTPS** (`next dev --experimental-https`) atau deployment via Vercel.

---

## 4. Directory Structure

```text my-next-pwa/ ├── app/ │   ├── favicon.ico │   ├── layout.tsx │   ├── page.tsx │   ├── manifest.ts          <-- Web App Manifest **API** (Next.js native) │   ├── offline/ │   │   └── page.tsx         <-- Halaman fallback offline │   └── sw.ts                <-- Service worker source (jika pakai serwist) ├── public/ │   ├── icons/ │   │   ├── icon-192x192.png │   │   └── icon-512x512.png │   └── screenshot-mobile.png ├── next.config.ts           <-- Konfigurasi bundler & **PWA** plugin ├── package.json └── tsconfig.json

```

---

## 5. Technical Specifications & Configuration

### 5.1. Web App Manifest (`app/manifest.ts`)

Menggunakan fitur Metadata Route bawaan Next.js App Router:

```typescript import type { MetadataRoute } from *next*;

export default function manifest(): MetadataRoute.Manifest {
    return {
    name: *Simple Next.js **PWA***,
    short_name: *NextPWA*,
    description: *Uji coba **PWA** sederhana berbasis Next.js App Router*,
    start_url: */*,
    display: *standalone*,
    background_color: *#ffffff*,
    theme_color: *#0f172a*,
    orientation: *portrait*,
    icons: [
    {
    src: */icons/icon-192x192.png*,
    sizes: *192x192*,
    type: *image/png*,
    purpose: *maskable*,
    },
    {
    src: */icons/icon-512x512.png*,
    sizes: *512x512*,
    type: *image/png*,
    purpose: *any*,
    },
    ],
    };
}

```

---

### 5.2. Next Config (`next.config.ts`)

Menggunakan plugin **PWA** (contoh menggunakan `@ducanh2912/next-pwa` yang stabil untuk App Router):

```typescript import type { NextConfig } from *next*; import withPWAInit from *@ducanh2912/next-pwa*;

const withPWA = withPWAInit({
    dest: *public*,
    disable: process.env.NODE_ENV === *development*, // Dinonaktifkan di local dev agar tidak bentrok dengan **HMR**
    register: true,
    skipWaiting: true,
    fallbacks: {
    document: */offline*, // Arahkan ke /offline jika request navigasi gagal saat offline
    },
});

const nextConfig: NextConfig = { reactStrictMode: true, };

export default withPWA(nextConfig);

```

---

### 5.3. Root Layout & Viewport Configuration (`app/layout.tsx`)

**PWA** memerlukan pengaturan metadata viewport dan theme color agar UI terlihat native:

```typescript import type { Metadata, Viewport } from *next*; import *./globals.css*;

export const metadata: Metadata = {
    title: *Simple Next **PWA***,
    description: *Eksperimen **PWA** Next.js*,
    appleWebApp: {
    capable: true,
    statusBarStyle: *default*,
    title: *NextPWA*,
    },
};

export const viewport: Viewport = {
    themeColor: *#0f172a*,
    width: *device-width*,
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
    <html lang=*id*>
    <body>{children}</body>
    </html>
    );
}

```

---

### 5.4. Offline Fallback Page (`app/offline/page.tsx`)

Halaman statis yang ditampilkan saat user membuka rute baru tanpa sambungan internet:

```typescript
export default function OfflinePage() {
    return (
    <main style={{ padding: *2rem*, textAlign: *center*, fontFamily: *sans-serif* }}>
    <h1>Koneksi Terputus</h1>
    <p>Anda sedang berada dalam mode offline. Silakan periksa koneksi internet Anda.</p>
    </main>
    );
}

```

---

## 6. Functional Requirements

| ID | Modul | Deskripsi Kebutuhan |
| --- | --- | --- |
| **FR-01** | Manifest Serving | Endpoint `/manifest.webmanifest` dapat diakses dan mereturn MIME type `application/manifest+json`. |
| **FR-02** | Service Worker Reg | SW otomatis terdaftar di background pada mode production (`pnpm build && pnpm start`). |
| **FR-03** | Precaching | Aset statis (chunk JS, CSS, icon) otomatis di-cache saat halaman pertama kali dimuat. |
| **FR-04** | Offline Navigation | Navigasi ke halaman yang pernah dibuka tetap berhasil; membuka rute baru yang belum di-cache menampilkan `/offline`. |
| **FR-05** | Browser Prompt | Browser memicu prompt native instalasi saat kriteria PWA terpenuhi. |

---

## 7. User Flows

```
[Kunjungi Web via **HTTPS** / Localhost]
    │
    ▼
[Browser Membaca manifest.ts & Mendaftarkan SW]
    │
    ├───────────────────────────────┐
    ▼                               ▼
    [Klik *Install App*]              [Akses Offline]
    │                               │
    ▼                               ▼
    [App Muncul di Desktop/          [Load Shell dari Cache atau
    Home Screen sebagai Icon]        Tampilkan Halaman Fallback]

```

---

## 8. Acceptance Criteria & Testing Checklist

| No | Parameter Pengujian | Cara Validasi | Kriteria Keberhasilan |
| --- | --- | --- | --- |
| 1 | **Manifest Validation** | Chrome DevTools > Tab *Application* > *Manifest* | Semua data (nama, warna, icon) terbaca tanpa tanda seru/warning. |
| 2 | **Service Worker State** | Chrome DevTools > Tab *Application* > *Service Workers* | Muncul status hijau `Activated and is running`. |
| 3 | **Offline Simulation** | DevTools > Tab *Network* > pilih preset `Offline`, lalu reload | Halaman tidak menampilkan *Dinosaur Game* / `ERR_INTERNET_DISCONNECTED`. |
| 4 | **Lighthouse Audit** | Chrome DevTools > Tab *Lighthouse* > Centang *Progressive Web App* | Lulus kategori **Installable** dan **PWA Optimized**. |

---

## 9. Out of Scope

```
- Integrasi Web Push Notifications.
- Background Synchronization **API**.
- Sinkronisasi data lokal ke cloud via IndexedDB/Dexie.js.
```

