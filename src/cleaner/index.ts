import { safeDelete, getDirSize } from './utils.js'
import type { ScanResult, CleanProgress } from '../scanner/types.js'

export type CleanCallback = (progress: CleanProgress) => void

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
        currentPath: p,
        bytesFreed,
        totalBytes: category.totalBytes,
        done: false,
      })

      try {
        const size = await getDirSize(p)
        await safeDelete(p)
        bytesFreed += size
      } catch (err) {
        onProgress({
          categoryId: category.id,
          currentPath: p,
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
