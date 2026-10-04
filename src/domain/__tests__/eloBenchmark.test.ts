import { calculateEloDelta, calculateWorkoutDifficulty } from '../eloEngine';

/**
 * Helper to simulate progression across consecutive workouts.
 */
function simulateProgression(
  initialElo: number,
  workoutElo: number,
  iterations: number,
  performanceRatio: number,
  rpe: number = 6
): number[] {
  const eloHistory: number[] = [initialElo];
  let currentElo = initialElo;
  const baseTarget = 5.0;

  for (let i = 0; i < iterations; i++) {
    const actual = baseTarget * performanceRatio;
    const { newElo } = calculateEloDelta(
      currentElo,
      workoutElo,
      actual,
      baseTarget,
      rpe
    );
    currentElo = newElo;
    eloHistory.push(currentElo);
  }

  return eloHistory;
}

describe('FitElo Progression Benchmark Tests', () => {
  it('converges smoothly toward workout difficulty when meeting expected target', () => {
    const initialElo = 1000;
    const workoutElo = 1200;
    // User performs exactly at target (ratio = 1.0) with neutral threshold RPE (7, modifier = 0.0, actualScore = 1.0)
    // Note: E = 1 / (1 + 10^((workoutElo - userElo) / 400)).
    // When actualScore = 1.0 and user meets target, rating steadily climbs and delta diminishes as E -> 1.0
    const history = simulateProgression(initialElo, workoutElo, 25, 1.0, 7);

    // Initial Elo should be lower than final Elo
    expect(history[history.length - 1]).toBeGreaterThan(initialElo);

    // Verify rating gain decreases per iteration as user Elo climbs (asymptotic convergence / diminishing deltas)
    const delta1 = history[1] - history[0];
    const deltaFinal = history[history.length - 1] - history[history.length - 2];
    expect(deltaFinal).toBeLessThan(delta1);

    // Deliberate, controlled progression without unbounded explosion or oscillation
    expect(history[history.length - 1]).toBeLessThan(workoutElo + 250);
  });

  it('exhibits logarithmic diminishing returns under extreme over-performance', () => {
    const initialElo = 1150;
    const workoutElo = 1150;
    const target = 3.0;

    // Evaluate progression with single session jumps at increasing excess
    const normalRun = calculateEloDelta(initialElo, workoutElo, target, target, 6);
    const doubleRun = calculateEloDelta(initialElo, workoutElo, target * 2, target, 6);
    const quadrupleRun = calculateEloDelta(initialElo, workoutElo, target * 4, target, 6);

    const gainNormalToDouble = doubleRun.delta - normalRun.delta;
    const gainDoubleToQuad = quadrupleRun.delta - doubleRun.delta;

    // Marginal delta gain for doubling output again must be strictly less (diminishing returns curve)
    expect(gainDoubleToQuad).toBeLessThan(gainNormalToDouble);
  });

  it('undergoes steady, bounded decay under chronic under-performance', () => {
    const initialElo = 1300;
    const workoutElo = 1200;
    // User only completes 40% of target at exhausting RPE 9
    const history = simulateProgression(initialElo, workoutElo, 20, 0.4, 9);

    // Elo should steadily decrease
    expect(history[history.length - 1]).toBeLessThan(initialElo);

    // Rating deltas remain bounded and floor at >= 500
    for (const elo of history) {
      expect(elo).toBeGreaterThanOrEqual(500);
    }
  });

  it('handles wide rating differences without mathematical breakdown', () => {
    const lowElo = 600;
    const highWorkoutElo = calculateWorkoutDifficulty('miles', 10); // ~1850

    const history = simulateProgression(lowElo, highWorkoutElo, 15, 1.0, 7);

    // Deliberate gain, staying valid and bounded
    for (const elo of history) {
      expect(Number.isFinite(elo)).toBe(true);
      expect(Number.isNaN(elo)).toBe(false);
      expect(elo).toBeGreaterThanOrEqual(500);
    }
    expect(history[history.length - 1]).toBeGreaterThan(lowElo);
  });
});
