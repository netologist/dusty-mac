import path from 'node:path'
import glob from 'fast-glob'
import { HOME, getDirSize } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  // Scan up to 5 levels deep for node_modules, but skip nested ones
  try {
    const matches = await glob('**/node_modules', {
      cwd: HOME,
      onlyDirectories: true,
      deep: 6,
      ignore: [
        '**/node_modules/**/node_modules',
        '.Trash/**',
        'Library/**',
        '.npm/**',
        '.yarn/**',
        '.pnpm-store/**',
      ],
      absolute: true,
      followSymbolicLinks: false,
    })

    for (const match of matches) {
      const size = await getDirSize(match)
      if (size > 1024 * 1024) { // only show > 1MB
        paths.push(match)
        totalBytes += size
      }
    }
  } catch {
    // permission issues etc
  }

  return {
    id: 'node-modules',
    label: 'node_modules',
    description: 'npm package directories (reinstall with npm install)',
    icon: '📦',
    color: 'green',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
