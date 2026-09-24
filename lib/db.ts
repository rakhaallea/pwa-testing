import Dexie, { type EntityTable } from 'dexie';

export interface PendingSubmission {
  id?: number;
  name: string;
  desc: string;
  mediaUrl: string;
  createdAt: number;
}

const db = new Dexie('PWANotionDB') as Dexie & {
  pending_submissions: EntityTable<
    PendingSubmission,
    'id' 
  >;
};

db.version(1).stores({
  pending_submissions: '++id, name, desc, mediaUrl, createdAt' 
});

export { db };
