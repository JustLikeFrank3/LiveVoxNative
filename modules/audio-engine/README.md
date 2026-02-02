# expo-audio-engine

A custom Expo module that provides low-latency audio input/output and real-time audio analysis using Apple's AVAudioEngine framework.

## Features

- **Low-latency audio monitoring**: Start/stop audio input monitoring with minimal delay
- **Real-time audio analysis**: RMS level metering, waveform capture, and pitch detection
- **Device management**: Enumerate and switch between available audio inputs and outputs
- **Latency measurement**: Get theoretical latency values and measure actual round-trip latency
- **Background audio control**: Configure audio ducking behavior
- **Event-driven API**: Subscribe to audio analysis and state change events

## Platform Support

- **iOS**: ✅ Full support (iOS 13.0+)
- **Android**: ❌ Not currently supported
- **Web**: ❌ Not supported

## Installation

This module is included as a local dependency in the LiveVoxNative project. If you want to use it in another project:

```bash
# From your project root
npm install file:./path/to/expo-audio-engine
```

## Usage

### Basic Setup

```typescript
import {
  start,
  stop,
  isRunning,
  addAudioAnalysisListener,
  addAudioStateListener,
} from 'expo-audio-engine'

// Start the audio engine
await start()

// Listen for audio analysis events
const analysisSub = addAudioAnalysisListener((payload) => {
  console.log('RMS:', payload.rms)
  console.log('Pitch:', payload.pitch)
  console.log('Waveform:', payload.waveform)
})

// Listen for state changes
const stateSub = addAudioStateListener((payload) => {
  console.log('Running:', payload.running)
})

// Stop the audio engine
await stop()

// Clean up
analysisSub.remove()
stateSub.remove()
```

### Device Management

```typescript
import {
  getAvailableInputs,
  getCurrentInput,
  setInput,
  getAvailableOutputs,
  getCurrentOutput,
  setOutput,
} from 'expo-audio-engine'

// Get all available audio inputs
const inputs = getAvailableInputs()
console.log('Available inputs:', inputs)

// Get current input
const currentInput = getCurrentInput()
console.log('Current input:', currentInput)

// Switch to a different input
if (inputs.length > 0) {
  setInput(inputs[0].uid)
}

// Get all available audio outputs
const outputs = getAvailableOutputs()
console.log('Available outputs:', outputs)

// Get current output
const currentOutput = getCurrentOutput()
console.log('Current output:', currentOutput)

// Switch to a different output (e.g., "Speaker")
setOutput('Speaker')
```

### Latency Measurement

```typescript
import {
  getLatency,
  measureRoundTripLatency,
} from 'expo-audio-engine'

// Get theoretical latency values
const latency = getLatency()
console.log('Total latency:', latency.total, 'ms')
console.log('Input latency:', latency.input, 'ms')
console.log('Output latency:', latency.output, 'ms')
console.log('Buffer latency:', latency.buffer, 'ms')
console.log('Sample rate:', latency.sampleRate, 'Hz')

// Measure actual round-trip latency
// Note: Engine must be running
const result = await measureRoundTripLatency()
if (result.success) {
  console.log('Measured latency:', result.measured, 'ms')
  console.log('Theoretical latency:', result.theoretical, 'ms')
  console.log('Difference:', result.difference, 'ms')
} else {
  console.error('Latency test failed:', result.error)
}
```

### Background Audio Control

```typescript
import {
  setBackgroundAudioDucking,
  getSystemVolume,
} from 'expo-audio-engine'

// Enable ducking (reduces other apps' volume by ~50%)
setBackgroundAudioDucking(true)

// Disable ducking (other apps play at full volume)
setBackgroundAudioDucking(false)

// Get current system volume (0.0 to 1.0)
const volume = getSystemVolume()
console.log('System volume:', volume)
```

## API Reference

### Functions

#### `start(): Promise<void>`

Starts the audio engine. This initializes the AVAudioEngine and begins processing audio input.

**Returns**: Promise that resolves when the engine has started.

