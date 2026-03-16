import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { SizeText } from '../components/SizeText.js'
import { filesize } from 'filesize'
import type { ScanResult, PathDetail } from '../scanner/types.js'
import os from 'node:os'

interface DetailScreenProps {
  result: ScanResult
  /** Paths that were previously selected (undefined = all selected by default) */
  initialSelectedPaths?: Set<string>
  onBack: (selectedPaths: Set<string>) => void
}

const HOME = os.homedir()
const PAGE_SIZE = 20

function shortenPath(p: string): string {
  return p.startsWith(HOME) ? p.replace(HOME, '~') : p
}

export function DetailScreen({ result, initialSelectedPaths, onBack }: DetailScreenProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Use details if available, otherwise synthesize from paths
  const items: PathDetail[] = result.details && result.details.length > 0
    ? result.details
    : result.paths.map((p) => ({ path: p, bytes: 0, label: undefined }))

  // Initialize selections: use initialSelectedPaths if provided, otherwise select all
  const [selections, setSelections] = useState<Set<string>>(() => {
    if (initialSelectedPaths) return new Set(initialSelectedPaths)
    return new Set(items.map((i) => i.path))
  })

  const pageStart = Math.max(0, Math.min(focusedIndex - Math.floor(PAGE_SIZE / 2), items.length - PAGE_SIZE))
  const pageEnd = Math.min(pageStart + PAGE_SIZE, items.length)
  const visibleItems = items.slice(pageStart, pageEnd)

  const selectedBytes = items
    .filter((i) => selections.has(i.path))
    .reduce((s, i) => s + i.bytes, 0)

  const allSelected = items.every((i) => selections.has(i.path))
  const noneSelected = items.every((i) => !selections.has(i.path))

  useInput((input, key) => {
    if (key.upArrow) {
      setFocusedIndex((i) => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setFocusedIndex((i) => Math.min(items.length - 1, i + 1))
    } else if (input === ' ') {
      const path = items[focusedIndex]?.path
      if (path) {
        setSelections((prev) => {
          const next = new Set(prev)
          if (next.has(path)) next.delete(path)
          else next.add(path)
          return next
        })
      }
    } else if (input === 'a' || input === 'A') {
      if (allSelected) {
        setSelections(new Set())
      } else {
        setSelections(new Set(items.map((i) => i.path)))
      }
    } else if (key.escape || key.leftArrow || input === 'q' || input === 'Q') {
      onBack(selections)
    }
  })

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header subtitle={`${result.icon}  ${result.label} — Details`} />

      <Box marginBottom={1}>
        <Text dimColor>{result.description}</Text>
      </Box>

      <Box flexDirection="column">
        {visibleItems.map((item, visIdx) => {
          const actualIdx = pageStart + visIdx
          const focused = actualIdx === focusedIndex
          const selected = selections.has(item.path)
          const shortPath = shortenPath(item.path)

          return (
            <Box key={item.path} flexDirection="column">
              <Box gap={1} alignItems="center">
                <Text color={focused ? 'cyan' : 'white'}>{focused ? '▶' : ' '}</Text>
                <Text color={selected ? 'green' : 'white'}>
                  {selected ? '[✓]' : '[ ]'}
                </Text>
                <Box flexGrow={1}>
                  <Text bold={focused} color={focused ? 'cyan' : 'white'} wrap="truncate">
                    {item.label ?? shortPath}
                  </Text>
                </Box>
                <Box width={12} justifyContent="flex-end">
                  {item.bytes > 0
                    ? <SizeText bytes={item.bytes} />
                    : <Text dimColor>–</Text>
                  }
                </Box>
              </Box>
              {focused && item.label && shortPath !== item.label && (
                <Box paddingLeft={4}>
                  <Text dimColor wrap="truncate">{shortPath}</Text>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {items.length > PAGE_SIZE && (
        <Box marginTop={1}>
          <Text dimColor>
            Showing {pageStart + 1}–{pageEnd} of {items.length} items
          </Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color="cyan" dimColor>{'─'.repeat(60)}</Text>
        <Box justifyContent="space-between">
          <Box gap={3}>
            <Text dimColor>↑↓ Scroll</Text>
            <Text dimColor>Space: Toggle</Text>
            <Text dimColor>A: {allSelected ? 'Deselect all' : 'Select all'}</Text>
            <Text dimColor>← / Q: Back</Text>
          </Box>
          <Text color={noneSelected ? 'red' : 'yellow'}>
            {selections.size}/{items.length} selected
            {selectedBytes > 0 && ` · ${filesize(selectedBytes, { standard: 'jedec', round: 1 })}`}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
