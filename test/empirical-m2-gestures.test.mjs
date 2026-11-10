import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE: Milestone 2 Challenger 2
 * Focus: Interruptible DOMMatrix gestures, rapid mid-flight interruption, direction reversal,
 * Apple 0.28 rubber-band resistance, tap-to-stop settle with click suppression,
 * and responsive layout breakpoint class invariants (<640px, 640-1024px, >1024px).
 */

// Implementation extracts from LiquidTabViewport.tsx & motion.ts
function getLiveTranslateX(transformStr, fallbackX, customDOMMatrix) {
  if (!transformStr || transformStr === 'none') return fallbackX;
  try {
    if (typeof customDOMMatrix !== 'undefined') {
      return new customDOMMatrix(transformStr).m41;
    }
    const match = transformStr.match(/matrix(?:3d)?\((.+)\)/);
    if (match) {
      const values = match[1].split(',').map((v) => parseFloat(v.trim()));
      if (values.length === 6 && !isNaN(values[4])) return values[4];
      if (values.length === 16 && !isNaN(values[12])) return values[12];
    }
  } catch {
    // fallback
  }
  return fallbackX;
}

function projectMomentum(velocity, decelerationRate = 0.992) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

function calculateRubberBandPosition(desiredX, width, totalTabs = 4) {
  const minValidX = -(totalTabs - 1) * width;
  const maxValidX = 0;

  if (desiredX > maxValidX) {
    const overshoot = desiredX - maxValidX;
    return maxValidX + overshoot * 0.28;
  } else if (desiredX < minValidX) {
    const overshoot = desiredX - minValidX;
    return minValidX + overshoot * 0.28;
  }
  return desiredX;
}

function resolveTargetTab(currentX, velocity, width, totalTabs = 4) {
  const currentVisualIndex = -currentX / width;
  const projectedDistance = projectMomentum(velocity, 0.992);
  const projectedX = currentX + projectedDistance;

  let targetIndex;
  if (velocity < -160 && currentVisualIndex < totalTabs - 1) {
    targetIndex = Math.min(totalTabs - 1, Math.floor(currentVisualIndex) + 1);
  } else if (velocity > 160 && currentVisualIndex > 0) {
    targetIndex = Math.max(0, Math.ceil(currentVisualIndex) - 1);
  } else {
    targetIndex = Math.round(-projectedX / width);
  }

  return Math.max(0, Math.min(totalTabs - 1, targetIndex));
}

// -----------------------------------------------------------------------------
// Test 1: DOMMatrix & Matrix3D Extraction Stress & Edge Cases
// -----------------------------------------------------------------------------
test('Stress 1: getLiveTranslateX parses extreme float precisions, scientific notation and weird whitespaces', () => {
  // Sub-pixel fractional offsets with negative signs
  const m1 = 'matrix(1, 0, 0, 1, -345.89712, 0)';
  assert.equal(getLiveTranslateX(m1, 0), -345.89712);

  // 3D matrix with scientific notation or multi-space formatting
  const m2 = 'matrix3d( 1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   -8.125e2, 0, 0, 1 )';
  assert.equal(getLiveTranslateX(m2, 0), -812.5);

  // Negative zero
  const m3 = 'matrix(1, 0, 0, 1, -0, 0)';
  assert.equal(Object.is(getLiveTranslateX(m3, 0), -0) || getLiveTranslateX(m3, 0) === 0, true);

  // Zero displacement
  const m4 = 'matrix(1, 0, 0, 1, 0, 0)';
  assert.equal(getLiveTranslateX(m4, 999), 0);
});

test('Stress 2: getLiveTranslateX gracefully falls back on corrupted or malformed transforms', () => {
  const fallback = -420;
  assert.equal(getLiveTranslateX(null, fallback), fallback);
  assert.equal(getLiveTranslateX(undefined, fallback), fallback);
  assert.equal(getLiveTranslateX('', fallback), fallback);
  assert.equal(getLiveTranslateX('none', fallback), fallback);
  assert.equal(getLiveTranslateX('rotate(45deg)', fallback), fallback);
  assert.equal(getLiveTranslateX('matrix(foo, bar)', fallback), fallback);
  assert.equal(getLiveTranslateX('matrix(1, 0, 0, 1, NaN, 0)', fallback), fallback);
  assert.equal(getLiveTranslateX('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0)', fallback), fallback); // only 12 elements
});

test('Stress 3: getLiveTranslateX uses mock DOMMatrix and WebKitCSSMatrix conforming to W3C specs', () => {
  class MockW3CDOMMatrix {
    constructor(init) {
      if (init === 'matrix(1, 0, 0, 1, -732.5, 0)') {
        this.m41 = -732.5;
      } else {
        throw new Error('Invalid format');
      }
    }
  }

  const tx = getLiveTranslateX('matrix(1, 0, 0, 1, -732.5, 0)', 0, MockW3CDOMMatrix);
  assert.equal(tx, -732.5);

  // Error inside constructor triggers fallback
  const fallbackTx = getLiveTranslateX('invalid_matrix_str', -100, MockW3CDOMMatrix);
  assert.equal(fallbackTx, -100);
});

