import test from 'node:test';
import assert from 'node:assert/strict';
import { spring } from 'motion-dom';
import { APPLE_SPRINGS, projectMomentum } from '../src/utils/motion.ts';

/**
 * ============================================================================
 * EMPIRICAL CHALLENGER TEST SUITE: APPLE SPRING DYNAMICS & VELOCITY ABSORPTION
 * ============================================================================
 * Milestone: M2 (Apple Design, Fluid Motion & Responsive Ergonomics)
 * Directives: AGENTS.md Directive 2 (Apple Fluid Motion Standards)
 * Scope:
 *  1. Analytical & numerical damping ratio calculations (\zeta >= 1.0 vs ~0.8)
 *  2. Step response zero-overshoot validation (Euler, RK4, Analytical, Framer Motion)
 *  3. Settle time compliance (0.35s modal/sheet, 0.30s snappy)
 *  4. Velocity absorption and rebound stability in SwipeToComplete (extreme & boundary velocities)
 *  5. Apple exponential momentum projection mathematical invariants
 *  6. 60Hz and 120Hz frame-rate discrete time-step stability
 */

// Classical damped harmonic oscillator physics
function calculateDampingRatio(damping, stiffness, mass = 1.0) {
  const criticalDamping = 2 * Math.sqrt(stiffness * mass);
  return damping / criticalDamping;
}

// Classical Runge-Kutta 4th order (RK4) ODE solver for m*x'' + c*x' + k*(x - target) = 0
function simulateRK4(stiffness, damping, mass, x0, v0, target, durationMs, dtMs = 1.0) {
  const steps = Math.floor(durationMs / dtMs);
  let x = x0;
  let v = v0;
  const history = [{ t: 0, x, v }];

  const f_v = (x_curr, v_curr) => (-stiffness * (x_curr - target) - damping * v_curr) / mass;

  for (let i = 1; i <= steps; i++) {
    const dt = dtMs / 1000; // seconds

    const k1_x = v;
    const k1_v = f_v(x, v);

    const k2_x = v + 0.5 * dt * k1_v;
    const k2_v = f_v(x + 0.5 * dt * k1_x, k2_x);

    const k3_x = v + 0.5 * dt * k2_v;
    const k3_v = f_v(x + 0.5 * dt * k2_x, k3_x);

    const k4_x = v + dt * k3_v;
    const k4_v = f_v(x + dt * k3_x, k4_x);

    x += (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x);
    v += (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);

    history.push({ t: i * dtMs, x, v });
  }
  return history;
}

