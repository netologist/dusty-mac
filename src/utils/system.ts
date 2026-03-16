import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const execAsync = promisify(exec)
const HOME = os.homedir()

export interface DiskVolume {
  mountPoint: string
  name: string
  totalBytes: number
  usedBytes: number
  availableBytes: number
  usedPercent: number
  isVirtual: boolean    // colima, docker, VM images
  virtualHint?: string  // e.g. "Colima VM" / "Docker Desktop" / "QEMU"
}

export interface CpuLoad {
  user: number    // 0-100
  system: number
  idle: number
  loadAvg1: number
  loadAvg5: number
  loadAvg15: number
}

export interface TopProcess {
  pid: number
  name: string
  cpuPercent: number
  memPercent: number
  memBytes: number
}

export interface SystemStats {
  disks: DiskVolume[]
  cpu: CpuLoad
  topProcesses: TopProcess[]
  uptime: string
  hostname: string
  macosVersion: string
}

// ---------- Disk ----------

const VIRTUAL_PATTERNS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /colima/i,         hint: 'Colima VM' },
  { pattern: /docker/i,         hint: 'Docker Desktop' },
  { pattern: /qemu/i,           hint: 'QEMU VM' },
  { pattern: /parallels/i,      hint: 'Parallels Desktop' },
  { pattern: /vmware/i,         hint: 'VMware Fusion' },
  { pattern: /virtualbox/i,     hint: 'VirtualBox' },
  { pattern: /utm/i,            hint: 'UTM VM' },
  { pattern: /\.dmg$/i,         hint: 'Disk Image' },
  { pattern: /\.sparseimage$/i, hint: 'Sparse Image' },
  { pattern: /\/private\/var\/folders/i, hint: 'System temp' },
]

function detectVirtual(mountPoint: string, name: string): { isVirtual: boolean; hint?: string } {
  const haystack = `${mountPoint} ${name}`
  for (const { pattern, hint } of VIRTUAL_PATTERNS) {
    if (pattern.test(haystack)) return { isVirtual: true, hint }
  }
  // also flag anything not under /Volumes or / that looks odd
  if (!mountPoint.startsWith('/Volumes') && mountPoint !== '/' && mountPoint !== '/System/Volumes/Data') {
    return { isVirtual: true, hint: 'Non-standard mount' }
  }
  return { isVirtual: false }
}

