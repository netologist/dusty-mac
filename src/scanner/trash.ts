import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { ScanResult } from './types.js'

const execAsync = promisify(exec)

// Sentinel path — the cleaner checks for this and calls osascript instead of safeDelete
export const TRASH_SENTINEL = '__macos_trash__'

async function getTrashInfo(): Promise<{ totalBytes: number; itemCount: number }> {
  try {
    // Get item count first — fast and reliable
    const { stdout: countOut } = await execAsync(
      `osascript -e 'tell application "Finder" to get count of items in trash'`,
      { timeout: 10_000 }
    )
    const itemCount = parseInt(countOut.trim(), 10)
    if (isNaN(itemCount) || itemCount === 0) return { totalBytes: 0, itemCount: 0 }

    // Sum sizes item by item — "get size of trash" returns missing value on some systems
    const { stdout: sizeOut } = await execAsync(
      `osascript -e 'tell application "Finder"
  set trashItems to items in trash
  set totalSize to 0
  repeat with i in trashItems
    try
      set totalSize to totalSize + (size of i)
    end try
  end repeat
  return totalSize
end tell'`,
      { timeout: 30_000 }
    )
    const totalBytes = parseInt(sizeOut.trim(), 10)
    return { totalBytes: isNaN(totalBytes) ? 0 : totalBytes, itemCount }
  } catch {
    return { totalBytes: 0, itemCount: 0 }
  }
}

export async function scan(): Promise<ScanResult> {
  const { totalBytes, itemCount } = await getTrashInfo()

  return {
    id: 'trash',
    label: 'Trash Bins',
    description: itemCount > 0
      ? `${itemCount} item${itemCount === 1 ? '' : 's'} in Trash — emptied via macOS Finder`
      : 'Trash is empty',
    icon: '🗑',
    color: 'red',
    paths: itemCount > 0 ? [TRASH_SENTINEL] : [],
    totalBytes,
    selected: true,
    status: 'done',
  }
}
