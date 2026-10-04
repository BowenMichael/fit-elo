# FitElo: Product & Technical Roadmap

This document outlines the phased milestones to drive FitElo from its current adaptive workout foundation to a production-ready application.

---

## Phase 1: Core Engine & Local Persistence (Current State)
* **Objective**: Solidify the local-first experience, ensuring the ELO math, dynamic workout queues, and streak logic work flawlessly on mobile and web.
* **Key Milestones**:
  - [x] Adaptive ELO math engine (RPE, completion ratio).
  - [x] Sequence manager & rolling grace period.
  - [x] Initial UI scaffolding (Dashboard, Queue, Settings).
  - [x] Zustand state persistence (AsyncStorage).
  - [ ] Thorough unit and integration testing of the Goal Engine and Sequence Manager edge cases.

## Phase 2: Real-time Sync & Backend Services
* **Objective**: Transition from local-only to a cloud-synced architecture, enabling cross-device sync and laying the groundwork for multiplayer features.
* **Key Milestones**:
  - [ ] Set up user authentication (e.g., Supabase, Clerk, or custom JWT).
  - [ ] Architect PostgreSQL database schema for User Profiles, Workouts, and Goals.
  - [ ] Build REST / GraphQL API for state synchronization.
  - [ ] Migrate Zustand local store to sync seamlessly with the backend.

## Phase 3: Social & Multiplayer ELO Matchmaking
* **Objective**: Introduce social competition and cooperative goals utilizing the established ELO system.
* **Key Milestones**:
  - [ ] Global & Friends Leaderboards categorized by ELO tiers (Silver, Gold, etc.).
  - [ ] ELO Matchmaking: Pair users with similar ELOs for weekly challenges (e.g., "10K Race").
  - [ ] Real-time Socket.IO activity feed (e.g., "User X just ranked up to Gold III!").
  - [ ] Multiplayer Goal tracking and shared streak milestones.

## Phase 4: Polish, Analytics, & App Store Release
* **Objective**: Finalize UX, add deep analytics for the user, and publish to iOS/Android.
* **Key Milestones**:
  - [ ] Advanced charting & analytics (Performance over time, ELO history graphs).
  - [ ] Rich push notifications (local and remote).
  - [ ] Accessibility (a11y) audit and UI/UX polish (Haptics, Animations).
  - [ ] Beta testing via TestFlight / Google Play Console.
  - [ ] Public Launch (App Store / Play Store).

---

## Next Steps / Proposed Issues

The following issues have been designed for autonomous agent execution to drive Phase 2 & Phase 3:

1. **Issue: Goal Engine Edge Case Unit Tests**
   - Ensure the Goal Engine accurately handles downgrades, edge case streak resets, and missing data points.
2. **Issue: Data Visualization Component (ELO History)**
   - Build a reusable modular chart component for ELO history tracking.
3. **Issue: Backend Schema Design & DB Initialization**
   - Design the initial relational database schema for User Profiles and Workout History.
4. **Issue: Socket.IO Integration for Live Feed**
   - Hook up a real-time activity feed component on the Dashboard for fake/mock social events, paving the way for real backend sync.
