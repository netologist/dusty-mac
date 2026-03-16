import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'

interface PasswordInputProps {
  prompt?: string
  onSubmit: (password: string) => void
  onCancel: () => void
}

export function PasswordInput({ prompt = 'Password:', onSubmit, onCancel }: PasswordInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useInput((input, key) => {
    if (key.return) {
      if (value.length === 0) {
        setError('Password cannot be empty')
        return
      }
      onSubmit(value)
    } else if (key.escape) {
      onCancel()
    } else if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1))
      setError('')
    } else if (input && !key.ctrl && !key.meta) {
      setValue((v) => v + input)
      setError('')
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1} alignItems="center">
        <Text color="yellow">🔐</Text>
        <Text bold>{prompt}</Text>
        <Text color="cyan">{'*'.repeat(value.length)}</Text>
        <Text color="cyan" bold>█</Text>
      </Box>
      {error && <Text color="red">{error}</Text>}
      <Text dimColor>Enter to confirm · Esc to cancel</Text>
    </Box>
  )
}
