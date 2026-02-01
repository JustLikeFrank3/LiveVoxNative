import { EventEmitter, requireNativeModule } from 'expo-modules-core'

const AudioEngineModule = requireNativeModule('AudioEngine')
const audioEngineEmitter = new EventEmitter(AudioEngineModule)

export function start() {
  return AudioEngineModule.start()
}

export function stop() {
  return AudioEngineModule.stop()
}

export function setGain(value) {
  return AudioEngineModule.setGain(value)
}

export function setBoost(value) {
  return AudioEngineModule.setBoost(value)
}

export function isRunning() {
  return AudioEngineModule.isRunning()
}

export function getLatency() {
  return AudioEngineModule.getLatency()
}

export function getSystemVolume() {
  return AudioEngineModule.getSystemVolume()
}

export function setBackgroundAudioDucking(enabled) {
  return AudioEngineModule.setBackgroundAudioDucking(enabled)
}

export function measureRoundTripLatency() {
  return AudioEngineModule.measureRoundTripLatency()
}

export function getAvailableInputs() {
  return AudioEngineModule.getAvailableInputs()
}

export function getCurrentInput() {
  return AudioEngineModule.getCurrentInput()
}

export function setInput(inputUID) {
  return AudioEngineModule.setInput(inputUID)
}

export function getAvailableOutputs() {
  return AudioEngineModule.getAvailableOutputs()
}

export function getCurrentOutput() {
  return AudioEngineModule.getCurrentOutput()
}

export function setOutput(portType) {
  return AudioEngineModule.setOutput(portType)
}

export function addAudioLevelListener(listener) {
  return audioEngineEmitter.addListener('onAudioLevel', listener)
}

export function addAudioAnalysisListener(listener) {
  return audioEngineEmitter.addListener('onAudioAnalysis', listener)
}

export function addAudioStateListener(listener) {
  return audioEngineEmitter.addListener('onStateChange', listener)
}
