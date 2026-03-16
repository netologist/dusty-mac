import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { safeDelete, getDirSize } from './utils.js'
import { TRASH_SENTINEL } from '../scanner/trash.js'
import type { ScanResult, CleanProgress } from '../scanner/types.js'

const execAsync = promisify(exec)

export type CleanCallback = (progress: CleanProgress) => void

async function emptyTrashViaOsascript(): Promise<void> {
  await execAsync(
    `osascript -e 'tell application "Finder" to empty trash'`,
    { timeout: 60_000 }
  )
}

export async function cleanCategories(
  categories: ScanResult[],
  onProgress: CleanCallback
): Promise<Map<string, number>> {
  const freed = new Map<string, number>()

  for (const category of categories) {
    let bytesFreed = 0

    for (const p of category.paths) {
      onProgress({
        categoryId: category.id,
        currentPath: p === TRASH_SENTINEL ? 'Emptying Trash via Finder...' : p,
        bytesFreed,
        totalBytes: category.totalBytes,
        done: false,
      })

      try {
        if (p === TRASH_SENTINEL) {
          // Use osascript — the only way to empty Trash without Full Disk Access
          await emptyTrashViaOsascript()
          bytesFreed += category.totalBytes
        } else {
          const size = await getDirSize(p)
          await safeDelete(p)
          bytesFreed += size
        }
      } catch (err) {
        onProgress({
          categoryId: category.id,
          currentPath: p === TRASH_SENTINEL ? 'Emptying Trash via Finder...' : p,
          bytesFreed,
          totalBytes: category.totalBytes,
          done: false,
          error: String(err),
        })
      }
    }

    freed.set(category.id, bytesFreed)
    onProgress({
      categoryId: category.id,
      currentPath: '',
      bytesFreed,
      totalBytes: category.totalBytes,
      done: true,
    })
  }

  return freed
}
