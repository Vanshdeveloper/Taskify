# Contributing to Taskify

Thank you for your interest in helping with Taskify.

Whether you are an experienced software engineer, a designer, or someone who vibe-codes with AI assistants, you are very welcome here.

---

## What We Value

1. **Local-First and Private**: No external tracking, no accounts, and no mandatory servers. All user data stays in local IndexedDB.
2. **Clean Design and Fluid Motion**: We follow Apple design principles. Interactions should feel instant, tactile, and natural on both desktop and mobile.
3. **No Bloat**: We keep the bundle light and dependencies minimal. If something can be done cleanly with standard JavaScript, React, or CSS, prefer that over adding a heavy package.
4. **Verified Code**: Every pull request must pass existing tests (`npm test`) and type checking (`npm run build`).

---

## Development Setup

### Prerequisites
- Node.js version 20 or newer
- npm version 10 or newer
- Android Studio or Xcode (optional, only if you want to test mobile builds)

### Steps

1. Fork and clone the repository:
```bash
git clone https://github.com/Vanshdeveloper/Taskify.git
cd Taskify
```

2. Install dependencies:
```bash
npm install
```

3. Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

4. Run tests:
```bash
npm test
```

5. Build for production and check TypeScript types:
```bash
npm run build
```

---

## Mobile Builds (Capacitor)

If you are working on native mobile behavior:

```bash
# Sync web changes to native projects
npm run cap:sync

# Open Android project in Android Studio
npm run cap:android

# Open iOS project in Xcode (macOS only)
npm run cap:ios
```

---

## How to Contribute

### 1. Finding or Reporting Bugs
If you find a bug, check existing GitHub Issues to see if it has already been reported. If not, open a new issue using the Bug Report template.

### 2. Proposing Features
If you want to build a new feature, open an issue first or describe it clearly in your pull request. Keeping features aligned with the clean, offline ethos of Taskify makes review faster.

### 3. Vibe-Coding and AI Contributions
If you use AI coding assistants to build features or fix bugs:
- Review the diff carefully before submitting.
- Make sure no dead code, unused imports, or placeholder files are left behind.
- Ensure all tests pass.
- Write a clear description of what changed and how you tested it.

### 4. Submitting a Pull Request
1. Create a feature branch:
```bash
git checkout -b feature/my-feature-name
```
2. Make your changes with concise, meaningful commit messages.
3. Verify tests and build pass:
```bash
npm test
npm run build
```
4. Push to your fork and open a Pull Request.

---

## Writing Guidelines

When writing user-facing text, documentation, or dialogs:
- Keep sentences short and clear.
- Avoid corporate buzzwords like "seamless", "leverage", or "elevate".
- Avoid em dashes. Use periods or commas instead.

---

## License

By contributing to Taskify, you agree that your contributions will be licensed under the MIT License.