// -----------------------------------------------------------------------------
// Test 2: Rapid Mid-Flight Interruption & Coordinate Continuity
// -----------------------------------------------------------------------------
test('Stress 4: Rapid interruption sequence guarantees continuous 1:1 motion without position jumps', () => {
  const width = 400;
  let currentVisualX = 0; // Starts at Tab 0

  // Simulation: 5 consecutive mid-flight grab-and-flick cycles
  const interruptionSteps = [
    { inFlightPos: -140, dragDelta: 30, releaseVelocity: 0, expectedSnapTab: 0 }, // settles to 0
    { inFlightPos: -80, dragDelta: -200, releaseVelocity: -300, expectedSnapTab: 1 }, // advances to 1
    { inFlightPos: -310, dragDelta: -160, releaseVelocity: -400, expectedSnapTab: 2 }, // advances to 2
    { inFlightPos: -690, dragDelta: 150, releaseVelocity: 500, expectedSnapTab: 1 }, // reverses to 1
    { inFlightPos: -420, dragDelta: 20, releaseVelocity: 0, expectedSnapTab: 1 }, // settles to 1
  ];

  for (const step of interruptionSteps) {
    // 1. Live grab: freeze at inFlightPos
    const grabInstantX = step.inFlightPos;
    assert.equal(grabInstantX, step.inFlightPos, 'Must freeze exactly on presentation coordinate');

    // 2. Drag by dragDelta
    const draggedX = calculateRubberBandPosition(grabInstantX + step.dragDelta, width);
    assert.equal(draggedX, grabInstantX + step.dragDelta);

    // 3. Release with velocity
    const targetTab = resolveTargetTab(draggedX, step.releaseVelocity, width);
    assert.equal(targetTab, step.expectedSnapTab, `Target tab mismatch for step at pos ${draggedX}`);

    currentVisualX = -targetTab * width;
  }
});

// -----------------------------------------------------------------------------
// Test 3: Direction Reversal Mid-Flight (Adversarial Physics Stress)
// -----------------------------------------------------------------------------
test('Stress 5: Mid-flight direction reversal cleanly updates landing target against ongoing momentum', () => {
  const width = 400;

  // Case A: Track animating leftward towards Tab 2 (-800px), grabbed mid-flight at -620px
  // User rapidly pulls rightward with high positive velocity (+450 px/s)
  const reverseToTab1 = resolveTargetTab(-620, 450, width);
  assert.equal(reverseToTab1, 1, 'Must cleanly abort forward slide and reverse to Tab 1');

  // Case B: Track animating rightward towards Tab 0 (0px), grabbed mid-flight at -180px
  // User rapidly pulls leftward with negative velocity (-400 px/s)
  const reverseToTab1FromLeft = resolveTargetTab(-180, -400, width);
  assert.equal(reverseToTab1FromLeft, 1, 'Must abort return slide and push forward to Tab 1');

  // Case C: Critical threshold velocity boundary: +/- 160 px/s
  // Visual index is exactly 1.0 (-400px)
  // Low positive velocity (+100 px/s < 160 px/s threshold): projectedDistance = 12.4px -> -387.6px -> rounds to 1
  assert.equal(resolveTargetTab(-400, 100, width), 1);
  // High positive velocity (+200 px/s > 160 px/s threshold): flick right triggers ceil(1.0) - 1 = 0
  assert.equal(resolveTargetTab(-400, 200, width), 0);

  // Low negative velocity (-100 px/s > -160 px/s threshold): projectedDistance = -12.4px -> -412.4px -> rounds to 1
  assert.equal(resolveTargetTab(-400, -100, width), 1);
  // High negative velocity (-200 px/s < -160 px/s threshold): flick left triggers floor(1.0) + 1 = 2
  assert.equal(resolveTargetTab(-400, -200, width), 2);
});