export async function getDiskVolumes(): Promise<DiskVolume[]> {
  try {
    // -k = 1024-byte blocks, -l = local filesystems only, skip devfs/map
    const { stdout } = await execAsync("df -k | grep -v '^Filesystem' | grep -v devfs | grep -v map")
    const volumes: DiskVolume[] = []

    for (const line of stdout.trim().split('\n')) {
      // Filesystem 1K-blocks Used Available Capacity iused ifree %iused Mounted on
      const parts = line.trim().split(/\s+/)
      if (parts.length < 6) continue

      const filesystem = parts[0]
      const totalKB = parseInt(parts[1], 10)
      const usedKB = parseInt(parts[2], 10)
      const availKB = parseInt(parts[3], 10)
      const capacityStr = parts[4]
      const mountPoint = parts[parts.length - 1]

      if (isNaN(totalKB) || totalKB === 0) continue
      // skip tiny system mounts
      if (totalKB < 1024) continue

      const usedPercent = parseInt(capacityStr.replace('%', ''), 10) || 0
      const name = mountPoint === '/' ? 'Macintosh HD' : path.basename(mountPoint)
      const { isVirtual, hint } = detectVirtual(mountPoint, filesystem)

      volumes.push({
        mountPoint,
        name,
        totalBytes: totalKB * 1024,
        usedBytes: usedKB * 1024,
        availableBytes: availKB * 1024,
        usedPercent,
        isVirtual,
        virtualHint: hint,
      })
    }

    // De-duplicate: /System/Volumes/Data is the same physical disk as /
    const seen = new Set<string>()
    return volumes.filter((v) => {
      const key = `${v.totalBytes}`
      if (v.mountPoint === '/System/Volumes/Data' && seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch {
    return []
  }
}

// ---------- CPU ----------

export async function getCpuLoad(): Promise<CpuLoad> {
  try {
    // iostat gives CPU percentages on macOS
    const [iostatOut, loadavgOut] = await Promise.all([
      execAsync('iostat -c 2 disk0 2>/dev/null || echo ""').then(r => r.stdout),
      execAsync('sysctl -n vm.loadavg').then(r => r.stdout),
    ])

    // iostat last line has cpu stats: us sy id
    let user = 0, system = 0, idle = 100
    const lines = iostatOut.trim().split('\n')
    const lastLine = lines[lines.length - 1]
    const cpuMatch = lastLine.match(/(\d+)\s+(\d+)\s+(\d+)\s*$/)
    if (cpuMatch) {
      user = parseInt(cpuMatch[1], 10)
      system = parseInt(cpuMatch[2], 10)
      idle = parseInt(cpuMatch[3], 10)
    }

    // vm.loadavg = { 0.52 0.58 0.59 }
    const lavgMatch = loadavgOut.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    const loadAvg1 = lavgMatch ? parseFloat(lavgMatch[1]) : 0
    const loadAvg5 = lavgMatch ? parseFloat(lavgMatch[2]) : 0
    const loadAvg15 = lavgMatch ? parseFloat(lavgMatch[3]) : 0

    return { user, system, idle, loadAvg1, loadAvg5, loadAvg15 }
  } catch {
    return { user: 0, system: 0, idle: 100, loadAvg1: 0, loadAvg5: 0, loadAvg15: 0 }
  }
}

// ---------- Top processes ----------

export async function getTopProcesses(n = 8): Promise<TopProcess[]> {
  try {
    // ps with cpu and memory sorted by cpu desc
    const { stdout } = await execAsync(
      `ps axo pid,comm,%cpu,%mem,rss --sort=-%cpu 2>/dev/null | head -${n + 1}`
    )
    const lines = stdout.trim().split('\n').slice(1) // skip header

    return lines
      .map((line) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 5) return null
        const pid = parseInt(parts[0], 10)
        const name = path.basename(parts[1])
        const cpuPercent = parseFloat(parts[2])
        const memPercent = parseFloat(parts[3])
        const memBytes = parseInt(parts[4], 10) * 1024 // rss is in KB
        return { pid, name, cpuPercent, memPercent, memBytes }
      })
      .filter((p): p is TopProcess => p !== null && !isNaN(p.pid))
      .slice(0, n)
  } catch {
    return []
  }
}

// ---------- Uptime / Version ----------

export async function getSystemInfo(): Promise<{ uptime: string; hostname: string; macosVersion: string }> {
  try {
    const [uptimeOut, hostnameOut, versionOut] = await Promise.all([
      execAsync('uptime').then(r => r.stdout.trim()),
      execAsync('hostname -s').then(r => r.stdout.trim()),
      execAsync('sw_vers -productVersion').then(r => r.stdout.trim()),
    ])

    // uptime:  9:41  up 2 days, 3:22, 5 users, load averages: ...
    const uptimeMatch = uptimeOut.match(/up\s+(.+?),\s+\d+ user/)
    const uptime = uptimeMatch ? uptimeMatch[1].trim() : uptimeOut.split(',')[0].replace(/.*up\s+/, '').trim()

    return { uptime, hostname: hostnameOut, macosVersion: versionOut }
  } catch {
    return { uptime: 'unknown', hostname: os.hostname(), macosVersion: 'unknown' }
  }
}

// ---------- All together ----------

export async function getSystemStats(): Promise<SystemStats> {
  const [disks, cpu, topProcesses, info] = await Promise.all([
    getDiskVolumes(),
    getCpuLoad(),
    getTopProcesses(8),
    getSystemInfo(),
  ])
  return { disks, cpu, topProcesses, ...info }
}
