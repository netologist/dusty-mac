import React from 'react'
import { Box, Text } from 'ink'

const VERSION = '1.0.0'

interface HeaderProps {
  subtitle?: string
}

export function Header({ subtitle }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          {' '}mac-cleaner{' '}
        </Text>
        <Text dimColor>v{VERSION}</Text>
        {subtitle && (
          <>
            <Text dimColor>  —  </Text>
            <Text color="white">{subtitle}</Text>
          </>
        )}
      </Box>
      <Text color="cyan" dimColor>
        {'─'.repeat(60)}
      </Text>
    </Box>
  )
}
