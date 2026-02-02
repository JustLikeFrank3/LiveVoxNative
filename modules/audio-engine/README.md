# expo-audio-engine

A custom Expo module that provides low-latency audio monitoring and analysis capabilities for iOS using AVAudioEngine.

## Overview

`expo-audio-engine` is a native iOS module that enables real-time audio input monitoring, analysis, and device management. It provides:

- Real-time audio level monitoring (RMS)
- Pitch detection with high accuracy
- Waveform data for visualization
- Audio input/output device selection
- Latency measurement (theoretical and measured)
- Background audio ducking control

## Installation

This module is included as a local dependency in the LiveVoxNative project:

```json
"dependencies": {
  "expo-audio-engine": "file:./modules/audio-engine"
}
```

To use it in your own project, copy the `modules/audio-engine` directory and add it to your `package.json`.

## Requirements

- Expo SDK 54+
- iOS 13.0+
- React Native 0.81+
- Expo development build (cannot run in Expo Go)

## API Reference

### Audio Engine Control

#### `start(): Promise<void>`

Starts the audio engine and begins monitoring the microphone input.

```typescript
import { start } from 'expo-audio-engine'

await start()
```

**Throws**: Error if the audio engine fails to start (e.g., microphone permission denied)

#### `stop(): Promise<void>`

Stops the audio engine and releases audio resources.

```typescript
import { stop } from 'expo-audio-engine'

await stop()
```

#### `isRunning(): boolean`

Returns whether the audio engine is currently running.

```typescript
import { isRunning } from 'expo-audio-engine'

const running = isRunning()
console.log(`Engine is ${running ? 'running' : 'stopped'}`)
```

### Audio Analysis Listeners

#### `addAudioAnalysisListener(listener): Subscription`

Subscribes to real-time audio analysis updates. The listener receives RMS levels, pitch frequency, and waveform data.

```typescript
import { addAudioAnalysisListener } from 'expo-audio-engine'

const subscription = addAudioAnalysisListener((payload) => {
  console.log('RMS:', payload.rms)
  console.log('Pitch:', payload.pitch, 'Hz')
  console.log('Waveform samples:', payload.waveform.length)
})

// Clean up when done
subscription.remove()
```

**Payload Type**:
```typescript
type AudioAnalysisPayload = {
  rms: number        // Root Mean Square level (0.0 - 1.0+)
  pitch: number      // Detected pitch in Hz (0 if no pitch detected)
  waveform: number[] // Array of normalized waveform samples (-1.0 to 1.0)
}
```

#### `addAudioLevelListener(listener): Subscription`

Subscribes to audio level updates (RMS only, lighter weight than analysis listener).

```typescript
import { addAudioLevelListener } from 'expo-audio-engine'

const subscription = addAudioLevelListener((payload) => {
  console.log('Level:', payload.rms)
})

subscription.remove()
```

**Payload Type**:
```typescript
type AudioLevelPayload = {
  rms: number  // Root Mean Square level (0.0 - 1.0+)
}
```

#### `addAudioStateListener(listener): Subscription`

Subscribes to audio engine state changes (start/stop events).

```typescript
import { addAudioStateListener } from 'expo-audio-engine'

const subscription = addAudioStateListener((payload) => {
  console.log('Engine running:', payload.running)
})

subscription.remove()
```

**Payload Type**:
```typescript
type AudioStatePayload = {
  running: boolean  // true when engine starts, false when it stops
}
```

### Audio Device Management

#### `getAvailableInputs(): AudioInput[]`

Returns a list of available audio input devices.

```typescript
import { getAvailableInputs } from 'expo-audio-engine'

const inputs = getAvailableInputs()
inputs.forEach(input => {
  console.log(`${input.portName} (${input.portType})`)
})
```

**Return Type**:
```typescript
type AudioInput = {
  uid: string      // Unique identifier
  portName: string // Human-readable name (e.g., "iPhone Microphone")
  portType: string // Type (e.g., "MicrophoneBuiltIn", "MicrophoneWired")
}
```

#### `getCurrentInput(): AudioInput | null`

Returns the currently selected audio input device.

```typescript
import { getCurrentInput } from 'expo-audio-engine'

const current = getCurrentInput()
if (current) {
  console.log('Current input:', current.portName)
}
```

#### `setInput(inputUID: string): void`

Sets the active audio input device by its unique identifier.

