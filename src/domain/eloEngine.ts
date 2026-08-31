import { RankTierInfo, WorkoutMetric } from './types';

export const STANDARD_K_FACTOR = 32;
export const COMEBACK_K_FACTOR = 40;
export const DEFAULT_INITIAL_ELO = 1150; // Silver II

/**
 * Calculates the dynamic ELO difficulty for a workout based on target metric and value.
 */
export function calculateWorkoutDifficulty(metric: WorkoutMetric, targetValue: number): number {
  if (targetValue <= 0) return 1000;

  switch (metric) {
    case 'miles':
      // 2.5 mi baseline = 1100, 6.21 mi (10k) = ~1471
      return Math.round(1100 + (targetValue - 2.5) * 100);

    case 'km':
      // 4.0 km baseline = 1100, 10.0 km = ~1472
      return Math.round(1100 + (targetValue - 4.0) * 62.1);

    case 'minutes':
      // 25 mins = 1100, 60 mins = 1350
      return Math.round(1100 + (targetValue - 25) * 7.14);

    case 'seconds':
      // 1500s (25m) = 1100, 3600s (60m) = 1350
      return Math.round(1100 + (targetValue - 1500) * 0.119);

    case 'reps':
      // 50 reps = 1100, 100 reps = 1300
      return Math.round(1100 + (targetValue - 50) * 4);

    case 'sets':
      // 3 sets = 1100, 10 sets = 1310
      return Math.round(1100 + (targetValue - 3) * 30);

    default:
      return 1150;
  }
}

/**
 * Computes expected performance probability E in [0, 1]
 * E = 1 / (1 + 10^((Rw - Ru) / 400))
 */
export function calculateExpectedPerformance(userElo: number, workoutElo: number): number {
  const diff = (workoutElo - userElo) / 400;
  return 1 / (1 + Math.pow(10, diff));
}

/**
 * RPE Exertion Modifier:
 * 1-4 (Effortless / Zone 2): +0.15 (Great aerobic efficiency)
 * 5-6 (Moderate / Tempo):   +0.08
 * 7-8 (Hard / Threshold):    0.00
 * 9-10 (Max Exhaustion):    -0.10 (Overtaxed / Poor pacing)
 */
export function getRpeModifier(rpe: number): number {
  if (rpe <= 4) return 0.15;
  if (rpe <= 6) return 0.08;
  if (rpe <= 8) return 0.00;
  return -0.10;
}

/**
 * Computes the actual performance score S.
 * Incorporates Logarithmic Diminishing Returns for overachievement and
 * Comeback Deficit Scaling when recovering from downgraded targets.
 */
export function calculateActualScore(
  actualValue: number,
  targetValue: number,
  rpe: number,
  graceDaysElapsed: number = 0,
  originalTargetValue?: number
): {
  score: number;
  logarithmicBonus: number;
  comebackMultiplier: number;
} {
  if (targetValue <= 0) {
    return { score: 1.0, logarithmicBonus: 0, comebackMultiplier: 1.0 };
  }

  const ratio = actualValue / targetValue;
  let baseScore = 0;
  let logarithmicBonus = 0;
  let comebackMultiplier = 1.0;

  if (ratio >= 1.0) {
    const excessRatio = ratio - 1.0;
    // Logarithmic curve: 0.65 * ln(1 + 1.25 * excessRatio)
    // Allows swift comeback gains at first, then flattens out to disincentivize excessive overtraining
    logarithmicBonus = 0.65 * Math.log(1 + 1.25 * excessRatio);
    baseScore = 1.0 + logarithmicBonus;

    // Deficit Comeback Scaling: if this session was downgraded from a higher original target
    if (originalTargetValue && originalTargetValue > targetValue) {
      const recoveryFraction = Math.min(1.0, actualValue / originalTargetValue);
      comebackMultiplier = 1.0 + 0.35 * recoveryFraction;
      baseScore *= comebackMultiplier;
    }
  } else {
    baseScore = Math.max(0.1, ratio * 0.85);
  }

  const rpeMod = getRpeModifier(rpe);
  const graceDecay = graceDaysElapsed * 0.03;

  const rawScore = baseScore + rpeMod - graceDecay;
  const score = Math.max(0.05, Math.min(3.5, rawScore));

  return {
    score,
    logarithmicBonus: Math.round(logarithmicBonus * 100) / 100,
    comebackMultiplier: Math.round(comebackMultiplier * 100) / 100
  };
}

