# Expo + Socket.IO Full-Stack Starter Template

A production-ready, universal starter template for building real-time multiplayer applications, games, and connected dashboards across **Web**, **iOS**, and **Android**.

---

## 🚀 Key Features

- **Universal Cross-Platform (Web + iOS + Android)**: Powered by **Expo SDK 54** and **React Native 0.81**.
- **Real-Time Signaling & Room Management**: Dedicated Node.js + Express + **Socket.IO** backend with Redis state/cache support.
- **Docker Compose Watch & Just CLI**: Hot-reloading development container environment syncing code instantaneously across both backend and frontend.
- **Zustand State Architecture**: Decoupled, high-performance stores for networking, real-time application state, user settings, and persistent statistics.
- **Production-Ready Metro Web Fixes**: Pre-configured CJS resolver to prevent `import.meta` ESM bundling errors on web deployments.
- **Full Test Harness**: Configured **Jest** suite with React Native Testing Library and pre-built mocks for Reanimated, Worklets, AsyncStorage, Expo Haptics, and Expo AV.
- **EAS Cloud Deployment CI/CD**: Pre-configured `eas.json` profiles (development, preview, production, iOS simulator) with automated build & submission recipes.

---

## 📁 Architecture Overview

```
├── assets/                   # App icons, splash screens, audio assets
├── server/                   # Node.js WebSocket signaling backend
│   ├── Dockerfile            # Server development container
│   ├── index.js              # Socket.IO room manager & REST endpoints
│   ├── package.json          # Server dependencies (Express, Socket.IO, CORS)
│   └── stress_test.js        # Automated latency & load tester
├── src/
│   ├── components/           # Reusable UI elements (Header, Card, Button)
│   ├── config/               # Dynamic environment URL resolvers
│   ├── navigation/           # Lightweight state-driven navigator
│   ├── network/              # Socket.IO client manager & schemas
│   ├── screens/              # LobbyScreen, RoomScreen, StatsDashboardScreen
│   ├── store/                # Zustand stores (Network, Game, Settings, Stats)
│   ├── theme.ts              # Harmonious HSL color & spacing design system
│   └── utils/                # Cross-platform audio & haptics managers
├── app.json                  # Expo mobile & web metadata
├── eas.json                  # EAS Build & Submit multi-target profiles
├── docker-compose.yml        # Multi-service setup (server, web, redis)
├── justfile                  # Multi-platform command task runner
├── metro.config.js           # Metro bundler with CJS fallback interceptor
└── package.json              # Client dependencies & scripts
```

---

## ⚡ Quick Start

### 1. With Docker & Just (Recommended)
```bash
# Start all services with live hot reloading
just up

# Follow logs
just logs

# Run tests
just test

# Stop containers
just down
```

### 2. Without Docker (Direct Node/Expo CLI)
```bash
# 1. Start Backend Server
cd server
npm install
npm run dev

# 2. In a separate terminal, start Expo Web / Mobile
npm install
npm run web     # or npm run start
```

---

## 📖 Complete Guides
- **[SETUP.md](SETUP.md)**: Detailed step-by-step developer setup, mobile testing (Expo Go), test suite execution, and customization guide.
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Production deployment instructions for Render (Server + Web) and Apple App Store / Google Play via EAS.
