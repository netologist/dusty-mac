# mac-cleaner — Detailed Implementation Plan

## Overview

`mac-cleaner` is a beautiful terminal UI (TUI) application for macOS that scans for safely removable files — similar to CleanMyMac — but runs entirely in the terminal via `npx mac-cleaner`. Built with TypeScript, React, and Ink (React renderer for CLIs).

---

## Tech Stack

| Tool | Purpose |
|---|---|
| **Ink v5** | TUI framework — React for CLIs (used by Claude Code, Cloudflare Wrangler) |
| **React 18** | Component model |
| **TypeScript** | Type safety |
| **tsup** | Build/bundle (ESM output with shebang) |
| **chalk** | Terminal colors |
| **filesize** | Human-readable size formatting |
| **fast-glob** | Fast file/directory glob scanning |

---

## Scan Categories (13 total, user-level only — no sudo)

| # | Category | Paths Scanned |
|---|---|---|
| 1 | System Caches | ~/Library/Caches/* |
| 2 | Log Files | ~/Library/Logs/, CrashReporter/ |
| 3 | Browser Caches | Safari, Chrome, Firefox, Edge, Brave |
| 4 | Xcode DerivedData | ~/Library/Developer/Xcode/DerivedData/, DeviceSupport |
| 5 | iOS Simulators | ~/Library/Developer/CoreSimulator/ |
| 6 | iOS Device Backups | ~/Library/Application Support/MobileSync/Backup/ |
| 7 | node_modules | **/node_modules up to 5 levels from ~ |
| 8 | Package Manager Caches | ~/.npm/_cacache/, ~/.yarn/cache/, ~/.pnpm-store/ |
| 9 | App Leftovers | Orphaned ~/Library/Application Support/ folders |
| 10 | Trash Bins | ~/.Trash/, /Volumes/*/.Trashes/<uid>/ |
| 11 | Temp & .DS_Store | /private/tmp/*, .DS_Store files |
| 12 | Mail Downloads | ~/Library/Containers/com.apple.mail/Data/Library/Mail Downloads/ |
| 13 | Build Tool Caches | ~/.gradle/caches/, ~/.m2/, ~/.cargo/registry/, ~/.cache/pip/ |

---

## App Screens

1. **Welcome/Scanning** — Animated spinner + live scan progress per category
2. **Scan Results** — Selectable list (Space=toggle, A=all, Enter=proceed)
3. **Confirmation** — "Delete X GB?" Yes/No dialog
4. **Progress** — Progress bar + current path + completed categories
5. **Summary** — Total freed, per-category breakdown, Q to exit

---

## Safety Guarantees

- No sudo required (user paths only)
- Preview before delete (confirmation screen)
- No Mail database — only Mail Downloads folder
- No /System/Library/ paths
- App leftovers only flags confirmed-uninstalled app data

*Plan created: 2026-03-16*
