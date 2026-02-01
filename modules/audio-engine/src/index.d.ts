import type { Subscription } from 'expo-modules-core'

type AudioLevelPayload = {
  rms: number
}

type AudioStatePayload = {
  running: boolean
}

type AudioAnalysisPayload = {
  rms: number
  pitch: number
  waveform: number[]
  latency?: LatencyInfo
}

export type AudioInput = {
  uid: string
  portName: string
  portType: string
}

export type AudioOutput = {
  uid: string
  portName: string
  portType: string
}

export type LatencyInfo = {
  total: number
  input: number
  output: number
  buffer: number
  sampleRate: number
}
export interface RoundTripLatencyResult {
  measured: number
  theoretical: number
  difference: number
  success: boolean
  error?: string
}
export function start(): Promise<void>
export function stop(): Promise<void>
export function setGain(value: number): Promise<void>
export function setBoost(value: number): Promise<void>
export function isRunning(): boolean
export function getLatency(): LatencyInfo
export function getSystemVolume(): number
export function setBackgroundAudioDucking(enabled: boolean): void
export function measureRoundTripLatency(): Promise<RoundTripLatencyResult>
export function getAvailableInputs(): AudioInput[]
export function getCurrentInput(): AudioInput | null
export function setInput(inputUID: string): void
export function getAvailableOutputs(): AudioOutput[]
export function getCurrentOutput(): AudioOutput | null
export function setOutput(portType: string): void
export function addAudioLevelListener(
  listener: (payload: AudioLevelPayload) => void
): Subscription
export function addAudioAnalysisListener(
  listener: (payload: AudioAnalysisPayload) => void
): Subscription
export function addAudioStateListener(
  listener: (payload: AudioStatePayload) => void
): Subscription
