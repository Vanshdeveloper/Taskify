# TEST_INFRA.md — Master Opaque-Box Test Infrastructure & Methodology

> **Taskify Quality Assurance & Verification Standard**  
> **Track**: Independent E2E Testing Track (Feature F17)  
> **Author**: `test_writer_e2e_1`  
> **Framework**: Native Node.js Test Runner (`node:test` + `node:assert/strict`)  
> **Standard Compliance**: Gravitas Reliability Runtime (Invariants 1–6) & Apple Design Fluid Motion Directives

---

## 1. Test Philosophy & Core Invariants

The Taskify test infrastructure adheres strictly to **Opaque-Box Requirement-Driven Testing**. Tests do not couple to arbitrary internal implementation details; instead, they verify features through their external public interfaces, API contracts, mathematical invariants, DOM layouts, and serialized file formats.

### The 4 Foundational Pillars:
1. **Opaque-Box Verification**: Every test treats the system under test (SUT) as an opaque box with well-defined inputs and observable outputs (return values, database mutations, UI layout classes, physics ODE step responses, and exported CSV/Markdown files).
2. **Progressive Testability**: Features are verified at their current milestone level without depending on uncompleted downstream milestones. For completed milestones (M1 & M2, Features F1–F10), tests run against live code and must achieve a 100% pass rate. For planned milestones (M3 & M4, Features F11–F16), tests verify explicit interface contracts, mathematical schemas, and algorithmic invariants defined in `PROJECT.md`.
3. **Deterministic & Isolated Execution**: Each test sets up its own state independently, avoids shared mutable variables, and cleans up after execution. All tests execute synchronously or with deterministic async promises without timing flakiness.
4. **Adversarial & Numerical Rigor**: Motion and gesture physics are cross-validated against Runge-Kutta 4th order (RK4) and analytical closed-form ordinary differential equations (ODEs). Formatting and sanitization are stress-tested against RFC 4180, extreme Unicode strings, and adversarial boundary values.

---

## 2. Feature Inventory Mapping (Features F1–F17)

| Feature | Feature Description | Milestone | Tier 1 (Coverage) | Tier 2 (Boundaries) | Observable Interface Contract |
|---|---|---|---|---|---|
| **F1** | Route & Dialog Code-Splitting | M1 | 5 tests | 5 tests | `React.lazy()` chunking, `<Suspense>` boundaries, build bundle manifest chunks |
| **F2** | Dynamic Import for Confetti | M1 | 5 tests | 5 tests | Dynamic `import('canvas-confetti')` on-demand in `triggerCompletionConfetti`, zero static top-level bundle weight |
| **F3** | Context Value & Callback Memoization | M1 | 5 tests | 5 tests | `useMemo` Provider value, `useCallback` mutation handlers, referential stability |
| **F4** | Algorithmic Map/Set Lookups | M1 | 5 tests | 5 tests | O(1) `Set<string>` streak loop in `AppContext`, O(N) `Map<string, number>` 98-cell aggregation in `StreakHeatmap` |
| **F5** | Reminder Sync Debounce & Dependency Hygiene | M1 | 5 tests | 5 tests | 500ms debounce timer, unmount cleanup, `@capacitor/cli` devDependency placement |
| **F6** | Unified Critically Damped Spring Physics | M2 | 5 tests | 5 tests | `APPLE_SPRINGS.modal`, `.sheet`, `.snappy` ($\zeta = 1.0$), 350ms synchronized scrim fade |
| **F7** | Eliminate Press Feedback Collision | M2 | 5 tests | 5 tests | Zero CSS `transition: transform` on `.pressable`, `whileTap={{ scale: 0.97 }}` spring feedback |
| **F8** | Interruptible Liquid Navigation Gestures | M2 | 5 tests | 5 tests | `getLiveTranslateX` with `DOMMatrix` reading, 0.28 rubber-banding, Apple exponential momentum decay |
| **F9** | Spring Rebound in SwipeToComplete | M2 | 5 tests | 5 tests | `APPLE_SPRINGS.snappy` rebound deceleration to 0 on release below threshold (>130px) |
| **F10** | Viewport Layout, Materials & Ergonomics | M2 | 5 tests | 5 tests | Bento 2-column on tablet (`md:grid-cols-12`), 44px min tap targets, `blur(20px) saturate(180%)`, bottom sheets <640px, dead code removal |
| **F11** | Task Duplication & Quick Templates | M3 | 5 tests | 5 tests | `duplicateTask(id: string)` deep cloning, ID regeneration, title prefixing, reset to `'todo'` |
| **F12** | Multi-Criteria Task Sorting | M3 | 5 tests | 5 tests | Due date, priority (urgent > high > med > low), alphabetical title, createdAt stable sort |
| **F13** | Lightweight Task Subtasks / Checklist | M4 | 5 tests | 5 tests | `Subtask` model, `updateTaskSubtasks`, percentage calculation `Math.round(comp / total * 100)` |
| **F14** | Integrated Focus / Pomodoro Session Timer | M4 | 5 tests | 5 tests | 25m/5m state machine (`idle`, `running`, `paused`, `completed`), drift-free interval, Web Audio chime synthesis |
| **F15** | Task CSV & Markdown Backlog Export | M3 | 5 tests | 5 tests | RFC 4180 CSV export with field escaping, hierarchical Markdown checklist with subtasks |
| **F16** | In-List Keyboard Navigation | M3 | 5 tests | 5 tests | `J`/`K` item indexing, `Space` toggle, `E` edit modal, `D` delete, input focus suppression |
| **F17** | Master Opaque-Box Test Suite | E2E | Unified Runner | Regression Suite | 4-tier test architecture, `TEST_INFRA.md`, `TEST_READY.md` |

