import path from 'node:path'
import { HOME, getDirSize, getDirectChildDirs, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const backupDir = path.join(HOME, 'Library', 'Application Support', 'MobileSync', 'Backup')
  const paths: string[] = []
  let totalBytes = 0

  if (await pathExists(backupDir)) {
    const backups = await getDirectChildDirs(backupDir)
    for (const backup of backups) {
      const size = await getDirSize(backup)
      if (size > 0) {
        paths.push(backup)
        totalBytes += size
      }
    }
  }

  return {
    id: 'ios-backups',
    label: 'iOS Device Backups',
    description: 'Local iPhone/iPad backups (keep your most recent!)',
    icon: '💾',
    color: 'yellow',
    paths,
    totalBytes,
    selected: false,
    status: 'done',
  }
}
