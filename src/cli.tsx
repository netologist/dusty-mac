import React from 'react'
import { render } from 'ink'
import { App } from './App.js'

// Only run on macOS
if (process.platform !== 'darwin') {
  console.error('dusty-os only works on macOS.')
  process.exit(1)
}

render(<App />, {
  exitOnCtrlC: true,
})
