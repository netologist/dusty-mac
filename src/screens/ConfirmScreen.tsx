import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { SizeText } from '../components/SizeText.js'
import type { ScanResult } from '../scanner/types.js'

interface ConfirmScreenProps {
  selected: ScanResult[]
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmScreen({ selected, onConfirm, onCancel }: ConfirmScreenProps) {
  const [choice, setChoice] = useState<0 | 1>(0) // 0 = Yes, 1 = No
  const totalBytes = selected.reduce((sum, r) => sum + r.totalBytes, 0)

  useInput((input, key) => {
    if (key.leftArrow || key.upArrow) setChoice(0)
    if (key.rightArrow || key.downArrow) setChoice(1)
    if (key.return) {
      if (choice === 0) onConfirm()
      else onCancel()
    }
    if (key.escape || input === 'q' || input === 'Q') onCancel()
    if (input === 'y' || input === 'Y') onConfirm()
    if (input === 'n' || input === 'N') onCancel()
  })

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={2} marginY={1} alignSelf="flex-start">
        <Box marginBottom={1}>
          <Text bold color="yellow">⚠  Ready to permanently delete</Text>
          <Text> </Text>
          <SizeText bytes={totalBytes} />
          <Text bold color="yellow">?</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          {selected.map((r) => (
            <Box key={r.id} gap={2}>
              <Text dimColor>  •</Text>
              <Box width={28}>
                <Text wrap="truncate">{r.icon}  {r.label}</Text>
              </Box>
              <SizeText bytes={r.totalBytes} />
            </Box>
          ))}
        </Box>

        <Text dimColor color="red">This action cannot be undone!</Text>
      </Box>

      <Box gap={3} marginTop={1}>
        <Box
          borderStyle={choice === 0 ? 'round' : undefined}
          borderColor="green"
          paddingX={2}
          paddingY={0}
        >
          <Text bold color={choice === 0 ? 'green' : 'white'}>
            {choice === 0 ? '▶ ' : '  '}Yes, clean now
          </Text>
        </Box>
        <Box
          borderStyle={choice === 1 ? 'round' : undefined}
          borderColor="red"
          paddingX={2}
          paddingY={0}
        >
          <Text bold color={choice === 1 ? 'red' : 'white'}>
            {choice === 1 ? '▶ ' : '  '}No, go back
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} gap={3}>
        <Text dimColor>← → Navigate</Text>
        <Text dimColor>Enter: Confirm</Text>
        <Text dimColor>Y/N: Quick select</Text>
      </Box>
    </Box>
  )
}
