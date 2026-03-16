import path from 'node:path'
import { HOME, getDirSize, pathExists } from '../cleaner/utils.js'
import type { ScanResult } from './types.js'

export async function scan(): Promise<ScanResult> {
  const mailDownloads = path.join(
    HOME,
    'Library',
    'Containers',
    'com.apple.mail',
    'Data',
    'Library',
    'Mail Downloads'
  )

  const paths: string[] = []
  let totalBytes = 0

  if (await pathExists(mailDownloads)) {
    const size = await getDirSize(mailDownloads)
    if (size > 0) {
      paths.push(mailDownloads)
      totalBytes = size
    }
  }

  return {
    id: 'mail-downloads',
    label: 'Mail Downloads',
    description: 'Attachments downloaded from Apple Mail',
    icon: '📧',
    color: 'blue',
    paths,
    totalBytes,
    selected: true,
    status: 'done',
  }
}
