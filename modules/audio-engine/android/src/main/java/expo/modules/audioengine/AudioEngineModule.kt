package expo.modules.audioengine

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread
import kotlin.math.abs
import kotlin.math.sqrt

class AudioEngineModule : Module() {
  private val sampleRate = 48_000
  private val channelConfig = AudioFormat.CHANNEL_IN_MONO
  private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
  private val analysisSize = 256
  private var audioRecord: AudioRecord? = null
  @Volatile private var isRunning = false
  @Volatile private var gain = 1.0
  @Volatile private var boost = 1.0
  private var lastEmitMs: Long = 0
  private var bufferSizeInSamples: Int = 0

  override fun definition() = ModuleDefinition {
    Name("AudioEngine")

    Events("onAudioLevel", "onAudioAnalysis", "onStateChange", "onError")

    Function("start") {
      if (isRunning) return@Function true
      try {
        startRecording()
      } catch (e: Exception) {
        sendEvent("onError", mapOf("message" to (e.message ?: "Unknown error")))
        throw e
      }
      return@Function true
    }

    Function("stop") {
      stopRecording()
    }

    Function("setGain") { value: Double ->
      gain = value.coerceIn(0.0, 2.0)
    }

    Function("setBoost") { value: Double ->
      boost = value.coerceIn(0.0, 4.0)
    }

    Function("isRunning") {
      return@Function isRunning
    }

    Function("getLatency") {
      return@Function getLatencyEstimate()
    }

    Function("getSystemVolume") {
      val context = appContext.reactContext ?: return@Function 0.0
      val audioManager = context.getSystemService(AudioManager::class.java)
      val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC).toFloat()
      val curVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC).toFloat()
      return@Function if (maxVol == 0f) 0.0 else (curVol / maxVol).toDouble()
    }

    Function("setBackgroundAudioDucking") { _: Boolean ->
      // No-op on Android
    }

    AsyncFunction("measureRoundTripLatency") {
      return@AsyncFunction measureRoundTripLatency()
    }

    Function("getAvailableInputs") {
      return@Function listOf(
        mapOf(
          "uid" to "default-mic",
          "portName" to "Microphone",
          "portType" to "builtInMic"
        )
      )
    }

    Function("getCurrentInput") {
      return@Function mapOf(
        "uid" to "default-mic",
        "portName" to "Microphone",
        "portType" to "builtInMic"
      )
    }

    Function("setInput") { _: String ->
      // No-op for now
    }

    Function("getAvailableOutputs") {
      return@Function listOf(
        mapOf(
          "uid" to "default-speaker",
          "portName" to "Speaker",
          "portType" to "speaker"
        )
      )
    }

    Function("getCurrentOutput") {
      return@Function mapOf(
        "uid" to "default-speaker",
        "portName" to "Speaker",
        "portType" to "speaker"
      )
    }

    Function("setOutput") { _: String ->
      // No-op for now
    }
  }

  private fun startRecording() {
    val minBuffer = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
    if (minBuffer == AudioRecord.ERROR || minBuffer == AudioRecord.ERROR_BAD_VALUE) {
      throw IllegalStateException("Invalid AudioRecord buffer size")
    }

    val bufferSize = maxOf(minBuffer, analysisSize * 2)
    bufferSizeInSamples = bufferSize
    audioRecord = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      sampleRate,
      channelConfig,
      audioFormat,
      bufferSize
    )

    if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
      throw IllegalStateException("AudioRecord init failed")
    }

    audioRecord?.startRecording()
    isRunning = true
    sendEvent("onStateChange", mapOf("running" to true))

    thread(name = "AudioEngineCapture", isDaemon = true) {
      val shortBuffer = ShortArray(bufferSize)
      while (isRunning) {
        val read = audioRecord?.read(shortBuffer, 0, shortBuffer.size) ?: 0
        if (read > 0) {
          emitAnalysis(shortBuffer, read)
        }
      }
    }
  }

  private fun stopRecording() {
    if (!isRunning) return
    isRunning = false
    try {
      audioRecord?.stop()
    } catch (_: Exception) {
    } finally {
      audioRecord?.release()
      audioRecord = null
    }
    sendEvent("onStateChange", mapOf("running" to false))
  }

  private fun emitAnalysis(buffer: ShortArray, length: Int) {
    val now = System.currentTimeMillis()
    if (now - lastEmitMs < 33) return
    lastEmitMs = now

    var sumSq = 0.0
    val waveform = ArrayList<Double>(analysisSize)
    val step = maxOf(1, length / analysisSize)

    var i = 0
    while (i < length) {
      val sample = buffer[i].toDouble() / Short.MAX_VALUE
      val scaled = (sample * gain * boost).coerceIn(-1.0, 1.0)
      sumSq += scaled * scaled
      if (waveform.size < analysisSize && (i % step == 0)) {
        waveform.add(scaled)
      }
      i++
    }

    val rms = sqrt(sumSq / length.coerceAtLeast(1))

    sendEvent("onAudioLevel", mapOf("rms" to rms))
    sendEvent(
      "onAudioAnalysis",
      mapOf(
        "rms" to rms,
        "pitch" to 0.0,
        "waveform" to waveform
      )
    )
  }

  private fun measureRoundTripLatency(): Map<String, Any> {
    val channelOut = AudioFormat.CHANNEL_OUT_MONO
    val minOut = AudioTrack.getMinBufferSize(sampleRate, channelOut, audioFormat)
    val minIn = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

    if (minOut <= 0 || minIn <= 0) {
      return mapOf(
        "measured" to 0.0,
        "theoretical" to 0.0,
        "difference" to 0.0,
        "success" to false,
        "error" to "Invalid audio buffer size"
      )
    }

    val bufferSize = maxOf(minOut, minIn, 1024)
    val record = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      sampleRate,
      channelConfig,
      audioFormat,
      bufferSize * 2
    )

    val track = AudioTrack(
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build(),
      AudioFormat.Builder()
        .setEncoding(audioFormat)
        .setSampleRate(sampleRate)
        .setChannelMask(channelOut)
        .build(),
      bufferSize,
      AudioTrack.MODE_STREAM,
      AudioManager.AUDIO_SESSION_ID_GENERATE
    )

    if (record.state != AudioRecord.STATE_INITIALIZED || track.state != AudioTrack.STATE_INITIALIZED) {
      record.release()
      track.release()
      return mapOf(
        "measured" to 0.0,
        "theoretical" to 0.0,
        "difference" to 0.0,
        "success" to false,
        "error" to "AudioRecord/AudioTrack init failed"
      )
    }

    val click = ShortArray(256)
    click[0] = Short.MAX_VALUE

    val temp = ShortArray(256)
    val threshold = (Short.MAX_VALUE * 0.3).toInt()
    val maxSamples = sampleRate // 1 second
    var samplesRead = 0
    var detectedAt: Int? = null

    try {
      record.startRecording()
      track.play()

      // pre-roll
      record.read(temp, 0, temp.size)

      track.write(click, 0, click.size)

      while (samplesRead < maxSamples && detectedAt == null) {
        val read = record.read(temp, 0, temp.size)
        if (read > 0) {
          for (i in 0 until read) {
            if (abs(temp[i].toInt()) >= threshold) {
              detectedAt = samplesRead + i
              break
            }
          }
          samplesRead += read
        }
      }
    } catch (e: Exception) {
      return mapOf(
        "measured" to 0.0,
        "theoretical" to 0.0,
        "difference" to 0.0,
        "success" to false,
        "error" to (e.message ?: "Latency test failed")
      )
    } finally {
      try {
        track.stop()
      } catch (_: Exception) {
      }
      try {
        record.stop()
      } catch (_: Exception) {
      }
      record.release()
      track.release()
    }

    val measuredMs = if (detectedAt != null) {
      detectedAt.toDouble() / sampleRate * 1000.0
    } else {
      0.0
    }

    val theoretical = (getLatencyEstimate()["total"] as? Double) ?: 0.0

    val success = detectedAt != null
    val difference = measuredMs - theoretical

    return mapOf<String, Any>(
      "measured" to measuredMs,
      "theoretical" to theoretical,
      "difference" to difference,
      "success" to success,
      "error" to if (success) "" else "Click not detected"
    )
  }

  private fun getLatencyEstimate(): Map<String, Any> {
    val context = appContext.reactContext ?: return mapOf(
      "total" to 0.0,
      "input" to 0.0,
      "output" to 0.0,
      "buffer" to 0.0,
      "sampleRate" to sampleRate.toDouble()
    )

    val audioManager = context.getSystemService(AudioManager::class.java)
    val outputLatencyMs = audioManager.getProperty("android.media.property.OUTPUT_LATENCY")?.toDoubleOrNull() ?: 0.0
    val framesPerBuffer = audioManager.getProperty("android.media.property.OUTPUT_FRAMES_PER_BUFFER")?.toDoubleOrNull() ?: 0.0
    val bufferMs = when {
      framesPerBuffer > 0 -> framesPerBuffer / sampleRate * 1000.0
      bufferSizeInSamples > 0 -> bufferSizeInSamples.toDouble() / sampleRate * 1000.0
      else -> 0.0
    }
    val inputMs = bufferMs
    val totalMs = inputMs + outputLatencyMs

    return mapOf<String, Any>(
      "total" to totalMs,
      "input" to inputMs,
      "output" to outputLatencyMs,
      "buffer" to bufferMs,
      "sampleRate" to sampleRate.toDouble()
    )
  }
}
