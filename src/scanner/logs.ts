import path from 'node:path'
import fs from 'node:fs/promises'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

async function collectLogPaths(): Promise<{ paths: string[]; totalBytes: number }> {
  const dirs = [
    path.join(HOME, 'Library', 'Logs'),
    path.join(HOME, 'Library', 'Application Support', 'CrashReporter'),
    path.join(HOME, 'Library', 'Containers', 'com.apple.mail', 'Data', 'Library', 'Logs'),
  ]

  const paths: string[] = []
  let totalBytes = 0

  for (const dir of dirs) {
    if (!(await pathExists(dir))) continue
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        const size = await getDirSize(full)
        if (size > 0) {
          paths.push(full)
          totalBytes += size
        }
      }
    } catch {
      // skip
    }
  }

  return { paths, totalBytes }
}

export async function scan(): Promise<ScanResult> {
  const { paths, totalBytes } = await collectLogPaths()

  return {
    id: 'logs',
    label: 'Log Files',
    description: 'App logs and crash reports (safe to delete)',
    icon: '📋',
    color: 'yellow',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
