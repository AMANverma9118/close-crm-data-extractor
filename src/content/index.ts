import { createIndicator } from '../shared/shadowIndicator'
import { saveSnapshot } from '../shared/storage'
import { extractSnapshot } from '../shared/extraction'
import type { ExtractResponse } from '../shared/types'
import type { RuntimeMessage } from '../shared/messaging'

const indicator = createIndicator()

function waitForDomIdle() {
  return new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) {
      ;(window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        () => resolve(),
      )
    } else {
      setTimeout(resolve, 250)
    }
  })
}

async function runExtraction(): Promise<ExtractResponse> {
  indicator.update('running', 'Extracting…')
  try {
    await waitForDomIdle()
    const snapshot = extractSnapshot()
    const { data, skipped } = await saveSnapshot(snapshot)
    indicator.update('success', skipped ? 'Skipped (stale)' : 'Saved')
    return { ok: true, data, message: skipped ? 'Older snapshot skipped' : 'Extraction complete' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed'
    indicator.update('error', message)
    return { ok: false, message }
  }
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message?.type === 'run_extraction') {
    runExtraction().then(sendResponse)
    return true
  }
  return false
})

