package uts.sdk.modules.tencentSpeechAsr

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.text.TextUtils
import com.tencent.aai.AAIClient
import com.tencent.aai.audio.data.PcmAudioDataSource
import com.tencent.aai.auth.LocalCredentialProvider
import com.tencent.aai.config.ClientConfiguration
import com.tencent.aai.exception.ClientException
import com.tencent.aai.exception.ClientExceptionType
import com.tencent.aai.exception.ServerException
import com.tencent.aai.listener.AudioRecognizeResultListener
import com.tencent.aai.listener.AudioRecognizeStateListener
import com.tencent.aai.model.AudioRecognizeConfiguration
import com.tencent.aai.model.AudioRecognizeRequest
import com.tencent.aai.model.AudioRecognizeResult
import com.tencent.aai.audio.utils.WavCache
import io.dcloud.uts.UTSAndroid
import io.dcloud.uts.UTSJSONObject
import io.dcloud.uts.console
import java.io.DataOutputStream
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private class StableAudioRecordDataSource(private val shouldSaveAsFile: Boolean) : PcmAudioDataSource {
    private val sampleRates = intArrayOf(16000, 44100, 8000)
    private val audioSources = intArrayOf(
        MediaRecorder.AudioSource.MIC,
        MediaRecorder.AudioSource.VOICE_RECOGNITION,
        MediaRecorder.AudioSource.CAMCORDER
    )
    private var audioRecord: AudioRecord? = null
    private var bufferSize = 0
    private var sampleRate = 16000
    private var audioSource = MediaRecorder.AudioSource.MIC
    private var started = false

    override fun read(buffer: ShortArray, length: Int): Int {
        val recorder = audioRecord ?: return -1
        return recorder.read(buffer, 0, length)
    }

    @Synchronized
    override fun start() {
        if (started) {
            throw ClientException(ClientExceptionType.AUDIO_RECORD_MULTIPLE_START)
        }
        val activity = UTSAndroid.getUniActivity()
        if (activity == null) {
            throw ClientException(ClientExceptionType.AUDIO_RECORD_INIT_FAILED, "Activity unavailable")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            throw ClientException(ClientExceptionType.AUDIO_RECORD_INIT_FAILED, "Missing RECORD_AUDIO permission")
        }

        releaseRecorder()
        var lastReason = ""
        for (source in audioSources) {
            for (rate in sampleRates) {
                val minBuffer = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
                if (minBuffer <= 0) {
                    console.log("TencentSpeechAsrNative skip audio source=$source sampleRate=$rate minBuffer=$minBuffer")
                    lastReason = "minBuffer=$minBuffer"
                    continue
                }
                val candidateBuffer = minBuffer * 2
                try {
                    val candidate = AudioRecord(source, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, candidateBuffer)
                    if (candidate.state != AudioRecord.STATE_INITIALIZED) {
                        console.log("TencentSpeechAsrNative uninitialized audio source=$source sampleRate=$rate bufferSize=$candidateBuffer state=${candidate.state}")
                        lastReason = "state=${candidate.state}"
                        candidate.release()
                        continue
                    }
                    candidate.startRecording()
                    audioRecord = candidate
                    bufferSize = candidateBuffer
                    sampleRate = rate
                    audioSource = source
                    started = true
                    console.log("TencentSpeechAsrNative audio record started source=$audioSource sampleRate=$sampleRate bufferSize=$bufferSize")
                    return
                } catch (t: Throwable) {
                    console.log("TencentSpeechAsrNative audio record init failed source=$source sampleRate=$rate message=${t.message ?: ""}")
                    lastReason = t.message ?: ""
                }
            }
        }
        releaseRecorder()
        throw ClientException(ClientExceptionType.AUDIO_RECORD_INIT_FAILED, "AudioRecord init failed: $lastReason")
    }

    @Synchronized
    override fun stop() {
        releaseRecorder()
    }

    override fun isSetSaveAudioRecordFiles(): Boolean {
        return shouldSaveAsFile
    }

    fun currentSampleRate(): Int {
        return sampleRate
    }

    private fun releaseRecorder() {
        try {
            audioRecord?.stop()
        } catch (_: Throwable) {
        }
        try {
            audioRecord?.release()
        } catch (_: Throwable) {
        }
        audioRecord = null
        bufferSize = 0
        started = false
    }
}