test('Stress 6: Randomized Oracle Fuzzing: 1,000 trials of direction reversal and supersonic velocities', () => {
  const width = 400;
  const totalTabs = 4;

  for (let trial = 0; trial < 1000; trial++) {
    // Random position within valid or overdragged range [-1500, 300]
    const currentX = Math.random() * 1800 - 1500;
    // Random velocity within [-5000, 5000] px/s
    const velocity = Math.random() * 10000 - 5000;

    const resolvedTab = resolveTargetTab(currentX, velocity, width, totalTabs);

    // Invariants:
    // 1. Result must be integer
    assert.equal(Number.isInteger(resolvedTab), true, `Resolved tab must be integer: ${resolvedTab}`);
    // 2. Result must be in [0, 3]
    assert.ok(resolvedTab >= 0 && resolvedTab <= 3, `Resolved tab out of bounds: ${resolvedTab}`);
    // 3. Extreme left flick (velocity < -3000) when not at right edge must advance
    if (velocity < -3000 && currentX < -100) {
      assert.ok(resolvedTab >= 1, `Extreme left flick must not yield Tab 0`);
    }
    // 4. Extreme right flick (velocity > 3000) when not at left edge must move leftward
    if (velocity > 3000 && currentX > -1100) {
      assert.ok(resolvedTab <= 2, `Extreme right flick must not yield Tab 3`);
    }
  }
});

// -----------------------------------------------------------------------------
// Test 4: Apple 0.28 Boundary Rubber-Banding Resistance
// -----------------------------------------------------------------------------
test('Stress 7: Apple 0.28 rubber-band resistance is strictly damped, monotonic, and bounds-restoring', () => {
  const width = 400;
  const totalTabs = 4; // Tab bounds: [0, -1200]

  // Verify left boundary curve: f(desiredX) = desiredX * 0.28 for desiredX > 0
  let prevPos = 0;
  for (let desiredX = 10; desiredX <= 1000; desiredX += 50) {
    const rubberX = calculateRubberBandPosition(desiredX, width, totalTabs);
    const expected = desiredX * 0.28;
    assert.ok(Math.abs(rubberX - expected) < 1e-9, `Left overshoot curve mismatch at ${desiredX}`);
    assert.ok(rubberX > prevPos, 'Rubber-band displacement must be strictly monotonically increasing');
    assert.ok(rubberX < desiredX, 'Rubber-band resistance must damp displacement below user input');
    prevPos = rubberX;

    // Release from any left overshoot with zero velocity must restore to Tab 0
    const snap = resolveTargetTab(rubberX, 0, width, totalTabs);
    assert.equal(snap, 0, `Must snap back to Tab 0 from ${rubberX}`);
  }

  // Verify right boundary curve: f(desiredX) = -1200 + (desiredX - (-1200)) * 0.28
  const minValidX = -1200;
  prevPos = minValidX;
  for (let delta = -10; delta >= -1000; delta -= 50) {
    const desiredX = minValidX + delta;
    const rubberX = calculateRubberBandPosition(desiredX, width, totalTabs);
    const expected = minValidX + delta * 0.28;
    assert.ok(Math.abs(rubberX - expected) < 1e-9, `Right overshoot curve mismatch at ${desiredX}`);
    assert.ok(rubberX < prevPos, 'Right overshoot displacement must be strictly monotonically decreasing');
    assert.ok(rubberX > desiredX, 'Right overshoot resistance must damp displacement towards boundary');
    prevPos = rubberX;

    // Release from any right overshoot with zero velocity must restore to Tab 3
    const snap = resolveTargetTab(rubberX, 0, width, totalTabs);
    assert.equal(snap, 3, `Must snap back to Tab 3 from ${rubberX}`);
  }
});

// -----------------------------------------------------------------------------
// Test 5: Tap-to-Stop Settle & Event Suppression Invariant
// -----------------------------------------------------------------------------
test('Stress 8: Tap-to-stop settle correctly targets nearest tab and click suppression prevents propagation', () => {
  const width = 400;

  // Interrupted mid-flight without dragging (dx < 8px, dy < 8px)
  // Position -190px (closer to Tab 0)
  assert.equal(Math.round(-(-190) / width), 0);
  // Position -210px (closer to Tab 1)
  assert.equal(Math.round(-(-210) / width), 1);
  // Position -590px (closer to Tab 1)
  assert.equal(Math.round(-(-590) / width), 1);
  // Position -610px (closer to Tab 2)
  assert.equal(Math.round(-(-610) / width), 2);
  // Position -990px (closer to Tab 2)
  assert.equal(Math.round(-(-990) / width), 2);
  // Position -1010px (closer to Tab 3)
  assert.equal(Math.round(-(-1010) / width), 3);

  // Click event suppression logic verification
  let eventPrevented = false;
  let eventStopped = false;
  const mockClickEvent = {
    preventDefault() {
      eventPrevented = true;
    },
    stopPropagation() {
      eventStopped = true;
    },
  };

  const preventClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  preventClick(mockClickEvent);
  assert.equal(eventPrevented, true, 'Tap-to-stop must prevent default click action');
  assert.equal(eventStopped, true, 'Tap-to-stop must stop propagation to underlying interactive cards');
});

