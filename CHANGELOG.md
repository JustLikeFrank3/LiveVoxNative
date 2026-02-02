# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-02

### Added
- Initial release of LiveVoxNative
- Real-time audio monitoring with AVAudioEngine
- Audio analysis features:
  - RMS (Root Mean Square) level metering
  - Waveform visualization
  - Pitch detection with note name, octave, and cents deviation
- Audio device management:
  - Enumerate available audio inputs
  - Enumerate available audio outputs
  - Switch between input/output devices dynamically
- Latency measurement:
  - Theoretical latency reporting (input, output, buffer)
  - Round-trip latency testing with click detection
- Background audio control:
  - Audio ducking mode (karaoke mode)
  - Mix with other apps mode
- Modern UI:
  - Dark-themed interface
  - Smooth boot animation
  - Real-time waveform display
  - Interactive device selection
- Native module: `expo-audio-engine`
  - iOS implementation using AVAudioEngine
  - TypeScript API for JavaScript/React Native
  - Event-driven architecture for audio analysis
- Documentation:
  - Comprehensive README
  - API reference for audio engine module
  - Contributing guidelines
  - MIT License

### Technical Details
- Built with React Native 0.81.5
- Expo SDK ~54.0.32
- React 19.1.0
- TypeScript support
- React Native New Architecture enabled
- iOS 13.0+ support

## [Unreleased]

### Planned Features
- Android support for audio engine
- Audio recording functionality
- Audio playback from files
- Audio effects (reverb, echo, equalizer)
- Frequency spectrum visualization
- Metronome functionality
- Audio file import/export
- Settings persistence
- Multiple audio format support
- Bluetooth audio device optimization

### Known Issues
- Android platform not yet supported
- Bluetooth audio devices may have higher latency in round-trip tests
- Pitch detection works best with sustained notes (60-1000 Hz range)

---

[1.0.0]: https://github.com/JustLikeFrank3/LiveVoxNative/releases/tag/v1.0.0
