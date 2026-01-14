import { STORAGE_KEY } from './constants'
import type { CloseData, ExtractionSnapshot, RecordKind } from './types'

export const emptyCloseData: CloseData = {
  contacts: [],
  opportunities: [],
  tasks: [],
  lastSync: 0,
}

export async function getCloseData(): Promise<CloseData> {
  const existing = (await chrome.storage.local.get(STORAGE_KEY))[
    STORAGE_KEY
  ] as CloseData | undefined
  return existing ? { ...emptyCloseData, ...existing } : { ...emptyCloseData }
}

export async function saveSnapshot(snapshot: ExtractionSnapshot) {
  const current = await getCloseData();

  const mergeRecords = (oldItems: any[], newItems: any[] | undefined) => {
    if (!newItems) return oldItems;
    const map = new Map();
    oldItems.forEach(item => map.set(item.id, item));
    newItems.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  const next: CloseData = {
    ...current,
    contacts: mergeRecords(current.contacts, snapshot.contacts),
    opportunities: mergeRecords(current.opportunities, snapshot.opportunities),
    tasks: mergeRecords(current.tasks, snapshot.tasks),
    lastSync: Date.now(),
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return { data: next, skipped: false as const };
}

export async function deleteRecord(kind: RecordKind, id: string) {
  const current = await getCloseData()
  const filtered = current[kind].filter((item) => item.id !== id)
  const next: CloseData = { ...current, [kind]: filtered, lastSync: Date.now() }
  await chrome.storage.local.set({ [STORAGE_KEY]: next })
  return next
}

