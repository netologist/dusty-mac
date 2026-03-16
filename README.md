# mac-cleaner

A beautiful, interactive TUI Mac cleaner — a free, open-source alternative to CleanMyMac, running entirely in your terminal.

```
npx mac-cleaner
```

> macOS only. Requires Node.js 18+.

---

## Screenshot

```
   mac-cleaner v1.0.0  —  Scanning your Mac...
  ──────────────────────────────────────────────────────────

  ✔   System Caches               3.9 GB
  ✔   Large Files                26.4 GB
  ✔   Duplicate Files             2.9 GB
  ✔   Package Manager Caches      1.1 GB
  ✔   Browser Caches              1.2 MB
  ✔   Temp & .DS_Store          385.9 KB
  ✔   App Leftovers               5.8 MB
  ✔   Login & Launch Items        5.8 KB
  ...
```

---

## Features

- **Smart scan** — 17 scanners run in parallel across your entire system
- **Dashboard** — disk volumes, RAM usage, CPU load, and top processes at a glance
- **Interactive results** — navigate, inspect, and select/deselect individual files before cleaning
- **Detail view** — drill into any category to see exactly what will be removed
- **Duplicate finder** — SHA-256 content hashing to find true duplicates, not just name matches
- **RAM optimizer** — free up memory with optional sudo, shows before/after comparison
- **Software updates** — detects outdated Homebrew formulae and global npm packages
- **Safe by default** — confirmation screen before any deletion; no file is touched without your consent
- **No GUI required** — runs in any terminal emulator, including SSH sessions

---

## Usage

```bash
# Run directly without installing
npx mac-cleaner

# Or install globally
npm install -g mac-cleaner
mac-cleaner
```

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate list |
| `Enter` | View details / confirm |
| `Space` | Toggle item selection |
| `C` | Start cleaning |
| `R` | Open RAM optimizer |
| `Q` / `Esc` | Quit / go back |

---

## Scanners

| Scanner | What it finds |
|---------|---------------|
| System Caches | `/Library/Caches`, `~/Library/Caches` |
| Log Files | `/var/log`, `~/Library/Logs`, crash reports |
| Browser Caches | Chrome, Firefox, Safari, Arc, Brave, Edge |
| Xcode Junk | Derived data, device support files, archives |
| iOS Simulators | Unused simulator runtimes |
| iOS Device Backups | Old iPhone/iPad backups in MobileSync |
| node_modules | Orphaned `node_modules` directories |
| Package Manager Caches | npm, yarn, pnpm, bun, pip, Poetry, conda, gem, Homebrew |
| App Leftovers | Orphaned support files from uninstalled apps |
| Trash Bins | Main trash + per-volume `.Trashes` |
| Temp & .DS_Store | Temp directories, `.DS_Store`, `.localized` |
| Mail Downloads | Attachments stored by Mail.app |
| Build Caches | Gradle, Maven, CMake, Bazel, Cargo, Go, Rust, Swift PM |
| Large Files | Files ≥ 50 MB across your home directory |
| Duplicate Files | True duplicates by size + SHA-256 hash (files ≥ 1 MB) |
| Login & Launch Items | `LaunchAgents` and `LaunchDaemons` plists |
| Software Updates | Outdated Homebrew formulae and global npm packages (informational) |

---

## Comparison with CleanMyMac

> Legend: ✅ Supported &nbsp; 🟡 Partial &nbsp; ❌ Not supported &nbsp; 🔧 Planned

### Cleaning & Space Recovery

| Feature | mac-cleaner | CleanMyMac |
|---------|:-----------:|:----------:|
| System junk / caches | ✅ | ✅ |
| Log files | ✅ | ✅ |
| Trash emptying | ✅ | ✅ |
| Mail attachments & downloads | ✅ | ✅ |
| Browser caches (Chrome, Firefox, Safari, Arc, Brave, Edge) | ✅ | ✅ |
| Xcode derived data & device support | ✅ | ✅ |
| iOS device backups | ✅ | ✅ |
| iOS simulators | ✅ | ✅ |
| Temp files & .DS_Store | ✅ | ✅ |
| node_modules finder | ✅ | ❌ |
| Package manager caches (npm, pip, gem, brew, cargo…) | ✅ | 🟡 (brew only) |
| Build tool caches (Gradle, Maven, CMake, Bazel…) | ✅ | ❌ |
| App leftover files | ✅ | ✅ |
| Large file finder (≥ 50 MB) | ✅ | ✅ |
| Duplicate file finder (SHA-256) | ✅ | ✅ (via Gemini 2) |
| Similar photo finder | ❌ | ✅ |
| Old & large files review | 🟡 (large files only) | ✅ |
| Cloud storage (iCloud, Dropbox) analysis | ❌ | ✅ |
| External drive cleaning | ❌ | ✅ |
| Per-item select/deselect before deletion | ✅ | ✅ |
| Custom scan paths | ❌ | 🟡 |
| Scheduled / automatic cleaning | ❌ | ✅ |

