# LiveVoxNative

A real-time audio monitoring and analysis application built with React Native and Expo, featuring a custom native audio engine module for iOS.

## Features

LiveVoxNative provides professional-grade audio monitoring capabilities:

- **Real-time Audio Monitoring**: Monitor microphone input with low latency
- **Waveform Visualization**: Live visualization of audio waveform
- **Pitch Detection**: Real-time pitch detection with note name and cents display
- **RMS Level Metering**: Monitor input audio levels in real-time
- **Audio Input/Output Selection**: Switch between available audio devices
- **Latency Measurement**: View theoretical and measure real round-trip latency
- **Background Audio Control**: Configure audio ducking behavior for mixing with other apps
- **Modern UI**: Dark-themed professional interface with smooth animations

## Architecture

The project consists of two main parts:

1. **React Native Application** (`App.tsx`): The main UI and application logic
2. **expo-audio-engine Module** (`modules/audio-engine`): A custom native Expo module that provides iOS audio capabilities using AVAudioEngine

## Prerequisites

- **Node.js** (v16 or later)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Development**:
  - macOS with Xcode installed
  - iOS Simulator or physical iOS device
  - CocoaPods: `sudo gem install cocoapods`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JustLikeFrank3/LiveVoxNative.git
   cd LiveVoxNative
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install iOS dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Running the App

### Development Build

Since this app uses a custom native module, you need to create a development build:

```bash
# Start the development server
npm start

# Build and run on iOS simulator
npm run ios

# Or build and run on iOS device
npx expo run:ios --device
```

### Expo Go

**Note**: This app cannot run in Expo Go because it uses a custom native module. You must use a development build.

## Usage

1. **Start Monitoring**: Tap the "Start" button to begin audio monitoring
2. **View Real-time Data**: Watch the waveform, RMS levels, and pitch detection update in real-time
3. **Change Audio Devices**: Select different input sources (microphone) and output devices (speaker/headphones)
4. **Measure Latency**: Use the "Measure Real Latency" button to test actual round-trip latency
5. **Configure Background Audio**: Toggle between ducking (karaoke mode) and mixing with other apps
6. **Stop Monitoring**: Tap the "Stop" button to stop the audio engine

## Project Structure

```
LiveVoxNative/
├── App.tsx                    # Main application component
├── index.ts                   # Entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── modules/
│   └── audio-engine/          # Custom native audio module
│       ├── src/
│       │   ├── index.ts       # Module exports
│       │   └── index.d.ts     # TypeScript definitions
│       ├── ios/
│       │   └── AudioEngineModule.swift  # iOS implementation
│       └── package.json       # Module configuration
└── ios/                       # iOS native project
```

## expo-audio-engine Module

The custom `expo-audio-engine` module provides native iOS audio capabilities. See [modules/audio-engine/README.md](modules/audio-engine/README.md) for detailed API documentation.

### Key Features

- Low-latency audio monitoring using AVAudioEngine
- Real-time audio analysis (RMS, pitch, waveform)
- Audio device management (input/output selection)
- Latency measurement and reporting
- Background audio ducking control

## Configuration

### Permissions

The app requires microphone permission. This is configured in `app.json`:

```json
"ios": {
  "infoPlist": {
    "NSMicrophoneUsageDescription": "LiveVox needs microphone access to monitor audio in real time."
  }
}
```

### Audio Settings

- **Sample Rate**: Automatically adapts to device hardware (typically 48 kHz)
- **Buffer Size**: Optimized for low latency
- **Audio Format**: 32-bit float PCM

## Development

### Building for Development

```bash
# Clean build
rm -rf ios/Pods ios/Podfile.lock
cd ios && pod install && cd ..
npm run ios
```

### Debugging

Use React Native debugging tools:

```bash
# Enable debugging in development build
# Shake device or press Cmd+D in simulator
# Select "Debug" from the menu
```

### Modifying the Native Module

When making changes to the native module (`modules/audio-engine/ios/AudioEngineModule.swift`), you need to rebuild:

```bash
npm run ios
```

## Known Limitations

- **iOS Only**: Currently only supports iOS devices (iPhone/iPad)
- **Development Build Required**: Cannot run in Expo Go
- **Microphone Required**: App requires a device with microphone input
- **Real Device Recommended**: For accurate latency testing, use a physical device

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clean the build:
   ```bash
   rm -rf ios/Pods ios/Podfile.lock
   cd ios && pod install && cd ..
   ```

2. Clean Xcode derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. Rebuild:
   ```bash
   npm run ios
   ```

### Audio Not Working

- Ensure microphone permissions are granted
- Check that input device is selected correctly
- Try stopping and restarting the audio engine
- Verify that another app isn't using the microphone

### Latency Issues

- Real round-trip latency may differ from theoretical latency
- Close other audio apps to reduce system load
- Use wired headphones for best latency
- Physical devices typically have better latency than simulator

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details

## Author

LiveVox

## Acknowledgments

Built with:
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [AVAudioEngine](https://developer.apple.com/documentation/avfaudio/avaudioengine) (iOS)
