import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'

interface DisclaimerScreenProps {
  onAccept: () => void
  onDecline: () => void
}

export function DisclaimerScreen({ onAccept, onDecline }: DisclaimerScreenProps) {
  const [selected, setSelected] = useState<'accept' | 'decline'>('accept')

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || key.tab) {
      setSelected((s) => (s === 'accept' ? 'decline' : 'accept'))
    } else if (key.return) {
      if (selected === 'accept') {
        onAccept()
      } else {
        onDecline()
      }
    } else if (input === 'q' || key.escape) {
      onDecline()
    }
  })

  return (
    <Box flexDirection="column" paddingX={3} paddingY={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="red" paddingX={2} paddingY={1} flexDirection="column">
        <Text color="red" bold>
          ⚠  WARNING — USE AT YOUR OWN RISK
        </Text>
      </Box>

      {/* Body */}
      <Box flexDirection="column" marginTop={1} paddingX={1}>
        <Text bold>
          mac-cleaner permanently and irreversibly deletes files from your system.
        </Text>

        <Box marginTop={1} flexDirection="column">
          <Text>By proceeding, you acknowledge and agree to ALL of the following:</Text>
        </Box>

        <Box marginTop={1} flexDirection="column" paddingLeft={2}>
          <Text>• You are the sole person responsible for any data loss, file corruption,</Text>
          <Text>  system instability, application breakage, or any other damage of any kind</Text>
          <Text>  that may result — directly or indirectly — from using this software.</Text>
        </Box>

        <Box marginTop={1} flexDirection="column" paddingLeft={2}>
          <Text>• The authors, contributors, and distributors of mac-cleaner accept</Text>
          <Text>  NO liability whatsoever, to the fullest extent permitted by applicable law.</Text>
        </Box>

        <Box marginTop={1} flexDirection="column" paddingLeft={2}>
          <Text>• This software is provided "AS IS", without warranty of any kind, express</Text>
          <Text>  or implied, including but not limited to fitness for a particular purpose.</Text>
        </Box>

        <Box marginTop={1} flexDirection="column" paddingLeft={2}>
          <Text>• You should have a complete, verified backup of your data (e.g. Time Machine)</Text>
          <Text>  before continuing. Deleted files cannot be recovered.</Text>
        </Box>
      </Box>

      {/* Buttons */}
      <Box marginTop={2} flexDirection="row" gap={3} paddingLeft={1}>
        <Box
          borderStyle="round"
          borderColor={selected === 'accept' ? 'green' : 'gray'}
          paddingX={2}
        >
          <Text color={selected === 'accept' ? 'green' : 'gray'} bold={selected === 'accept'}>
            I Accept — Continue
          </Text>
        </Box>

        <Box
          borderStyle="round"
          borderColor={selected === 'decline' ? 'red' : 'gray'}
          paddingX={2}
        >
          <Text color={selected === 'decline' ? 'red' : 'gray'} bold={selected === 'decline'}>
            Decline — Quit
          </Text>
        </Box>
      </Box>

      {/* Hint */}
      <Box marginTop={1} paddingLeft={1}>
        <Text dimColor>Use ← → or Tab to switch  ·  Enter to confirm  ·  Q to quit</Text>
      </Box>
    </Box>
  )
}