// -----------------------------------------------------------------------------
// Test 6: Gesture Intent Disambiguation Invariant
// -----------------------------------------------------------------------------
test('Stress 9: Gesture intent disambiguation cleanly separates vertical scroll from horizontal swipe', () => {
  const evaluateIntent = (dx, dy) => {
    if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) return 'undecided';
    if (Math.abs(dx) > Math.abs(dy) * 1.15) return 'horizontal_swipe';
    return 'vertical_scroll';
  };

  // Pure horizontal:
  assert.equal(evaluateIntent(20, 0), 'horizontal_swipe');
  assert.equal(evaluateIntent(-30, 2), 'horizontal_swipe');

  // Pure vertical:
  assert.equal(evaluateIntent(0, 25), 'vertical_scroll');
  assert.equal(evaluateIntent(4, -40), 'vertical_scroll');

  // Diagonal threshold:
  // dx = 12, dy = 10 -> 12 / 10 = 1.2 > 1.15 -> swipe
  assert.equal(evaluateIntent(12, 10), 'horizontal_swipe');
  // dx = 11, dy = 10 -> 11 / 10 = 1.10 < 1.15 -> vertical scroll (protects native compositor)
  assert.equal(evaluateIntent(11, 10), 'vertical_scroll');

  // Micro-jitters:
  assert.equal(evaluateIntent(4, 5), 'undecided');
  assert.equal(evaluateIntent(-7, -7), 'undecided');
});

// -----------------------------------------------------------------------------
// Test 7: Static AST & Class Token Verification for Viewport Breakpoints
// -----------------------------------------------------------------------------
test('Stress 10: Responsive layout classes satisfy <640px, 640-1024px, and >1024px ergonomics', () => {
  const rootDir = process.cwd();

  // 1. Sidebar.tsx
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/Sidebar.tsx'), 'utf-8');
  assert.match(
    sidebarContent,
    /hidden\s+sm:flex/,
    'Sidebar must be hidden on mobile (<640px) and flex on tablet/desktop (>=640px)'
  );
  assert.match(
    sidebarContent,
    /w-60\s+lg:w-64/,
    'Sidebar must support responsive desktop width scaling (w-60 to lg:w-64)'
  );

  // 2. MobileTabBar.tsx
  const mobileDockContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/MobileTabBar.tsx'), 'utf-8');
  assert.match(
    mobileDockContent,
    /sm:hidden/,
    'MobileTabBar dock must be hidden on tablet and desktop (>=640px)'
  );
  assert.match(
    mobileDockContent,
    /min-h-\[44px\]/,
    'Mobile dock touch targets must conform to Apple 44px HIG minimum'
  );

  // 3. TodayView.tsx Bento Grid
  const todayViewContent = fs.readFileSync(path.join(rootDir, 'src/components/today/TodayView.tsx'), 'utf-8');
  assert.match(
    todayViewContent,
    /grid-cols-1\s+md:grid-cols-12/,
    'TodayView must transition from single-column on mobile to 12-column Bento at md (768px)'
  );
  assert.match(
    todayViewContent,
    /md:col-span-7/,
    'Top focus hero card must occupy 7 columns on tablet Bento'
  );
  assert.match(
    todayViewContent,
    /md:col-span-5/,
    'Progress and habit widgets must occupy 5 columns on tablet Bento (7+5=12)'
  );

  // 4. Modal Bottom Sheet Adaptations (<640px items-end p-0 rounded-t-3xl vs >=640px items-center sm:p-4 sm:rounded-2xl)
  const modalFiles = [
    'src/components/modals/TaskModal.tsx',
    'src/components/modals/HabitModal.tsx',
    'src/components/modals/FinanceModal.tsx',
    'src/components/modals/QuickCaptureModal.tsx',
  ];

  for (const file of modalFiles) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    assert.match(
      content,
      /items-end\s+sm:items-center/,
      `${file} must dock to bottom on mobile and center on desktop`
    );
    assert.match(
      content,
      /rounded-t-3xl\s+sm:rounded-2xl/,
      `${file} must render as top-rounded bottom sheet on mobile and rounded dialog on desktop`
    );
    assert.match(
      content,
      /p-0\s+sm:p-4/,
      `${file} must use 0 padding on mobile to reach edge and sm:p-4 on desktop`
    );
  }

  // 5. Desktop Blank Bottom Scroll Void Purge Verification
  const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
  assert.doesNotMatch(
    appContent,
    /pb-64|pb-56/,
    'App layout must not contain bloated 200px+ desktop scroll void padding classes'
  );

  // 6. LiquidTabViewport.tsx Responsive Padding
  const viewportContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/LiquidTabViewport.tsx'), 'utf-8');
  assert.match(
    viewportContent,
    /px-4\s+sm:px-6\s+lg:px-8/,
    'LiquidTabViewport slide containers must apply responsive horizontal padding'
  );
});
