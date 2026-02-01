import ExpoModulesCore
import AVFoundation
import Accelerate
import MediaPlayer

public class AudioEngineModule: Module {
  private let engine = AVAudioEngine()
  private let boostMixer = AVAudioMixerNode()
  private var isEngineRunning = false
  private var isConfigured = false
  private var lastEmitTime: TimeInterval = 0
  private var currentLatencyMs: Double = 0
  private var inputLatencyMs: Double = 0
  private var outputLatencyMs: Double = 0
  private var bufferDurationMs: Double = 0
  private var measuredRoundTripMs: Double = 0
  private var isLatencyTestRunning = false
  private var latencyTestStartTime: TimeInterval = 0
  private var latencyTestThreshold: Float = 0.1
  private var latencyTestPeakThreshold: Float = 0.2
  private var latencyClickSignal: [Float] = []
  private var latencyInputHistory: [Float] = []
  private var latencyHistoryMax: Int = 4096
  private var latencyCorrelationThreshold: Float = 0.6

  public func definition() -> ModuleDefinition {
    Name("AudioEngine")

    Events("onAudioLevel", "onAudioAnalysis", "onStateChange", "onError")

    Function("start") { () -> Void in
      do {
        try self.startEngine()
      } catch {
        self.sendEvent("onError", ["message": error.localizedDescription])
        throw error
      }
    }

    Function("stop") { () -> Void in
      self.stopEngine()
    }

    Function("setGain") { (value: Double) -> Void in
      let clamped = max(0.0, min(value, 2.0))
      self.engine.mainMixerNode.outputVolume = Float(clamped)
    }

    Function("setBoost") { (value: Double) -> Void in
      let clamped = max(0.0, min(value, 4.0))
      self.boostMixer.outputVolume = Float(clamped)
    }

    Function("isRunning") { () -> Bool in
      return self.isEngineRunning
    }

    Function("getLatency") { () -> [String: Double] in
      return self.getLatency()
    }

    Function("getSystemVolume") { () -> Double in
      return Double(AVAudioSession.sharedInstance().outputVolume)
    }

    Function("setBackgroundAudioDucking") { (enabled: Bool) -> Void in
      try self.setBackgroundAudioDucking(enabled: enabled)
    }

    Function("getAvailableInputs") { () -> [[String: Any]] in
      return self.getAvailableInputs()
    }

    Function("getCurrentInput") { () -> [String: Any]? in
      return self.getCurrentInput()
    }

    Function("setInput") { (inputUID: String) throws -> Void in
      try self.setInput(inputUID: inputUID)
    }

    Function("getAvailableOutputs") { () -> [[String: Any]] in
      return self.getAvailableOutputs()
    }

    Function("getCurrentOutput") { () -> [String: Any]? in
      return self.getCurrentOutput()
    }

    Function("setOutput") { (portType: String) throws -> Void in
      try self.setOutput(portType: portType)
    }

    AsyncFunction("measureRoundTripLatency") { (promise: Promise) -> Void in
      self.measureRoundTripLatency(promise: promise)
    }
  }

  private func startEngine() throws {
    if isEngineRunning { return }

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(
      .playAndRecord,
      mode: .measurement,
      options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP]
    )
    try session.setPreferredSampleRate(48_000)
    try session.setPreferredIOBufferDuration(0.002)
    try session.setActive(true)

    // Capture latency information
    self.inputLatencyMs = session.inputLatency * 1000
    self.outputLatencyMs = session.outputLatency * 1000
    self.bufferDurationMs = session.ioBufferDuration * 1000
    self.currentLatencyMs = self.inputLatencyMs + self.outputLatencyMs + self.bufferDurationMs

    let input = engine.inputNode
    let inputFormat = input.inputFormat(forBus: 0)

    if !isConfigured {
      engine.attach(boostMixer)
      engine.connect(input, to: boostMixer, format: inputFormat)
      engine.connect(boostMixer, to: engine.mainMixerNode, format: inputFormat)
      installTap(node: boostMixer, format: inputFormat)
      isConfigured = true
    } else {
      installTap(node: boostMixer, format: inputFormat)
    }

