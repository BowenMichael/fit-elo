import {
  calculateActualScore,
  calculateEloDelta,
  calculateExpectedPerformance,
  calculateWorkoutDifficulty,
  getRankTierInfo,
  getRpeModifier
} from '../eloEngine';

describe('ELO MMR Engine & Logarithmic Comeback Returns', () => {
  describe('calculateWorkoutDifficulty', () => {
    it('computes realistic difficulty ratings for running miles', () => {
      expect(calculateWorkoutDifficulty('miles', 2.5)).toBe(1100);
      expect(calculateWorkoutDifficulty('miles', 3.5)).toBe(1200);
      expect(calculateWorkoutDifficulty('miles', 6.21)).toBe(1471);
    });

    it('computes difficulty for minutes', () => {
      expect(calculateWorkoutDifficulty('minutes', 25)).toBe(1100);
      expect(calculateWorkoutDifficulty('minutes', 60)).toBe(1350);
    });
  });

  describe('calculateExpectedPerformance', () => {
    it('returns 0.5 when user Elo equals workout difficulty Elo', () => {
      expect(calculateExpectedPerformance(1200, 1200)).toBeCloseTo(0.5, 3);
    });

    it('returns < 0.5 when workout is harder than user Elo', () => {
      expect(calculateExpectedPerformance(1100, 1300)).toBeLessThan(0.5);
    });

    it('returns > 0.5 when workout is easier than user Elo', () => {
      expect(calculateExpectedPerformance(1300, 1100)).toBeGreaterThan(0.5);
    });
  });

  describe('getRpeModifier', () => {
    it('awards bonus for low RPE (effortless aerobic efficiency)', () => {
      expect(getRpeModifier(3)).toBe(0.15);
    });

    it('awards modest bonus for moderate RPE', () => {
      expect(getRpeModifier(5)).toBe(0.08);
    });

    it('applies neutral modifier for threshold RPE 7-8', () => {
      expect(getRpeModifier(7)).toBe(0.0);
    });

    it('applies penalty for max exhaustion RPE 9-10', () => {
      expect(getRpeModifier(9)).toBe(-0.1);
    });
  });

  describe('Logarithmic Overachievement & Comeback Surge', () => {
    it('awards a big comeback swing when rising to the challenge (0.5 target, 4.1 original, 2.0 actual)', () => {
      // User adjusted/downgraded target is 0.5 mi, original was 4.1 mi, user ran 2.0 mi with good RPE 4
      const result = calculateEloDelta(
        1150, // User Elo (Silver II)
        1100, // Workout Elo
        2.0,  // Actual miles
        0.5,  // Adjusted target
        4,    // RPE
        0,    // Grace days
        4.1   // Original target before downgrade
      );

      expect(result.isComeback).toBe(true);
      expect(result.delta).toBeGreaterThanOrEqual(40); // Big positive swing!
      expect(result.logarithmicBonus).toBeGreaterThan(0.8);
      expect(result.comebackMultiplier).toBeGreaterThan(1.1);
    });

    it('applies logarithmic diminishing returns as actual distance increases (disincentivizing reckless overexertion)', () => {
      const userElo = 1150;
      const workoutElo = 1100;
      const target = 1.0;

      // 1x target (1.0 mi)
      const r1 = calculateEloDelta(userElo, workoutElo, 1.0, target, 5);
      // 2x target (2.0 mi) -> +1.0 mi gain
      const r2 = calculateEloDelta(userElo, workoutElo, 2.0, target, 5);
      // 4x target (4.0 mi) -> +2.0 mi gain
      const r4 = calculateEloDelta(userElo, workoutElo, 4.0, target, 5);
      // 8x target (8.0 mi) -> +4.0 mi gain
      const r8 = calculateEloDelta(userElo, workoutElo, 8.0, target, 5);

      const gain1to2 = r2.delta - r1.delta; // Gain for first +1.0 mi over target
      const gain2to4 = r4.delta - r2.delta; // Gain for next +2.0 mi
      const gain4to8 = r8.delta - r4.delta; // Gain for next +4.0 mi

      // Per-mile return strictly decreases due to natural logarithm
      const rate1to2 = gain1to2 / 1.0;
      const rate2to4 = gain2to4 / 2.0;
      const rate4to8 = gain4to8 / 4.0;

      expect(rate1to2).toBeGreaterThan(rate2to4);
      expect(rate2to4).toBeGreaterThan(rate4to8);
    });

    it('applies grace period decay when elapsed', () => {
      const onTime = calculateActualScore(2.5, 2.5, 5, 0);
      const day2Grace = calculateActualScore(2.5, 2.5, 5, 2);
      expect(day2Grace.score).toBeLessThan(onTime.score);
    });
  });

  describe('getRankTierInfo', () => {
    it('returns Bronze for sub-1100 ratings', () => {
      const info = getRankTierInfo(950);
      expect(info.tier).toBe('Bronze');
      expect(info.division).toBe('II');
    });

    it('returns Silver for 1100-1299 ratings', () => {
      const info = getRankTierInfo(1150);
      expect(info.tier).toBe('Silver');
      expect(info.division).toBe('III');
    });

    it('returns Gold for 1300-1499 ratings', () => {
      const info = getRankTierInfo(1380);
      expect(info.tier).toBe('Gold');
      expect(info.division).toBe('II');
    });

    it('returns Apex Legend for 1900+ ratings', () => {
      const info = getRankTierInfo(1950);
      expect(info.tier).toBe('Apex Legend');
    });
  });
});
