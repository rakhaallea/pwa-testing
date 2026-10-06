import { Client } from "@notionhq/client";
import webpush from "web-push";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Host push service milik browser. Endpoint di luar daftar ini ditolak supaya
// server tidak bisa dipakai untuk mengirim request ke alamat sembarang (SSRF).
const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"];
const PUSH_SERVICE_SUFFIXES = [".push.apple.com", ".notify.windows.com"];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return (
      PUSH_SERVICE_HOSTS.includes(url.hostname) ||
      PUSH_SERVICE_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

// p256dh adalah public key 65 byte dan auth adalah secret 16 byte, keduanya base64url.
export function isValidSubscriptionKeys(keys: { p256dh?: unknown; auth?: unknown }): boolean {
  const decodedLength = (value: unknown) =>
    typeof value === "string" && /^[A-Za-z0-9_-]+={0,2}$/.test(value)
      ? Buffer.from(value, "base64url").length
      : -1;
  return decodedLength(keys.p256dh) === 65 && decodedLength(keys.auth) === 16;
}

// Dibaca saat dibutuhkan, bukan saat module dimuat, supaya env VAPID yang kosong atau salah
// tidak membuat route yang mengimpor file ini (misalnya /api/notion) ikut gagal.
function getVapidDetails() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

// Query di @notionhq/client v5 memakai data source, bukan database.
let dataSourceId: string | undefined;
async function getDataSourceId(): Promise<string> {
  if (dataSourceId) return dataSourceId;
  const db: any = await notion.databases.retrieve({
    database_id: process.env.NOTION_SUBSCRIPTION_DB_ID!,
  });
  const id: string = db.data_sources[0].id;
  dataSourceId = id;
  return id;
}

export type StoredSubscription = {
  pageId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function textOf(prop: any): string {
  return (prop?.rich_text ?? []).map((t: any) => t.plain_text).join("");
}

export async function findSubscriptionByEndpoint(endpoint: string) {
  const res = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: { property: "endpoint", url: { equals: endpoint } },
    page_size: 1,
  });
  return res.results[0] ?? null;
}

export async function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const keyProperties = {
    p256dh: { rich_text: [{ text: { content: sub.keys.p256dh } }] },
    auth: { rich_text: [{ text: { content: sub.keys.auth } }] },
  };

  const existing: any = await findSubscriptionByEndpoint(sub.endpoint);
  if (existing) {
    // Browser bisa membuat ulang key untuk endpoint yang sama. Simpan key terbaru,
    // karena push yang dienkripsi dengan key lama tidak bisa dibuka oleh browser.
    const keysChanged =
      textOf(existing.properties.p256dh) !== sub.keys.p256dh ||
      textOf(existing.properties.auth) !== sub.keys.auth;
    if (keysChanged) {
      await notion.pages.update({ page_id: existing.id, properties: keyProperties });
    }
    return existing.id as string;
  }

  const page: any = await notion.pages.create({
    parent: { database_id: process.env.NOTION_SUBSCRIPTION_DB_ID! },
    properties: {
      Id: { title: [{ text: { content: crypto.randomUUID() } }] },
      endpoint: { url: sub.endpoint },
      ...keyProperties,
      createdAt: { date: { start: new Date().toISOString() } },
    },
  });
  return page.id as string;
}

async function listSubscriptions(): Promise<StoredSubscription[]> {
  const subs: StoredSubscription[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.dataSources.query({
      data_source_id: await getDataSourceId(),
      start_cursor: cursor,
    });
    for (const page of res.results) {
      subs.push({
        pageId: page.id,
        endpoint: page.properties.endpoint.url,
        keys: {
          p256dh: textOf(page.properties.p256dh),
          auth: textOf(page.properties.auth),
        },
      });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return subs;
}

// Batas jeda antar push. Disimpan di memori, jadi hanya berlaku per instance server.
const PUSH_COOLDOWN_MS = 10_000;
let lastPushAt = 0;

export async function sendPushToAll(payload: { title: string; body: string; url?: string; tag?: string }) {
  const vapidDetails = getVapidDetails();
  if (!vapidDetails) {
    console.error("Push skipped: VAPID env belum lengkap.");
    return;
  }

  const now = Date.now();
  if (now - lastPushAt < PUSH_COOLDOWN_MS) return;
  lastPushAt = now;

  const subs = await listSubscriptions();
  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      // Baris yang diubah manual di Notion juga harus lolos pemeriksaan yang sama.
      if (!isAllowedPushEndpoint(sub.endpoint)) {
        console.error("Push skipped: endpoint tidak dikenal:", sub.endpoint);
        return;
      }
      try {
        await webpush.sendNotification(sub, body, { TTL: 60 * 60, vapidDetails });
      } catch (err: any) {
        // 404/410 berarti subscription sudah tidak valid (misalnya app di-uninstall). Hapus dari Notion.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await notion.pages.update({ page_id: sub.pageId, archived: true });
        } else {
          console.error("Push failed:", sub.endpoint, err.statusCode ?? err.message, err.body);
        }
      }
    }),
  );
}
