# expo-audio-engine Examples

This document provides practical examples for common use cases of the expo-audio-engine module.

## Basic Examples

### Example 1: Simple Audio Monitoring

Start monitoring audio and display the RMS level:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { start, stop, addAudioAnalysisListener } from 'expo-audio-engine'

export default function SimpleMonitor() {
  const [isRunning, setIsRunning] = useState(false)
  const [rmsLevel, setRmsLevel] = useState(0)

  useEffect(() => {
    const subscription = addAudioAnalysisListener((payload) => {
      setRmsLevel(payload.rms)
    })

    return () => subscription.remove()
  }, [])

  const toggleMonitoring = async () => {
    if (isRunning) {
      await stop()
      setIsRunning(false)
    } else {
      await start()
      setIsRunning(true)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>RMS Level: {rmsLevel.toFixed(4)}</Text>
      <Button
        title={isRunning ? 'Stop' : 'Start'}
        onPress={toggleMonitoring}
      />
    </View>
  )
}
```

### Example 2: Pitch Detector

Create a simple pitch detector that shows the detected note:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { start, addAudioAnalysisListener } from 'expo-audio-engine'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToNote(frequency: number) {
  if (!frequency || frequency < 60 || frequency > 1000) {
    return null
  }
  
  const midi = Math.round(12 * Math.log2(frequency / 440) + 69)
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  
  return `${noteName}${octave}`
}

export default function PitchDetector() {
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    start()
    
    const subscription = addAudioAnalysisListener((payload) => {
      setNote(frequencyToNote(payload.pitch))
    })

    return () => {
      subscription.remove()
      stop()
    }
  }, [])

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 48 }}>
        {note || 'No pitch detected'}
      </Text>
    </View>
  )
}
```

### Example 3: Audio Device Selector

Let users choose from available audio inputs:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import {
  getAvailableInputs,
  getCurrentInput,
  setInput,
  type AudioInput,
} from 'expo-audio-engine'

export default function DeviceSelector() {
  const [inputs, setInputs] = useState<AudioInput[]>([])
  const [currentInput, setCurrentInput] = useState<AudioInput | null>(null)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = () => {
    setInputs(getAvailableInputs())
    setCurrentInput(getCurrentInput())
  }

  const selectInput = async (input: AudioInput) => {
    try {
      await setInput(input.uid)
      setCurrentInput(input)
    } catch (error) {
      console.error('Failed to set input:', error)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Select Audio Input:
      </Text>
      <FlatList
        data={inputs}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => selectInput(item)}
            style={{
              padding: 15,
              backgroundColor: currentInput?.uid === item.uid ? '#007AFF' : '#f0f0f0',
              marginBottom: 5,
              borderRadius: 8,
            }}
          >
            <Text style={{ 
              color: currentInput?.uid === item.uid ? 'white' : 'black' 
            }}>
              {item.portName}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
```

### Example 4: VU Meter

Create a visual VU meter using the RMS values:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { start, addAudioAnalysisListener } from 'expo-audio-engine'

export default function VUMeter() {
  const [rms, setRms] = useState(0)

  useEffect(() => {
    start()
    
    const subscription = addAudioAnalysisListener((payload) => {
      setRms(payload.rms)
    })

    return () => {
      subscription.remove()
      stop()
    }
  }, [])

  const getColor = (level: number) => {
    if (level > 0.8) return '#ff0000' // Red - clipping
    if (level > 0.6) return '#ffaa00' // Orange - hot
    if (level > 0.3) return '#00ff00' // Green - good
    return '#666666' // Gray - low
  }

  const bars = Array.from({ length: 20 }, (_, i) => {
    const threshold = i / 20
    const isActive = rms > threshold
    return (
      <View
        key={i}
        style={{
          width: 10,
          height: 200,
          backgroundColor: isActive ? getColor(rms) : '#333333',
          marginHorizontal: 2,
        }}
      />
    )
  })

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        RMS: {(rms * 100).toFixed(1)}%
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {bars}
      </View>
    </View>
  )
}
```

## Advanced Examples

### Example 5: Latency Monitor

Monitor and display latency information:

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, Button } from 'react-native'
import {
  start,
  getLatency,
  measureRoundTripLatency,
  type LatencyInfo,
  type RoundTripLatencyResult,
} from 'expo-audio-engine'

export default function LatencyMonitor() {
  const [latency, setLatency] = useState<LatencyInfo | null>(null)
  const [roundTripResult, setRoundTripResult] = useState<RoundTripLatencyResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const init = async () => {
      await start()
      setLatency(getLatency())
    }
    init()
  }, [])

  const testLatency = async () => {
    setIsTesting(true)
    try {
      const result = await measureRoundTripLatency()
      setRoundTripResult(result)
    } catch (error) {
      console.error('Latency test failed:', error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Latency Info</Text>
      
      {latency && (
        <View style={{ marginBottom: 20 }}>
          <Text>Total: {latency.total.toFixed(1)} ms</Text>
          <Text>Input: {latency.input.toFixed(1)} ms</Text>
          <Text>Output: {latency.output.toFixed(1)} ms</Text>
          <Text>Buffer: {latency.buffer.toFixed(1)} ms</Text>
          <Text>Sample Rate: {(latency.sampleRate / 1000).toFixed(1)} kHz</Text>
        </View>
      )}

      <Button
        title={isTesting ? 'Testing...' : 'Measure Round-Trip'}
        onPress={testLatency}
        disabled={isTesting}
      />

      {roundTripResult && (
        <View style={{ marginTop: 20 }}>
          {roundTripResult.success ? (
            <>
              <Text>Measured: {roundTripResult.measured.toFixed(1)} ms</Text>
              <Text>Theoretical: {roundTripResult.theoretical.toFixed(1)} ms</Text>
              <Text>Difference: {roundTripResult.difference.toFixed(1)} ms</Text>
            </>
          ) : (
            <Text style={{ color: 'red' }}>
              {roundTripResult.error || 'Test failed'}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
```

### Example 6: Waveform Display

Display the audio waveform:

```typescript
import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'
import { start, addAudioAnalysisListener } from 'expo-audio-engine'

export default function WaveformDisplay() {
  const [waveform, setWaveform] = useState<number[]>([])

  useEffect(() => {
    start()
    
    const subscription = addAudioAnalysisListener((payload) => {
      setWaveform(payload.waveform)
    })

    return () => {
      subscription.remove()
      stop()
    }
  }, [])

  const width = 300
  const height = 100
  const padding = 10

  const points = waveform.length > 0
    ? waveform
        .map((value, index) => {
          const x = padding + (index / (waveform.length - 1)) * (width - padding * 2)
          const y = height / 2 - value * (height / 2 - padding)
          return `${x},${y}`
        })
        .join(' ')
    : ''

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke="#00ff00"
          strokeWidth="2"
        />
      </Svg>
    </View>
  )
}
```

### Example 7: Background Audio Control

Manage background audio behavior:

```typescript
import React, { useState } from 'react'
import { View, Text, Switch } from 'react-native'
import { setBackgroundAudioDucking } from 'expo-audio-engine'

export default function BackgroundAudioControl() {
  const [isDucking, setIsDucking] = useState(true)

  const toggleDucking = (value: boolean) => {
    setBackgroundAudioDucking(value)
    setIsDucking(value)
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Background Audio Mode
      </Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1 }}>
          {isDucking ? 'Duck Other Apps (Karaoke)' : 'Mix With Other Apps'}
        </Text>
        <Switch
          value={isDucking}
          onValueChange={toggleDucking}
        />
      </View>
      
      <Text style={{ marginTop: 10, color: '#666' }}>
        {isDucking
          ? 'Other apps will play at reduced volume (~50%)'
          : 'Other apps will play at full volume'}
      </Text>
    </View>
  )
}
```

## Integration Patterns

### Pattern 1: Centralized Audio Manager

Create a custom hook to manage audio state across your app:

```typescript
// hooks/useAudioEngine.ts
import { useEffect, useState, useCallback } from 'react'
import {
  start,
  stop,
  isRunning,
  addAudioAnalysisListener,
  addAudioStateListener,
  type AudioAnalysisPayload,
} from 'expo-audio-engine'

export function useAudioEngine() {
  const [running, setRunning] = useState(isRunning())
  const [analysis, setAnalysis] = useState<AudioAnalysisPayload | null>(null)

  useEffect(() => {
    const analysisSub = addAudioAnalysisListener(setAnalysis)
    const stateSub = addAudioStateListener((payload) => {
      setRunning(payload.running)
    })

    return () => {
      analysisSub.remove()
      stateSub.remove()
    }
  }, [])

  const startEngine = useCallback(async () => {
    try {
      await start()
    } catch (error) {
      console.error('Failed to start audio engine:', error)
    }
  }, [])

  const stopEngine = useCallback(async () => {
    try {
      await stop()
    } catch (error) {
      console.error('Failed to stop audio engine:', error)
    }
  }, [])

  return {
    running,
    analysis,
    start: startEngine,
    stop: stopEngine,
  }
}
```

Usage:
```typescript
import { useAudioEngine } from './hooks/useAudioEngine'

export default function MyComponent() {
  const { running, analysis, start, stop } = useAudioEngine()

  return (
    <View>
      <Text>RMS: {analysis?.rms.toFixed(4)}</Text>
      <Button title={running ? 'Stop' : 'Start'} onPress={running ? stop : start} />
    </View>
  )
}
```

### Pattern 2: Error Handling

Always handle errors when starting the audio engine:

```typescript
const startAudioWithPermissions = async () => {
  try {
    await start()
    setError(null)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        setError('Microphone permission denied. Please enable in Settings.')
      } else if (error.message.includes('hardware')) {
        setError('Audio hardware unavailable. Please check device settings.')
      } else {
        setError('Failed to start audio engine: ' + error.message)
      }
    }
  }
}
```

## Testing Examples

### Example: Unit Testing Utilities

```typescript
// utils/__tests__/audioUtils.test.ts
import { frequencyToNote, rmsToDb } from '../audioUtils'

describe('Audio Utilities', () => {
  test('converts frequency to note correctly', () => {
    expect(frequencyToNote(440)).toBe('A4')
    expect(frequencyToNote(261.63)).toBe('C4')
  })

  test('handles invalid frequencies', () => {
    expect(frequencyToNote(0)).toBeNull()
    expect(frequencyToNote(50)).toBeNull()
    expect(frequencyToNote(2000)).toBeNull()
  })

  test('converts RMS to decibels', () => {
    expect(rmsToDb(1.0)).toBe(0)
    expect(rmsToDb(0.5)).toBeCloseTo(-6.02, 1)
  })
})
```

## Performance Tips

1. **Debounce UI updates**: Audio analysis events fire frequently. Consider debouncing or throttling UI updates:
   ```typescript
   const [displayRms, setDisplayRms] = useState(0)
   
   useEffect(() => {
     let lastUpdate = 0
     const subscription = addAudioAnalysisListener((payload) => {
       const now = Date.now()
       if (now - lastUpdate > 100) { // Update max 10 times per second
         setDisplayRms(payload.rms)
         lastUpdate = now
       }
     })
     return () => subscription.remove()
   }, [])
   ```

2. **Clean up subscriptions**: Always remove listeners when components unmount

3. **Stop when not needed**: Stop the audio engine when not in use to save battery

4. **Optimize rendering**: Use `React.memo()` for components that display audio data

## See Also

- [API Reference](README.md#api-reference)
- [Main App Example](../../App.tsx)
- [Troubleshooting](README.md#troubleshooting)