**Throws**: Error if the engine fails to start (e.g., microphone permissions denied).

---

#### `stop(): Promise<void>`

Stops the audio engine and releases audio resources.

**Returns**: Promise that resolves when the engine has stopped.

---

#### `isRunning(): boolean`

Checks if the audio engine is currently running.

**Returns**: `true` if the engine is running, `false` otherwise.

---

#### `getLatency(): LatencyInfo`

Gets the current latency information from the audio engine. This includes theoretical values calculated by the system.

**Returns**: Object containing latency values in milliseconds and sample rate.

---

#### `measureRoundTripLatency(): Promise<RoundTripLatencyResult>`

Measures the actual round-trip latency by playing a click sound and detecting when it returns through the microphone.

**Returns**: Promise that resolves with measurement results.

**Note**: The audio engine must be running before calling this function.

---

#### `getAvailableInputs(): AudioInput[]`

Gets a list of all available audio input devices.

**Returns**: Array of `AudioInput` objects.

---

#### `getCurrentInput(): AudioInput | null`

Gets the currently active audio input device.

**Returns**: `AudioInput` object or `null` if no input is selected.

---

#### `setInput(inputUID: string): void`

Switches to a different audio input device.

**Parameters**:
- `inputUID`: The unique identifier of the input device (from `AudioInput.uid`)

**Throws**: Error if the input device cannot be set.

---

#### `getAvailableOutputs(): AudioOutput[]`

Gets a list of all available audio output devices.

**Returns**: Array of `AudioOutput` objects.

---

#### `getCurrentOutput(): AudioOutput | null`

Gets the currently active audio output device.

**Returns**: `AudioOutput` object or `null` if no output is selected.

---

#### `setOutput(portType: string): void`

Switches to a different audio output device.

**Parameters**:
- `portType`: The port type of the output device (from `AudioOutput.portType`)

**Throws**: Error if the output device cannot be set.

---

#### `getSystemVolume(): number`

Gets the current system volume level.

**Returns**: Volume level from 0.0 (silent) to 1.0 (maximum).

---

#### `setBackgroundAudioDucking(enabled: boolean): void`

Controls whether background audio from other apps should be ducked (reduced in volume) when this app is running.

**Parameters**:
- `enabled`: `true` to enable ducking (karaoke mode), `false` to mix at full volume

---

#### `setGain(value: number): Promise<void>`

Sets the input gain level.

**Parameters**:
- `value`: Gain value (typically 0.0 to 1.0)

**Returns**: Promise that resolves when the gain has been set.

---

#### `setBoost(value: number): Promise<void>`

Sets the input boost level for additional amplification.

**Parameters**:
- `value`: Boost value

**Returns**: Promise that resolves when the boost has been set.

---

### Event Listeners

#### `addAudioAnalysisListener(listener: (payload: AudioAnalysisPayload) => void): Subscription`

Subscribes to real-time audio analysis events.

**Parameters**:
- `listener`: Callback function that receives audio analysis data

**Returns**: Subscription object with a `remove()` method to unsubscribe.

**AudioAnalysisPayload**:
```typescript
{
  rms: number         // Root mean square amplitude (0.0 to 1.0)
  pitch: number       // Detected pitch in Hz (0 if no pitch detected)
  waveform: number[]  // Array of waveform samples (-1.0 to 1.0)
  latency?: LatencyInfo  // Optional latency information
}
```

---

#### `addAudioStateListener(listener: (payload: AudioStatePayload) => void): Subscription`

Subscribes to audio engine state change events.

**Parameters**:
- `listener`: Callback function that receives state change data

**Returns**: Subscription object with a `remove()` method to unsubscribe.

**AudioStatePayload**:
```typescript
{
  running: boolean  // true if engine is running, false if stopped
}
```

---

#### `addAudioLevelListener(listener: (payload: AudioLevelPayload) => void): Subscription`

Subscribes to audio level events (RMS only).

**Parameters**:
- `listener`: Callback function that receives audio level data

