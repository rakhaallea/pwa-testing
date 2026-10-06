// Kode service worker kustom. @ducanh2912/next-pwa membundel file ini ke public/sw.js.
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Notifikasi", {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      tag: data.tag,
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => client.focused) ?? clientList[0];
      if (existing) {
        return existing.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
