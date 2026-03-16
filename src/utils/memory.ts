import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface MemoryStats {
  totalBytes: number
  usedBytes: number
  freeBytes: number
  wiredBytes: number
  compressedBytes: number
  appBytes: number
  pressurePercent: number  // 0-100
}

const PAGE_SIZE = 16384 // 16 KB default on Apple Silicon / Intel macOS

function parseVmStat(output: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const line of output.split('\n')) {
    const m = line.match(/^(.+?):\s+(\d+)/)
    if (m) result[m[1].trim()] = parseInt(m[2], 10)
  }
  return result
}

export async function getMemoryStats(): Promise<MemoryStats> {
  try {
    const [vmStatOut, sysctlOut] = await Promise.all([
      execAsync('vm_stat').then((r) => r.stdout),
      execAsync('sysctl hw.memsize').then((r) => r.stdout),
    ])

    const stats = parseVmStat(vmStatOut)
    const totalBytes = parseInt(sysctlOut.split(':')[1].trim(), 10)

    // Page size override from vm_stat header if present
    const pageSizeMatch = vmStatOut.match(/page size of (\d+) bytes/)
    const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : PAGE_SIZE

    const freePages = stats['Pages free'] ?? 0
    const activePages = stats['Pages active'] ?? 0
    const inactivePages = stats['Pages inactive'] ?? 0
    const wiredPages = stats['Pages wired down'] ?? 0
    const compressedPages = stats['Pages occupied by compressor'] ?? 0
    const speculativePages = stats['Pages speculative'] ?? 0

    const freeBytes = (freePages + speculativePages) * pageSize
    const wiredBytes = wiredPages * pageSize
    const compressedBytes = compressedPages * pageSize
    const appBytes = activePages * pageSize
    const usedBytes = totalBytes - freeBytes - (inactivePages * pageSize)

    // Pressure heuristic: (used - free) / total
    const pressurePercent = Math.min(100, Math.round((usedBytes / totalBytes) * 100))

    return {
      totalBytes,
      usedBytes: Math.max(0, usedBytes),
      freeBytes,
      wiredBytes,
      compressedBytes,
      appBytes,
      pressurePercent,
    }
  } catch {
    return {
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      wiredBytes: 0,
      compressedBytes: 0,
      appBytes: 0,
      pressurePercent: 0,
    }
  }
}

export type FreeMemoryResult =
  | { success: true }
  | { success: false; needsPassword: true }
  | { success: false; needsPassword: false; error: string }

/**
 * Attempt to free RAM via `purge`.
 * 1. First tries `sudo -n purge` (no password prompt — succeeds if NOPASSWD is set)
 * 2. If that fails and a password is provided, pipes it via `sudo -S purge`
 * 3. If no password provided and no-password sudo fails, signals back needsPassword=true
 */
export async function freeMemory(password?: string): Promise<FreeMemoryResult> {
  // Attempt 1: no-password sudo (works if NOPASSWD configured, or already have a sudo session)
  try {
    await execAsync('sudo -n purge', { timeout: 10000 })
    return { success: true }
  } catch {
    // falls through
  }

  // Attempt 2: use supplied password
  if (password) {
    try {
      await execAsync(`echo ${JSON.stringify(password)} | sudo -S purge`, { timeout: 10000 })
      return { success: true }
    } catch (err) {
      const msg = String(err)
      if (msg.includes('incorrect password') || msg.includes('Sorry')) {
        return { success: false, needsPassword: true }
      }
      return { success: false, needsPassword: false, error: msg }
    }
  }

  // Signal that we need a password
  return { success: false, needsPassword: true }
}