object TencentSpeechAsrNative {
    private var aaiClient: AAIClient? = null
    private var isRecognizingFlag = false
    private var shouldSaveAsFileFlag = false
    private var currentSampleRate = 16000
    private var audioSaveExecutor: ExecutorService? = null
    private var pcmDir = ""
    private var pcmName = ""
    private var pcmOutputStream: DataOutputStream? = null
    private var onStopRecordCallback: (() -> Unit)? = null
    private var onAudioSavedCallback: ((UTSJSONObject) -> Unit)? = null
    private val isWriteFilePrepare = AtomicBoolean(false)
    private val isAudioFinalizeStarted = AtomicBoolean(false)
    private val isStopRecordDispatched = AtomicBoolean(false)

    fun isRecognizing(): Boolean {
        return isRecognizingFlag
    }

    fun stopRecognize(): Boolean {
        return aaiClient?.stopAudioRecognize() ?: false
    }

    fun cancelRecognize(): Boolean {
        isRecognizingFlag = false
        val cancelled = aaiClient?.cancelAudioRecognize() ?: false
        finalizeAudioSaveAsync(true)
        return cancelled
    }

    private fun dispatchStopRecordOnce() {
        if (isStopRecordDispatched.compareAndSet(false, true)) {
            onStopRecordCallback?.invoke()
        }
    }

    private fun clearAudioSaveState() {
        shouldSaveAsFileFlag = false
        currentSampleRate = 16000
        pcmDir = ""
        pcmName = ""
        pcmOutputStream = null
        onStopRecordCallback = null
        onAudioSavedCallback = null
        isWriteFilePrepare.set(false)
        isAudioFinalizeStarted.set(false)
        isStopRecordDispatched.set(false)
        audioSaveExecutor?.shutdown()
        audioSaveExecutor = null
    }

    private fun finalizeAudioSaveAsync(triggerStopRecord: Boolean) {
        if (triggerStopRecord) {
            dispatchStopRecordOnce()
        }
        isWriteFilePrepare.set(false)
        if (!shouldSaveAsFileFlag || !isAudioFinalizeStarted.compareAndSet(false, true)) {
            return
        }
        val executor = audioSaveExecutor
        val outputStream = pcmOutputStream
        val outputDir = pcmDir
        val outputName = pcmName
        val sampleRate = currentSampleRate
        if (executor == null || outputDir.isEmpty() || outputName.isEmpty()) {
            try {
                WavCache.closeDataOutputStream(outputStream)
            } catch (_: Throwable) {
            }
            if (pcmOutputStream === outputStream) {
                pcmOutputStream = null
            }
            return
        }
        executor.execute {
            try {
                WavCache.closeDataOutputStream(outputStream)
                if (pcmOutputStream === outputStream) {
                    pcmOutputStream = null
                }
                WavCache.makePCMFileToWAVFile(outputDir, outputName, 1.toShort(), sampleRate)
                val wavPath = File(outputDir, outputName.replace(".pcm", ".wav")).absolutePath
                if (File(wavPath).exists()) {
                    val payload = UTSJSONObject()
                    payload.set("audioFilePath", wavPath)
                    payload.set("savedFilePath", wavPath)
                    payload.set("path", wavPath)
                    onAudioSavedCallback?.invoke(payload)
                } else {
                    console.log("TencentSpeechAsrNative audio save failed, wav not found: $wavPath")
                }
            } catch (t: Throwable) {
                console.log("TencentSpeechAsrNative audio save failed: ${t.message ?: ""}")
            } finally {
                executor.shutdown()
                if (audioSaveExecutor === executor) {
                    audioSaveExecutor = null
                }
            }
        }
    }

    private fun buildResultPayload(result: AudioRecognizeResult): UTSJSONObject {
        val payload = UTSJSONObject()
        payload.set("code", result.code)
        payload.set("message", result.message ?: "")
        payload.set("voiceId", result.voiceId ?: "")
        payload.set("text", result.text ?: "")
        payload.set("seq", result.seq)
        payload.set("sliceType", result.sliceType)
        payload.set("startTime", result.startTime)
        payload.set("endTime", result.endTime)
        payload.set("resultJson", result.resultJson ?: "")
        return payload
    }

    private fun emitError(callback: ((UTSJSONObject) -> Unit)?, message: String, clientCode: Int = 0, response: String = ""): Boolean {
        val payload = UTSJSONObject()
        payload.set("message", message)
        payload.set("clientErrCode", clientCode)
        payload.set("response", response)
        callback?.invoke(payload)
        return false
    }

