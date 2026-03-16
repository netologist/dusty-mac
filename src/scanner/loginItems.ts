import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'
import { HOME, pathExists, getPathSize } from '../cleaner/utils.js'
import type { ScanResult, PathDetail } from './types.js'

// Launch agents/daemons locations (user-writable only, no sudo needed)
const LAUNCH_AGENT_DIRS = [
  path.join(HOME, 'Library', 'LaunchAgents'),
  '/Library/LaunchAgents',
  '/Library/LaunchDaemons',
]

function extractLabel(plistPath: string): string {
  return path.basename(plistPath, '.plist')
}

async function readPlistLabel(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const m = content.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/)
    return m ? m[1] : extractLabel(filePath)
  } catch {
    return extractLabel(filePath)
  }
}

export async function scan(): Promise<ScanResult> {
  const details: PathDetail[] = []
  const paths: string[] = []
  let totalBytes = 0

  for (const dir of LAUNCH_AGENT_DIRS) {
    if (!(await pathExists(dir))) continue
    let entries: Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true }) as Dirent[]
    } catch {
      continue
    }

    await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.plist'))
        .map(async (e) => {
          const fullPath = path.join(dir, e.name)
          const [size, label] = await Promise.all([
            getPathSize(fullPath),
            readPlistLabel(fullPath),
          ])
          details.push({ path: fullPath, bytes: size, label })
          paths.push(fullPath)
          totalBytes += size
        })
    )
  }

  // Sort alphabetically by label
  details.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''))

  return {
    id: 'login-items',
    label: 'Login & Launch Items',
    description: 'LaunchAgents and LaunchDaemons plist files',
    icon: '🚀',
    color: 'cyan',
    paths,
    totalBytes,
    selected: false,  // user must consciously choose what to remove
    status: 'done',
    details,
  }
}
