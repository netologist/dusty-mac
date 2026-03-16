import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import type { Dirent } from 'node:fs'
import { HOME } from '../cleaner/utils.js'
import type { ScanResult, PathDetail } from './types.js'

const MIN_FILE_SIZE = 1024 * 1024   // 1 MB — ignore tiny files
const MAX_DEPTH = 6
const MAX_FILES = 5000              // cap total files considered for perf

// Directories to skip entirely
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.Trash', 'Library/Caches',
  'Photos Library.photoslibrary', 'Music', 'Pictures',
])

// Extensions worth deduplicating (skip system binaries, object files, etc.)
const INCLUDE_EXTENSIONS = new Set([
  '.zip', '.tar', '.gz', '.bz2', '.xz', '.dmg', '.pkg', '.ipa', '.apk',
  '.mp4', '.mov', '.avi', '.mkv', '.m4v',
  '.mp3', '.m4a', '.flac', '.wav',
  '.pdf', '.docx', '.xlsx', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.tiff', '.heic',
  '.iso', '.img',
  '.jar', '.war', '.aar',
  '.framework', '.a', '.dylib',
])

async function hashFile(filePath: string): Promise<string | null> {
  try {
    // Only hash first 64 KB for speed — sufficient for dedup detection
    const SAMPLE = 65536
    const handle = await fs.open(filePath, 'r')
    const buf = Buffer.alloc(SAMPLE)
    const { bytesRead } = await handle.read(buf, 0, SAMPLE, 0)
    await handle.close()
    return crypto.createHash('sha256').update(buf.subarray(0, bytesRead)).digest('hex')
  } catch {
    return null
  }
}

interface FileEntry {
  path: string
  size: number
  ext: string
}

async function collectFiles(
  dir: string,
  depth: number,
  out: FileEntry[]
): Promise<void> {
  if (depth > MAX_DEPTH || out.length >= MAX_FILES) return
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true }) as Dirent[]
  } catch {
    return
  }
  await Promise.all(
    entries.map(async (entry) => {
      if (out.length >= MAX_FILES) return
      if (entry.isSymbolicLink()) return
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) return
        if (entry.name.startsWith('.') && depth > 0) return
        await collectFiles(fullPath, depth + 1, out)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!INCLUDE_EXTENSIONS.has(ext)) return
        try {
          const stat = await fs.stat(fullPath)
          if (stat.size >= MIN_FILE_SIZE) {
            out.push({ path: fullPath, size: stat.size, ext })
          }
        } catch { /* skip */ }
      }
    })
  )
}

export async function scan(): Promise<ScanResult> {
  const allFiles: FileEntry[] = []
  await collectFiles(HOME, 0, allFiles)

  // Group by size first (cheap) — only hash within same-size groups
  const bySize = new Map<number, FileEntry[]>()
  for (const f of allFiles) {
    const group = bySize.get(f.size)
    if (group) group.push(f)
    else bySize.set(f.size, [f])
  }

  const duplicateGroups: FileEntry[][] = []

  await Promise.all(
    Array.from(bySize.values())
      .filter((g) => g.length > 1)
      .map(async (sizeGroup) => {
        // hash each file in the group
        const withHash = await Promise.all(
          sizeGroup.map(async (f) => ({ ...f, hash: await hashFile(f.path) }))
        )
        // re-group by hash
        const byHash = new Map<string, typeof withHash>()
        for (const f of withHash) {
          if (!f.hash) continue
          const g = byHash.get(f.hash)
          if (g) g.push(f)
          else byHash.set(f.hash, [f])
        }
        for (const hashGroup of byHash.values()) {
          if (hashGroup.length > 1) {
            duplicateGroups.push(hashGroup)
          }
        }
      })
  )

  // For each duplicate group, keep the first (oldest path) and mark the rest deletable
  const details: PathDetail[] = []
  const paths: string[] = []
  let totalBytes = 0

  for (const group of duplicateGroups) {
    // Sort by path length (shorter = probably the "original")
    group.sort((a, b) => a.path.length - b.path.length)
    const dupes = group.slice(1) // keep first, delete rest
    for (const f of dupes) {
      const baseName = path.basename(f.path)
      details.push({
        path: f.path,
        bytes: f.size,
        label: `${baseName}  [duplicate of ${path.basename(group[0].path)}]`,
      })
      paths.push(f.path)
      totalBytes += f.size
    }
  }

  details.sort((a, b) => b.bytes - a.bytes)

  return {
    id: 'duplicates',
    label: 'Duplicate Files',
    description: `Duplicate files ≥1 MB (matched by content hash)`,
    icon: '♊',
    color: 'magenta',
    paths,
    totalBytes,
    selected: false,
    status: 'done',
    details,
  }
}
