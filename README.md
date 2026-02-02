# LiveVoxNative

A professional-grade real-time audio monitoring and analysis application built with React Native and Expo. LiveVoxNative provides low-latency audio input/output with advanced audio analysis capabilities including RMS metering, waveform visualization, and pitch detection.

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[API Reference](modules/audio-engine/README.md)** - Complete audio engine API documentation
- **[Code Examples](modules/audio-engine/EXAMPLES.md)** - Practical usage examples
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Documentation Overview](DOCS.md)** - Navigate all documentation

## Features

- **Real-time Audio Monitoring**: Low-latency audio input and output using AVAudioEngine
- **Audio Analysis**:
  - RMS (Root Mean Square) level metering
  - Waveform visualization
  - Pitch detection with note and cents display
- **Latency Measurement**: 
  - Theoretical latency reporting (input, output, buffer)
  - Round-trip latency testing with click detection
- **Flexible Audio Routing**:
  - Select from available audio inputs (microphone, external devices)
  - Select from available audio outputs (speaker, headphones, external devices)
- **Background Audio Control**: Toggle between ducking mode (karaoke) and mixing with other apps
- **Modern UI**: Sleek dark-themed interface with smooth animations

## Prerequisites

- **macOS**: Required for iOS development
- **Xcode**: Latest version recommended
- **Node.js**: v18 or higher
- **npm** or **yarn**: Package manager
- **Expo CLI**: Installed globally or via npx
- **iOS Device or Simulator**: iOS 13.0 or higher

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JustLikeFrank3/LiveVoxNative.git
   cd LiveVoxNative
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install iOS dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Running the App

### Development Mode

**Start the Expo development server**:
```bash
npm start
```

**Run on iOS Simulator**:
```bash
npm run ios
```

**Run on iOS Device**:
1. Connect your iOS device via USB
2. Ensure your device is registered in your Apple Developer account
3. Run:
   ```bash
   npm run ios
   ```

### Production Build

To create a production build, use Expo's build service or EAS Build:
```bash
npx eas build --platform ios
```

## Usage

### Starting Audio Monitoring

1. Launch the app
2. Grant microphone permissions when prompted
3. Tap the **Start** button to begin monitoring
4. The app will display:
   - Real-time RMS levels
   - Waveform visualization
   - Pitch detection (note name, octave, and cents deviation)
   - Latency information

### Selecting Audio Devices

- **Audio Input**: Tap on any available input device to switch (e.g., built-in microphone, external mic)
- **Audio Output**: Tap on any available output device to switch (e.g., speaker, headphones)

### Measuring Latency

1. Make sure the audio engine is running
2. Tap **Measure Real Latency** in the Round-Trip Latency Test section
3. The app will play a click through the speaker and measure when it returns through the microphone
4. Results include measured latency, theoretical latency, and the difference

### Background Audio Control

Toggle between two modes:
- **Duck Other Apps (Karaoke Mode)**: Reduces other apps' volume by ~50%
- **Mix With Other Apps**: Allows other apps to play at full volume

## Project Structure

```
LiveVoxNative/
├── App.tsx                 # Main application component
├── index.ts               # Entry point
├── app.json              # Expo configuration
├── package.json          # Project dependencies
├── modules/
│   └── audio-engine/     # Native audio engine module
│       ├── ios/          # iOS native implementation
│       ├── src/          # TypeScript/JavaScript interface
│       └── package.json  # Module metadata
├── assets/               # App icons and images
└── ios/                  # iOS project files
```

## Audio Engine Module

The `expo-audio-engine` is a custom Expo module that provides native audio processing capabilities using Apple's AVAudioEngine framework.

### Key Features

- Start/stop audio monitoring
- Get available audio inputs and outputs
- Switch between audio devices
- Real-time audio analysis (RMS, pitch, waveform)
- Latency measurement and reporting
- Background audio ducking control

### API Reference

See [modules/audio-engine/README.md](modules/audio-engine/README.md) for detailed API documentation.

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run the app on iOS simulator or device
- `npm run android` - Run the app on Android (not currently supported)
- `npm run web` - Run the app in a web browser (limited functionality)

## Technical Details

### Audio Processing

- **Engine**: AVAudioEngine (iOS)
- **Sample Rate**: Device-dependent (typically 48 kHz)
- **Buffer Size**: Optimized for low latency
- **Analysis**: Real-time FFT for pitch detection, time-domain analysis for RMS and waveform

### Permissions

The app requires microphone access:
- **iOS**: `NSMicrophoneUsageDescription` is configured in `app.json`
- Users will be prompted to grant permission on first use

### React Native New Architecture

This app is configured to use React Native's New Architecture:
- Turbo Modules for native module communication
- Fabric renderer for improved performance
- Set via `newArchEnabled: true` in `app.json`

## Troubleshooting

### Microphone Permission Issues

If the app cannot access the microphone:
1. Go to iOS Settings → Privacy → Microphone
2. Ensure LiveVoxNative has permission enabled

### Audio Not Working

- Check that audio monitoring is started (tap Start button)
- Verify that the device is not muted
- Check the selected input/output devices
- Try restarting the app

### Build Errors

If you encounter build errors:
1. Clean the iOS build:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```
2. Clear Metro bundler cache:
   ```bash
   npx expo start --clear
   ```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

LiveVox

## Support

For issues and questions, please open an issue on GitHub.
