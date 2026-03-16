import path from 'node:path'
import { HOME, getDirSize, getDirectChildDirs, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const paths: string[] = []
  let totalBytes = 0

  const simulatorDirs = [
    path.join(HOME, 'Library', 'Developer', 'CoreSimulator', 'Devices'),
    path.join(HOME, 'Library', 'Developer', 'CoreSimulator', 'Caches'),
  ]

  for (const dir of simulatorDirs) {
    if (!(await pathExists(dir))) continue
    const children = await getDirectChildDirs(dir)
    for (const child of children) {
      const size = await getDirSize(child)
      if (size > 0) {
        paths.push(child)
        totalBytes += size
      }
    }
  }

  // Simulator runtime images
  const runtimesDir = path.join(HOME, 'Library', 'Developer', 'CoreSimulator', 'Profiles', 'Runtimes')
  if (await pathExists(runtimesDir)) {
    const runtimes = await getDirectChildDirs(runtimesDir)
    for (const runtime of runtimes) {
      const size = await getDirSize(runtime)
      if (size > 0) {
        paths.push(runtime)
        totalBytes += size
      }
    }
  }

  return {
    id: 'ios-simulators',
    label: 'iOS Simulators',
    description: 'Simulator device images and runtime caches',
    icon: '📱',
    color: 'cyan',
    paths,
    totalBytes,
    selected: false,
    status: 'done',
  }
}
