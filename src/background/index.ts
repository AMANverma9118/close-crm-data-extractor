import { deleteRecord, getCloseData } from '../shared/storage'
import type { ExtractResponse } from '../shared/types'
import type { RuntimeMessage } from '../shared/messaging'

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' }).catch(() => {})
})

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === 'extract_now') {
    handleExtractNow().then(sendResponse)
    return true
  }

  if (message.type === 'delete_record') {
    deleteRecord(message.payload.kind, message.payload.id)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: Error) => sendResponse({ ok: false, message: error.message }))
    return true
  }

  return false
})

async function handleExtractNow(): Promise<ExtractResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    return { ok: false, message: 'No active tab' }
  }

  try {
    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: 'run_extraction',
    })) as ExtractResponse | undefined

    if (!response) {
      return { ok: false, message: 'Content script did not respond' }
    }
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach content script'
    const fallback = await getCloseData()
    return { ok: false, message, data: fallback }
  }
}

