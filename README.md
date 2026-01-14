# Close CRM Data Extractor (Chrome MV3)

Chrome extension that scrapes Contacts, Opportunities, and Tasks from Close CRM list views, stores them locally, and surfaces everything in a React + Tailwind popup dashboard.

## Quick start
1) Install deps  
`npm install`

2) Build extension (outputs to `dist/`)  
`npm run build`

3) Load in Chrome  
`chrome://extensions` → enable Developer Mode → “Load unpacked” → pick the `dist` folder.

4) Use it  
- Open `app.close.com` and navigate to Contacts, Opportunities, or Tasks list views.  
- Click the extension icon → “Extract Now” to scrape the active tab.  
- Data persists in `chrome.storage.local` across refreshes.  
- Delete items from the popup or export JSON/CSV.

## What’s inside
- Manifest V3 (service worker + content script) via `@crxjs/vite-plugin`
- React + Tailwind popup UI (`index.html`, `src/popup`)
- Content script extractor (`src/content`) with Shadow DOM status pill
- Storage + messaging utilities in `src/shared`

## DOM selection strategy
- Primary selectors: CSS queries that match Close list rows by `data-testid`/`data-test*` patterns and common class name fragments per entity:  
  - Contacts: `[data-testid*="contact-row"], [data-testid*="lead-row"], a[href*="/people/"], a[href*="/lead/"]`  
  - Opportunities: `[data-testid*="opportunity-row"], [data-testid*="opportunity"], a[href*="/opportunity/"]`  
  - Tasks: `[data-testid*="task-row"], [data-testid*="task"]`
- Field extraction pulls common sub-elements: names (`[data-testid*="name"]`), emails (`mailto:`), phones (`tel:`), status/value (`[data-testid*="status"], [data-testid*="value"]`), due/close dates (`time` or `data-testid*="close-date"/"due"`), checkboxes for completion.
- Dynamic/lazy content: before scraping we wait for `requestIdleCallback` (or 250ms fallback) to let virtualized rows settle. If Close loads more as you scroll, re-run “Extract Now” after scrolling.
- View detection: URL path heuristics (`/contacts`, `/opportunities`, `/tasks`) with DOM fallbacks (`data-testid` probes). Unknown views trigger a best-effort scrape of all three selectors.

## Storage schema (`chrome.storage.local`)
```json
{
  "close_data": {
    "contacts": [{ "id": "string", "name": "string", "emails": [], "phones": [], "lead": "string" }],
    "opportunities": [{ "id": "string", "name": "string", "value": 0, "status": "string", "closeDate": "iso-string|null" }],
    "tasks": [{ "id": "string", "description": "string", "dueDate": "iso-string|null", "assignee": "string", "done": true }],
    "lastSync": 1730000000000
  }
}
```
- Deduping: each row uses `data-id`/`data-testid`/href when available; otherwise a hashed fallback of key fields (`ensureId`). We drop duplicates by id per extraction run.
- Updates/deletes: each extraction creates a snapshot for that type; storage is replaced atomically so missing rows imply deletion. Manual deletes flow through the background worker to keep state consistent.
- Race safety: `saveSnapshot` ignores stale writes using `lastSync` timestamps so parallel tabs do not override newer data.

## Popup dashboard (React + Tailwind)
- Tabs for Contacts/Opportunities/Tasks with counts, search/filter, delete per row.
- Shows last sync timestamp and quick export (JSON/CSV).
- “Extract Now” sends a message to the active tab → content script scrapes → data saved → popup auto-refreshes via `chrome.storage.onChanged`.

## Visual feedback (Shadow DOM)
- Content script injects a fixed status pill (`src/shared/shadowIndicator.ts`) into the page via Shadow DOM for style isolation. States: idle, running, success, error.

## Messaging flow
- Popup → background: `extract_now`, `delete_record`.
- Background → content (active tab): `run_extraction`.
- Content → background/popup: extraction result with success/error + saved data.

## Notes & limitations
- Selectors are resilient but may need tweaking if Close updates its DOM. The README documents where to adjust (`src/shared/extraction.ts`).
- For paginated or virtualized lists, scroll/load all rows and click “Extract Now” again; the storage replacement ensures deletions are captured when items are absent in the latest snapshot.

## Scripts
- `npm run build` – type-check + bundle popup/content/background into `dist/`.
- `npm run dev` – Vite dev server for popup UI only (not MV3 served).
- `npm run lint` – ESLint.

## Demo checklist (for the required 3–5 min video)
1. Open Close list view (contacts/opportunities/tasks).  
2. Click extension → “Extract Now”; indicator shows progress.  
3. Refresh page; popup still shows persisted data.  
4. Delete an entry from the popup.  
5. Export JSON/CSV.
