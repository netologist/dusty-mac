export interface PathDetail {
  path: string
  bytes: number
  label?: string  // human-friendly name (e.g. app name, file name)
}

export interface ScanResult {
  id: string
  label: string
  description: string
  icon: string
  color: string
  paths: string[]
  totalBytes: number
  selected: boolean
  status: 'pending' | 'scanning' | 'done' | 'error'
  error?: string
  details?: PathDetail[]  // per-path breakdown for detail screen
}

export interface CleanProgress {
  categoryId: string
  currentPath: string
  bytesFreed: number
  totalBytes: number
  done: boolean
  error?: string
}

export type ScanCallback = (id: string, status: 'scanning' | 'done' | 'error', result?: Partial<ScanResult>) => void
