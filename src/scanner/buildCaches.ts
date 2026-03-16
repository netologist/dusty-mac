import path from 'node:path'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

const BUILD_CACHE_PATHS = [
  // Gradle
  path.join(HOME, '.gradle', 'caches'),
  // Maven
  path.join(HOME, '.m2', 'repository'),
  // Rust/Cargo
  path.join(HOME, '.cargo', 'registry'),
  path.join(HOME, '.cargo', 'git'),
  // Python pip
  path.join(HOME, '.cache', 'pip'),
  // Ruby gems (unused versions)
  path.join(HOME, '.gem'),
  // CocoaPods
  path.join(HOME, 'Library', 'Caches', 'CocoaPods'),
  // Swift Package Manager
  path.join(HOME, 'Library', 'Caches', 'org.swift.swiftpm'),
  // Go module cache
  path.join(HOME, 'go', 'pkg', 'mod', 'cache'),
]

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  for (const p of BUILD_CACHE_PATHS) {
    if (await pathExists(p)) {
      const size = await getDirSize(p)
      if (size > 0) {
        paths.push(p)
        totalBytes += size
      }
    }
  }

  return {
    id: 'build-caches',
    label: 'Build Tool Caches',
    description: 'Gradle, Maven, Cargo, pip, CocoaPods, Go module caches',
    icon: '⚙️',
    color: 'magenta',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
