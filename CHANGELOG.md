# Changelog

All notable changes to LiveVoxNative will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## LiveVoxNative (React Native/iOS)

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

### Added
- Android native folder and build scripts for local development
- Android audio engine implementation (AudioRecord) with RMS + waveform events
- Android microphone permission request flow
- Android module autolinking configuration for `expo-audio-engine`
- Shared cross-platform directory scaffold (components/hooks/lib)

### Changed
- Updated Android app identifiers and permissions in app configuration

### Known Issues
- Accurate round-trip latency measurement is unreliable on Android emulator

### Planned Features
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
- Bluetooth audio devices may have higher latency in round-trip tests
- Pitch detection works best with sustained notes (60-1000 Hz range)

---

[1.0.0]: https://github.com/JustLikeFrank3/LiveVoxNative/releases/tag/v1.0.0

---

## LiveVox Web (Original Project)

*LiveVoxNative is a native iOS reimplementation of the original LiveVox web app. Below is the changelog from the web version that inspired this project.*

---

### [1.3.0] - Pitch Detection Update
**Added pitch indicator feature for singers**

#### ✨ New Features
- Real-time pitch detection using autocorrelation algorithm
- Visual tuning indicator showing sharp/flat/in-tune status
- Musical note display with octave (C2-B5 range)
- Cents deviation measurement from perfect pitch
- "In Tune" badge appears when within ±15 cents
- Smooth animated tuning needle
- Color-coded feedback (emerald=in tune, yellow=sharp, blue=flat)

#### 🎯 Detection Range
- Frequency range: 60Hz-1000Hz
- Response time: <100ms
- Accuracy: ±5 cents
- Handles silence gracefully with "Sing or play a note" placeholder

#### 🎵 Use Cases
- Practice singing in tune
- Train your ear for pitch accuracy
- Monitor vocal intonation during practice
- Tune acoustic instruments by voice

---

### [1.2.0] - GitHub Deployment & Documentation
**Prepared app for public GitHub sharing**

#### 📚 Documentation
- Comprehensive README with usage guides
- Screenshots folder with placeholder images
- Contributing guidelines for developers
- Detailed troubleshooting section
- Technical architecture documentation

#### 🌐 Deployment
- Instructions for sharing live URL
- Guide for making repository public
- Custom domain configuration info
- License and acknowledgments

---

### [1.1.0] - Ultra-Low Latency Mode
**Enhanced latency control and performance**

#### ⚡ New Features
- Ultra-Low Latency Mode toggle
- Dual mode support:
  - **Ultra-Low**: <10ms latency, no compression
  - **Balanced**: 15-25ms latency, with compression and smoothing
- Real-time latency measurement display
- Color-coded latency indicators (green/yellow/orange)
- Optimized audio buffer sizes (FFT 128 in ultra-low, 256 in balanced)
- Setting persists between sessions

#### 🎚️ Audio Processing
- Conditional dynamic compression (balanced mode only)
- Adjustable FFT size based on mode
- Configurable smoothing constants
- AudioContext latency hints (0 vs 'interactive')
- Seamless mode switching while monitoring

#### 🎨 UI Improvements
- Gauge icon for latency mode toggle
- Detailed mode descriptions
- Warning about clipping in ultra-low mode
- Latency badge with color coding
- Visual feedback for active mode

---

### [1.0.0] - Initial Web Release
**Core audio monitoring functionality**

#### 🎤 Core Features
- Real-time audio passthrough with Web Audio API
- Single-button monitoring toggle
- Microphone permission handling
- Volume control (0-100%)
- Boost amplification (up to 300% gain)
- Audio level meter with gradient zones
- Clipping detection and warnings

#### 📊 Visualizations
- Real-time waveform oscilloscope display
- Canvas-based audio visualization
- Level meter with safe/optimal/clipping zones
- Animated clipping indicators

#### 🎧 Device Management
- Automatic microphone detection
- Preference for headphone/headset microphones
- Multiple input device support
- Device selector dropdown
- Persistent device selection
- Device change detection

#### 🎨 User Interface
- Clean, professional audio equipment aesthetic
- IBM Plex fonts (Sans, Serif, Code)
- Green-based color scheme
- Smooth Framer Motion animations
- Responsive mobile-friendly design
- Shadcn UI components

#### 💾 Persistence
- Volume settings saved between sessions
- Boost level preserved
- Selected device remembered
- Settings stored in browser

#### 🔧 Technical
- React 19 with TypeScript
- 48kHz sample rate
- 16-bit audio
- Mono channel for voice
- Gain nodes for volume and boost
- AnalyserNode for visualization
- RequestAnimationFrame for smooth updates

#### 🎯 Target Use Cases
- Singers practicing with streaming music
- Podcasters monitoring voice quality
- Musicians hearing themselves through headphones
- Voice training and speech practice

---

## Development Evolution

### Web to Native Migration
The transition from LiveVox Web to LiveVoxNative brought significant improvements:

**Architecture Changes:**
- Web Audio API → AVAudioEngine (native iOS)
- JavaScript/TypeScript → Swift for audio processing
- Canvas rendering → Native UIKit/SwiftUI views
- Browser constraints → Direct hardware access

**Performance Improvements:**
- Lower latency: ~5-10ms web → ~2-5ms native
- Direct audio I/O access
- Hardware-accelerated DSP with Accelerate framework
- No browser sandbox limitations

**New Capabilities:**
- Background audio support
- Hardware audio device selection
- Lower-level audio session control
- Round-trip latency measurement with correlation
- Native iOS integration

---

## Web Version Timeline

### Iteration 3: Pitch Detection
- Implemented autocorrelation-based pitch detection algorithm
- Created PitchIndicator component with visual tuning meter
- Added musical note mapping (C2-B5)
- Designed cents deviation display
- Added "In Tune" badge feedback
- Integrated with existing audio analysis pipeline

### Iteration 2: GitHub Preparation
- Wrote comprehensive README documentation
- Created screenshots folder structure
- Added placeholder images with instructions
- Documented sharing and deployment options
- Created CONTRIBUTING.md for developers
- Added detailed troubleshooting guide

### Iteration 1: Ultra-Low Latency
- Researched Web Audio API latency optimization
- Implemented dual-mode audio processing
- Added real-time latency measurement
- Created mode toggle UI with descriptive labels
- Optimized FFT sizes for each mode
- Added conditional compression pipeline

### Iteration 0: Core Application
- Set up React + TypeScript project structure
- Implemented Web Audio API integration
- Created audio processing pipeline
- Built volume and boost controls
- Designed visual feedback components
- Implemented device selection
- Created persistent storage system
- Designed UI theme and styling

---

## Credits

**Core Technology:**
- AVFoundation (Apple)
- Accelerate framework (Apple)
- Expo and React Native teams
- Web Audio API team at W3C (original web version)
- React team at Meta
- Vite team (web version)
- Tailwind Labs
- Shadcn (UI components)

**Inspiration:**
- Professional audio interfaces
- Studio monitoring equipment
- DAW (Digital Audio Workstation) designs
- Hardware synthesizer interfaces

**Special Thanks:**
- GitHub Spark team for the original web platform
- Web Audio API community
- React Native community
- iOS audio engineering community
- All beta testers and early users

---

*LiveVoxNative is the native iOS evolution of the original LiveVox web application*
