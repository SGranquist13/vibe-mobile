<div align="center">
  <img src="logo.png" width="120" alt="Vibe on the Go"/>
  
  <h1>Vibe on the Go — Mobile App</h1>
  
  <p><strong>Your AI coding agents, in your pocket.</strong></p>
  
  <p>
    React Native app for <strong>iOS</strong>, <strong>Android</strong>, and <strong>Web</strong>
  </p>

  <p>
    React Native app for <strong>iOS</strong>, <strong>Android</strong>, and <strong>Web</strong>
  </p>
</div>

---

## 🚀 Getting Started

### Connect Your Terminal

1. Build and install the CLI from source (see [Development](#-development) section below)
2. Run `vibe claude` (or `vibe codex`, `vibe gemini`, `vibe cursor`)
3. Scan the QR code with the app to link devices

---

## ✨ Features

- 📱 **Mobile Access** — Monitor AI agents from anywhere
- ⚡ **Instant Switching** — Take control with one tap
- 🔔 **Push Notifications** — Alerts for permissions & errors
- 🔐 **End-to-End Encrypted** — Zero-knowledge architecture
- 🎙️ **Voice Assistant** — Talk to your AI (15+ languages)
- 🌙 **Dark Mode** — Auto-detects system preference
- 🐙 **GitHub Integration** — Connect your profile
- 📁 **File Manager** — Browse files with syntax highlighting

---

## 🛠️ Development

### Prerequisites

- **Node.js 20+** and npm/yarn
- **Expo CLI** (install with `npm install -g expo-cli` or use `npx expo`)
- **Server running locally** (see [main README](../README.md) or [server README](../server/README.md))
- **CLI built and linked** (see [CLI README](../cli/README.md))

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SGranquist13/vibe-mobile.git
   cd vibe-mobile
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start the local server** (in a separate terminal):
   ```bash
   cd ../server
   yarn dev
   ```

4. **Start the mobile app with local server:**
   ```bash
   cd ../mobile
   yarn start:local-server
   ```

### Running on Devices

After starting the dev server, you can run on:

- **Web browser**: Press `w` in the terminal
- **iOS Simulator** (macOS only): Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical device**: Scan the QR code with the Expo Go app

### Environment Configuration

For local development, the app will automatically use `http://localhost:3005` when using `yarn start:local-server`.

To use a different server URL, set the environment variable:
```bash
EXPO_PUBLIC_VIBE_SERVER_URL=http://YOUR_IP:3005 yarn start:local-server
```

### Available Scripts

```bash
yarn start              # Start Expo dev server (uses production server)
yarn start:local-server # Start with local server URL (http://localhost:3005)
yarn typecheck          # Run TypeScript checks
yarn lint               # Run ESLint
```

---

## 📦 Project Structure

```
mobile/
├── sources/
│   ├── app/           # Screen components (Expo Router)
│   ├── components/    # Reusable UI components
│   ├── sync/          # Real-time sync engine
│   ├── auth/          # Authentication logic
│   ├── encryption/    # E2E encryption utilities
│   ├── hooks/         # React hooks
│   └── utils/         # Utilities
├── src-tauri/         # Tauri desktop wrapper
└── public/            # Static assets
```

---

## 🔐 Security

- **TweetNaCl encryption** — Military-grade cryptography
- **Local key storage** — Keys never leave your device
- **Zero-knowledge sync** — Server cannot read your data
- **No telemetry** — We don't track you

---

## 📖 Documentation

- [**Main Project README**](../README.md) — Full project overview
- [**Quick Start Guide**](../QUICK_START.md) — Complete setup instructions
- [**Mobile Development Guide**](CLAUDE.md) — Detailed mobile development docs
- [**Changelog**](CHANGELOG.md) — Version history

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Part of the <a href="https://github.com/SGranquist13/votg">Vibe on the Go</a> project.</p>
  <p>
    <a href="https://github.com/SGranquist13/vibe-mobile">📱 Mobile</a> •
    <a href="https://github.com/SGranquist13/vibe-cli">💻 CLI</a> •
    <a href="https://github.com/SGranquist13/vibe-server">🖥️ Server</a>
  </p>
</div>
