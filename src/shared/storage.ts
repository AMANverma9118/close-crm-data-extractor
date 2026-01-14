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
  const current = await getCloseData()
  if (snapshot.timestamp < current.lastSync) {
    return { data: current, skipped: true as const }
  }

  const next: CloseData = {
    ...current,
    contacts: snapshot.contacts ?? current.contacts,
    opportunities: snapshot.opportunities ?? current.opportunities,
    tasks: snapshot.tasks ?? current.tasks,
    lastSync: snapshot.timestamp,
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: next })
  return { data: next, skipped: false as const }
}

export async function deleteRecord(kind: RecordKind, id: string) {
  const current = await getCloseData()
  const filtered = current[kind].filter((item) => item.id !== id)
  const next: CloseData = { ...current, [kind]: filtered, lastSync: Date.now() }
  await chrome.storage.local.set({ [STORAGE_KEY]: next })
  return next
}

