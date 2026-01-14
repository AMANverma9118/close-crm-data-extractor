import { useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY } from '../shared/constants'
import { emptyCloseData } from '../shared/storage'
import { formatDateShort, normalizeText } from '../shared/utils'
import type {
  CloseData,
  Contact,
  ExtractResponse,
  Opportunity,
  RecordKind,
  Task,
} from '../shared/types'

type Tab = RecordKind

const TAB_LABELS: Record<Tab, string> = {
  contacts: 'Contacts',
  opportunities: 'Opportunities',
  tasks: 'Tasks',
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('contacts')
  const [data, setData] = useState<CloseData>(emptyCloseData)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const next = (result[STORAGE_KEY] as CloseData | undefined) ?? emptyCloseData
      setData(next)
    })

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      areaName,
    ) => {
      if (areaName === 'local' && STORAGE_KEY in changes) {
        const next = changes[STORAGE_KEY].newValue as CloseData
        setData(next ?? emptyCloseData)
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    const list = data[activeTab] as Array<Contact | Opportunity | Task>
    return list.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term),
    )
  }, [activeTab, data, search])

  const handleExtract = async () => {
    setIsBusy(true)
    setError(null)
    setStatus('Requesting extraction…')
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'extract_now',
      })) as ExtractResponse

      if (!response?.ok) {
        throw new Error(response?.message || 'Extraction failed')
      }
      setStatus(response.message ?? 'Extraction complete')
      if (response.data) setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to extract')
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (kind: RecordKind, id: string) => {
    setError(null)
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'delete_record',
        payload: { kind, id },
      })) as ExtractResponse
      if (response?.ok && response.data) setData(response.data)
      else if (response?.message) setError(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleExport = (format: 'json' | 'csv') => {
    const payload = JSON.stringify(data, null, 2)
    const mime =
      format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;'

    const blob =
      format === 'json'
        ? new Blob([payload], { type: mime })
        : new Blob([toCsv(data)], { type: mime })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `close-data.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Close CRM
            </p>
            <h1 className="text-lg font-semibold">Data Extractor</h1>
          </div>
          <button
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={handleExtract}
            disabled={isBusy}
          >
            {isBusy ? 'Working…' : 'Extract Now'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            Last sync:{' '}
            {data.lastSync
              ? new Date(data.lastSync).toLocaleString()
              : 'Not yet synced'}
          </span>
          <span className="mx-1 text-slate-300">•</span>
          <button
            className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => handleExport('json')}
          >
            Export JSON
          </button>
          <button
            className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </button>
          {status && <span className="text-blue-600">{status}</span>}
          {error && <span className="text-red-600">{error}</span>}
        </div>
      </header>

      <main className="px-4 pb-4">
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {Object.entries(TAB_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  onClick={() => setActiveTab(key as Tab)}
                >
                  {label} ({data[key as Tab].length})
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-auto pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500">
                No {TAB_LABELS[activeTab].toLowerCase()} found yet.
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="text-sm text-slate-800">
                    {activeTab === 'contacts' &&
                      renderContact(item as CloseData['contacts'][number])}
                    {activeTab === 'opportunities' &&
                      renderOpportunity(item as CloseData['opportunities'][number])}
                    {activeTab === 'tasks' &&
                      renderTask(item as CloseData['tasks'][number])}
                  </div>
                  <button
                    onClick={() => handleDelete(activeTab, item.id)}
                    className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function renderContact(item: CloseData['contacts'][number]) {
  return (
    <div className="space-y-1">
      <div className="text-base font-semibold">{item.name}</div>
      <div className="text-slate-600">Lead: {item.lead || 'Unknown'}</div>
      {item.emails.length > 0 && (
        <div className="text-slate-600">
          Emails: <span className="font-medium">{item.emails.join(', ')}</span>
        </div>
      )}
      {item.phones.length > 0 && (
        <div className="text-slate-600">
          Phones: <span className="font-medium">{item.phones.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

function renderOpportunity(item: CloseData['opportunities'][number]) {
  return (
    <div className="space-y-1">
      <div className="text-base font-semibold">{item.name}</div>
      <div className="text-slate-600">Status: {item.status}</div>
      <div className="text-slate-600">
        Value:{' '}
        <span className="font-medium">
          {item.value !== null ? item.value : '—'}
        </span>
      </div>
      <div className="text-slate-600">
        Close date: <span className="font-medium">{formatDateShort(item.closeDate)}</span>
      </div>
    </div>
  )
}

function renderTask(item: CloseData['tasks'][number]) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">{item.description}</span>
        <span
          className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${
            item.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {item.done ? 'Done' : 'Open'}
        </span>
      </div>
      <div className="text-slate-600">Assignee: {item.assignee}</div>
      <div className="text-slate-600">
        Due: <span className="font-medium">{formatDateShort(item.dueDate)}</span>
      </div>
    </div>
  )
}

function toCsv(data: CloseData) {
  const lines: string[] = []
  lines.push('type,id,name_or_title,extra,value,status,closeDate,done,dueDate')

  data.contacts.forEach((c) =>
    lines.push(
      [
        'contact',
        c.id,
        escapeCsv(c.name),
        escapeCsv(`emails: ${c.emails.join(' / ')} phones: ${c.phones.join(' / ')} lead: ${c.lead}`),
        '',
        '',
        '',
        '',
        '',
      ].join(','),
    ),
  )

  data.opportunities.forEach((o) =>
    lines.push(
      [
        'opportunity',
        o.id,
        escapeCsv(o.name),
        '',
        o.value ?? '',
        escapeCsv(o.status),
        o.closeDate ?? '',
        '',
        '',
      ].join(','),
    ),
  )

  data.tasks.forEach((t) =>
    lines.push(
      [
        'task',
        t.id,
        escapeCsv(t.description),
        escapeCsv(`assignee: ${t.assignee}`),
        '',
        '',
        '',
        t.done,
        t.dueDate ?? '',
      ].join(','),
    ),
  )

  return lines.join('\n')
}

function escapeCsv(value: string | number | boolean) {
  const str = normalizeText(String(value))
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default App
