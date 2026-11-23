# Taskify

Taskify is a free and open-source personal productivity app. It runs locally on your device and keeps all data in local storage. There are no user accounts, no cloud servers, and no telemetry.

## Features

- **Tasks**: Create and organize tasks with priorities, subtasks, due dates, reminder times, and categories.
- **Habits**: Track daily routines, track streak counts, and set recurring reminders.
- **Focus Timer**: Work in Pomodoro sessions with custom lengths, ticking audio, and edge progress lighting.
- **Notes**: Write notes with checklists, text styling, dark and light modes, and automatic local saving.
- **Finance**: Log daily income and expenses. The app calculates a daily safe-to-spend limit based on your monthly budget and remaining calendar days.
- **Local Storage**: Everything is saved to IndexedDB on your device. You can export or import your data as a JSON file at any time.

## Downloads

Taskify is available across platforms:

| Platform | Format | Release |
|:---|:---|:---|
| Windows | `.exe` (Installer) | [Download](https://github.com/Vanshdeveloper/Taskify/releases/latest) |
| macOS | `.dmg` | [Download](https://github.com/Vanshdeveloper/Taskify/releases/latest) |
| Linux | `.AppImage` | [Download](https://github.com/Vanshdeveloper/Taskify/releases/latest) |
| Android | `.apk` | [Download](https://github.com/Vanshdeveloper/Taskify/releases/latest) |

## Development Setup

Requirements:
- Node.js 20 or newer
- npm 10 or newer

```bash
# Clone the repository
git clone https://github.com/Vanshdeveloper/Taskify.git

# Install dependencies
cd Taskify
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

## Mobile Development

The mobile app uses Capacitor:

```bash
# Sync web build to native folders
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode
npm run cap:ios
```

## Why I built this

I vibe-coded Taskify for people who want to track everything in one private place: daily tasks, habits, daily spending, focus blocks, and quick notes. Most tools force you into monthly subscriptions, mandatory accounts, and scattered apps. Taskify keeps all your data strictly on your device with zero tracking.

Try out the app on your desktop or phone. If you spot a bug or have ideas for the layout, navigation, or features, open an issue on GitHub. If you want to fix something or refine the code, submit a pull request. I review every submission and merge verified improvements directly into main.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