    fun startRecognize(
        appId: Number,
        secretId: String,
        secretKey: String,
        token: String,
        projectId: Number,
        engineModelType: String,
        filterDirty: Number,
        filterModal: Number,
        filterPunc: Number,
        convertNumMode: Number,
        needvad: Number,
        wordInfo: Number,
        noiseThreshold: Number,
        maxSpeakTime: Number,
        hotwordId: String,
        customizationId: String,
        host: String,
        enableDetectVolume: Boolean,
        endRecognizeWhenDetectSilence: Boolean,
        endRecognizeWhenDetectSilenceAutoStop: Boolean,
        silenceDetectDuration: Number,
        sliceTime: Number,
        requestTimeout: Number,
        compress: Boolean,
        shouldSaveAsFile: Boolean,
        saveFilePath: String,
        onSliceRecognize: ((UTSJSONObject) -> Unit)?,
        onSegmentRecognize: ((UTSJSONObject) -> Unit)?,
        onFinish: ((UTSJSONObject) -> Unit)?,
        onError: ((UTSJSONObject) -> Unit)?,
        onStartRecord: (() -> Unit)?,
        onStopRecord: (() -> Unit)?,
        onVolumeChange: ((Number) -> Unit)?,
        onFlowStart: ((UTSJSONObject) -> Unit)?,
        onFlowEnd: ((UTSJSONObject) -> Unit)?,
        onSilentDetectTimeout: (() -> Unit)?,
        onAudioSaved: ((UTSJSONObject) -> Unit)?
    ): Boolean {
        val activity = UTSAndroid.getUniActivity()
        if (activity == null) {
            return emitError(onError, "当前无法获取 Activity 上下文")
        }
        if (appId.toInt() <= 0 || secretId.isEmpty() || secretKey.isEmpty()) {
            return emitError(onError, "腾讯云实时语音识别凭证不完整")
        }

        try {
            if (aaiClient != null) {
                aaiClient?.cancelAudioRecognize()
                aaiClient?.release()
                aaiClient = null
            }
            clearAudioSaveState()

            ClientConfiguration.setAudioRecognizeConnectTimeout(requestTimeout.toInt() * 1000)
            ClientConfiguration.setAudioRecognizeWriteTimeout(requestTimeout.toInt() * 1000)
            ClientConfiguration.setAudioRecognizeSliceTimeout(requestTimeout.toInt() * 1000)

            aaiClient = if (token.isNotEmpty()) {
                AAIClient(activity, appId.toInt(), projectId.toInt(), secretId, secretKey, token)
            } else {
                AAIClient(activity, appId.toInt(), projectId.toInt(), secretId, LocalCredentialProvider(secretKey))
            }

            val audioDataSource = StableAudioRecordDataSource(shouldSaveAsFile)
            shouldSaveAsFileFlag = shouldSaveAsFile
            onStopRecordCallback = onStopRecord
            onAudioSavedCallback = onAudioSaved
            audioSaveExecutor = if (shouldSaveAsFile) Executors.newSingleThreadExecutor() else null

            val requestBuilder = AudioRecognizeRequest.Builder()
                .pcmAudioDataSource(audioDataSource)
                .setEngineModelType(if (engineModelType.isEmpty()) "16k_zh" else engineModelType)
                .setFilterDirty(filterDirty.toInt())
                .setFilterModal(filterModal.toInt())
                .setFilterPunc(filterPunc.toInt())
                .setConvert_num_mode(convertNumMode.toInt())
                .setNeedvad(needvad.toInt())
                .setWordInfo(wordInfo.toInt())
                .setNoiseThreshold(noiseThreshold.toFloat())

            if (maxSpeakTime.toInt() > 0) {
                requestBuilder.setMaxSpeakTime(maxSpeakTime.toInt())
            }
            if (!TextUtils.isEmpty(hotwordId)) {
                requestBuilder.setHotWordId(hotwordId)
            }
            if (!TextUtils.isEmpty(customizationId)) {
                requestBuilder.setCustomizationId(customizationId)
            }
            if (!TextUtils.isEmpty(host)) {
                requestBuilder.setHost(host)
            }

            val request = requestBuilder.build()

            val recognizeConfiguration = AudioRecognizeConfiguration.Builder()
                .sliceTime(sliceTime.toInt())
                .setSilentDetectTimeOut(endRecognizeWhenDetectSilence)
                .setSilentDetectTimeOutAutoStop(endRecognizeWhenDetectSilenceAutoStop)
                .audioFlowSilenceTimeOut(silenceDetectDuration.toInt())
                .minVolumeCallbackTime(if (enableDetectVolume) 80 else sliceTime.toInt())
                .isCompress(compress)
                .build()

            val resultListener = object : AudioRecognizeResultListener {
                override fun onSliceSuccess(request: AudioRecognizeRequest, result: AudioRecognizeResult, seq: Int) {
                    onSliceRecognize?.invoke(buildResultPayload(result))
                }

                override fun onSegmentSuccess(request: AudioRecognizeRequest, result: AudioRecognizeResult, seq: Int) {
                    onSegmentRecognize?.invoke(buildResultPayload(result))
                }

                override fun onSuccess(request: AudioRecognizeRequest, result: String) {
                    isRecognizingFlag = false
                    val payload = UTSJSONObject()
                    payload.set("text", result)
                    onFinish?.invoke(payload)
                }

                override fun onFailure(request: AudioRecognizeRequest, clientException: ClientException?, serverException: ServerException?, response: String?) {
                    isRecognizingFlag = false
                    val payload = UTSJSONObject()
                    payload.set("message", clientException?.message ?: serverException?.message ?: "腾讯实时语音识别失败")
                    payload.set("clientErrCode", clientException?.code ?: 0)
                    payload.set("response", response ?: "")
                    onError?.invoke(payload)
                }
            }

            val stateListener = object : AudioRecognizeStateListener {
                override fun onStartRecord(request: AudioRecognizeRequest) {
                    isRecognizingFlag = true
                    if (shouldSaveAsFile) {
                        pcmDir = if (saveFilePath.isNotEmpty()) {
                            File(saveFilePath).parent ?: activity.filesDir.absolutePath + "/tencent_audio_cache"
                        } else {
                            activity.filesDir.absolutePath + "/tencent_audio_cache"
                        }
                        pcmName = "${System.currentTimeMillis()}.pcm"
                        File(pcmDir).mkdirs()
                        pcmOutputStream = WavCache.creatPmcFileByPath(pcmDir, pcmName)
                        isWriteFilePrepare.set(true)
                    }
                    currentSampleRate = audioDataSource.currentSampleRate()
                    onStartRecord?.invoke()
                }

                override fun onStopRecord(request: AudioRecognizeRequest) {
                    finalizeAudioSaveAsync(true)
                }

                override fun onVoiceVolume(request: AudioRecognizeRequest, volume: Int) {
                    if (enableDetectVolume) {
                        onVolumeChange?.invoke(volume)
                    }
                }

                override fun onVoiceDb(db: Float) {
                    if (enableDetectVolume) {
                        onVolumeChange?.invoke(db)
                    }
                }

                override fun onNextAudioData(audioDatas: ShortArray, readBufferLength: Int) {
                    if (shouldSaveAsFile && isWriteFilePrepare.get() && audioSaveExecutor != null) {
                        val outputStream = pcmOutputStream ?: return
                        audioSaveExecutor?.execute {
                            try {
                                WavCache.savePcmData(outputStream, audioDatas, readBufferLength)
                            } catch (t: Throwable) {
                                console.log("TencentSpeechAsrNative save pcm failed: ${t.message ?: ""}")
                            }
                        }
                    }
                }

                override fun onSilentDetectTimeOut() {
                    onSilentDetectTimeout?.invoke()
                }
            }

            Thread {
                try {
                    aaiClient?.startAudioRecognize(request, resultListener, stateListener, recognizeConfiguration)
                    if (shouldSaveAsFile && saveFilePath.isNotEmpty()) {
                        console.log("tencent realtime sdk saveFilePath requested", saveFilePath)
                    }
                } catch (t: Throwable) {
                    isRecognizingFlag = false
                    emitError(onError, t.message ?: "启动腾讯实时语音识别失败")
                }
            }.start()

            return true
        } catch (t: Throwable) {
            isRecognizingFlag = false
            console.log("TencentSpeechAsrNative startRecognize failed: " + (t.message ?: ""))
            return emitError(onError, t.message ?: "初始化腾讯实时语音识别失败")
        }
    }
}