/**
 * Computes the rating delta and resulting new ELO with Dynamic Comeback Swings.
 */
export function calculateEloDelta(
  userElo: number,
  workoutElo: number,
  actualValue: number,
  targetValue: number,
  rpe: number,
  graceDaysElapsed: number = 0,
  originalTargetValue?: number
): {
  delta: number;
  newElo: number;
  expected: number;
  actualScore: number;
  isComeback: boolean;
  logarithmicBonus: number;
  comebackMultiplier: number;
} {
  const expected = calculateExpectedPerformance(userElo, workoutElo);
  const { score: actualScore, logarithmicBonus, comebackMultiplier } = calculateActualScore(
    actualValue,
    targetValue,
    rpe,
    graceDaysElapsed,
    originalTargetValue
  );

  const isComeback =
    (originalTargetValue !== undefined && originalTargetValue > targetValue && actualValue >= targetValue) ||
    actualValue >= targetValue * 1.5;

  const kFactor = isComeback ? COMEBACK_K_FACTOR : STANDARD_K_FACTOR;

  const delta = Math.round(kFactor * (actualScore - expected));
  const newElo = Math.max(500, userElo + delta);

  return {
    delta,
    newElo,
    expected,
    actualScore,
    isComeback,
    logarithmicBonus,
    comebackMultiplier
  };
}

/**
 * Resolves current ELO rating to Rank Tier, Division, Color, and Progress %
 */
export function getRankTierInfo(elo: number): RankTierInfo {
  if (elo < 1100) {
    // Bronze: 800 - 1099 (300 pt span)
    const clamped = Math.max(800, elo);
    const offset = clamped - 800;
    const div = offset < 100 ? 'III' : offset < 200 ? 'II' : 'I';
    const progressPercent = Math.min(100, Math.round((offset / 300) * 100));

    return {
      tier: 'Bronze',
      division: div,
      name: `Bronze ${div}`,
      minElo: 800,
      maxElo: 1099,
      color: '#CD7F32',
      badgeBg: 'rgba(205, 127, 50, 0.15)',
      icon: '🥉',
      progressPercent
    };
  }

  if (elo < 1300) {
    // Silver: 1100 - 1299 (200 pt span)
    const offset = elo - 1100;
    const div = offset < 67 ? 'III' : offset < 134 ? 'II' : 'I';
    const progressPercent = Math.min(100, Math.round((offset / 200) * 100));

    return {
      tier: 'Silver',
      division: div,
      name: `Silver ${div}`,
      minElo: 1100,
      maxElo: 1299,
      color: '#94A3B8',
      badgeBg: 'rgba(148, 163, 184, 0.15)',
      icon: '🥈',
      progressPercent
    };
  }

  if (elo < 1500) {
    // Gold: 1300 - 1499 (200 pt span)
    const offset = elo - 1300;
    const div = offset < 67 ? 'III' : offset < 134 ? 'II' : 'I';
    const progressPercent = Math.min(100, Math.round((offset / 200) * 100));

    return {
      tier: 'Gold',
      division: div,
      name: `Gold ${div}`,
      minElo: 1300,
      maxElo: 1499,
      color: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      icon: '🥇',
      progressPercent
    };
  }

  if (elo < 1700) {
    // Platinum: 1500 - 1699 (200 pt span)
    const offset = elo - 1500;
    const div = offset < 67 ? 'III' : offset < 134 ? 'II' : 'I';
    const progressPercent = Math.min(100, Math.round((offset / 200) * 100));

    return {
      tier: 'Platinum',
      division: div,
      name: `Platinum ${div}`,
      minElo: 1500,
      maxElo: 1699,
      color: '#06B6D4',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      icon: '💎',
      progressPercent
    };
  }

  if (elo < 1900) {
    // Diamond: 1700 - 1899 (200 pt span)
    const offset = elo - 1700;
    const div = offset < 67 ? 'III' : offset < 134 ? 'II' : 'I';
    const progressPercent = Math.min(100, Math.round((offset / 200) * 100));

    return {
      tier: 'Diamond',
      division: div,
      name: `Diamond ${div}`,
      minElo: 1700,
      maxElo: 1899,
      color: '#3B82F6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      icon: '👑',
      progressPercent
    };
  }

  // Apex Legend: 1900+
  return {
    tier: 'Apex Legend',
    division: '',
    name: 'Apex Legend',
    minElo: 1900,
    maxElo: 2500,
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.18)',
    icon: '⚡',
    progressPercent: 100
  };
}
