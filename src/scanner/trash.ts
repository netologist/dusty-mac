import path from 'node:path'
import fs from 'node:fs/promises'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  // Main user trash
  const mainTrash = path.join(HOME, '.Trash')
  if (await pathExists(mainTrash)) {
    const size = await getDirSize(mainTrash)
    if (size > 0) {
      paths.push(mainTrash)
      totalBytes += size
    }
  }

  // External volume trash bins
  try {
    const volumes = await fs.readdir('/Volumes', { withFileTypes: true })
    const uid = process.getuid ? process.getuid() : 0
    for (const vol of volumes) {
      if (!vol.isDirectory() && !vol.isSymbolicLink()) continue
      const trashPath = path.join('/Volumes', vol.name, '.Trashes', String(uid))
      if (await pathExists(trashPath)) {
        const size = await getDirSize(trashPath)
        if (size > 0) {
          paths.push(trashPath)
          totalBytes += size
        }
      }
    }
  } catch {
    // skip
  }

  return {
    id: 'trash',
    label: 'Trash Bins',
    description: 'Items in Trash (main + external volumes)',
    icon: '🗑',
    color: 'red',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
