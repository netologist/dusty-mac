import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { ProgressBar } from '../components/ProgressBar.js'
import { PasswordInput } from '../components/PasswordInput.js'
import { filesize } from 'filesize'
import { getMemoryStats, freeMemory } from '../utils/memory.js'
import type { MemoryStats } from '../utils/memory.js'

interface RamScreenProps {
  onBack: () => void
}

type RamState = 'loading' | 'idle' | 'asking-password' | 'freeing' | 'done' | 'error'

function fmt(bytes: number) {
  return filesize(bytes, { standard: 'jedec', round: 1 })
}

function pressureColor(pct: number): string {
  if (pct > 80) return 'red'
  if (pct > 60) return 'yellow'
  return 'green'
}

export function RamScreen({ onBack }: RamScreenProps) {
  const [memStats, setMemStats] = useState<MemoryStats | null>(null)
  const [afterStats, setAfterStats] = useState<MemoryStats | null>(null)
  const [state, setState] = useState<RamState>('loading')
  const [error, setError] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  useEffect(() => {
    getMemoryStats().then((stats) => {
      setMemStats(stats)
      setState('idle')
    })
  }, [])

  async function doFree(password?: string) {
    setState('freeing')
    const result = await freeMemory(password)

    if (result.success) {
      const after = await getMemoryStats()
      setAfterStats(after)
      setState('done')
    } else if (!result.success && result.needsPassword) {
      setWrongPassword(!!password) // if we already tried a password, it was wrong
      setState('asking-password')
    } else {
      setError(!result.success && !result.needsPassword ? result.error : 'Unknown error')
      setState('error')
    }
  }

  useInput((_input, key) => {
    if (state === 'asking-password') return // handled by PasswordInput

    if (state === 'idle') {
      if (_input === 'f' || _input === 'F' || key.return) {
        doFree()
      } else if (key.escape || _input === 'q' || _input === 'Q' || key.leftArrow) {
        onBack()
      }
    } else if (state === 'done' || state === 'error') {
      if (key.escape || _input === 'q' || _input === 'Q' || key.return || key.leftArrow) {
        onBack()
      }
    }
  })

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header subtitle="RAM Manager" />

      {state === 'loading' && (
        <Text color="cyan">Reading memory stats...</Text>
      )}

      {(state !== 'loading') && memStats && (
        <Box flexDirection="column" gap={1}>
          {/* Memory stats card */}
          <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
            <Text bold color="cyan">Current Memory</Text>
            <Box marginTop={1} flexDirection="column">
              <Box gap={2}>
                <Box width={14}><Text dimColor>Total RAM</Text></Box>
                <Text bold>{fmt(memStats.totalBytes)}</Text>
              </Box>
              <Box gap={2}>
                <Box width={14}><Text dimColor>Used</Text></Box>
                <Text color={pressureColor(memStats.pressurePercent)} bold>
                  {fmt(memStats.usedBytes)}
                </Text>
                <Text dimColor>({memStats.pressurePercent}%)</Text>
              </Box>
              <Box gap={2}>
                <Box width={14}><Text dimColor>Free</Text></Box>
                <Text color="green">{fmt(memStats.freeBytes)}</Text>
              </Box>
              <Box gap={2}>
                <Box width={14}><Text dimColor>Wired</Text></Box>
                <Text>{fmt(memStats.wiredBytes)}</Text>
              </Box>
              <Box gap={2}>
                <Box width={14}><Text dimColor>Compressed</Text></Box>
                <Text>{fmt(memStats.compressedBytes)}</Text>
              </Box>
            </Box>
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>Pressure</Text>
              <ProgressBar percent={memStats.pressurePercent} width={40} />
            </Box>
          </Box>

          {/* Password prompt */}
          {state === 'asking-password' && (
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={2} paddingY={1}>
              <Text bold color="yellow">sudo required to run purge</Text>
              {wrongPassword && (
                <Text color="red">Incorrect password, try again</Text>
              )}
              <Box marginTop={1}>
                <PasswordInput
                  prompt="Enter sudo password:"
                  onSubmit={(pw) => doFree(pw)}
                  onCancel={onBack}
                />
              </Box>
            </Box>
          )}

          {/* Freeing */}
          {state === 'freeing' && (
            <Box>
              <Text color="cyan">Freeing memory... (this may take a moment)</Text>
            </Box>
          )}

          {/* Done */}
          {state === 'done' && afterStats && (
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
              <Text bold color="green">Memory Freed</Text>
              <Box marginTop={1} gap={2}>
                <Box width={14}><Text dimColor>Before</Text></Box>
                <Text>{fmt(memStats.usedBytes)} used</Text>
              </Box>
              <Box gap={2}>
                <Box width={14}><Text dimColor>After</Text></Box>
                <Text color="green">{fmt(afterStats.usedBytes)} used</Text>
              </Box>
              {afterStats.freeBytes > memStats.freeBytes && (
                <Box gap={2}>
                  <Box width={14}><Text dimColor>Gained</Text></Box>
                  <Text color="green" bold>
                    +{fmt(afterStats.freeBytes - memStats.freeBytes)} free
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Error */}
          {state === 'error' && (
            <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
              <Text bold color="red">Failed to free memory</Text>
              <Text dimColor>{error}</Text>
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="cyan" dimColor>{'─'.repeat(60)}</Text>
        {state === 'idle' && (
          <Box gap={3}>
            <Text color="green" bold>F / Enter: Free RAM</Text>
            <Text dimColor>← / Q: Back</Text>
          </Box>
        )}
        {(state === 'done' || state === 'error') && (
          <Text dimColor>Any key to go back</Text>
        )}
      </Box>
    </Box>
  )
}