### Performance & System

| Feature | mac-cleaner | CleanMyMac |
|---------|:-----------:|:----------:|
| RAM optimizer (free memory) | ✅ | ✅ |
| RAM before/after comparison | ✅ | ✅ |
| Disk usage dashboard | ✅ | ✅ |
| CPU load monitor | ✅ | ✅ |
| Top processes by CPU/RAM | ✅ | ✅ |
| Force-quit hanging apps | ❌ | ✅ |
| Maintenance scripts (fsck, permissions repair, etc.) | ❌ | ✅ |
| Disk health / S.M.A.R.T. status | ❌ | ✅ |
| Speed test / benchmarks | ❌ | ❌ |
| Battery health info | ❌ | 🟡 |

### Apps & Software

| Feature | mac-cleaner | CleanMyMac |
|---------|:-----------:|:----------:|
| App uninstaller (removes leftovers) | 🟡 (detects leftovers, no GUI uninstall) | ✅ |
| Software updater (brew / npm) | ✅ (informational) | ✅ (one-click update) |
| App store updates checker | ❌ | ✅ |
| Broken login items detection | ✅ | ✅ |
| Login items manager (enable/disable) | 🟡 (list only) | ✅ |
| Launch agents / daemons manager | 🟡 (list only) | ✅ |
| Startup items control | ❌ | ✅ |
| Browser extensions manager | ❌ | ✅ |

### Security & Privacy

| Feature | mac-cleaner | CleanMyMac |
|---------|:-----------:|:----------:|
| Malware / adware scanner | ❌ | ✅ |
| Ransomware protection | ❌ | ✅ |
| Real-time threat monitor | ❌ | ✅ |
| Privacy cleaner (recent files, history) | ❌ | ✅ |
| File shredder (secure erase) | ❌ | ✅ |
| VPN integration | ❌ | ❌ (separate app) |

### Interface & Experience

| Feature | mac-cleaner | CleanMyMac |
|---------|:-----------:|:----------:|
| Terminal / TUI interface | ✅ | ❌ |
| GUI (native macOS app) | ❌ | ✅ |
| Menu bar icon | ❌ | ✅ |
| Dark mode | ✅ (inherits terminal theme) | ✅ |
| SSH / headless usage | ✅ | ❌ |
| One-command install (npx) | ✅ | ❌ |
| Open source | ✅ | ❌ |
| Price | **Free** | $3.35–$9.99/month |
| Platform | macOS | macOS |
| Virtual/VM disk detection | ✅ (Colima, Docker, Parallels…) | ❌ |
| Confirmation screen before deletion | ✅ | ✅ |
| Sudo password prompt (no silent escalation) | ✅ | ✅ |

---

## Development

```bash
# Clone and install
git clone <repo>
cd mac-cleaner
npm install

# Run in dev mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build

# Run built output
node dist/cli.js
```

### Project structure

```
src/
├── cli.tsx                 # Entry point + macOS platform guard
├── App.tsx                 # Root component, screen state machine
├── scanner/
│   ├── index.ts            # Scanner registry (17 scanners)
│   ├── types.ts            # ScanResult, PathDetail types
│   └── *.ts                # Individual scanner modules
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── DashboardScreen.tsx # Disk / RAM / CPU overview
│   ├── ScanResultsScreen.tsx
│   ├── DetailScreen.tsx    # Per-item select/deselect
│   ├── ConfirmScreen.tsx
│   ├── ProgressScreen.tsx
│   ├── RamScreen.tsx
│   └── SummaryScreen.tsx
├── components/
│   ├── Header.tsx
│   ├── PasswordInput.tsx   # Masked sudo password input
│   ├── ProgressBar.tsx
│   ├── SizeText.tsx
│   └── StatusIcon.tsx
├── cleaner/
│   ├── index.ts            # Deletion executor
│   └── utils.ts
└── utils/
    ├── memory.ts           # RAM stats + purge
    └── system.ts           # Disk volumes, CPU, top processes
```

### Tech stack

| | |
|--|--|
| Runtime | Node.js 18+ |
| UI framework | [Ink](https://github.com/vadimdemedes/ink) v5 + React 18 |
| Language | TypeScript 5 |
| Bundler | tsup (ESM, single file) |
| File globbing | fast-glob |

---

## License

MIT
