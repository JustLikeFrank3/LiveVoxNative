# Quick Start Guide

Get LiveVoxNative running on your device in under 5 minutes!

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] macOS computer (required for iOS development)
- [ ] Xcode installed (download from App Store)
- [ ] Node.js v18+ installed ([Download](https://nodejs.org/))
- [ ] An iOS device or simulator available

## Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/JustLikeFrank3/LiveVoxNative.git
cd LiveVoxNative

# Install JavaScript dependencies
npm install

# Install iOS dependencies
cd ios
pod install
cd ..
```

### 2. Run the App (1 minute)

**On iOS Simulator:**
```bash
npm run ios
```

**On iOS Device:**
1. Connect your device via USB
2. Open Xcode: `open ios/LiveVoxNative.xcworkspace`
3. Select your device from the device menu
4. Press the Run button or use:
   ```bash
   npm run ios
   ```

### 3. Grant Permissions (30 seconds)

When the app launches:
1. You'll see a boot animation
2. Tap **Allow** when prompted for microphone access
3. Wait for the main screen to appear

### 4. Start Monitoring (30 seconds)

1. Tap the **Start** button at the bottom
2. Speak or make a sound
3. Watch the real-time displays:
   - **RMS Level**: Shows input volume
   - **Waveform**: Visual representation of the sound
   - **Pitch**: Detects musical notes (sing or whistle!)

## Quick Feature Tour

### Test Audio Monitoring
- Speak into the microphone
- Watch the RMS level change
- See the waveform update in real-time

### Try Pitch Detection
- Sing or whistle a sustained note
- The app will show the note name (e.g., "A4")
- See how many cents you're off from perfect pitch

### Measure Latency
1. Scroll down to "Round-Trip Latency Test"
2. Tap **Measure Real Latency**
3. The app plays a click and measures the delay
4. See both measured and theoretical latency values

### Switch Audio Devices
- Tap different input/output devices to switch
- Try headphones vs speaker
- Compare latency between different configurations

### Change Background Audio Mode
- Toggle between "Duck Other Apps" and "Mix With Other Apps"
- Play music from another app to hear the difference
- Ducking mode reduces other apps' volume by ~50%

## Troubleshooting Quick Fixes

### App Won't Build
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo start --clear
```

### No Audio Analysis
- Check that you tapped the **Start** button
- Verify microphone permissions in iOS Settings
- Make sure your device isn't muted
- Try increasing the volume

### Can't Hear Anything
- Audio monitoring doesn't play back by default
- For latency test, make sure volume is up
- Check that the correct output device is selected

## What's Next?

Now that you're up and running:
- Read the full [README.md](README.md) for detailed documentation
- Check out the [API Reference](modules/audio-engine/README.md) for the audio engine
- Explore the [Contributing Guide](CONTRIBUTING.md) if you want to contribute

## Need Help?

- Check [Troubleshooting](README.md#troubleshooting) in the README
- Review [Known Issues](CHANGELOG.md#known-issues) in the CHANGELOG
- Open an issue on GitHub if you're stuck

## Pro Tips

1. **Best Latency**: Use wired headphones with a built-in mic
2. **Clearest Pitch**: Sing sustained notes between 100-500 Hz
3. **Stable RMS**: Keep distance from mic consistent
4. **Battery Life**: Stop monitoring when not in use

Happy monitoring! 🎤🎵
