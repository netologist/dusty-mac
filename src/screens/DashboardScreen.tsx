import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { SizeText } from '../components/SizeText.js'
import { filesize } from 'filesize'
import { getSystemStats } from '../utils/system.js'
import { getMemoryStats } from '../utils/memory.js'
import type { SystemStats } from '../utils/system.js'
import type { MemoryStats } from '../utils/memory.js'
import type { ScanResult } from '../scanner/types.js'

interface DashboardScreenProps {
  scanResults: ScanResult[]
  onClean: () => void   // go to results / clean flow
  onRam: () => void
  onExit: () => void
}

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function diskColor(pct: number) {
  if (pct > 90) return 'red'
  if (pct > 75) return 'yellow'
  return 'green'
}

function cpuColor(pct: number) {
  if (pct > 80) return 'red'
  if (pct > 50) return 'yellow'
  return 'green'
}

function memColor(pct: number) {
  if (pct > 85) return 'red'
  if (pct > 65) return 'yellow'
  return 'green'
}

function bar(percent: number, width = 20): string {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export function DashboardScreen({ scanResults, onClean, onRam, onExit }: DashboardScreenProps) {
  const [sysStats, setSysStats] = useState<SystemStats | null>(null)
  const [memStats, setMemStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => f + 1), 80)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Promise.all([getSystemStats(), getMemoryStats()]).then(([sys, mem]) => {
      setSysStats(sys)
      setMemStats(mem)
      setLoading(false)
    })
  }, [])

  useInput((input, key) => {
    if (key.return || input === 'c' || input === 'C') {
      onClean()
    } else if (input === 'r' || input === 'R') {
      onRam()
    } else if (input === 'q' || input === 'Q' || key.escape) {
      onExit()
    }
  })

  const totalJunk = scanResults.reduce((s, r) => s + r.totalBytes, 0)
  const junkCategories = scanResults.filter((r) => r.totalBytes > 0).length

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header subtitle={
        sysStats
          ? `${sysStats.hostname}  ·  macOS ${sysStats.macosVersion}  ·  up ${sysStats.uptime}`
          : 'Loading system info...'
      } />

      {loading && (
        <Box gap={1}>
          <Text color="cyan">{FRAMES[frame % FRAMES.length]}</Text>
          <Text dimColor>Loading system stats...</Text>
        </Box>
      )}

      {!loading && sysStats && memStats && (
        <Box flexDirection="row" gap={3} flexWrap="wrap">

          {/* ── Left column ── */}
          <Box flexDirection="column" gap={1} minWidth={38}>

            {/* Disk volumes */}
            <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
              <Text bold color="cyan">Disk</Text>
              {sysStats.disks.length === 0 && <Text dimColor>No volumes found</Text>}
              {sysStats.disks.map((disk) => (
                <Box key={disk.mountPoint} flexDirection="column" marginTop={1}>
                  <Box gap={1} alignItems="center">
                    <Text bold wrap="truncate">{disk.name}</Text>
                    {disk.isVirtual && (
                      <Text color="yellow" dimColor> [{disk.virtualHint}]</Text>
                    )}
                  </Box>
                  <Box gap={1} alignItems="center">
                    <Text color={diskColor(disk.usedPercent)}>[{bar(disk.usedPercent)}]</Text>
                    <Text color={diskColor(disk.usedPercent)} bold>{disk.usedPercent}%</Text>
                  </Box>
                  <Box gap={2}>
                    <Text dimColor>{filesize(disk.usedBytes, { standard: 'jedec', round: 1 })} used</Text>
                    <Text dimColor>/</Text>
                    <Text dimColor>{filesize(disk.totalBytes, { standard: 'jedec', round: 1 })} total</Text>
                    <Text color="green">{filesize(disk.availableBytes, { standard: 'jedec', round: 1 })} free</Text>
                  </Box>
                  {disk.isVirtual && (
                    <Text color="yellow" dimColor>
                      Note: virtual/VM disk — size may not reflect real storage
                    </Text>
                  )}
                </Box>
              ))}
            </Box>

            {/* RAM */}
            <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
              <Text bold color="magenta">Memory</Text>
              <Box marginTop={1} flexDirection="column">
                <Box gap={1} alignItems="center">
                  <Text color={memColor(memStats.pressurePercent)}>
                    [{bar(memStats.pressurePercent)}]
                  </Text>
                  <Text color={memColor(memStats.pressurePercent)} bold>
                    {memStats.pressurePercent}%
                  </Text>
                </Box>
                <Box gap={2}>
                  <Text color={memColor(memStats.pressurePercent)}>
                    {filesize(memStats.usedBytes, { standard: 'jedec', round: 1 })} used
                  </Text>
                  <Text dimColor>/</Text>
                  <Text dimColor>
                    {filesize(memStats.totalBytes, { standard: 'jedec', round: 1 })} total
                  </Text>
                </Box>
                <Box gap={3}>
                  <Text dimColor>Wired: {filesize(memStats.wiredBytes, { standard: 'jedec', round: 1 })}</Text>
                  <Text dimColor>Compressed: {filesize(memStats.compressedBytes, { standard: 'jedec', round: 1 })}</Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── Right column ── */}
          <Box flexDirection="column" gap={1} minWidth={38}>

            {/* CPU */}
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={2} paddingY={1}>
              <Text bold color="yellow">CPU</Text>
              <Box marginTop={1} flexDirection="column">
                <Box gap={2}>
                  <Box width={10}><Text dimColor>Load avg</Text></Box>
                  <Text bold>{sysStats.cpu.loadAvg1.toFixed(2)}</Text>
                  <Text dimColor>{sysStats.cpu.loadAvg5.toFixed(2)}</Text>
                  <Text dimColor>{sysStats.cpu.loadAvg15.toFixed(2)}</Text>
                  <Text dimColor>(1m / 5m / 15m)</Text>
                </Box>
                <Box gap={2}>
                  <Box width={10}><Text dimColor>User</Text></Box>
                  <Text color={cpuColor(sysStats.cpu.user)}>{sysStats.cpu.user}%</Text>
                </Box>
                <Box gap={2}>
                  <Box width={10}><Text dimColor>System</Text></Box>
                  <Text>{sysStats.cpu.system}%</Text>
                </Box>
                <Box gap={2}>
                  <Box width={10}><Text dimColor>Idle</Text></Box>
                  <Text color="green">{sysStats.cpu.idle}%</Text>
                </Box>
              </Box>
            </Box>

            {/* Top processes */}
            {sysStats.topProcesses.length > 0 && (
              <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1}>
                <Text bold>Top Processes (CPU)</Text>
                <Box marginTop={1} flexDirection="column">
                  {sysStats.topProcesses.slice(0, 6).map((proc) => (
                    <Box key={proc.pid} gap={1}>
                      <Box width={20}>
                        <Text wrap="truncate" dimColor={proc.cpuPercent < 1}>{proc.name}</Text>
                      </Box>
                      <Box width={7}>
                        <Text color={cpuColor(proc.cpuPercent)} bold={proc.cpuPercent > 10}>
                          {proc.cpuPercent.toFixed(1)}% cpu
                        </Text>
                      </Box>
                      <Text dimColor>
                        {filesize(proc.memBytes, { standard: 'jedec', round: 0 })}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Junk summary */}
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
              <Text bold color="green">Junk Found</Text>
              <Box marginTop={1} flexDirection="column">
                <Box gap={2}>
                  <Text bold color="green">{filesize(totalJunk, { standard: 'jedec', round: 1 })}</Text>
                  <Text dimColor>across {junkCategories} categories</Text>
                </Box>
                {scanResults
                  .filter((r) => r.totalBytes > 0)
                  .slice(0, 4)
                  .map((r) => (
                    <Box key={r.id} gap={2}>
                      <Text dimColor>{r.icon}</Text>
                      <Box width={22}><Text dimColor wrap="truncate">{r.label}</Text></Box>
                      <SizeText bytes={r.totalBytes} />
                    </Box>
                  ))}
                {junkCategories > 4 && (
                  <Text dimColor>  +{junkCategories - 4} more categories</Text>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="cyan" dimColor>{'─'.repeat(60)}</Text>
        <Box gap={3}>
          <Text color="green" bold>C / Enter: Clean now</Text>
          <Text color="magenta">R: Free RAM</Text>
          <Text dimColor>Q: Quit</Text>
        </Box>
      </Box>
    </Box>
  )
}
