<div align="center">
  <img src="logo.png" width="120" alt="Vibe on the Go"/>
  
  <h1>Vibe on the Go — Mobile App</h1>
  
  <p><strong>Your AI coding agents, in your pocket.</strong></p>
  
  <p>
    React Native app for <strong>iOS</strong>, <strong>Android</strong>, and <strong>Web</strong>
  </p>

  <p>
    <a href="https://apps.apple.com/us/app/vibe-on-the-go/id6748571505">📱 iOS App</a> •
    <a href="https://play.google.com/store/apps/details?id=com.vibeonthego">🤖 Android App</a> •
    <a href="https://app.vibeonthego.com">🌐 Web App</a> •
    <a href="https://youtu.be/GCS0OG9QMSE">🎥 Demo</a>
  </p>
</div>

---

## 🚀 Getting Started

### Download the App

<div align="center">
  <a href="https://apps.apple.com/us/app/vibe-on-the-go/id6748571505">
    <img width="135" alt="Download on App Store" src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://play.google.com/store/apps/details?id=com.vibeonthego">
    <img width="155" alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"/>
  </a>
</div>

Or visit [app.vibeonthego.com](https://app.vibeonthego.com) for the web version.

### Connect Your Terminal

1. Install the CLI: `npm install -g vibe-cli`
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

- Node.js 20+
- Yarn
- Expo CLI
- Server running locally (see [main README](../README.md))

### Setup

```bash
# Install dependencies
yarn install

# Start with local server
yarn start:local-server

# Or standard start (uses production server)
yarn start
```

### Running on Devices

```bash
# Web browser
# Press 'w' after starting

# iOS Simulator (macOS only)
# Press 'i' after starting

# Android Emulator
# Press 'a' after starting

# Physical device
# Scan QR code with Expo Go app
```

### Available Scripts

```bash
yarn start              # Start Expo dev server
yarn start:local-server # Start with local server URL
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
  <p>Part of the <a href="https://github.com/ex3ndr/vibe-on-the-go">Vibe on the Go</a> project.</p>
</div>
