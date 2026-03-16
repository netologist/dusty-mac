import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { ScanResult, PathDetail } from './types.js'

const execAsync = promisify(exec)

interface OutdatedPackage {
  name: string
  current: string
  latest: string
  source: string // 'brew' | 'npm-global' | 'gem'
}

async function getOutdatedBrew(): Promise<OutdatedPackage[]> {
  try {
    const { stdout } = await execAsync('brew outdated --json=v2 2>/dev/null', { timeout: 15000 })
    const data = JSON.parse(stdout)
    const results: OutdatedPackage[] = []

    for (const f of (data.formulae ?? [])) {
      results.push({
        name: f.name,
        current: f.installed_versions?.[0] ?? '?',
        latest: f.current_version ?? '?',
        source: 'brew',
      })
    }
    for (const c of (data.casks ?? [])) {
      results.push({
        name: c.name,
        current: c.installed_versions?.[0] ?? '?',
        latest: c.current_version ?? '?',
        source: 'brew-cask',
      })
    }
    return results
  } catch {
    return []
  }
}

async function getOutdatedNpmGlobal(): Promise<OutdatedPackage[]> {
  try {
    const { stdout } = await execAsync('npm outdated -g --json 2>/dev/null', { timeout: 15000 })
    if (!stdout.trim()) return []
    const data = JSON.parse(stdout)
    return Object.entries(data).map(([name, info]: [string, any]) => ({
      name,
      current: info.current ?? '?',
      latest: info.latest ?? '?',
      source: 'npm-global',
    }))
  } catch {
    return []
  }
}

export async function scan(): Promise<ScanResult> {
  const [brew, npm] = await Promise.all([
    getOutdatedBrew(),
    getOutdatedNpmGlobal(),
  ])

  const all = [...brew, ...npm]

  // These are not deletable paths — we model them as zero-byte entries
  // so they appear in detail view as informational items
  const details: PathDetail[] = all.map((p) => ({
    path: `__update__:${p.source}:${p.name}`,
    bytes: 0,
    label: `${p.name}  ${p.current} → ${p.latest}  [${p.source}]`,
  }))

  return {
    id: 'sw-updates',
    label: 'Software Updates',
    description: `${all.length} outdated packages (brew, npm global)`,
    icon: '🔄',
    color: 'blue',
    paths: [],           // informational only — no deletion
    totalBytes: 0,
    selected: false,
    status: 'done',
    details,
  }
}
