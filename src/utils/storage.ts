import type { GeneratedItem } from '../types';

/**
 * Gallery persistence in IndexedDB.
 *
 * Why not localStorage: a single 2K/4K image as a base64 data URL is several MB,
 * which blows through localStorage's ~5MB quota after one or two images, and
 * blob: URLs of videos die when the page reloads. IndexedDB holds large strings
 * and Blobs, and we rebuild fresh object URLs on load.
 */

const DB_NAME = 'aether_studio';
const STORE = 'items';
const LEGACY_KEY = 'aether_studio_history_v1';

type StoredItem = Omit<GeneratedItem, 'url' | 'blob'> & { data: string | Blob };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          resolve(req ? (req.result as T) : undefined);
        };
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
        t.onabort = () => {
          db.close();
          reject(t.error || new Error('IndexedDB transaction aborted'));
        };
      })
  );
}

function toStored(item: GeneratedItem): StoredItem {
  const { url, blob, ...rest } = item;
  return { ...rest, data: item.type === 'video' && blob ? blob : url };
}

function fromStored(row: StoredItem): GeneratedItem {
  const { data, ...rest } = row;
  const url = data instanceof Blob ? URL.createObjectURL(data) : data;
  return { ...rest, url, blob: data instanceof Blob ? data : undefined };
}

export async function saveItem(item: GeneratedItem): Promise<void> {
  await tx('readwrite', (s) => s.put(toStored(item)));
}

export async function deleteItem(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

/** All items, newest first. Also migrates the old localStorage history once. */
export async function loadItems(): Promise<GeneratedItem[]> {
  await migrateLegacy();
  const rows = ((await tx<StoredItem[]>('readonly', (s) => s.getAll())) || []) as StoredItem[];
  return rows.map(fromStored).sort((a, b) => b.createdAt - a.createdAt);
}

/** Keep only the newest `max` items; returns the ids that were removed. */
export async function trimItems(max: number): Promise<string[]> {
  const rows = ((await tx<StoredItem[]>('readonly', (s) => s.getAll())) || []) as StoredItem[];
  const extra = rows.sort((a, b) => b.createdAt - a.createdAt).slice(max);
  if (extra.length === 0) return [];
  await tx('readwrite', (s) => {
    extra.forEach((r) => s.delete(r.id));
  });
  return extra.map((r) => r.id);
}

async function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const old = JSON.parse(raw) as GeneratedItem[];
    // Legacy videos had blob: URLs that no longer exist, so only images are worth keeping.
    for (const item of old) {
      if (item.type === 'image' && item.url?.startsWith('data:')) await saveItem(item);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    console.warn('Legacy gallery migration skipped:', e);
  }
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export function requestPersistence() {
  try {
    navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}
