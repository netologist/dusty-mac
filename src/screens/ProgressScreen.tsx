import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { Header } from '../components/Header.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { StatusIcon } from '../components/StatusIcon.js'
import { SizeText } from '../components/SizeText.js'
import { filesize } from 'filesize'
import os from 'node:os'
import path from 'node:path'
import type { ScanResult } from '../scanner/types.js'
import type { CleanProgress } from '../scanner/types.js'

interface ProgressScreenProps {
  selected: ScanResult[]
  progress: Map<string, CleanProgress>
  totalBytesToFree: number
  currentPath: string
  totalBytesFreed: number
}

export function ProgressScreen({
  selected,
  progress,
  totalBytesToFree,
  currentPath,
  totalBytesFreed,
}: ProgressScreenProps) {
  const [frame, setFrame] = useState(0)
  const HOME = os.homedir()

  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => f + 1), 80)
    return () => clearInterval(timer)
  }, [])

  const percent = totalBytesToFree > 0
    ? Math.min(100, Math.round((totalBytesFreed / totalBytesToFree) * 100))
    : 0

  const freedFormatted = filesize(totalBytesFreed, { standard: 'jedec', round: 1 })
  const totalFormatted = filesize(totalBytesToFree, { standard: 'jedec', round: 1 })

  // Shorten path for display
  const displayPath = currentPath
    ? currentPath.replace(HOME, '~').slice(0, 55) + (currentPath.length > 55 ? '…' : '')
    : ''

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header subtitle="Cleaning your Mac..." />

      <Box flexDirection="column" marginBottom={1}>
        <ProgressBar percent={percent} width={42} />
        <Box marginTop={0} gap={2}>
          <Text bold color="green">{freedFormatted}</Text>
          <Text dimColor>freed of</Text>
          <Text>{totalFormatted}</Text>
        </Box>
      </Box>

      {displayPath && (
        <Box marginBottom={1}>
          <Text dimColor>Deleting: </Text>
          <Text color="white" wrap="truncate">{displayPath}</Text>
        </Box>
      )}

      <Text color="cyan" dimColor>{'─'.repeat(60)}</Text>
      <Box flexDirection="column" marginTop={0}>
        {selected.map((r) => {
          const p = progress.get(r.id)
          const isDone = p?.done === true
          const isActive = p && !p.done
          const bytesFreed = p?.bytesFreed ?? 0

          return (
            <Box key={r.id} gap={2} alignItems="center">
              <StatusIcon
                status={isDone ? 'done' : isActive ? 'scanning' : 'pending'}
                frame={frame}
              />
              <Box width={28}>
                <Text
                  wrap="truncate"
                  dimColor={!isDone && !isActive}
                  color={isDone ? 'green' : isActive ? 'cyan' : 'white'}
                >
                  {r.icon}  {r.label}
                </Text>
              </Box>
              {isDone && (
                <>
                  <SizeText bytes={bytesFreed} />
                  <Text dimColor>freed</Text>
                </>
              )}
              {isActive && <Text dimColor color="cyan">cleaning...</Text>}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
