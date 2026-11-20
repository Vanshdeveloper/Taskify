# Security Policy

## Data Sovereignty and Local Storage

Taskify is built from the ground up as a local-first application:
- **Zero remote databases**: Your tasks, habits, notes, finances, and settings never touch a company server.
- **Client-side storage**: All relational data is stored directly in your browser or device using IndexedDB (via Dexie.js).
- **No telemetry or analytics**: Taskify contains no third-party trackers, advertising SDKs, or background telemetry.
- **Offline operation**: The entire application runs fully offline.

Because Taskify has no central user database or remote API endpoints, typical server-side breaches (such as leaked SQL databases or stolen password lists) do not apply to this repository.

## Supported Versions

Only the latest release on the `main` branch receives security updates and bug fixes.

| Version | Supported |
|:---|:---|
| 1.0.x (main branch) | Yes |
| < 1.0.0 | No |

## Reporting a Security Concern

If you find a security issue, such as client-side script injection in notes or export handling risks:
1. Please do not open a public issue.
2. Send an email to the repository owner or open a private GitHub security advisory.
3. Include a description of the issue, steps to reproduce it, and any proof-of-concept code.
4. We will review and respond to reports within 48 hours.

## Best Practices for Users

Because your data lives directly on your device:
- Keep your browser and operating system up to date.
- Use the built-in **Export JSON** feature in Settings to make regular personal backups of your data.
- Avoid importing JSON backup files from untrusted or unknown sources.