```typescript
import { setInput, getAvailableInputs } from 'expo-audio-engine'

const inputs = getAvailableInputs()
if (inputs.length > 0) {
  setInput(inputs[0].uid)
}
```

**Parameters**:
- `inputUID`: The `uid` property from an `AudioInput` object

#### `getAvailableOutputs(): AudioOutput[]`

Returns a list of available audio output devices.

```typescript
import { getAvailableOutputs } from 'expo-audio-engine'

const outputs = getAvailableOutputs()
outputs.forEach(output => {
  console.log(`${output.portName} (${output.portType})`)
})
```

**Return Type**:
```typescript
type AudioOutput = {
  uid: string      // Unique identifier
  portName: string // Human-readable name (e.g., "iPhone Speaker")
  portType: string // Type (e.g., "Speaker", "BluetoothA2DP", "Headphones")
}
```

#### `getCurrentOutput(): AudioOutput | null`

Returns the currently selected audio output device.

```typescript
import { getCurrentOutput } from 'expo-audio-engine'

const current = getCurrentOutput()
if (current) {
  console.log('Current output:', current.portName)
}
```

#### `setOutput(portType: string): void`

Sets the active audio output device by its port type.

```typescript
import { setOutput } from 'expo-audio-engine'

// Switch to speaker
setOutput('Speaker')

// Or use Bluetooth
setOutput('BluetoothA2DP')
```

**Parameters**:
- `portType`: The `portType` property from an `AudioOutput` object

### Latency Measurement

#### `getLatency(): LatencyInfo`

Returns theoretical latency information based on buffer sizes and sample rate.

```typescript
import { getLatency } from 'expo-audio-engine'

const latency = getLatency()
console.log('Total latency:', latency.total, 'ms')
console.log('Input latency:', latency.input, 'ms')
console.log('Output latency:', latency.output, 'ms')
console.log('Buffer latency:', latency.buffer, 'ms')
console.log('Sample rate:', latency.sampleRate, 'Hz')
```

**Return Type**:
```typescript
type LatencyInfo = {
  total: number      // Total theoretical latency in milliseconds
  input: number      // Input device latency in milliseconds
  output: number     // Output device latency in milliseconds
  buffer: number     // Audio buffer latency in milliseconds
  sampleRate: number // Current sample rate in Hz
}
```

#### `measureRoundTripLatency(): Promise<RoundTripLatencyResult>`

Measures actual round-trip latency by playing a click through the speaker and detecting when it returns through the microphone.

```typescript
import { measureRoundTripLatency } from 'expo-audio-engine'

const result = await measureRoundTripLatency()
if (result.success) {
  console.log('Measured latency:', result.measured, 'ms')
  console.log('Theoretical latency:', result.theoretical, 'ms')
  console.log('Difference:', result.difference, 'ms')
} else {
  console.error('Latency test failed:', result.error)
}
```

**Return Type**:
```typescript
type RoundTripLatencyResult = {
  measured: number     // Measured round-trip latency in milliseconds
  theoretical: number  // Theoretical latency from getLatency()
  difference: number   // measured - theoretical
  success: boolean     // true if measurement succeeded
  error?: string       // Error message if success is false
}
```

**Note**: The audio engine must be running before measuring latency. For best results, measure in a quiet environment.

### Audio Settings

#### `setGain(value: number): Promise<void>`

Sets the input gain/amplification level.

```typescript
import { setGain } from 'expo-audio-engine'

// Set gain to 50%
await setGain(0.5)

// Set gain to 150% (boost)
await setGain(1.5)
```

**Parameters**:
- `value`: Gain multiplier (typically 0.0 to 2.0)

#### `setBoost(value: number): Promise<void>`

Sets an additional boost level for weak signals.

```typescript
import { setBoost } from 'expo-audio-engine'

await setBoost(1.2)
```

**Parameters**:
- `value`: Boost multiplier

#### `getSystemVolume(): number`

Returns the current system volume level.

```typescript
import { getSystemVolume } from 'expo-audio-engine'

const volume = getSystemVolume()
console.log('System volume:', (volume * 100).toFixed(0) + '%')
```

**Returns**: Volume level from 0.0 (muted) to 1.0 (maximum)

#### `setBackgroundAudioDucking(enabled: boolean): void`

Controls whether background audio from other apps should be ducked (reduced in volume) when this app's audio is active.

