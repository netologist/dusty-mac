import path from 'node:path'
import fs from 'node:fs/promises'
import glob from 'fast-glob'
import { HOME, getPathSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  // /private/tmp contents
  const tmpDir = '/private/tmp'
  if (await pathExists(tmpDir)) {
    try {
      const entries = await fs.readdir(tmpDir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(tmpDir, entry.name)
        const size = await getPathSize(full)
        if (size > 0) {
          paths.push(full)
          totalBytes += size
        }
      }
    } catch {
      // skip
    }
  }

  // .DS_Store files (5 levels deep in HOME, excluding hidden dirs like .git)
  try {
    const dsStores = await glob('**/.DS_Store', {
      cwd: HOME,
      deep: 5,
      dot: true,
      ignore: ['Library/**', '.Trash/**', 'node_modules/**'],
      absolute: true,
      followSymbolicLinks: false,
    })
    for (const ds of dsStores) {
      paths.push(ds)
      totalBytes += 4096 // .DS_Store is tiny
    }
  } catch {
    // skip
  }

  return {
    id: 'temp-dsstore',
    label: 'Temp & .DS_Store',
    description: '/private/tmp contents and Finder metadata files',
    icon: '🧹',
    color: 'white',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
