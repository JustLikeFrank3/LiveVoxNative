# Multi-Platform Build Guide

LiveVoxNative now supports building for iOS, Android, macOS, and tvOS from a single codebase.

## Platform Status

| Platform | Status | Build Command | Notes |
|----------|--------|---------------|-------|
| **iOS** | ✅ Ready | `npm run ios` | Fully configured and tested |
| **Android** | ✅ Ready | `npm run android` | Native folder generated |
| **macOS** | 🚧 Pending | `npm run macos` | Requires react-native-macos setup |
| **tvOS** | 🚧 Pending | `npm run tvos` | Requires tvOS target creation |

## Quick Start

### iOS (Current)
```bash
npm run ios
```

### Android (New!)
```bash
npm run android
# Or build release APK
npm run android:build
```

### macOS (Coming Soon)
```bash
# 1. Install react-native-macos
npx react-native-macos-init

# 2. Add macOS native module support
cd modules/audio-engine
# Implement macOS AVAudioEngine bridge

# 3. Run
npm run macos
```

### tvOS (Coming Soon)
```bash
# 1. Create tvOS target in Xcode
# 2. Implement tvOS audio module
# 3. Update UI for remote navigation
npm run tvos
```

## Shared Code Structure

```
LiveVoxNative/
├── shared/              # Platform-agnostic code
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and helpers
├── modules/
│   └── audio-engine/    # Native audio module
│       ├── ios/         # iOS implementation
│       ├── android/     # Android implementation (TODO)
│       ├── macos/       # macOS implementation (TODO)
│       └── tvos/        # tvOS implementation (TODO)
├── ios/                 # iOS native code
├── android/             # Android native code (generated)
└── App.tsx             # Main app component (all platforms)
```

## Development Workflow

1. **Write cross-platform code** in `App.tsx` and `shared/`
2. **Platform-specific code** goes in respective native folders
3. **Native modules** have platform implementations in `modules/audio-engine/`

## Next Steps

- [ ] Implement Android audio module (AVAudioEngine equivalent)
- [ ] Set up macOS build configuration
- [ ] Create tvOS target and implement focus navigation
- [ ] Add CI/CD pipelines for all platforms

## Microphone Permissions

### iOS
Configured in `app.json`:
```json
"NSMicrophoneUsageDescription": "LiveVox needs microphone access..."
```

### Android
Auto-configured in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
```

### macOS
Entitlements in `app.json`:
```json
"com.apple.security.device.audio-input": true
```
