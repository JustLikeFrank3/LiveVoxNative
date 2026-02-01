import { EventEmitter, requireNativeModule, Subscription } from 'expo-modules-core'

type AudioLevelPayload = {
  rms: number
}

type AudioStatePayload = {
  running: boolean
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

const AudioEngineModule = requireNativeModule('AudioEngine')
const audioEngineEmitter = new EventEmitter(AudioEngineModule)

export function start() {
  return AudioEngineModule.start()
}

export function stop() {
  return AudioEngineModule.stop()
}

export function setGain(value: number) {
  return AudioEngineModule.setGain(value)
}

export function setBoost(value: number) {
  return AudioEngineModule.setBoost(value)
}

export function isRunning(): boolean {
  return AudioEngineModule.isRunning()
}

export function getLatency(): LatencyInfo {
  return AudioEngineModule.getLatency()
}

export function getAvailableInputs(): AudioInput[] {
  return AudioEngineModule.getAvailableInputs()
}

export function getCurrentInput(): AudioInput | null {
  return AudioEngineModule.getCurrentInput()
}

export function setInput(inputUID: string): void {
  return AudioEngineModule.setInput(inputUID)
}

export function getAvailableOutputs(): AudioOutput[] {
  return AudioEngineModule.getAvailableOutputs()
}

export function getCurrentOutput(): AudioOutput | null {
  return AudioEngineModule.getCurrentOutput()
}

export function setOutput(portType: string): void {
  return AudioEngineModule.setOutput(portType)
}

export function addAudioLevelListener(listener: (payload: AudioLevelPayload) => void): Subscription {
  return audioEngineEmitter.addListener<AudioLevelPayload>('onAudioLevel', listener)
}

export function addAudioStateListener(listener: (payload: AudioStatePayload) => void): Subscription {
  return audioEngineEmitter.addListener<AudioStatePayload>('onStateChange', listener)
}
