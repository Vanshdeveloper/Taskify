# AGENTS.md — Global AI Agent Operating Rules & Directives

> **MANDATORY INSTRUCTION FOR ALL AI AGENTS:**  
> Every task in this repository MUST be executed strictly according to the **Gravitas Reliability Runtime** and the **Apple Design System**. You must also maintain the live project ledger in [`PROJECT_LEDGER.md`](file:///c:/Users/Admin/Desktop/Root/taskify%20(ver-2)/PROJECT_LEDGER.md).

---

## 1. The Core Directives

### Directive 1: Execute with the Gravitas Runtime
Before touching or planning any code, consult and follow [`.agents/skills/gravitas/SKILL.md`](file:///c:/Users/Admin/Desktop/Root/taskify%20(ver-2)/.agents/skills/gravitas/SKILL.md).
The **6 Invariants** are non-negotiable:
1. **Ground before mutating**: Always read the target file, related dependencies, and existing tests before editing. Never assume file contents or project state.
2. **Stay in declared scope**: Only modify files within the declared task scope.
3. **Completion needs evidence**: A task is never marked complete without executable proof (build passes, tests pass, type-check passes).
4. **Never exact-retry a failure**: If an approach fails, change the diagnosis, context, or strategy before retrying.
5. **Satisfy the contract**: Acceptance criteria and required validators gate completion.
6. **Say what you can't verify**: Mark uncertain or unverifiable items explicitly. Never fabricate certainty.

### Directive 2: Enforce Apple Design & Fluid Motion
All UI and interaction design must adhere to [`.agents/skills/Apple design/SKILL.md`](file:///c:/Users/Admin/Desktop/Root/taskify%20(ver-2)/.agents/skills/Apple%20design/SKILL.md):
- **Zero Latency & 1:1 Direct Manipulation**: Visual feedback on `pointerdown` (`transform: scale(0.97)`), continuous tracking with `setPointerCapture`.
- **Interruptibility**: Animations must use additive springs that can be grabbed and reversed mid-flight without input lockouts.
- **Spring Physics Standard**:
  - Sheets/Drawers/Modals: Damping `1.0`, Response `0.35s` (critically damped, no bounce).
  - Momentum/Flicks/Completions: Damping `~0.8`, Response `0.30s` (slight natural bounce).
- **Translucent Materials & Vibrancy**: Use `backdrop-filter: blur(20px) saturate(180%)`, hierarchical depth, and scroll-edge gradient masks instead of rigid 1px border lines.
- **Optical Typography**: Dynamic tracking (`-0.025em` on display titles, positive on micro captions), responsive scaling.
- **Adaptive Across Devices**: Native-feeling experiences on Phone (<640px, thumb zone), Tablet (640-1024px, 2-column split), and Desktop (>1024px, 3-column macOS style).

### Directive 3: Maintain the Living Project Ledger
**Rule:** Every time the user instructs you to perform a task or build a feature (e.g., creating a navbar, building a screen, refactoring a database), you **MUST** record an entry in [`PROJECT_LEDGER.md`](file:///c:/Users/Admin/Desktop/Root/taskify%20(ver-2)/PROJECT_LEDGER.md).

Each ledger entry must contain:
1. **Task ID & Timestamp**
2. **User Request / Prompt**
3. **Scope & Files Touched**
4. **Implementation Details (What Changed)**
5. **Verification Evidence (Actual command outputs, build/test results)**
6. **Status** (`Completed` / `In Progress` / `Blocked`)

---

## 2. Project Architecture Standards

- **Core Framework**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion.
- **Data Layer**: Local-first offline storage via Dexie.js (IndexedDB). Zero mandatory user accounts. 100% data sovereignty.
- **Mobile Targets**: Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/haptics`).
- **Desktop Targets**: Electron (Windows `.exe`, macOS `.dmg`, Linux `.AppImage`).
- **Open Source**: Public GitHub repository with automated GitHub Actions CI/CD release builds.
