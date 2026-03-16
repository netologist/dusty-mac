import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { Header } from '../components/Header.js'
import { StatusIcon } from '../components/StatusIcon.js'
import { SizeText } from '../components/SizeText.js'
import type { ScanResult } from '../scanner/types.js'

interface WelcomeScreenProps {
  scanningIds: Set<string>
  results: ScanResult[]
  totalFound: number
}

export function WelcomeScreen({ scanningIds, results, totalFound }: WelcomeScreenProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => f + 1), 80)
    return () => clearInterval(timer)
  }, [])

  const scanning = scanningIds.size > 0

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header subtitle={scanning ? 'Scanning your Mac...' : `Found ${results.length} categories`} />

      {/* ASCII art logo */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>   ____   _____  _   _   ___  </Text>
        <Text color="cyan" bold>  |  _ \ |  ___|| \ | | / _ \ </Text>
        <Text color="cyan">  | | | || |_   |  \| || | | |</Text>
        <Text color="cyan">  | |_| ||  _|  |     || |_| |</Text>
        <Text color="cyan">  |____/ |_|    |_|\_| \___/ </Text>
        <Text color="cyan" dimColor>  dusty-os — Dust off your system</Text>
      </Box>

      <Box flexDirection="column" gap={0}>
        {results.map((r) => (
          <Box key={r.id} gap={2} alignItems="center">
            <StatusIcon status={r.status} frame={frame} />
            <Box width={26}>
              <Text wrap="truncate">{r.label}</Text>
            </Box>
            {r.status === 'done' ? (
              <SizeText bytes={r.totalBytes} />
            ) : r.status === 'scanning' ? (
              <Text dimColor>scanning...</Text>
            ) : (
              <Text dimColor>waiting...</Text>
            )}
          </Box>
        ))}

        {/* Show scanning placeholders for categories not yet started */}
        {Array.from(scanningIds)
          .filter((id) => !results.find((r) => r.id === id))
          .map((id) => (
            <Box key={id} gap={2} alignItems="center">
              <StatusIcon status="scanning" frame={frame} />
              <Box width={26}>
                <Text dimColor>{id}</Text>
              </Box>
              <Text dimColor>scanning...</Text>
            </Box>
          ))}
      </Box>

      {scanning && (
        <Box marginTop={1}>
          <Text color="cyan">{['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][frame % 10]}</Text>
          <Text dimColor>  Scanning in progress...</Text>
        </Box>
      )}

      {!scanning && totalFound > 0 && (
        <Box marginTop={1}>
          <Text color="green">✔  Scan complete — </Text>
          <SizeText bytes={totalFound} />
          <Text color="green"> found</Text>
        </Box>
      )}
    </Box>
  )
}
