import type { ScanResult, ScanCallback } from './types.js'
import { scan as scanSystemCaches } from './systemCaches.js'
import { scan as scanLogs } from './logs.js'
import { scan as scanBrowserCaches } from './browserCaches.js'
import { scan as scanXcodeJunk } from './xcodeJunk.js'
import { scan as scanIosSimulators } from './iosSimulators.js'
import { scan as scanIosBackups } from './iosBackups.js'
import { scan as scanNodeModules } from './nodeModules.js'
import { scan as scanPmCaches } from './packageManagerCaches.js'
import { scan as scanAppLeftovers } from './appLeftovers.js'
import { scan as scanTrash } from './trash.js'
import { scan as scanTempDsStore } from './tempAndDsStore.js'
import { scan as scanMailDownloads } from './mailDownloads.js'
import { scan as scanBuildCaches } from './buildCaches.js'
import { scan as scanLargeFiles } from './largeFiles.js'
import { scan as scanLoginItems } from './loginItems.js'
import { scan as scanDuplicates } from './duplicates.js'
import { scan as scanSoftwareUpdates } from './softwareUpdates.js'

const SCANNERS: Array<{ id: string; fn: () => Promise<ScanResult> }> = [
  { id: 'system-caches', fn: scanSystemCaches },
  { id: 'logs', fn: scanLogs },
  { id: 'browser-caches', fn: scanBrowserCaches },
  { id: 'xcode-junk', fn: scanXcodeJunk },
  { id: 'ios-simulators', fn: scanIosSimulators },
  { id: 'ios-backups', fn: scanIosBackups },
  { id: 'node-modules', fn: scanNodeModules },
  { id: 'pm-caches', fn: scanPmCaches },
  { id: 'app-leftovers', fn: scanAppLeftovers },
  { id: 'trash', fn: scanTrash },
  { id: 'temp-dsstore', fn: scanTempDsStore },
  { id: 'mail-downloads', fn: scanMailDownloads },
  { id: 'build-caches', fn: scanBuildCaches },
  { id: 'large-files', fn: scanLargeFiles },
  { id: 'login-items', fn: scanLoginItems },
  { id: 'duplicates', fn: scanDuplicates },
  { id: 'sw-updates', fn: scanSoftwareUpdates },
]

export { SCANNERS }
export type { ScanResult, ScanCallback }

export async function runAllScanners(onUpdate: ScanCallback): Promise<ScanResult[]> {
  const results: ScanResult[] = []

  await Promise.allSettled(
    SCANNERS.map(async ({ id, fn }) => {
      onUpdate(id, 'scanning')
      try {
        const result = await fn()
        results.push(result)
        onUpdate(id, 'done', result)
      } catch (err) {
        const errorResult: ScanResult = {
          id,
          label: id,
          description: '',
          icon: '⚠',
          color: 'red',
          paths: [],
          totalBytes: 0,
          selected: false,
          status: 'error',
          error: String(err),
        }
        results.push(errorResult)
        onUpdate(id, 'error', errorResult)
      }
    })
  )

  // Sort by totalBytes descending
  results.sort((a, b) => b.totalBytes - a.totalBytes)
  return results
}