---

## 3. Test Architecture & 4-Tier Matrix

The test suite is organized into 4 hierarchical, modular tiers located in `test/`:

```
test/
├── e2e-tier1-features.test.mjs    # Tier 1: Equivalence Class Feature Coverage (>=80 tests)
├── e2e-tier2-boundaries.test.mjs  # Tier 2: Boundary, Extreme Limits & Stress (>=80 tests)
├── e2e-tier3-pairwise.test.mjs    # Tier 3: Cross-Feature Pairwise Interactions (12+ tests)
├── e2e-tier4-scenarios.test.mjs   # Tier 4: Real-World Application Workflows (6 full scenarios)
├── core-logic.test.mjs            # Baseline M0 Core Logic Suite (19 tests)
├── empirical-m1-challenger.mjs    # Milestone 1 Deep Verification Suite (12 tests)
└── empirical-m2-gestures.test.mjs # Milestone 2 Physics & Gestures Suite (22 tests)
```

### Tier 1: Feature Coverage (>=5 tests per feature for F1–F16)
- Evaluates the nominal primary behaviors and acceptance criteria of each feature in isolation.
- Verifies that all valid inputs produce expected outputs and state transitions conforming to interface contracts.
- **Coverage Target**: 16 features $\times$ 5 tests minimum = **80+ tests**.

### Tier 2: Boundary & Corner Cases (>=5 tests per feature for F1–F16)
- Exercises system limits: empty arrays, 0 values, massive arrays (10,000+ items), leap years, timezone offsets, boundary rubber-band limits, extreme velocities ($\pm 50,000$ px/s), and malformed inputs.
- Verifies graceful degradation, zero crashes, absence of memory leaks, and bounded numerical precision.
- **Coverage Target**: 16 features $\times$ 5 tests minimum = **80+ tests**.

### Tier 3: Cross-Feature Pairwise Interactions
- Evaluates combinatorial interactions across orthogonal feature domains:
  - Tasks + Habit Streaks (completing task synchronizes daily consistency score).
  - Finance Cashflow + Task Metrics (currency changes update all currency formatting).
  - Navigation Gestures + Modal Presentation (opening dialog freezes live momentum).
  - Multi-Criteria Sorting + In-List Keyboard Navigation (`J`/`K` navigation follows sorted order).
  - Task Duplication + Subtasks Checklist (duplicating creates deep cloned subtasks).
  - Pomodoro Timer + Task Completion (timer finish prompts task completion).
  - Backlog Export + Subtasks + Templates (CSV & Markdown accurately serialize nested checklist state).
  - Dynamic Confetti + Haptic Vibration Gating (toggling haptics off silences vibration while keeping visuals).
  - Responsive Breakpoints + Bottom Sheets + 44px Touch Targets (mobile viewports enforce thumb-zone ergonomics).
  - Reminder Debounce + Task Duplication (batch task cloning fires debounced sync once).
  - Streak Heatmap + Habit Log Deletion (deleting historical log recalibrates heatmap cell fills).
  - Liquid Viewport + SwipeToComplete (`data-no-swipe` prevents parent gesture conflicts).
- **Coverage Target**: 12+ pairwise integration tests.

### Tier 4: Real-World Application Scenarios
- End-to-end full-lifecycle user journeys exercising real-world workflows from start to finish:
  - **Scenario 1**: Morning Check-in & Priority Task Sprint.
  - **Scenario 2**: Weekly Financial Audit & Cashflow Rebalance.
  - **Scenario 3**: Backlog Triage, Multi-Criteria Sorting & Markdown Export.
  - **Scenario 4**: Habit Streak Freeze, Missed Day & Recovery.
  - **Scenario 5**: 25-Minute Focus / Pomodoro Session Lifecycle.
  - **Scenario 6**: High-Load Stress, Data Corruption Recovery & JSON Backup/Restore.
- **Coverage Target**: 6 comprehensive multi-step workflows.

---

## 4. Execution Commands & Automation

All test suites run natively via Node.js without external runner dependencies:

```bash
# Run all E2E test suites (Tiers 1-4)
node --test test/e2e-tier1-features.test.mjs test/e2e-tier2-boundaries.test.mjs test/e2e-tier3-pairwise.test.mjs test/e2e-tier4-scenarios.test.mjs

# Run full project verification (All baseline + E2E suites)
node --test test/*.test.mjs test/empirical-*.mjs

# Run project standard npm test command
npm test
```

---

## 5. Coverage & Verification Gates

1. **Pass Rate Gate**: 100% of tests must pass with 0 failures and 0 uncaught rejections.
2. **Build Gate**: `npm run build` (`tsc -b && vite build`) must succeed with exit code 0.
3. **Total Test Count Gate**: The combined test suite must contain $\ge 180$ executable tests.
4. **Performance Gate**: Full test suite execution across all tiers must finish in $< 10$ seconds.
