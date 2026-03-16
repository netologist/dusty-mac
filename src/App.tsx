import React, { useState, useEffect, useCallback } from 'react'
import { Box, useApp } from 'ink'
import { WelcomeScreen } from './screens/WelcomeScreen.js'
import { DashboardScreen } from './screens/DashboardScreen.js'
import { ScanResultsScreen } from './screens/ScanResultsScreen.js'
import { ConfirmScreen } from './screens/ConfirmScreen.js'
import { ProgressScreen } from './screens/ProgressScreen.js'
import { SummaryScreen } from './screens/SummaryScreen.js'
import { RamScreen } from './screens/RamScreen.js'
import { DisclaimerScreen } from './screens/DisclaimerScreen.js'
import { runAllScanners, SCANNERS } from './scanner/index.js'
import { cleanCategories } from './cleaner/index.js'
import type { ScanResult, CleanProgress } from './scanner/types.js'

type AppScreen = 'disclaimer' | 'scanning' | 'dashboard' | 'results' | 'confirm' | 'progress' | 'summary' | 'ram'

export function App() {
  const { exit } = useApp()

  const [screen, setScreen] = useState<AppScreen>('disclaimer')
  const [prevScreen, setPrevScreen] = useState<AppScreen>('dashboard')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [scanningIds, setScanningIds] = useState<Set<string>>(
    new Set(SCANNERS.map((s) => s.id))
  )
  const [selectedCategories, setSelectedCategories] = useState<ScanResult[]>([])
  const [cleanProgress, setCleanProgress] = useState<Map<string, CleanProgress>>(new Map())
  const [currentPath, setCurrentPath] = useState('')
  const [totalBytesFreed, setTotalBytesFreed] = useState(0)
  const [freedByCategory, setFreedByCategory] = useState<Map<string, number>>(new Map())

  // Start scanning when we enter the scanning screen
  useEffect(() => {
    if (screen === 'scanning') {
      runAllScanners((id, status, result) => {
        setScanningIds((prev) => {
          const next = new Set(prev)
          if (status !== 'scanning') next.delete(id)
          return next
        })

        if (result && status !== 'scanning') {
          setScanResults((prev) => {
            const existing = prev.find((r) => r.id === id)
            if (existing) return prev
            return [...prev, result as ScanResult]
          })
        }
      }).then((results) => {
        setScanResults(results)
        setScanningIds(new Set())
        setScreen('dashboard')  // land on dashboard first
      })
    }
  }, [screen])

  const handleConfirm = useCallback((selected: ScanResult[]) => {
    setSelectedCategories(selected)
    setScreen('confirm')
  }, [])

  const handleStartCleaning = useCallback(async () => {
    setScreen('progress')
    setTotalBytesFreed(0)
    setCleanProgress(new Map())

    let runningTotal = 0

    const freed = await cleanCategories(selectedCategories, (progress: CleanProgress) => {
      setCurrentPath(progress.currentPath)
      setCleanProgress((prev) => new Map(prev).set(progress.categoryId, progress))

      if (progress.done) {
        runningTotal += progress.bytesFreed
        setTotalBytesFreed(runningTotal)
      }
    })

    setFreedByCategory(freed)
    setScreen('summary')
  }, [selectedCategories])

  const openRam = useCallback((from: AppScreen) => {
    setPrevScreen(from)
    setScreen('ram')
  }, [])

  const totalToFree = selectedCategories.reduce((s, r) => s + r.totalBytes, 0)

  return (
    <Box flexDirection="column">
      {screen === 'disclaimer' && (
        <DisclaimerScreen
          onAccept={() => setScreen('scanning')}
          onDecline={exit}
        />
      )}

      {screen === 'scanning' && (
        <WelcomeScreen
          scanningIds={scanningIds}
          results={scanResults}
          totalFound={scanResults.reduce((s, r) => s + r.totalBytes, 0)}
        />
      )}

      {screen === 'dashboard' && (
        <DashboardScreen
          scanResults={scanResults}
          onClean={() => setScreen('results')}
          onRam={() => openRam('dashboard')}
          onExit={exit}
        />
      )}

      {screen === 'results' && (
        <ScanResultsScreen
          results={scanResults}
          onConfirm={handleConfirm}
          onBack={() => setScreen('dashboard')}
          onRam={() => openRam('results')}
        />
      )}

      {screen === 'confirm' && (
        <ConfirmScreen
          selected={selectedCategories}
          onConfirm={handleStartCleaning}
          onCancel={() => setScreen('results')}
        />
      )}

      {screen === 'progress' && (
        <ProgressScreen
          selected={selectedCategories}
          progress={cleanProgress}
          totalBytesToFree={totalToFree}
          currentPath={currentPath}
          totalBytesFreed={totalBytesFreed}
        />
      )}

      {screen === 'summary' && (
        <SummaryScreen
          selected={selectedCategories}
          freedByCategory={freedByCategory}
          onExit={exit}
          onRam={() => openRam('summary')}
        />
      )}

      {screen === 'ram' && (
        <RamScreen onBack={() => setScreen(prevScreen)} />
      )}
    </Box>
  )
}