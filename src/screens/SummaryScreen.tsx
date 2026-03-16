import React from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { SizeText } from '../components/SizeText.js'
import { filesize } from 'filesize'
import type { ScanResult } from '../scanner/types.js'

interface SummaryScreenProps {
  selected: ScanResult[]
  freedByCategory: Map<string, number>
  onExit: () => void
  onRam?: () => void
}

export function SummaryScreen({ selected, freedByCategory, onExit, onRam }: SummaryScreenProps) {
  const totalFreed = Array.from(freedByCategory.values()).reduce((s, v) => s + v, 0)

  useInput((input, key) => {
    if (input === 'r' || input === 'R') {
      onRam?.()
    } else if (input === 'q' || input === 'Q' || key.escape || key.return) {
      onExit()
    }
  })

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="green"
        padding={2}
        marginY={1}
        alignSelf="flex-start"
        minWidth={50}
      >
        <Box marginBottom={1} gap={2}>
          <Text bold color="green" >✓  Done!</Text>
          <Text bold color="white">Freed </Text>
          <SizeText bytes={totalFreed} />
          <Text bold color="white"> from your Mac</Text>
        </Box>

        <Text color="cyan" dimColor>{'─'.repeat(46)}</Text>

        <Box flexDirection="column" marginTop={1}>
          {selected.map((r) => {
            const freed = freedByCategory.get(r.id) ?? 0
            return (
              <Box key={r.id} gap={2} alignItems="center">
                <Text color="green">✔</Text>
                <Box width={28}>
                  <Text wrap="truncate">{r.icon}  {r.label}</Text>
                </Box>
                <SizeText bytes={freed} />
                <Text dimColor>freed</Text>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box marginTop={1} gap={3}>
        <Text dimColor>Press </Text>
        <Text color="cyan">Q / Enter</Text>
        <Text dimColor> to exit</Text>
        {onRam && (
          <>
            <Text dimColor> · </Text>
            <Text color="magenta">R</Text>
            <Text dimColor> to free RAM</Text>
          </>
        )}
      </Box>
    </Box>
  )
}
