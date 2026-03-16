import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Header } from '../components/Header.js'
import { SizeText } from '../components/SizeText.js'
import { filesize } from 'filesize'
import type { ScanResult } from '../scanner/types.js'
import { DetailScreen } from './DetailScreen.js'

interface ScanResultsScreenProps {
  results: ScanResult[]
  onConfirm: (selected: ScanResult[]) => void
  onBack: () => void
  onRam?: () => void
}

export function ScanResultsScreen({ results, onConfirm, onBack, onRam }: ScanResultsScreenProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  // category-level on/off toggle
  const [selections, setSelections] = useState<Map<string, boolean>>(
    new Map(results.map((r) => [r.id, r.selected && r.totalBytes > 0]))
  )
  // per-item path selections within each category (undefined = all paths selected)
  const [pathSelections, setPathSelections] = useState<Map<string, Set<string>>>(new Map())
  const [detailResult, setDetailResult] = useState<ScanResult | null>(null)

  const visibleResults = results.filter((r) => r.totalBytes > 0 || r.status === 'error')

  // Compute selected bytes, accounting for partial path selections
  const selectedBytes = visibleResults
    .filter((r) => selections.get(r.id))
    .reduce((sum, r) => {
      const ps = pathSelections.get(r.id)
      if (!ps) return sum + r.totalBytes
      // sum only the selected paths' bytes
      const items = r.details && r.details.length > 0
        ? r.details
        : r.paths.map((p) => ({ path: p, bytes: 0 }))
      return sum + items.filter((i) => ps.has(i.path)).reduce((s, i) => s + i.bytes, 0)
    }, 0)

  const totalBytes = visibleResults.reduce((sum, r) => sum + r.totalBytes, 0)

  useInput((input, key) => {
    if (detailResult) return

    if (key.upArrow) {
      setFocusedIndex((i) => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setFocusedIndex((i) => Math.min(visibleResults.length - 1, i + 1))
    } else if (input === ' ') {
      const id = visibleResults[focusedIndex]?.id
      if (id) {
        setSelections((prev) => new Map(prev).set(id, !prev.get(id)))
      }
    } else if (key.rightArrow || input === 'd' || input === 'D') {
      const r = visibleResults[focusedIndex]
      if (r) setDetailResult(r)
    } else if (input === 'r' || input === 'R') {
      onRam?.()
    } else if (input === 'a' || input === 'A') {
      const allSelected = visibleResults.every((r) => selections.get(r.id))
      setSelections(new Map(visibleResults.map((r) => [r.id, !allSelected])))
    } else if (key.return) {
      const selected = buildSelectedResults()
      if (selected.length > 0) onConfirm(selected)
    } else if (key.escape || input === 'q' || input === 'Q') {
      onBack()
    }
  })

  function buildSelectedResults(): ScanResult[] {
    return visibleResults
      .filter((r) => selections.get(r.id))
      .map((r) => {
        const ps = pathSelections.get(r.id)
        if (!ps) return r  // all paths selected — pass through unchanged

        // Filter paths and recompute totalBytes for partial selections
        const filteredPaths = r.paths.filter((p) => ps.has(p))
        const filteredDetails = r.details?.filter((d) => ps.has(d.path))
        const filteredBytes = filteredDetails
          ? filteredDetails.reduce((s, d) => s + d.bytes, 0)
          : r.totalBytes  // fallback if no detail sizes

        return {
          ...r,
          paths: filteredPaths,
          details: filteredDetails,
          totalBytes: filteredBytes || filteredPaths.length > 0 ? filteredBytes : 0,
        }
      })
      .filter((r) => r.paths.length > 0)
  }

  // Show detail screen overlay
  if (detailResult) {
    const currentPathSel = pathSelections.get(detailResult.id)
    return (
      <DetailScreen
        result={detailResult}
        initialSelectedPaths={currentPathSel}
        onBack={(selectedPaths) => {
          const allPaths = (detailResult.details && detailResult.details.length > 0
            ? detailResult.details.map((d) => d.path)
            : detailResult.paths)
          const allSelected = allPaths.every((p) => selectedPaths.has(p))
          const noneSelected = allPaths.every((p) => !selectedPaths.has(p))

          // Persist path-level selections
          setPathSelections((prev) => new Map(prev).set(detailResult.id, selectedPaths))

          // Auto-sync category-level checkbox: off if nothing selected
          if (noneSelected) {
            setSelections((prev) => new Map(prev).set(detailResult.id, false))
          } else {
            setSelections((prev) => new Map(prev).set(detailResult.id, true))
          }

          setDetailResult(null)
        }}
      />
    )
  }

  const selectedFormatted = filesize(Math.max(0, selectedBytes), { standard: 'jedec', round: 1 })

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header
        subtitle={`Found ${filesize(totalBytes, { standard: 'jedec', round: 1 })} to clean`}
      />

      <Box flexDirection="column">
        {visibleResults.map((result, i) => {
          const selected = selections.get(result.id) ?? false
          const focused = i === focusedIndex
          const hasDetails = (result.details && result.details.length > 0) || result.paths.length > 0
          const ps = pathSelections.get(result.id)
          const allPaths = result.details?.map((d) => d.path) ?? result.paths
          const isPartial = ps !== undefined && ps.size > 0 && ps.size < allPaths.length

          return (
            <Box key={result.id} gap={1} alignItems="center">
              <Text color={focused ? 'cyan' : 'white'}>{focused ? '▶' : ' '}</Text>
              <Text color={selected ? (isPartial ? 'yellow' : 'green') : 'white'}>
                {selected ? (isPartial ? '[~]' : '[✓]') : '[ ]'}
              </Text>
              <Box width={28}>
                <Text
                  bold={focused}
                  color={focused ? 'cyan' : 'white'}
                  dimColor={result.totalBytes === 0}
                  wrap="truncate"
                >
                  {result.icon}  {result.label}
                </Text>
              </Box>
              <Box width={12} justifyContent="flex-end">
                <SizeText bytes={result.totalBytes} />
              </Box>
              {focused && (
                <Box gap={2}>
                  <Text dimColor wrap="truncate">
                    {result.description}
                  </Text>
                  {hasDetails && (
                    <Text color="cyan" dimColor>→ detail</Text>
                  )}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="cyan" dimColor>{'─'.repeat(60)}</Text>
        <Box gap={3}>
          <Text dimColor>↑↓ Navigate</Text>
          <Text dimColor>Space: Toggle</Text>
          <Text dimColor>→ / D: Detail</Text>
          <Text dimColor>A: All</Text>
          <Text color="magenta" dimColor>R: RAM</Text>
          <Text color="green" bold>Enter: Clean {selectedFormatted}</Text>
          <Text dimColor>Q: Quit</Text>
        </Box>
      </Box>
    </Box>
  )
}
