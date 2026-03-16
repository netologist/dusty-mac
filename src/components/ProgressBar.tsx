import React from 'react'
import { Box, Text } from 'ink'

interface ProgressBarProps {
  percent: number
  width?: number
  label?: string
}

export function ProgressBar({ percent, width = 40, label }: ProgressBarProps) {
  const filled = Math.round((percent / 100) * width)
  const empty = width - filled
  const clampedPercent = Math.max(0, Math.min(100, percent))

  const bar =
    '█'.repeat(Math.max(0, filled)) +
    '░'.repeat(Math.max(0, empty))

  const color = clampedPercent < 33 ? 'cyan' : clampedPercent < 66 ? 'blue' : 'green'

  return (
    <Box gap={1} alignItems="center">
      <Text color={color}>[{bar}]</Text>
      <Text bold color={color}>{clampedPercent}%</Text>
      {label && <Text dimColor>{label}</Text>}
    </Box>
  )
}
