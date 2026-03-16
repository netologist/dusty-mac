import path from 'node:path'
import { HOME, getDirSize, getDirectChildDirs, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  const candidates = [
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'DerivedData'),
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'Archives'),
    path.join(HOME, 'Library', 'Caches', 'com.apple.dt.Xcode'),
  ]

  for (const p of candidates) {
    if (!(await pathExists(p))) continue
    const children = await getDirectChildDirs(p)
    for (const child of children) {
      const size = await getDirSize(child)
      if (size > 0) {
        paths.push(child)
        totalBytes += size
      }
    }
  }

  // iOS/watchOS/tvOS DeviceSupport — show each version separately
  const devSupportParents = [
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'iOS DeviceSupport'),
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'watchOS DeviceSupport'),
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'tvOS DeviceSupport'),
    path.join(HOME, 'Library', 'Developer', 'Xcode', 'visionOS DeviceSupport'),
  ]
  for (const parent of devSupportParents) {
    if (!(await pathExists(parent))) continue
    const versions = await getDirectChildDirs(parent)
    for (const versionDir of versions) {
      const size = await getDirSize(versionDir)
      if (size > 0) {
        paths.push(versionDir)
        totalBytes += size
      }
    }
  }

  return {
    id: 'xcode-junk',
    label: 'Xcode Junk',
    description: 'DerivedData, archives, iOS/watchOS device support files',
    icon: '🔨',
    color: 'magenta',
    paths,
    totalBytes,
    selected: false,
    status: 'done',
  }
}