```typescript
import { setBackgroundAudioDucking } from 'expo-audio-engine'

// Enable ducking (karaoke mode - reduces other apps' volume)
setBackgroundAudioDucking(true)

// Disable ducking (mix with other apps at full volume)
setBackgroundAudioDucking(false)
```

**Parameters**:
- `enabled`: 
  - `true`: Other apps' audio is reduced by ~50% (good for monitoring/recording)
  - `false`: Other apps' audio plays at full volume (good for mixing)

## Usage Example

Complete example of using the audio engine:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Button, Text } from 'react-native'
import {
  start,
  stop,
  isRunning,
  addAudioAnalysisListener,
  getAvailableInputs,
  setInput,
  getLatency,
} from 'expo-audio-engine'

export default function AudioMonitor() {
  const [running, setRunning] = useState(false)
  const [rms, setRms] = useState(0)
  const [pitch, setPitch] = useState(0)

  useEffect(() => {
    // Subscribe to audio analysis
    const subscription = addAudioAnalysisListener((payload) => {
      setRms(payload.rms)
      setPitch(payload.pitch)
    })

    return () => subscription.remove()
  }, [])

  const toggleEngine = async () => {
    try {
      if (running) {
        await stop()
        setRunning(false)
      } else {
        await start()
        setRunning(true)
        
        // Log latency info
        const latency = getLatency()
        console.log('Total latency:', latency.total, 'ms')
      }
    } catch (error) {
      console.error('Failed to toggle engine:', error)
    }
  }

  return (
    <View>
      <Button 
        title={running ? 'Stop' : 'Start'} 
        onPress={toggleEngine} 
      />
      <Text>RMS: {rms.toFixed(4)}</Text>
      <Text>Pitch: {pitch.toFixed(1)} Hz</Text>
    </View>
  )
}
```

## Technical Details

### Audio Pipeline

The module uses AVAudioEngine with the following configuration:

1. **Input Node**: Captures microphone audio
2. **Mixer Node**: Processes and mixes audio
3. **Output Node**: Routes to speaker/headphones
4. **Tap Point**: Analyzes audio buffer for RMS, pitch, and waveform

### Audio Format

- **Sample Rate**: Device native (typically 48000 Hz)
- **Bit Depth**: 32-bit float
- **Channels**: Mono (1 channel)
- **Buffer Size**: Optimized for low latency

### Pitch Detection Algorithm

The pitch detection uses autocorrelation with the following features:

- Detects fundamental frequency in the range of 60-1000 Hz
- Provides cent-level accuracy for tuning applications
- Filters out noise and harmonics
- Updates in real-time with minimal latency

### Performance

- **Update Rate**: ~60 times per second for analysis data
- **Latency**: Typically 10-50ms round-trip on modern iOS devices
- **CPU Usage**: Optimized for minimal battery impact
- **Memory**: Lightweight with automatic buffer management

## Troubleshooting

### Module Not Found

If you see "expo-audio-engine module not found":

1. Ensure the module is properly linked in package.json
2. Rebuild the app with `npx expo run:ios`
3. Cannot use Expo Go - development build required

### Microphone Permission Denied

Add the required permission to `app.json`:

```json
"ios": {
  "infoPlist": {
    "NSMicrophoneUsageDescription": "This app needs microphone access."
  }
}
```

### Audio Engine Fails to Start

- Check that no other app is using the microphone
- Ensure device is not in silent mode (may affect some devices)
- Try restarting the app
- Check that Bluetooth devices are properly connected

### Inaccurate Pitch Detection

- Ensure a strong, clear signal (high RMS value)
- Avoid background noise
- Pitch detection works best with sustained tones
- Range is limited to 60-1000 Hz

## Platform Support

Currently supports:
- ✅ iOS 13.0+
- ❌ Android (not yet implemented)
- ❌ Web (not supported)

## License

MIT License

## Contributing

To contribute to this module:

1. Make changes to `ios/AudioEngineModule.swift` for native code
2. Update TypeScript definitions in `src/index.d.ts`
3. Update JavaScript exports in `src/index.ts`
4. Test thoroughly on real iOS devices
5. Submit a pull request

## See Also

- [AVAudioEngine Documentation](https://developer.apple.com/documentation/avfaudio/avaudioengine)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [React Native Audio](https://reactnative.dev/docs/audio)
