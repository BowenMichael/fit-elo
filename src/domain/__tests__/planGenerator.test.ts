import { generate10KPlan } from '../planGenerator';

describe('10K Progressive Overload Preset Generator', () => {
  it('generates a 16-session plan with relative day gaps and target dates', () => {
    const fixedBase = new Date('2026-09-01T12:00:00Z');
    const plan = generate10KPlan('miles', fixedBase);
    expect(plan.length).toBe(16);

    // Week 1 Session 1
    expect(plan[0].title).toBe('Baseline Calibration Run');
    expect(plan[0].targetValue).toBe(2.5);
    expect(plan[0].daysOffset).toBe(0);
    expect(plan[0].daysFromPrevious).toBe(0);
    expect(plan[0].targetDate).toBe('2026-09-01');

    // Week 1 Session 2
    expect(plan[1].title).toBe('Pacing & Rhythm Intervals');
    expect(plan[1].daysFromPrevious).toBe(2);
    expect(plan[1].daysOffset).toBe(2);
    expect(plan[1].targetDate).toBe('2026-09-03');

    // Final Race Session
    const raceSession = plan[plan.length - 1];
    expect(raceSession.title).toContain('10K GOAL RACE RUN');
    expect(raceSession.targetValue).toBe(6.21);
    expect(raceSession.daysOffset).toBe(30);
  });
});
