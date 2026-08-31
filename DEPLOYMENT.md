# Production Deployment Guide

This guide covers deploying the signaling server, web client, and native iOS/Android mobile applications.

---

## 1. Signaling Server Deployment (Render)

1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect your repository and configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free or Starter
4. Under the **Environment** tab, set:
   - `PORT`: `3001`
   - `ALLOWED_ORIGINS`: `https://your-web-app.onrender.com,https://your-custom-domain.com`
5. Verify health check: `https://your-server-url.onrender.com/health`

---

## 2. Web Client Deployment (Render Static Site)

1. Update `extra.serverUrl` in `app.json` with your live server URL:
   ```json
   "extra": {
     "serverUrl": "https://your-server-url.onrender.com"
   }
   ```
2. In Render Dashboard → **New** → **Static Site**.
3. Configure:
   - **Build Command**: `npx expo export --platform web`
   - **Publish Directory**: `dist`
4. Deploy the static site and update `ALLOWED_ORIGINS` on your signaling server to match this web URL.

---

## 3. iOS App Deployment (Apple App Store / TestFlight)

> Requires an active **Apple Developer Program** account.

1. **Log in to EAS**:
   ```bash
   npx eas login
   ```
2. **Configure Credentials**:
   ```bash
   npx eas credentials
   ```
3. **Trigger Production Build**:
   > ⚠️ **Windows Workaround**: If running on Windows paths with spaces or tildes, specify `EAS_NO_VCS=1` to prevent Git tarball clone errors:
   ```powershell
   $env:EAS_NO_VCS="1"; npx eas build --platform ios --profile production
   ```
4. **Submit to TestFlight**:
   ```powershell
   $env:EAS_NO_VCS="1"; npx eas submit --platform ios --profile production --latest
   ```

---

## 4. Android App Deployment (Google Play)

1. **Build Android App Bundle (.aab)**:
   ```powershell
   $env:EAS_NO_VCS="1"; npx eas build --platform android --profile production
   ```
2. **Submit to Google Play Internal Testing**:
   ```powershell
   $env:EAS_NO_VCS="1"; npx eas submit --platform android --profile production
   ```

---

## 5. Summary Environment Matrix

| Environment | Signaling Server URL | Client URL |
| :--- | :--- | :--- |
| **Local Dev** | `http://localhost:3001` | `http://localhost:8081` |
| **LAN Mobile** | `http://<YOUR_LAN_IP>:3001` | Metro LAN QR / Expo Go |
| **Production** | `https://your-server.onrender.com` | `https://your-web.onrender.com` / App Store |