**Returns**: Subscription object with a `remove()` method to unsubscribe.

**AudioLevelPayload**:
```typescript
{
  rms: number  // Root mean square amplitude (0.0 to 1.0)
}
```

---

### Types

#### `AudioInput`

Represents an audio input device.

```typescript
type AudioInput = {
  uid: string       // Unique identifier for the input
  portName: string  // Human-readable name (e.g., "iPhone Microphone")
  portType: string  // Port type identifier
}
```

#### `AudioOutput`

Represents an audio output device.

```typescript
type AudioOutput = {
  uid: string       // Unique identifier for the output
  portName: string  // Human-readable name (e.g., "Speaker", "Headphones")
  portType: string  // Port type identifier (e.g., "Speaker", "BluetoothA2DPOutput")
}
```

#### `LatencyInfo`

Contains latency information in milliseconds.

```typescript
type LatencyInfo = {
  total: number       // Total round-trip latency
  input: number       // Input (ADC) latency
  output: number      // Output (DAC) latency
  buffer: number      // Buffer processing latency
  sampleRate: number  // Current sample rate in Hz
}
```

#### `RoundTripLatencyResult`

Result of a round-trip latency measurement.

```typescript
type RoundTripLatencyResult = {
  measured: number     // Measured latency in milliseconds
  theoretical: number  // Theoretical latency in milliseconds
  difference: number   // Difference between measured and theoretical
  success: boolean     // Whether the measurement succeeded
  error?: string       // Error message if success is false
}
```

## Implementation Details

### Audio Processing

- **Engine**: AVAudioEngine (iOS Core Audio)
- **Sample Rate**: Device-dependent, typically 48 kHz
- **Buffer Size**: Optimized for low latency
- **Analysis Rate**: Real-time updates at audio buffer intervals

### Pitch Detection

The module uses FFT-based pitch detection to identify the fundamental frequency of incoming audio. The algorithm:
1. Applies a Hamming window to the input buffer
2. Performs FFT using vDSP (Accelerate framework)
3. Finds the peak frequency in the spectrum
4. Returns the frequency in Hz (0 if no clear pitch is detected)

### Waveform Capture

Waveform data is captured directly from the audio buffer and downsampled for efficient transmission to JavaScript. The waveform array contains normalized samples in the range -1.0 to 1.0.

### Latency Measurement

The `measureRoundTripLatency()` function:
1. Generates a short click sound (1ms pulse)
2. Plays it through the current output device
3. Monitors the input signal for the click's return
4. Measures the time delay between output and detection
5. Compares with the theoretical latency reported by the system

## Permissions

### iOS

The app must request microphone permission. Add this to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Your app needs microphone access for audio monitoring."
      }
    }
  }
}
```

## Troubleshooting

### Audio Engine Won't Start

**Problem**: `start()` fails with an error.

**Solutions**:
- Check that microphone permissions are granted
- Ensure no other app has exclusive access to the audio hardware
- Try restarting the app
- Check device audio settings

### No Audio Analysis Events

**Problem**: `addAudioAnalysisListener` callback is never called.

**Solutions**:
- Ensure the audio engine is running (`isRunning()` returns `true`)
- Check that the microphone is not muted
- Verify that an audio input device is selected
- Try increasing the input gain

### Pitch Detection Not Working

**Problem**: Pitch is always 0.

**Solutions**:
- Ensure the input signal is strong enough (check RMS value)
- Sing or play a clear, sustained note
- Avoid background noise
- The pitch detector works best with signals between 60 Hz and 1000 Hz

### Round-Trip Latency Test Fails

**Problem**: `measureRoundTripLatency()` returns `success: false`.

**Solutions**:
- Ensure both input and output are using the device's internal hardware (not Bluetooth)
- Increase the system volume
- Make sure the microphone can hear the speaker (don't cover them)
- Reduce background noise
- Try multiple times - some measurements may fail due to noise

## License

MIT

## Contributing

This module is part of the LiveVoxNative project. Contributions are welcome through pull requests.
