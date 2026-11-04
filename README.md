<div align="center">

# Taskify •
### The Local-First, Privacy-Native Productivity Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Dexie.js](https://img.shields.io/badge/IndexedDB-Dexie.js-orange?style=flat-square)](https://dexie.org)
[![Capacitor 8](https://img.shields.io/badge/Capacitor-Android%20%7C%20iOS-119EFF?style=flat-square&logo=capacitor)](https://capacitorjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

<p align="center">
  <b>Zero mandatory accounts. Zero remote servers. Zero telemetry. 100% data sovereignty.</b><br>
  Built with Apple Design System principles, fluid liquid physics, and solid aesthetic minimalism.
</p>

</div>

---

## 🌟 Overview

**Taskify** is an open-source personal life operating system unifying **Task Management**, **Atomic Habit Tracking**, **Consistency Streaks**, and **Cashflow Discipline** into a lightning-fast, offline-first experience.

Every interaction runs sub-16ms with zero network lag, storing all relational data directly in your browser or device via **IndexedDB (Dexie.js)**.

---

## ✨ Key Features

- **📱 Pure 120Hz Viscous Oil Glide**: Preloaded horizontal sliding across main tabs (`Today`, `Tasks`, `Habits`, `Finance`) powered by flat 2D hardware-composited tape motion, Apple exponential momentum projection, release velocity handoff, and deferred state commit. Zero blank flash, zero frame drops on budget or flagship hardware.
- **⚡ Unified Full-Featured Quick Capture (`+`)**: One-tap quick capture dialog available from the bottom dock and home screen, providing all fields for Tasks (deadline date & time, priority, reminder), Routines (category, target, time of day, accent color, reminders), and Cashflow (income/expense, payment method, category, date).
- **🔔 Native Apple In-App Alert Banner & Multi-Reminders**: Dynamic Island floating alert banner with Web Audio bell chime, native mobile haptic feedback, and configurable daily routine reminders (1x to 5x presets) and task deadline alerts.
- **🔍 Universal Spotlight Search (`Cmd+K` / `/`)**: Rapid command palette querying tasks, routines, cashflow ledger, and direct system actions in real time.
- **🔥 Consistency Hall of Fame**:
  - Live animated flame counter in the top navigation bar.
  - Dual-mode streak showcase: Unreal graphics display + 14-week consistency heatmap matrix.
  - Progression rank tiers (Bronze Pioneer $\rightarrow$ Diamond Titan) and Streak Freeze Shields.
- **🎯 Creative Tasks Architecture**:
  - Bento Milestone Grid with category accent capsules, glowing priority badges, and deadline capsules.
  - Instant Swiss Minimalist Compact Rows toggle for dense productivity triage.
- **💳 Wealth & Cashflow Architecture**:
  - Real-time **Daily Safe-to-Spend** calculation based on monthly budget and remaining calendar days.
  - Income and expense capture with payment method classification (Card, Apple Pay, Cash, Bank Transfer, Other).
  - Client-side zero-API currency auto-detection from locale & timezone.
- **🎨 7 Handcrafted Solid Color Palettes**:
  - `Warm Espresso & Ochre` (Flagship warm earth minimal)
  - `Nordic Frost & Platinum` (Glacier cyan & deep slate)
  - `Kyoto Matcha & Bamboo` (Zen moss & bamboo green)
  - `Amber Dune & Sahara Gold` (Molten liquid gold & dusk)
  - `Forest Moss & Rose Noir` (Woodland green & dusty rose)
  - `Tokyo Cyber Amethyst` (Midnight black & electric violet)
  - `Obsidian Pure OLED` (Monochrome high-contrast pitch black)
- **📅 iOS-Grade Custom Date & Time Pickers**:
  - Month calendar grid with ISO weekday alignment and quick preset chips.
  - Dual-tumbler drum dial with 12-hour grid, 5-minute multiples, AM/PM segmented switch, and quick presets.
- **😂 Dynamic Gen-Z Delete Dialogs**:
  - Rotating pool of playful, authentic confirmation dialogs ("No cap, this will disappear into the void forever fr fr").
- **📲 True Cross-Platform & Wireless Debugging**:
  - Native iOS & Android builds configured via `@capacitor/core`.
  - Android Studio ready with cleartext development config and Chrome remote debugging (`chrome://inspect`).
  - JSON system export & import with full backup portability.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Taskify Frontend                     │
│      React 19 + TypeScript + Tailwind CSS v4           │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   ┌────────────────────┐      ┌────────────────────┐
   │    Web Runtime     │      │ Capacitor Native   │
   │  Vite Production   │      │ iOS & Android      │
   └──────────┬─────────┘      └──────────┬─────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
              ┌───────────────────────────┐
              │  Local-First Storage      │
              │  IndexedDB (Dexie.js)     │
              │  • Tasks Table            │
              │  • Habits & Logs Table    │
              │  • Transactions Table     │
              │  • Settings Key-Value     │
              └───────────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org) >= 20.x
- `npm` >= 10.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/taskify.git
cd taskify

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

```bash
# Run unit tests
npm test

# Production build and type checking
npm run build

# Sync web assets to native Android and iOS
npm run cap:sync
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Universal Spotlight Search |
| <kbd>/</kbd> | Instant Search |
| <kbd>1</kbd> | Switch to **Today** view |
| <kbd>2</kbd> | Switch to **Tasks** view |
| <kbd>3</kbd> | Switch to **Habits** view |
| <kbd>4</kbd> | Switch to **Streaks** view |
| <kbd>5</kbd> | Switch to **Finance** view |
| <kbd>6</kbd> | Switch to **Settings** view |
| <kbd>Esc</kbd> | Close active modal / slide-over |

---

## 📱 Mobile Platform Builds (Capacitor)

```bash
# Android Studio
npm run cap:android

# Xcode (macOS only)
npm run cap:ios
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
