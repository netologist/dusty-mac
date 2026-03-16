import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

export const HOME = os.homedir()

export function expandHome(p: string): string {
  if (p.startsWith('~/')) return path.join(HOME, p.slice(2))
  return p
}

export async function getDirSize(dirPath: string): Promise<number> {
  try {
    const stat = await fs.stat(dirPath)
    if (!stat.isDirectory()) return stat.size

    let total = 0
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)
        try {
          if (entry.isSymbolicLink()) {
            // skip symlinks
          } else if (entry.isDirectory()) {
            total += await getDirSize(fullPath)
          } else {
            const s = await fs.stat(fullPath)
            total += s.size
          }
        } catch {
          // skip unreadable
        }
      })
    )
    return total
  } catch {
    return 0
  }
}

export async function getPathSize(p: string): Promise<number> {
  try {
    const stat = await fs.stat(p)
    if (stat.isDirectory()) return getDirSize(p)
    return stat.size
  } catch {
    return 0
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function safeDelete(p: string): Promise<void> {
  await fs.rm(p, { recursive: true, force: true })
}

export async function getDirectChildren(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.map((e) => path.join(dirPath, e.name))
  } catch {
    return []
  }
}

export async function getDirectChildDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(dirPath, e.name))
  } catch {
    return []
  }
}
