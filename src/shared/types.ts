export type Contact = {
  id: string
  name: string
  emails: string[]
  phones: string[]
  lead: string
}

export type Opportunity = {
  id: string
  name: string
  value: number | null
  confidence: string
  status: string
  closeDate: string | null
  user: string; 
}

export type Task = {
  id: string
  description: string
  dueDate: string | null
  assignee: string
  done: boolean
}

export type CloseData = {
  contacts: Contact[]
  opportunities: Opportunity[]
  tasks: Task[]
  lastSync: number
}

export type CloseView = 'contacts' | 'opportunities' | 'tasks' | 'unknown'

export type ExtractionSnapshot = Partial<CloseData> & {
  view: CloseView
  timestamp: number
}

export type RecordKind = 'contacts' | 'opportunities' | 'tasks'

export type ExtractResponse =
  | { ok: true; message?: string; data: CloseData }
  | { ok: false; message: string; data?: CloseData }

