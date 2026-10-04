# FitElo: Adaptive Workout Tracker

FitElo is an adaptive workout and streak tracking system engineered for mobile (iOS / Android) and web. It helps athletes and runners build and sustain habits through dynamic performance evaluation.

---

## 🚀 Core Value Proposition

1. **Fitness ELO Rating System (MMR)**: Workouts and athletes are assigned dynamic ratings. Performance, completion accuracy, and Rate of Perceived Exertion (RPE) adjust your rating dynamically.
2. **Relative Day Sequence Queue**: Workouts exist in a relative sequence rather than being anchored to rigid dates.
3. **Smart Rolling Grace Period**: Missed workouts are held in a grace period (default 3 days), protecting your streak before safely downgrading difficulty to prevent overtraining.

---

## 📁 Architecture Overview

```
├── docs/                     # Documentation, architecture, and roadmap
├── src/
│   ├── components/           # Reusable UI elements (Modals, Cards)
│   ├── domain/               # Core business logic (Elo Engine, Goal Engine)
│   ├── navigation/           # Lightweight state-driven navigator
│   ├── screens/              # Dashboard, Goals, History, Settings
│   ├── store/                # Zustand stores for state management
│   ├── theme.ts              # Global design system
│   └── utils/                # Audio & haptics managers
├── app.json                  # Expo mobile & web metadata
├── eas.json                  # EAS Build & Submit multi-target profiles
└── package.json              # Client dependencies & scripts
```

## 🛠 Tech Stack

- **Client**: Expo SDK 54 / React Native 0.81 (Hermes / JSC on iOS)
- **Language**: TypeScript
- **State Management**: Zustand 5
- **Testing**: Jest with `jest-expo`
- **Navigation**: React Navigation (within Expo)

---

## ⚡ Quick Start

### Start Expo Web / Mobile
```bash
npm install
npm run web     # for web
npm run ios     # for iOS simulator
npm run android # for Android emulator
```

### Testing
```bash
# Run all unit tests
npm run test
```

---

## 📖 Complete Guides
- **[ROADMAP.md](docs/ROADMAP.md)**: Product and technical roadmap.
- **[ADAPTIVE_WORKOUT_PLAN.md](docs/ADAPTIVE_WORKOUT_PLAN.md)**: Original architecture and plan specifications.
