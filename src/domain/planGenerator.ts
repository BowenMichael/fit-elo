import { calculateWorkoutDifficulty } from './eloEngine';
import { WorkoutItem, WorkoutMetric } from './types';

interface PresetSessionTemplate {
  week: number;
  session: number;
  title: string;
  milesTarget: number;
  kmTarget: number;
  minutesTarget: number;
  category: 'running' | 'recovery' | 'race';
  notes: string;
  daysFromPrevious: number;
}

const TEMPLATE_SESSIONS: PresetSessionTemplate[] = [
  // Week 1: Baseline Calibration
  {
    week: 1,
    session: 1,
    title: 'Baseline Calibration Run',
    milesTarget: 2.5,
    kmTarget: 4.0,
    minutesTarget: 25,
    category: 'running',
    notes: 'Comfortable aerobic pace. Establish heart rate and breathing baseline.',
    daysFromPrevious: 0
  },
  {
    week: 1,
    session: 2,
    title: 'Pacing & Rhythm Intervals',
    milesTarget: 2.3,
    kmTarget: 3.7,
    minutesTarget: 22,
    category: 'running',
    notes: 'Alternate 3 mins steady with 1 min snappy cadence.',
    daysFromPrevious: 2
  },
  {
    week: 1,
    session: 3,
    title: 'Active Recovery Jog',
    milesTarget: 2.0,
    kmTarget: 3.2,
    minutesTarget: 20,
    category: 'recovery',
    notes: 'Very light effort (Zone 2). Flush legs and prepare for long run.',
    daysFromPrevious: 2
  },
  {
    week: 1,
    session: 4,
    title: 'Week 1 Long Run (5K Check)',
    milesTarget: 3.1,
    kmTarget: 5.0,
    minutesTarget: 32,
    category: 'running',
    notes: 'Sustained endurance builder. Keep effort at RPE 5-6.',
    daysFromPrevious: 2
  },

  // Week 2: Volume Step-Up
  {
    week: 2,
    session: 1,
    title: 'Aerobic Base Step-Up',
    milesTarget: 2.8,
    kmTarget: 4.5,
    minutesTarget: 28,
    category: 'running',
    notes: 'Steady aerobic effort with a controlled finish.',
    daysFromPrevious: 2
  },
  {
    week: 2,
    session: 2,
    title: 'Mid-Distance Tempo Run',
    milesTarget: 2.6,
    kmTarget: 4.2,
    minutesTarget: 26,
    category: 'running',
    notes: 'Comfortably hard tempo pace at lactate threshold.',
    daysFromPrevious: 2
  },
  {
    week: 2,
    session: 3,
    title: 'Flush & Mobility Run',
    milesTarget: 2.2,
    kmTarget: 3.5,
    minutesTarget: 22,
    category: 'recovery',
    notes: 'Easy shakeout to promote recovery and muscle elasticity.',
    daysFromPrevious: 2
  },
  {
    week: 2,
    session: 4,
    title: 'Week 2 Extended Long Run',
    milesTarget: 4.1,
    kmTarget: 6.6,
    minutesTarget: 42,
    category: 'running',
    notes: 'Mental endurance training. Practice smooth midfoot strike.',
    daysFromPrevious: 2
  },

  // Week 3: Peak Endurance
  {
    week: 3,
    session: 1,
    title: 'Threshold Progression',
    milesTarget: 3.1,
    kmTarget: 5.0,
    minutesTarget: 30,
    category: 'running',
    notes: 'Increase pace each mile, finishing at 10K goal pace.',
    daysFromPrevious: 2
  },
  {
    week: 3,
    session: 2,
    title: 'Lactate Speed Intervals',
    milesTarget: 3.0,
    kmTarget: 4.8,
    minutesTarget: 30,
    category: 'running',
    notes: '4x 800m repeats with 90 sec walking recovery.',
    daysFromPrevious: 2
  },
  {
    week: 3,
    session: 3,
    title: 'Active Aerobic Flush',
    milesTarget: 2.4,
    kmTarget: 3.8,
    minutesTarget: 24,
    category: 'recovery',
    notes: 'Gentle recovery run before the pinnacle endurance session.',
    daysFromPrevious: 2
  },
  {
    week: 3,
    session: 4,
    title: 'Peak Long Run Simulation',
    milesTarget: 5.2,
    kmTarget: 8.4,
    minutesTarget: 52,
    category: 'running',
    notes: 'Crucial endurance anchor. Simulates deep race fatigue.',
    daysFromPrevious: 2
  },

  // Week 4: Taper & Race Event
  {
    week: 4,
    session: 1,
    title: 'Taper Shakeout Run',
    milesTarget: 2.5,
    kmTarget: 4.0,
    minutesTarget: 24,
    category: 'recovery',
    notes: 'Reduced volume to rebuild glycogen stores and leg freshness.',
    daysFromPrevious: 2
  },
  {
    week: 4,
    session: 2,
    title: 'Form & Strides Pacing',
    milesTarget: 2.0,
    kmTarget: 3.2,
    minutesTarget: 18,
    category: 'running',
    notes: 'Short fast strides to awaken neuromuscular pathways.',
    daysFromPrevious: 2
  },
  {
    week: 4,
    session: 3,
    title: 'Pre-Race Priming Jog',
    milesTarget: 1.6,
    kmTarget: 2.5,
    minutesTarget: 15,
    category: 'recovery',
    notes: 'Light tune-up jog. Hydrate and get good sleep tonight.',
    daysFromPrevious: 2
  },
  {
    week: 4,
    session: 4,
    title: '🏆 10K GOAL RACE RUN!',
    milesTarget: 6.21,
    kmTarget: 10.0,
    minutesTarget: 62,
    category: 'race',
    notes: 'The culmination of your 4-week ramp! Execute your plan and finish strong.',
    daysFromPrevious: 2
  }
];

export function formatDateOffset(baseDate: Date, daysOffset: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Generates the full 4-week 10K progressive overload training plan with relative day gaps
 */
export function generate10KPlan(
  metric: WorkoutMetric = 'miles',
  baseDate: Date = new Date()
): WorkoutItem[] {
  let cumulativeDays = 0;

  return TEMPLATE_SESSIONS.map((item, index) => {
    let targetValue = item.milesTarget;
    if (metric === 'km') targetValue = item.kmTarget;
    if (metric === 'minutes') targetValue = item.minutesTarget;

    const difficultyElo = calculateWorkoutDifficulty(metric, targetValue);
    cumulativeDays += item.daysFromPrevious;

    return {
      id: `plan-10k-w${item.week}-s${item.session}-${index}`,
      title: item.title,
      metric,
      targetValue,
      originalTargetValue: targetValue,
      daysFromPrevious: item.daysFromPrevious,
      daysOffset: cumulativeDays,
      targetDate: formatDateOffset(baseDate, cumulativeDays),
      difficultyElo,
      status: 'PENDING' as const,
      graceDaysElapsed: 0,
      notes: item.notes,
      category: item.category,
      weekNumber: item.week,
      sessionNumber: item.session
    };
  });
}