    engine.prepare()
    try engine.start()
    isEngineRunning = true
    sendEvent("onStateChange", ["running": true])
  }

  private func stopEngine() {
    if !isEngineRunning { return }

    boostMixer.removeTap(onBus: 0)
    engine.stop()
    engine.reset()

    isEngineRunning = false
    sendEvent("onStateChange", ["running": false])
  }

  private func installTap(node: AVAudioNode, format: AVAudioFormat) {
    node.removeTap(onBus: 0)
    node.installTap(onBus: 0, bufferSize: 256, format: format) { [weak self] buffer, _ in
      self?.emitRms(buffer: buffer)
    }
  }

  private func emitRms(buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData?.pointee else { return }
    let frameLength = Int(buffer.frameLength)
    if frameLength == 0 { return }

    var sum: Float = 0
    vDSP_svesq(channelData, 1, &sum, vDSP_Length(frameLength))
    let rms = sqrt(sum / Float(frameLength))

    var peak: Float = 0
    vDSP_maxmgv(channelData, 1, &peak, vDSP_Length(frameLength))

    // Check for latency test click detection
    if isLatencyTestRunning {
      if peak > latencyTestPeakThreshold || rms > latencyTestThreshold {
        let now = Date().timeIntervalSince1970
        measuredRoundTripMs = (now - latencyTestStartTime) * 1000
        isLatencyTestRunning = false
        print("[AudioEngine] Latency test: Click detected! Peak: \(peak), RMS: \(rms), Latency: \(measuredRoundTripMs)ms")
      } else if !latencyClickSignal.isEmpty {
        // Append to history for correlation-based detection
        for i in 0..<frameLength {
          latencyInputHistory.append(channelData[i])
        }
        if latencyInputHistory.count > latencyHistoryMax {
          latencyInputHistory.removeFirst(latencyInputHistory.count - latencyHistoryMax)
        }

        let clickLen = latencyClickSignal.count
        if latencyInputHistory.count >= clickLen {
          let startIndex = latencyInputHistory.count - clickLen
          let window = Array(latencyInputHistory[startIndex..<latencyInputHistory.count])

          var dot: Float = 0
          vDSP_dotpr(window, 1, latencyClickSignal, 1, &dot, vDSP_Length(clickLen))

          var winEnergy: Float = 0
          vDSP_svesq(window, 1, &winEnergy, vDSP_Length(clickLen))

          var sigEnergy: Float = 0
          vDSP_svesq(latencyClickSignal, 1, &sigEnergy, vDSP_Length(clickLen))

          let denom = sqrt(winEnergy * sigEnergy) + 1e-9
          let corr = dot / denom

          if corr > latencyCorrelationThreshold {
            let now = Date().timeIntervalSince1970
            measuredRoundTripMs = (now - latencyTestStartTime) * 1000
            isLatencyTestRunning = false
            print("[AudioEngine] Latency test: Correlation detected! Corr: \(corr), Latency: \(measuredRoundTripMs)ms")
          }
        }
      }
    }

    let now = Date().timeIntervalSince1970
    if now - lastEmitTime < (1.0 / 60.0) { return }
    lastEmitTime = now

    sendEvent("onAudioLevel", ["rms": Double(rms)])
    let pitch = estimatePitch(channelData: channelData, frameLength: frameLength, sampleRate: buffer.format.sampleRate)
    let waveform = downsampleWaveform(channelData: channelData, frameLength: frameLength, targetCount: 64)
    sendEvent("onAudioAnalysis", [
      "rms": Double(rms),
      "pitch": Double(pitch),
      "waveform": waveform
    ])
  }

  private func downsampleWaveform(channelData: UnsafePointer<Float>, frameLength: Int, targetCount: Int) -> [Double] {
    if frameLength == 0 || targetCount == 0 { return [] }
    var samples: [Double] = []
    samples.reserveCapacity(targetCount)
    let strideValue = max(1, frameLength / targetCount)
    var index = 0
    while index < frameLength && samples.count < targetCount {
      let value = max(-1.0, min(1.0, Double(channelData[index])))
      samples.append(value)
      index += strideValue
    }
    return samples
  }

  private func estimatePitch(channelData: UnsafePointer<Float>, frameLength: Int, sampleRate: Double) -> Double {
    if frameLength < 2 { return -1 }

    var sum: Float = 0
    vDSP_svesq(channelData, 1, &sum, vDSP_Length(frameLength))
    let rms = sqrt(sum / Float(frameLength))
    if rms < 0.01 { return -1 }

    let maxSamples = frameLength / 2
    if maxSamples <= 1 { return -1 }

    var bestOffset = -1
    var bestCorrelation: Float = 0
    var lastCorrelation: Float = 1
    var foundGoodCorrelation = false

    for offset in 1..<maxSamples {
      var correlation: Float = 0
      var i = 0
      while i < maxSamples {
        correlation += abs(channelData[i] - channelData[i + offset])
        i += 1
      }
      correlation = 1 - (correlation / Float(maxSamples))

      if correlation > 0.9 && correlation > lastCorrelation {
        foundGoodCorrelation = true
        if correlation > bestCorrelation {
          bestCorrelation = correlation
          bestOffset = offset
        }
      }
      lastCorrelation = correlation
    }

    if foundGoodCorrelation && bestOffset > 0 {
      return sampleRate / Double(bestOffset)
    }

    return -1
  }

  private func getAvailableInputs() -> [[String: Any]] {
    let session = AVAudioSession.sharedInstance()
    guard let inputs = session.availableInputs else { return [] }
    
    return inputs.map { input in
      return [
        "uid": input.uid,
        "portName": input.portName,
        "portType": input.portType.rawValue
      ]
    }
  }

  private func getCurrentInput() -> [String: Any]? {
    let session = AVAudioSession.sharedInstance()
    guard let currentInput = session.currentRoute.inputs.first else { return nil }
    
    return [
      "uid": currentInput.uid,
      "portName": currentInput.portName,
      "portType": currentInput.portType.rawValue
    ]
  }

  private func setInput(inputUID: String) throws {
    let session = AVAudioSession.sharedInstance()
    guard let inputs = session.availableInputs else {
      throw NSError(domain: "AudioEngine", code: -1, userInfo: [NSLocalizedDescriptionKey: "No audio inputs available"])
    }
    
    guard let input = inputs.first(where: { $0.uid == inputUID }) else {
      throw NSError(domain: "AudioEngine", code: -1, userInfo: [NSLocalizedDescriptionKey: "Input not found"])
    }
    
    try session.setPreferredInput(input)
  }

  private func getAvailableOutputs() -> [[String: Any]] {
    let session = AVAudioSession.sharedInstance()
    let currentOutputs = session.currentRoute.outputs
    
    // Build a list of available output options
    var outputs: [[String: Any]] = []
    
    // Built-in speaker
    outputs.append([
      "portType": AVAudioSession.Port.builtInSpeaker.rawValue,
      "portName": "Speaker",
      "uid": "speaker"
    ])
    
    // Built-in receiver (earpiece)
    outputs.append([
      "portType": AVAudioSession.Port.builtInReceiver.rawValue,
      "portName": "Receiver",
      "uid": "receiver"
    ])
    
    // Add currently connected outputs (headphones, Bluetooth, etc.)
    for output in currentOutputs {
      let portType = output.portType.rawValue
      // Skip if already added
      if portType != AVAudioSession.Port.builtInSpeaker.rawValue && 
         portType != AVAudioSession.Port.builtInReceiver.rawValue {
        outputs.append([
          "portType": portType,
          "portName": output.portName,
          "uid": output.uid
        ])
      }
    }
    
    return outputs
  }

  private func getCurrentOutput() -> [String: Any]? {
    let session = AVAudioSession.sharedInstance()
    guard let currentOutput = session.currentRoute.outputs.first else { return nil }
    return [
      "uid": currentOutput.uid,
      "portName": currentOutput.portName,
      "portType": currentOutput.portType.rawValue
    ]
  }

  private func setOutput(portType: String) throws {
    let session = AVAudioSession.sharedInstance()
    
    // Handle built-in speaker override
    if portType == AVAudioSession.Port.builtInSpeaker.rawValue {
      try session.overrideOutputAudioPort(.speaker)
    } else if portType == AVAudioSession.Port.builtInReceiver.rawValue {
      try session.overrideOutputAudioPort(.none)
    } else {
      // For external outputs (headphones, Bluetooth), just clear override
      // The system will automatically route to them if connected
      try session.overrideOutputAudioPort(.none)
    }
  }

  private func getLatency() -> [String: Double] {
    let session = AVAudioSession.sharedInstance()
    return [
      "total": self.currentLatencyMs,
      "input": self.inputLatencyMs,
      "output": self.outputLatencyMs,
      "buffer": self.bufferDurationMs,
      "sampleRate": session.sampleRate
    ]
  }

  private func setBackgroundAudioDucking(enabled: Bool) throws {
    let session = AVAudioSession.sharedInstance()
    if enabled {
      // Duck other audio (reduce volume by ~50%)
      try session.setCategory(
        .playAndRecord,
        mode: .measurement,
        options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .duckOthers]
      )
    } else {
      // Don't duck other audio
      try session.setCategory(
        .playAndRecord,
        mode: .measurement,
        options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers]
      )
    }
    if isEngineRunning {
      try session.setActive(true)
    }
  }

  private func measureRoundTripLatency(promise: Promise) {
    guard isEngineRunning else {
      promise.reject("ENGINE_NOT_RUNNING", "Audio engine must be running to measure latency")
      return
    }

    // Reset measurement state
    measuredRoundTripMs = 0
    isLatencyTestRunning = true
    latencyTestStartTime = Date().timeIntervalSince1970

    // Force speaker output for the test
    let session = AVAudioSession.sharedInstance()
    try? session.overrideOutputAudioPort(.speaker)

    // Generate a sharp click (impulse)
    let sampleRate = engine.mainMixerNode.outputFormat(forBus: 0).sampleRate
    let clickDuration: AVAudioFrameCount = 512
    let clickBuffer = AVAudioPCMBuffer(pcmFormat: engine.mainMixerNode.outputFormat(forBus: 0), frameCapacity: clickDuration)!
    clickBuffer.frameLength = clickDuration

    guard let channelData = clickBuffer.floatChannelData?[0] else {
      promise.reject("BUFFER_ERROR", "Failed to create click buffer")
      return
    }

    // Generate a pseudo-random click pattern for correlation detection
    latencyClickSignal = []
    latencyClickSignal.reserveCapacity(Int(clickDuration))
    var seed: UInt32 = 0x12345678
    for _ in 0..<Int(clickDuration) {
      seed = seed &* 1103515245 &+ 12345
      let bit = (seed >> 31) & 1
      let sample: Float = bit == 0 ? -1.0 : 1.0
      latencyClickSignal.append(sample)
    }
    latencyInputHistory.removeAll(keepingCapacity: true)
    latencyHistoryMax = max(4096, latencyClickSignal.count * 4)

    for i in 0..<Int(clickDuration) {
      channelData[i] = latencyClickSignal[i] * 0.9
    }

    print("[AudioEngine] Latency test: Starting measurement, threshold: \(latencyTestThreshold), peak: \(latencyTestPeakThreshold), corr: \(latencyCorrelationThreshold)")
    
    // Play the click
    let playerNode = AVAudioPlayerNode()
    engine.attach(playerNode)
    engine.connect(playerNode, to: engine.mainMixerNode, format: clickBuffer.format)
    playerNode.volume = 1.0
    
    playerNode.scheduleBuffer(clickBuffer, at: nil, options: [], completionHandler: nil)
    playerNode.play()

    // Wait for detection with timeout
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
      guard let self = self else { return }
      
      playerNode.stop()
      self.engine.detach(playerNode)
      try? session.overrideOutputAudioPort(.none)
      
      if self.measuredRoundTripMs > 0 {
        let theoretical = self.currentLatencyMs
        print("[AudioEngine] Latency test: Success! Measured: \(self.measuredRoundTripMs)ms, Theoretical: \(theoretical)ms")
        promise.resolve([
          "measured": self.measuredRoundTripMs,
          "theoretical": theoretical,
          "difference": self.measuredRoundTripMs - theoretical,
          "success": true
        ])
      } else {
        self.isLatencyTestRunning = false
        print("[AudioEngine] Latency test: Failed - no click detected (threshold: \(self.latencyTestThreshold))")
        promise.resolve([
          "measured": 0,
          "theoretical": self.currentLatencyMs,
          "difference": 0,
          "success": false,
          "error": "No click detected. Try on a real device - simulators often can't do loopback audio."
        ])
      }
    }
  }
}