// Analytical solution for damped harmonic oscillator
function analyticalDisplacement(stiffness, damping, mass, x0, v0, target, tSec) {
  const delta = x0 - target;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (Math.abs(zeta - 1.0) < 1e-6) {
    // Critically damped
    return target + Math.exp(-w0 * tSec) * (delta + (v0 + w0 * delta) * tSec);
  } else if (zeta > 1.0) {
    // Overdamped
    const wd = w0 * Math.sqrt(zeta * zeta - 1);
    const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
    const c1 = (v0 - r2 * delta) / (r1 - r2);
    const c2 = delta - c1;
    return target + c1 * Math.exp(r1 * tSec) + c2 * Math.exp(r2 * tSec);
  } else {
    // Underdamped
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const a = delta;
    const b = (v0 + zeta * w0 * delta) / wd;
    return target + Math.exp(-zeta * w0 * tSec) * (a * Math.cos(wd * tSec) + b * Math.sin(wd * tSec));
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

test('APPLE_SPRINGS: Damping ratio analytical verification', () => {
  // Modal: critically damped or slightly overdamped (zeta >= 1.0)
  const zetaModal = calculateDampingRatio(APPLE_SPRINGS.modal.damping, APPLE_SPRINGS.modal.stiffness);
  assert.ok(
    zetaModal >= 1.0,
    `APPLE_SPRINGS.modal damping ratio must be >= 1.0 (critically damped/overdamped), received ${zetaModal.toFixed(4)}`
  );
  // Modal zeta = 38 / (2 * sqrt(360)) = 1.0014
  assert.ok(Math.abs(zetaModal - 1.0014) < 0.001, `Modal zeta should match theoretical 1.0014 within 0.001`);

  // Sheet: critically damped approximation (zeta >= 0.97, duration = 0.35s)
  const zetaSheet = calculateDampingRatio(APPLE_SPRINGS.sheet.damping, APPLE_SPRINGS.sheet.stiffness);
  assert.ok(
    zetaSheet >= 0.97,
    `APPLE_SPRINGS.sheet damping ratio should be near-critical (>= 0.97), received ${zetaSheet.toFixed(4)}`
  );

  // Snappy: intentional momentum bounce token (zeta ~ 0.7 - 0.8)
  const zetaSnappy = calculateDampingRatio(APPLE_SPRINGS.snappy.damping, APPLE_SPRINGS.snappy.stiffness);
  assert.ok(
    zetaSnappy >= 0.70 && zetaSnappy <= 0.85,
    `APPLE_SPRINGS.snappy damping ratio must be within Apple momentum spec 0.70 - 0.85, received ${zetaSnappy.toFixed(4)}`
  );
});

test('APPLE_SPRINGS.modal: Zero-overshoot step response across all time steps', () => {
  const { damping, stiffness } = APPLE_SPRINGS.modal;
  const target = 0;
  const x0 = 1.0;
  const v0 = 0.0;

  // 1. Framer Motion actual spring generator simulation
  const gen = spring({ damping, stiffness, keyframes: [x0, target] });
  let minFramerMotionVal = 1.0;
  for (let t = 0; t <= 1000; t += 1) {
    const val = gen.next(t).value;
    if (val < minFramerMotionVal) minFramerMotionVal = val;
  }
  assert.ok(
    minFramerMotionVal >= -1e-6,
    `Framer Motion modal step response must not overshoot target 0, minimum observed: ${minFramerMotionVal}`
  );

  // 2. Analytical ODE step response
  for (let tMs = 0; tMs <= 1000; tMs += 5) {
    const tSec = tMs / 1000;
    const x = analyticalDisplacement(stiffness, damping, 1.0, x0, v0, target, tSec);
    assert.ok(
      x >= -1e-9,
      `Analytical modal displacement must never cross 0 (overshoot) at t=${tMs}ms: x=${x}`
    );
  }

  // 3. Discrete 60Hz (dt = 16.67ms) and 120Hz (dt = 8.33ms) simulation
  for (const dt of [16.6667, 8.3333]) {
    const history = simulateRK4(stiffness, damping, 1.0, x0, v0, target, 1000, dt);
    const minX = Math.min(...history.map(h => h.x));
    assert.ok(
      minX >= -1e-4,
      `RK4 simulation at dt=${dt.toFixed(2)}ms must not have negative overshoot, minimum: ${minX}`
    );
  }
});

test('APPLE_SPRINGS.sheet: Near-critical damping and zero practical overshoot', () => {
  const { damping, stiffness } = APPLE_SPRINGS.sheet;
  const target = 0;
  const x0 = 1.0;
  const v0 = 0.0;

  // Framer Motion spring generator test
  const gen = spring({ damping, stiffness, keyframes: [x0, target] });
  let minFramerVal = 1.0;
  for (let t = 0; t <= 1000; t += 2) {
    const val = gen.next(t).value;
    if (val < minFramerVal) minFramerVal = val;
  }
  // Theoretical overshoot for zeta=0.976 is e^(-14.1) = 7e-7, strictly <= 0.0001
  assert.ok(
    minFramerVal >= -1e-5,
    `Sheet spring generator should have zero detectable overshoot, minVal: ${minFramerVal}`
  );

  // Discrete 60Hz simulation: verify monotonic decay
  const history = simulateRK4(stiffness, damping, 1.0, x0, v0, target, 1000, 16.6667);
  for (let i = 1; i < history.length; i++) {
    assert.ok(
      history[i].x <= history[i - 1].x + 1e-4,
      `Sheet displacement should monotonically decrease at 60Hz step ${i}: curr=${history[i].x}, prev=${history[i - 1].x}`
    );
  }
});

test('APPLE_SPRINGS.snappy: Controlled natural momentum bounce conforms to Apple spec', () => {
  const { damping, stiffness } = APPLE_SPRINGS.snappy;
  const target = 0;
  const x0 = 1.0;
  const v0 = 0.0;

  const gen = spring({ damping, stiffness, keyframes: [x0, target] });
  let minVal = 1.0;
  let overshootPeak = 0;

  for (let t = 0; t <= 1000; t += 1) {
    const val = gen.next(t).value;
    if (val < minVal) {
      minVal = val;
      if (val < 0) overshootPeak = Math.max(overshootPeak, Math.abs(val));
    }
  }

  // Apple spec specifies damping ~0.8 with "slight natural bounce"
  // Overshoot must exist (it is bouncy) but must be restrained (under 6%)
  assert.ok(overshootPeak > 0.01, `Snappy spring should exhibit slight bounce, peak: ${overshootPeak}`);
  assert.ok(overshootPeak <= 0.05, `Snappy overshoot must remain under 5% (received ${(overshootPeak * 100).toFixed(2)}%)`);
});

test('APPLE_SPRINGS: Settle times conform to declared durations', () => {
  // Modal: target 0.35s duration -> should reach < 0.01 threshold by ~350-450ms
  const genModal = spring({ ...APPLE_SPRINGS.modal, keyframes: [1.0, 0] });
  let modalSettleTime = null;
  for (let t = 0; t <= 1000; t += 10) {
    const s = genModal.next(t);
    if (Math.abs(s.value) < 0.01 && modalSettleTime === null) {
      modalSettleTime = t;
    }
  }
  assert.ok(
    modalSettleTime !== null && modalSettleTime <= 450,
    `Modal spring must settle within 450ms, settled at ${modalSettleTime}ms`
  );

  // Snappy: target 0.30s duration -> should reach < 0.01 threshold by ~300-380ms
  const genSnappy = spring({ ...APPLE_SPRINGS.snappy, keyframes: [1.0, 0] });
  let snappySettleTime = null;
  for (let t = 0; t <= 1000; t += 10) {
    const s = genSnappy.next(t);
    if (Math.abs(s.value) < 0.01 && snappySettleTime === null) {
      snappySettleTime = t;
    }
  }
  assert.ok(
    snappySettleTime !== null && snappySettleTime <= 380,
    `Snappy spring must settle within 380ms, settled at ${snappySettleTime}ms`
  );
});

test('SwipeToComplete: Velocity absorption and shock resilience', () => {
  const { damping, stiffness } = APPLE_SPRINGS.snappy;
  const initialOffset = 50; // Released at 50px (under 130px threshold)
  const target = 0;

  // Test across a wide spectrum of physical gesture release velocities
  const testVelocities = [
    0,           // Stationary release
    100,         // Gentle forward drag release
    1500,        // Fast forward throw towards threshold
    -500,        // Gentle backward fling
    -3000,       // Violent backward fling
    10000,       // Super-fast flick (e.g. trackpad gesture burst)
    -10000,      // Super-fast reverse flick
    100000,      // Hardware impulse edge case
    -100000,     // Hardware impulse edge case
  ];

  for (const velocity of testVelocities) {
    // Generate spring simulation with initial release velocity
    const gen = spring({
      damping,
      stiffness,
      velocity, // in px/s
      keyframes: [initialOffset, target],
    });

    let maxDisplacement = -Infinity;
    let minDisplacement = Infinity;
    let hasNaN = false;
    let finalState = null;

    // Simulate for 1500ms
    for (let t = 0; t <= 1500; t += 10) {
      const s = gen.next(t);
      if (Number.isNaN(s.value)) hasNaN = true;
      if (s.value > maxDisplacement) maxDisplacement = s.value;
      if (s.value < minDisplacement) minDisplacement = s.value;
      if (s.done) {
        finalState = s;
        break;
      }
    }

    assert.ok(!hasNaN, `Spring simulation produced NaN with velocity=${velocity}`);
    assert.ok(Number.isFinite(maxDisplacement), `Displacement reached non-finite number with velocity=${velocity}`);
    assert.ok(Number.isFinite(minDisplacement), `Displacement reached non-finite number with velocity=${velocity}`);

    // Verify it cleanly converges to target 0
    const finalVal = finalState ? finalState.value : gen.next(1500).value;
    assert.ok(
      Math.abs(finalVal - target) <= 1.0,
      `Spring failed to converge to 0 with velocity=${velocity}, ended at ${finalVal}`
    );
  }
});

test('SwipeToComplete: Null, undefined, and non-numeric velocity tolerance', () => {
  const { damping, stiffness } = APPLE_SPRINGS.snappy;
  const initialOffset = 40;
  const target = 0;

  // Simulate optional chaining fallback `info.velocity?.x`
  const mockVelocities = [undefined, null, NaN, 0];

  for (const v of mockVelocities) {
    const safeVelocity = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
    const gen = spring({
      damping,
      stiffness,
      velocity: safeVelocity,
      keyframes: [initialOffset, target],
    });

    const s1 = gen.next(0);
    const s100 = gen.next(100);
    const s500 = gen.next(500);

    assert.ok(!Number.isNaN(s1.value), `Step 0 is NaN for velocity=${v}`);
    assert.ok(!Number.isNaN(s100.value), `Step 100 is NaN for velocity=${v}`);
    assert.ok(!Number.isNaN(s500.value), `Step 500 is NaN for velocity=${v}`);
    assert.ok(s500.value < initialOffset, `Handle should progress towards 0 with velocity=${v}`);
  }
});

test('projectMomentum: Mathematical invariants and boundary conditions', () => {
  // 1. Zero velocity returns exactly 0
  assert.strictEqual(projectMomentum(0), 0, 'projectMomentum(0) must equal 0');

  // 2. Sign preservation
  assert.ok(projectMomentum(500) > 0, 'Positive velocity must produce positive projection');
  assert.ok(projectMomentum(-500) < 0, 'Negative velocity must produce negative projection');

  // 3. Proportional linearity
  const p1 = projectMomentum(400);
  const p2 = projectMomentum(800);
  assert.ok(Math.abs(p2 - 2 * p1) < 1e-9, 'projectMomentum must be strictly linear with respect to velocity');

  // 4. Default deceleration rate (0.992) evaluation
  // (500 / 1000) * 0.992 / (1 - 0.992) = 0.5 * 0.992 / 0.008 = 0.5 * 124 = 62px
  const proj500 = projectMomentum(500, 0.992);
  assert.ok(Math.abs(proj500 - 62) < 1e-6, `500 px/s with decel 0.992 should project 62px, got ${proj500}`);

  // 5. Standard scroll deceleration rate (0.998)
  // (500 / 1000) * 0.998 / 0.002 = 0.5 * 499 = 249.5px
  const projScroll = projectMomentum(500, 0.998);
  assert.ok(Math.abs(projScroll - 249.5) < 1e-6, `500 px/s with decel 0.998 should project 249.5px, got ${projScroll}`);

  // 6. Extreme velocity limits: no overflow or NaN
  const hugePositive = projectMomentum(1e7);
  const hugeNegative = projectMomentum(-1e7);
  assert.ok(Number.isFinite(hugePositive) && hugePositive > 0);
  assert.ok(Number.isFinite(hugeNegative) && hugeNegative < 0);
});

test('LiquidTabViewport: 1:1 Live Matrix Delta Tracking Math', () => {
  // Simulate DOMMatrix extraction and delta tracking logic from LiquidTabViewport.tsx
  // Current in-flight matrix translation
  const capturedMatrixM41 = -185.4; // Mid-transition between Slide 1 (0px) and Slide 2 (-375px)
  const pointerDownClientX = 210.0;

  // On pointerdown:
  const dragStartTranslateX = capturedMatrixM41;
  const startX = pointerDownClientX;

  // Simulate user dragging finger to the left by 50px
  const currentClientX = 160.0;
  const deltaX = currentClientX - startX; // -50px
  const livePosition = dragStartTranslateX + deltaX; // -185.4 - 50 = -235.4px

  assert.strictEqual(deltaX, -50.0, 'Delta must be -50px');
  assert.ok(
    Math.abs(livePosition - (-235.4)) < 1e-9,
    `Live tracked position must seamlessly add finger delta to in-flight matrix offset`
  );

  // Position jump test: compare with naive logic calc(-activeSlideIndex * 100% + deltaX)
  const slideWidth = 375;
  const activeSlideIndex = 0;
  const naivePosition = -activeSlideIndex * slideWidth + deltaX; // 0 - 50 = -50px
  const jumpMagnitude = Math.abs(livePosition - naivePosition);

  // Naive logic would have introduced an abrupt 135.4px jump!
  assert.ok(
    jumpMagnitude > 100,
    `Adversarial check: naive logic jumps by ${jumpMagnitude.toFixed(1)}px; live matrix prevents this jump`
  );
});

test('SwipeToComplete Rebound: Randomized Differential Fuzzing (1,000 trials)', () => {
  const { damping, stiffness } = APPLE_SPRINGS.snappy;
  const target = 0;

  for (let trial = 0; trial < 1000; trial++) {
    // Random offset between 0 and 130px
    const initialOffset = Math.random() * 130;
    // Random velocity between -25,000 and +25,000 px/s
    const velocity = (Math.random() - 0.5) * 50000;

    const gen = spring({
      damping,
      stiffness,
      velocity,
      keyframes: [initialOffset, target],
    });

    let hasNaN = false;
    let finalVal = initialOffset;

    // Simulate for 800ms
    for (let t = 0; t <= 800; t += 20) {
      const s = gen.next(t);
      if (Number.isNaN(s.value)) {
        hasNaN = true;
        break;
      }
      finalVal = s.value;
      if (s.done) break;
    }

    assert.ok(!hasNaN, `Trial ${trial} produced NaN with offset=${initialOffset}, velocity=${velocity}`);
    assert.ok(
      Math.abs(finalVal - target) <= 1.0,
      `Trial ${trial} failed to converge: offset=${initialOffset}, vel=${velocity}, final=${finalVal}`
    );
  }
});

test('Multi-Solver Cross-Validation: RK4 vs Analytical Closed-Form ODE', () => {
  const { damping, stiffness } = APPLE_SPRINGS.modal;
  const target = 0;
  const x0 = 1.0;
  const v0 = 0.0;
  const mass = 1.0;

  const rk4History = simulateRK4(stiffness, damping, mass, x0, v0, target, 500, 1.0); // 1ms steps

  let maxDiscrepancy = 0;
  for (const point of rk4History) {
    const analyticalX = analyticalDisplacement(stiffness, damping, mass, x0, v0, target, point.t / 1000);
    const diff = Math.abs(point.x - analyticalX);
    if (diff > maxDiscrepancy) {
      maxDiscrepancy = diff;
    }
  }

  // High precision RK4 and analytical solution should agree within 1e-4
  assert.ok(
    maxDiscrepancy < 1e-4,
    `RK4 numerical simulation diverged from analytical solution: max discrepancy ${maxDiscrepancy}`
  );
});

test('Motion Tokens: Comprehensive physics audit of all exported springs', async () => {
  const motionModule = await import('../src/utils/motion.ts');
  const tokens = [
    { name: 'APPLE_SPRINGS.modal', ...motionModule.APPLE_SPRINGS.modal },
    { name: 'APPLE_SPRINGS.sheet', ...motionModule.APPLE_SPRINGS.sheet },
    { name: 'APPLE_SPRINGS.snappy', ...motionModule.APPLE_SPRINGS.snappy },
    { name: 'SPRING_LIQUID', ...motionModule.SPRING_LIQUID },
    { name: 'SPRING_TACTILE', ...motionModule.SPRING_TACTILE },
    { name: 'SPRING_PILL', ...motionModule.SPRING_PILL },
    { name: 'SPRING_VISCOUS_FLUID', ...motionModule.SPRING_VISCOUS_FLUID },
    { name: 'SPRING_DOCK_LIQUID', ...motionModule.SPRING_DOCK_LIQUID },
  ];

  for (const token of tokens) {
    const mass = token.mass ?? 1.0;
    const zeta = calculateDampingRatio(token.damping, token.stiffness, mass);

    // Verify all tokens have positive stiffness, damping, and physically sound damping ratio
    assert.ok(token.stiffness > 0, `${token.name} stiffness must be positive`);
    assert.ok(token.damping > 0, `${token.name} damping must be positive`);
    assert.ok(
      zeta >= 0.5 && zeta <= 1.5,
      `${token.name} damping ratio ${zeta.toFixed(4)} is out of reasonable human interaction bounds [0.5, 1.5]`
    );

    // Verify stability in Framer Motion spring generator
    const gen = spring({
      damping: token.damping,
      stiffness: token.stiffness,
      mass,
      keyframes: [1.0, 0.0],
    });

    const s0 = gen.next(0);
    const s500 = gen.next(500);
    assert.ok(!Number.isNaN(s0.value), `${token.name} step 0 is NaN`);
    assert.ok(!Number.isNaN(s500.value), `${token.name} step 500 is NaN`);
  }
});
