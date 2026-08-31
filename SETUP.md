# Detailed Setup & Developer Guide

This document walks you through configuring, running, testing, and customizing the **Expo Fullstack Starter Template**.

---

## 1. Prerequisites

Make sure the following tools are installed on your workstation:
- **Node.js**: `>= 20.0.0` ([nodejs.org](https://nodejs.org))
- **Docker Desktop**: With Docker Compose v2.22+ ([docker.com](https://www.docker.com))
- **Just Task Runner**: Optional, but strongly recommended for single-command task execution:
  - Windows: `winget install Casey.Just` or `cargo install just`
  - macOS: `brew install just`
  - Linux: `sudo apt install just` (or cargo install)
- **Expo Go App**: Install on your physical iOS/Android device from App Store / Google Play for mobile testing.
- **EAS CLI**: For cloud builds: `npm install -g eas-cli`

---

## 2. Local Development Workflows

### Option A: Docker Compose Watch & Just (Recommended)

1. **Copy Environment Defaults**:
   ```bash
   cp .env.example .env
   ```
2. **Start All Containers**:
   ```bash
   just up
   ```
   This starts:
   - `app-server` on `http://localhost:3001`
   - `app-web` on `http://localhost:8081`
   - `app-redis` on port `6379`
   With file synchronization enabled, saving changes in `src/` or `server/` automatically updates the live runtime.

3. **Useful Just Commands**:
   | Command | Description |
   | :--- | :--- |
   | `just up` | Start all services with live watch |
   | `just logs` | View streaming container logs |
   | `just logs server` | View backend server logs only |
   | `just test` | Execute Jest tests inside container |
   | `just expo-attach` | Attach interactive terminal controls to Metro |
   | `just expo-start` | Launch Metro for LAN Expo Go connections |
   | `just expo-tunnel` | Launch Metro over remote tunnel |
   | `just db-reset` | Flush Redis cache |
   | `just down` | Stop all containers and clean up networks |

---

### Option B: Local Development without Docker

1. **Install Dependencies**:
   ```bash
   # Root / Frontend
   npm install

   # Backend Server
   cd server
   npm install
   cd ..
   ```

2. **Start Backend**:
   ```bash
   node server/index.js
   ```

3. **Start Frontend Web / Mobile**:
   ```bash
   # For Web Browser:
   npm run web

   # For Metro QR Interface (Expo Go):
   npm run start
   ```

---

## 3. Testing Physical Devices

### LAN Mode
1. Ensure your computer and phone are connected to the same Wi-Fi network.
2. In `.env`, set `REACT_NATIVE_PACKAGER_HOSTNAME` and `EXPO_PUBLIC_SERVER_URL` to your local machine's LAN IP (e.g. `http://192.168.1.100:3001`).
3. Run `npm run start` and scan the QR code with the Expo Go camera.

### Tunnel Mode
If your Wi-Fi blocks LAN peer-to-peer traffic, start Metro in tunnel mode:
```bash
npx expo start --tunnel
```

---

## 4. Running Test Suites

The test harness uses **Jest** with pre-configured mocks for native modules:
```bash
# Run all unit and integration tests:
npm test

# Run tests in watch mode:
npx jest --watch

# Run a specific test file:
npx jest LobbyScreen
```

---

## 5. Customization Guide

### Renaming App & Bundle Identifiers
1. **`app.json`**: Update `name`, `slug`, `scheme`, `ios.bundleIdentifier`, and `android.package`.
2. **`package.json`**: Update project `name` and `description`.

### Adjusting Design System & Theme
Open `src/theme.ts` to customize:
- Primary, accent, success, and danger color palettes.
- Surface and background contrasts.
- Typography scale and border radius tokens.

### Adding New WebSocket Events
1. **Server**: Add listeners in `server/index.js` under `io.on('connection', ...)`.
2. **Types**: Define payload interfaces in `src/network/types.ts`.
3. **Client**: Add wrapper methods in `src/network/socketClient.ts` and bind to Zustand stores in `src/store/`.

---

## 6. Troubleshooting

- **Web build fails with `import.meta` error**: Ensure `metro.config.js` is active. The custom resolver prevents ESM bundle resolution on web.
- **Port 3001 or 8081 already in use**: Adjust ports in `.env` and restart containers.
- **Expo Go cannot connect to server**: Use your LAN IP (e.g. `http://192.168.x.x:3001`) instead of `localhost`.
