# Contributing to Taskify

Thank you for your interest in contributing to Taskify! We welcome contributions to make Taskify the premier privacy-first, local-offline productivity operating system.

---

## Guiding Principles

1. **Local-First & Privacy Sovereign**: Zero remote accounts, zero external tracking, zero telemetry. 100% of data belongs to the user and is stored locally in IndexedDB.
2. **Apple Design & Fluid Motion**:
   - Zero-latency direct manipulation (`pointerdown` feedback, additive spring physics).
   - Clean, tactile interfaces with translucent materials and balanced typography.
   - All horizontal sliding must run on the hardware compositor with zero React re-render lag during gestures.
3. **Reliability & Grounded Verification**:
   - Never commit code that breaks tests or type checks.
   - Run `npm test` and `npm run build` before submitting PRs.

---

## Development Setup

### Prerequisites
- **Node.js**: v20 or newer
- **npm**: v10 or newer
- **Android Studio** (optional, for Android builds & wireless debugging)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/taskify.git
cd taskify

# Install dependencies
npm install

# Start the Vite development server
npm run dev

# Run unit and stress tests
npm test

# Build production bundle
npm run build
```

---

## Mobile Development (Capacitor)

```bash
# Synchronize web assets to native Android / iOS projects
npx cap sync

# Open Android Studio
npm run cap:android

# Open Xcode
npm run cap:ios
```

---

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Keep changes focused and lean. Avoid unnecessary dependencies.
3. Ensure automated tests pass:
   ```bash
   npm test
   npm run build
   ```
4. Write clear, descriptive commit messages.
5. Open a Pull Request on GitHub with a summary of changes and verification evidence.

---

## License

By contributing to Taskify, you agree that your contributions will be licensed under the [MIT License](LICENSE).
