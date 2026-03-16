import React from 'react'
import { Text } from 'ink'

interface StatusIconProps {
  status: 'pending' | 'scanning' | 'done' | 'error'
  frame?: number
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function StatusIcon({ status, frame = 0 }: StatusIconProps) {
  switch (status) {
    case 'done':
      return <Text color="green">✔</Text>
    case 'error':
      return <Text color="red">✗</Text>
    case 'scanning':
      return <Text color="cyan">{SPINNER_FRAMES[frame % SPINNER_FRAMES.length]}</Text>
    default:
      return <Text dimColor>·</Text>
  }
}
