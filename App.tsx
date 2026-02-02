import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Pressable, StyleSheet, Text, View, ScrollView, Animated, Platform, PermissionsAndroid } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'
import {
  addAudioAnalysisListener,
  addAudioStateListener,
  isRunning,
  start,
  stop,
  getAvailableInputs,
  getCurrentInput,
  setInput,
  getAvailableOutputs,
  getCurrentOutput,
  setOutput,
  getLatency,
  getSystemVolume,
  setBackgroundAudioDucking,
  measureRoundTripLatency,
  type AudioInput,
  type AudioOutput,
  type LatencyInfo,
  type RoundTripLatencyResult,
} from 'expo-audio-engine'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const LATENCY_SAMPLE_COUNT = 5

const formatPitch = (frequency: number) => {
  if (!Number.isFinite(frequency) || frequency <= 0) return null
  if (frequency < 60 || frequency > 1000) return null

  const midi = Math.round(12 * Math.log2(frequency / 440) + 69)
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  const noteFrequency = 440 * Math.pow(2, (midi - 69) / 12)
  const cents = Math.round(1200 * Math.log2(frequency / noteFrequency))

  return {
    noteName,
    octave,
    cents,
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [running, setRunning] = useState(isRunning())
  const [rms, setRms] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [availableInputs, setAvailableInputs] = useState<AudioInput[]>([])
  const [currentInput, setCurrentInput] = useState<AudioInput | null>(null)
  const [availableOutputs, setAvailableOutputs] = useState<AudioOutput[]>([])
  const [currentOutput, setCurrentOutput] = useState<AudioOutput | null>(null)
  const [latency, setLatency] = useState<LatencyInfo | null>(null)
  const [isDuckingEnabled, setIsDuckingEnabled] = useState(true)
  const [roundTripLatency, setRoundTripLatency] = useState<RoundTripLatencyResult | null>(null)
  const [isTestingLatency, setIsTestingLatency] = useState(false)
  const [latencySamples, setLatencySamples] = useState<number[]>([])

  useEffect(() => {
    // Boot sequence
    const bootTimer = setTimeout(() => {
      setIsReady(true)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    }, 1500)

    return () => clearTimeout(bootTimer)
  }, [])

  useEffect(() => {
    if (!isReady) return

    // Load available inputs
    try {
      const inputs = getAvailableInputs()
      setAvailableInputs(inputs)
      setCurrentInput(getCurrentInput())

      const outputs = getAvailableOutputs()
      setAvailableOutputs(outputs)
      setCurrentOutput(getCurrentOutput())
    } catch (error) {
      console.error('Error loading audio inputs/outputs:', error)
    }

    const analysisSub = addAudioAnalysisListener(payload => {
      setRms(payload.rms)
      setPitch(payload.pitch)
      setWaveform(payload.waveform)
    })

    const stateSub = addAudioStateListener(payload => {
      setRunning(payload.running)
      if (payload.running) {
        // Get latency when engine starts
        try {
          setLatency(getLatency())
        } catch (error) {
          console.error('Error getting latency:', error)
        }
      }
    })

    return () => {
      analysisSub.remove()
      stateSub.remove()
    }
  }, [isReady])

  const toggleMonitoring = async () => {
    setErrorMessage('')
    try {
      if (running) {
        await stop()
      } else {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'LiveVox needs access to your microphone to monitor audio in real time.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          )

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setErrorMessage('Microphone permission denied.')
            return
          }
        }
        await start()
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Unable to start audio engine.')
      }
    }
  }

  const handleInputChange = async (input: AudioInput) => {
    try {
      await setInput(input.uid)
      setCurrentInput(input)
      setErrorMessage('')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    }
  }

  const handleOutputChange = async (output: AudioOutput) => {
    try {
      await setOutput(output.portType)
      setCurrentOutput(output)
      setErrorMessage('')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    }
  }

  const toggleDucking = async () => {
    try {
      const newValue = !isDuckingEnabled
      await setBackgroundAudioDucking(newValue)
      setIsDuckingEnabled(newValue)
      setErrorMessage('')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    }
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const median = (values: number[]) => {
    if (!values.length) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  const handleMeasureLatency = async () => {
    if (!running) {
      setErrorMessage('Start the audio engine first')
      return
    }
    setIsTestingLatency(true)
    setErrorMessage('')
    try {
      const results: RoundTripLatencyResult[] = []
      for (let i = 0; i < LATENCY_SAMPLE_COUNT; i += 1) {
        const result = await measureRoundTripLatency()
        results.push(result)
        await sleep(250)
      }

      const successful = results.filter(item => item.success)
      const measuredValues = successful.map(item => item.measured)
      const latest = results[results.length - 1]

      setLatencySamples(measuredValues)
      setRoundTripLatency(latest)

      if (!successful.length && latest?.error) {
        setErrorMessage(latest.error)
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      }
    } finally {
      setIsTestingLatency(false)
    }
  }

  if (!isReady) {
    return (
      <View style={styles.bootScreen}>
        <Text style={styles.bootTitle}>LiveVox</Text>
        <Text style={styles.bootSubtitle}>AUDIO ENGINE</Text>
        <View style={styles.bootLoader}>
          <Text style={styles.bootText}>Initializing audio engine...</Text>
        </View>
      </View>
    )
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.title}>LiveVox</Text>
        <Text style={styles.subtitle}>Audio engine</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Engine status</Text>
        <Text style={[styles.value, running ? styles.valueActive : styles.valueInactive]}>
          {running ? 'Running' : 'Stopped'}
        </Text>
      </View>

      {latency && (
        <View style={styles.card}>
          <Text style={styles.label}>Latency (Theoretical)</Text>
          <Text style={styles.value}>{latency.total.toFixed(1)} ms</Text>
          <Text style={styles.valueSmall}>Input: {latency.input.toFixed(1)} ms</Text>
          <Text style={styles.valueSmall}>Output: {latency.output.toFixed(1)} ms</Text>
          <Text style={styles.valueSmall}>Buffer: {latency.buffer.toFixed(1)} ms</Text>
          <Text style={styles.valueSmall}>Sample Rate: {(latency.sampleRate / 1000).toFixed(1)} kHz</Text>
        </View>
      )}

      {running && (
        <View style={styles.card}>
          <Text style={styles.label}>Round-Trip Latency Test</Text>
          <Pressable
            onPress={handleMeasureLatency}
            disabled={isTestingLatency}
            style={[styles.toggleButton, isTestingLatency && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, isTestingLatency && styles.toggleTextActive]}>
              {isTestingLatency ? 'Testing...' : 'Measure Real Latency'}
            </Text>
          </Pressable>
          {roundTripLatency && (
            <View style={styles.latencyResults}>
              {roundTripLatency.success ? (
                <>
                  <Text style={styles.valueSmall}>Measured: {roundTripLatency.measured.toFixed(1)} ms</Text>
                  <Text style={styles.valueSmall}>Theoretical: {roundTripLatency.theoretical.toFixed(1)} ms</Text>
                  <Text style={[styles.valueSmall, roundTripLatency.difference > 5 ? styles.valueInactive : styles.valueActive]}>
                    Difference: {roundTripLatency.difference > 0 ? '+' : ''}{roundTripLatency.difference.toFixed(1)} ms
                  </Text>
                  {latencySamples.length > 0 && (
                    <>
                      <Text style={styles.valueSmall}>Median (x{LATENCY_SAMPLE_COUNT}): {median(latencySamples).toFixed(1)} ms</Text>
                      <Text style={styles.valueSmall}>Range: {Math.min(...latencySamples).toFixed(1)}–{Math.max(...latencySamples).toFixed(1)} ms</Text>
                    </>
                  )}
                </>
              ) : (
                <Text style={[styles.valueSmall, styles.valueInactive]}>
                  {roundTripLatency.error || 'Test failed - click not detected'}
                </Text>
              )}
            </View>
          )}
          <Text style={styles.helpText}>
            Plays a click through speaker and measures when it returns through mic
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Background Audio</Text>
        <Pressable
          onPress={toggleDucking}
          style={[styles.toggleButton, isDuckingEnabled && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, isDuckingEnabled && styles.toggleTextActive]}>
            {isDuckingEnabled ? 'Duck Other Apps (Karaoke Mode)' : 'Mix With Other Apps'}
          </Text>
        </Pressable>
        <Text style={styles.valueSmall}>
          {isDuckingEnabled 
            ? 'Other apps\' volume reduced by ~50%' 
            : 'Other apps play at full volume'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Audio Input</Text>
        {currentInput && (
          <Text style={styles.valueSmall}>{currentInput.portName}</Text>
        )}
        {availableInputs.map((input) => (
          <Pressable
            key={input.uid}
            onPress={() => handleInputChange(input)}
            style={[
              styles.inputOption,
              currentInput?.uid === input.uid && styles.inputOptionActive,
            ]}
          >
            <Text style={[
              styles.inputOptionText,
              currentInput?.uid === input.uid && styles.inputOptionTextActive,
            ]}>
              {input.portName}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Audio Output</Text>
        {currentOutput && (
          <Text style={styles.valueSmall}>{currentOutput.portName}</Text>
        )}
        {availableOutputs.map((output) => (
          <Pressable
            key={output.uid}
            onPress={() => handleOutputChange(output)}
            style={[
              styles.inputOption,
              currentOutput?.uid === output.uid && styles.inputOptionActive,
            ]}
          >
            <Text style={[
              styles.inputOptionText,
              currentOutput?.uid === output.uid && styles.inputOptionTextActive,
            ]}>
              {output.portName}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Input level (RMS)</Text>
        <Text style={styles.value}>{rms.toFixed(4)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Waveform</Text>
        <Waveform samples={waveform} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pitch</Text>
        <PitchReadout frequency={pitch} />
      </View>

      <Pressable
        onPress={toggleMonitoring}
        style={[styles.button, running ? styles.buttonActive : styles.buttonInactive]}
      >
        <Text style={styles.buttonLabel}>{running ? 'Stop' : 'Start'}</Text>
      </Pressable>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <StatusBar style="auto" />
      </ScrollView>
    </Animated.View>
  )
}

function Waveform({ samples }: { samples: number[] }) {
  const width = 320
  const height = 90
  const padding = 6

  const points = useMemo(() => {
    if (!samples.length) return ''
    const step = (width - padding * 2) / (samples.length - 1)
    return samples
      .map((value, index) => {
        const x = padding + index * step
        const y = height / 2 - value * (height / 2 - padding)
        return `${x},${y}`
      })
      .join(' ')
  }, [samples])

  return (
    <View style={styles.waveformContainer}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline
          points={points}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
        />
      </Svg>
    </View>
  )
}

function PitchReadout({ frequency }: { frequency: number }) {
  const pitchData = useMemo(() => formatPitch(frequency), [frequency])

  if (!pitchData) {
    return <Text style={styles.valueInactive}>No pitch</Text>
  }

  return (
    <View style={styles.pitchRow}>
      <Text style={styles.pitchNote}>
        {pitchData.noteName}
        <Text style={styles.pitchOctave}>{pitchData.octave}</Text>
      </Text>
      <Text style={styles.pitchCents}>
        {pitchData.cents > 0 ? `+${pitchData.cents}` : pitchData.cents} cents
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: '#0c0d12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f4f5f8',
    letterSpacing: 2,
  },
  bootSubtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#3b82f6',
    letterSpacing: 8,
    marginTop: 4,
  },
  bootLoader: {
    marginTop: 60,
  },
  bootText: {
    color: '#9aa1b2',
    fontSize: 14,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0c0d12',
  },
  container: {
    backgroundColor: '#0c0d12',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f4f5f8',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 32,
    color: '#9aa1b2',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#171922',
    marginBottom: 16,
  },
  label: {
    color: '#9aa1b2',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#f4f5f8',
  },
  valueSmall: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#f4f5f8',
  },
  valueActive: {
    color: '#4ade80',
  },
  valueInactive: {
    color: '#f97316',
  },
  inputOption: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0b0c11',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputOptionActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  inputOptionText: {
    color: '#9aa1b2',
    fontSize: 14,
  },
  inputOptionTextActive: {
    color: '#f4f5f8',
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0b0c11',
    borderWidth: 2,
    borderColor: '#9aa1b2',
  },
  toggleButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  toggleText: {
    color: '#9aa1b2',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#f4f5f8',
  },
  latencyResults: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2d3a',
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  waveformContainer: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0c11',
    borderRadius: 12,
    paddingVertical: 8,
  },
  pitchRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  pitchNote: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f4f5f8',
  },
  pitchOctave: {
    fontSize: 18,
    color: '#9aa1b2',
  },
  pitchCents: {
    fontSize: 14,
    color: '#9aa1b2',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonActive: {
    backgroundColor: '#ef4444',
  },
  buttonInactive: {
    backgroundColor: '#2563eb',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 12,
    color: '#fca5a5',
    textAlign: 'center',
  },
})
