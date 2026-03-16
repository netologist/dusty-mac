import path from 'node:path'
import { HOME, getDirSize, getDirectChildDirs, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const cacheDir = path.join(HOME, 'Library', 'Caches')
  const paths: string[] = []
  let totalBytes = 0

  if (await pathExists(cacheDir)) {
    const children = await getDirectChildDirs(cacheDir)
    // Filter out browser cache dirs (handled separately) and system-critical ones
    const skip = new Set([
      'com.apple.Safari',
      'Google',
      'org.mozilla.firefox',
      'Microsoft Edge',
      'com.brave.Browser',
      'BraveSoftware',
      'com.operasoftware.Opera',
      'com.apple.dt.Xcode',
    ])
    for (const child of children) {
      const name = path.basename(child)
      if (!skip.has(name)) {
        const size = await getDirSize(child)
        if (size > 0) {
          paths.push(child)
          totalBytes += size
        }
      }
    }
  }

  return {
    id: 'system-caches',
    label: 'System Caches',
    description: 'App caches in ~/Library/Caches (rebuilt automatically)',
    icon: '🗄',
    color: 'cyan',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
