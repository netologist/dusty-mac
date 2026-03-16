import path from 'node:path'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

const BROWSER_CACHE_PATHS = [
  // Safari
  path.join(HOME, 'Library', 'Caches', 'com.apple.Safari'),
  // Chrome
  path.join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Cache'),
  path.join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Code Cache'),
  path.join(HOME, 'Library', 'Caches', 'Google', 'Chrome'),
  // Firefox
  path.join(HOME, 'Library', 'Caches', 'Firefox'),
  // Edge
  path.join(HOME, 'Library', 'Caches', 'Microsoft Edge'),
  path.join(HOME, 'Library', 'Application Support', 'Microsoft Edge', 'Default', 'Cache'),
  // Brave
  path.join(HOME, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser', 'Default', 'Cache'),
  path.join(HOME, 'Library', 'Caches', 'BraveSoftware'),
  // Opera
  path.join(HOME, 'Library', 'Caches', 'com.operasoftware.Opera'),
]

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  for (const p of BROWSER_CACHE_PATHS) {
    if (await pathExists(p)) {
      const size = await getDirSize(p)
      if (size > 0) {
        paths.push(p)
        totalBytes += size
      }
    }
  }

  return {
    id: 'browser-caches',
    label: 'Browser Caches',
    description: 'Safari, Chrome, Firefox, Edge, Brave caches',
    icon: '🌐',
    color: 'blue',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
