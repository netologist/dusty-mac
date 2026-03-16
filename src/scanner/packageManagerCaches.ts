import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult, PathDetail } from './types.js'

const execAsync = promisify(exec)

interface CacheEntry {
  path: string
  label: string
}

const PM_CACHE_PATHS: CacheEntry[] = [
  // Node.js ecosystem
  { path: path.join(HOME, '.npm', '_cacache'),       label: 'npm cache' },
  { path: path.join(HOME, '.yarn', 'cache'),          label: 'Yarn classic cache' },
  { path: path.join(HOME, '.yarn', 'berry', 'cache'), label: 'Yarn Berry cache' },
  { path: path.join(HOME, '.pnpm-store'),             label: 'pnpm store' },
  { path: path.join(HOME, '.cache', 'yarn'),          label: 'Yarn global cache' },
  { path: path.join(HOME, '.bun', 'install', 'cache'),label: 'Bun cache' },
  // Python
  { path: path.join(HOME, '.cache', 'pip'),           label: 'pip cache' },
  { path: path.join(HOME, 'Library', 'Caches', 'pip'),label: 'pip macOS cache' },
  { path: path.join(HOME, '.cache', 'pypoetry'),      label: 'Poetry cache' },
  { path: path.join(HOME, 'Library', 'Caches', 'pypoetry'), label: 'Poetry macOS cache' },
  { path: path.join(HOME, '.conda', 'pkgs'),          label: 'conda packages' },
  { path: path.join(HOME, 'opt', 'anaconda3', 'pkgs'),label: 'Anaconda packages' },
  { path: path.join(HOME, 'miniforge3', 'pkgs'),      label: 'Miniforge packages' },
  // Ruby
  { path: path.join(HOME, '.gem'),                    label: 'RubyGems cache' },
  { path: path.join(HOME, 'Library', 'Caches', 'Homebrew'), label: 'Homebrew downloads' },
  // Homebrew
  { path: '/Library/Caches/Homebrew',                 label: 'Homebrew system cache' },
  // Rust / Cargo (caches, not the built artifacts)
  { path: path.join(HOME, '.cargo', 'registry', 'cache'), label: 'Cargo registry cache' },
  { path: path.join(HOME, '.cargo', 'registry', 'src'),   label: 'Cargo registry src' },
]

async function getHomebrewCachePath(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('brew --cache 2>/dev/null')
    return stdout.trim() || null
  } catch {
    return null
  }
}

export async function scan(): Promise<ScanResult> {
  // Dynamically resolve Homebrew cache path (handles Apple Silicon /opt/homebrew)
  const brewCache = await getHomebrewCachePath()
  const entries: CacheEntry[] = [...PM_CACHE_PATHS]
  if (brewCache && !entries.some((e) => e.path === brewCache)) {
    entries.push({ path: brewCache, label: 'Homebrew cache (brew --cache)' })
  }

  const details: PathDetail[] = []
  const paths: string[] = []
  let totalBytes = 0

  await Promise.all(
    entries.map(async ({ path: p, label }) => {
      if (await pathExists(p)) {
        const size = await getDirSize(p)
        if (size > 0) {
          details.push({ path: p, bytes: size, label })
          paths.push(p)
          totalBytes += size
        }
      }
    })
  )

  // Sort by size descending
  details.sort((a, b) => b.bytes - a.bytes)

  return {
    id: 'pm-caches',
    label: 'Package Manager Caches',
    description: 'npm, yarn, pnpm, bun, pip, conda, gem, Homebrew caches',
    icon: '📥',
    color: 'green',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
    details,
  }
}
