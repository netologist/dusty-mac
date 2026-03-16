import React from 'react'
import { Text } from 'ink'
import { filesize } from 'filesize'

interface SizeTextProps {
  bytes: number
  dimIfSmall?: boolean
}

export function SizeText({ bytes, dimIfSmall = false }: SizeTextProps) {
  if (bytes === 0) return <Text dimColor>  –  </Text>

  const formatted = filesize(bytes, { standard: 'jedec', round: 1 })

  // Color code by size
  const color =
    bytes > 1024 * 1024 * 1024
      ? 'red'
      : bytes > 100 * 1024 * 1024
      ? 'yellow'
      : bytes > 10 * 1024 * 1024
      ? 'white'
      : 'white'

  const dim = dimIfSmall && bytes < 1024 * 1024

  return (
    <Text color={color} dimColor={dim}>
      {formatted}
    </Text>
  )
}
