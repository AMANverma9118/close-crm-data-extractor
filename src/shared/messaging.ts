import type { ExtractResponse, RecordKind } from './types'

export type RuntimeMessage =
  | { type: 'extract_now' }
  | { type: 'run_extraction' }
  | { type: 'delete_record'; payload: { kind: RecordKind; id: string } }

export type ContentMessage = ExtractResponse

export async function sendMessage<T = unknown>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message)
}

