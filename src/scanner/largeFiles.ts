import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'
import { HOME } from '../cleaner/utils.js'
import type { ScanResult, PathDetail } from './types.js'

const MIN_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_RESULTS = 50
const MAX_DEPTH = 8

// Directories to skip entirely
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.Trash',
  'Library/Mail',
  'Photos Library.photoslibrary',
])

async function findLargeFiles(
  dir: string,
  depth: number,
  results: PathDetail[]
): Promise<void> {
  if (depth > MAX_DEPTH) return
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true }) as Dirent[]
  } catch {
    return
  }

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith('.') && depth > 1) return
      const fullPath = path.join(dir, entry.name)

      if (entry.isSymbolicLink()) return

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) return
        await findLargeFiles(fullPath, depth + 1, results)
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(fullPath)
          if (stat.size >= MIN_SIZE) {
            results.push({ path: fullPath, bytes: stat.size, label: entry.name })
          }
        } catch {
          // skip
        }
      }
    })
  )
}

export async function scan(): Promise<ScanResult> {
  const raw: PathDetail[] = []
  await findLargeFiles(HOME, 0, raw)

  // Sort by size descending, keep top N
  raw.sort((a, b) => b.bytes - a.bytes)
  const top = raw.slice(0, MAX_RESULTS)

  const paths = top.map((d) => d.path)
  const totalBytes = top.reduce((s, d) => s + d.bytes, 0)

  return {
    id: 'large-files',
    label: 'Large Files',
    description: `Files over 50 MB (top ${MAX_RESULTS} by size)`,
    icon: '📦',
    color: 'yellow',
    paths,
    totalBytes,
    selected: false,  // user must explicitly choose — destructive
    status: 'done',
    details: top,
  }
}
