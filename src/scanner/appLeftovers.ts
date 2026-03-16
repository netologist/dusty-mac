import path from 'node:path'
import fs from 'node:fs/promises'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult, PathDetail } from './types.js'

async function getInstalledAppNames(): Promise<Set<string>> {
  const names = new Set<string>()
  const appDirs = ['/Applications', path.join(HOME, 'Applications')]
  for (const dir of appDirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.endsWith('.app')) {
          // e.g. "Slack.app" → "Slack", "Google Chrome.app" → "Google Chrome"
          names.add(entry.name.replace(/\.app$/, '').toLowerCase())
        }
      }
    } catch {
      // skip
    }
  }
  return names
}

// Map bundle ID prefixes/names to known app names
function bundleIdToAppName(bundleId: string): string {
  // com.apple.* are system apps — always keep
  // com.google.Chrome → "google chrome"
  // com.spotify.client → "spotify"
  const parts = bundleId.toLowerCase().split('.')
  if (parts.length >= 3) return parts.slice(2).join(' ').replace(/[-_]/g, ' ')
  return bundleId.toLowerCase()
}

export async function scan(): Promise<ScanResult> {
  const installedApps = await getInstalledAppNames()
  const paths: string[] = []
  const details: PathDetail[] = []
  let totalBytes = 0

  const scanDirs = [
    path.join(HOME, 'Library', 'Application Support'),
    path.join(HOME, 'Library', 'Containers'),
  ]

  for (const dir of scanDirs) {
    if (!(await pathExists(dir))) continue
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const name = entry.name

        // Skip known system/apple entries
        if (name.startsWith('com.apple.') || name === 'Apple') continue
        if (name.startsWith('MobileSync')) continue

        const appName = bundleIdToAppName(name)

        // Check if any installed app name is contained in this entry
        const isInstalled = Array.from(installedApps).some(
          (app) => appName.includes(app) || app.includes(appName.split(' ')[0])
        )

        if (!isInstalled) {
          const full = path.join(dir, name)
          const size = await getDirSize(full)
          if (size > 1024 * 1024) { // > 1 MB threshold
            paths.push(full)
            details.push({ path: full, bytes: size, label: name })
            totalBytes += size
          }
        }
      }
    } catch {
      // skip
    }
  }

  details.sort((a, b) => b.bytes - a.bytes)

  return {
    id: 'app-leftovers',
    label: 'App Leftovers',
    description: 'Data left behind by uninstalled applications',
    icon: '🗑',
    color: 'red',
    paths,
    totalBytes,
    selected: false,
    status: 'done',
    details,
  }
}
