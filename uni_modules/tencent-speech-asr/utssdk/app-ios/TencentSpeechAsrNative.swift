import Foundation
import DCloudUTSFoundation

/// iOS 不链接腾讯云实时语音静态 xcframework。
/// 那些库是 static archive 却带 CFBundleExecutable，打进包后会被 dyld 当动态库加载，App 一点就闪退。
/// 录音走 JS 层 uni.getRecorderManager。
public class TencentSpeechAsrNative: NSObject {
    public static func isRecognizing() -> Bool {
        return false
    }

    public static func stopRecognize() -> Bool {
        return false
    }

    public static func cancelRecognize() -> Bool {
        return false
    }

    public static func startRecognize(
        _ appId: NSNumber,
        _ secretId: String,
        _ secretKey: String,
        _ token: String,
        _ projectId: NSNumber,
        _ engineModelType: String,
        _ filterDirty: NSNumber,
        _ filterModal: NSNumber,
        _ filterPunc: NSNumber,
        _ convertNumMode: NSNumber,
        _ needvad: NSNumber,
        _ wordInfo: NSNumber,
        _ noiseThreshold: NSNumber,
        _ maxSpeakTime: NSNumber,
        _ hotwordId: String,
        _ customizationId: String,
        _ host: String,
        _ enableDetectVolume: Bool,
        _ endRecognizeWhenDetectSilence: Bool,
        _ endRecognizeWhenDetectSilenceAutoStop: Bool,
        _ silenceDetectDuration: NSNumber,
        _ sliceTime: NSNumber,
        _ requestTimeout: NSNumber,
        _ compress: Bool,
        _ shouldSaveAsFile: Bool,
        _ saveFilePath: String,
        _ onSliceRecognize: ((UTSJSONObject) -> Void)?,
        _ onSegmentRecognize: ((UTSJSONObject) -> Void)?,
        _ onFinish: ((UTSJSONObject) -> Void)?,
        _ onError: ((UTSJSONObject) -> Void)?,
        _ onStartRecord: (() -> Void)?,
        _ onStopRecord: (() -> Void)?,
        _ onVolumeChange: ((NSNumber) -> Void)?,
        _ onFlowStart: ((UTSJSONObject) -> Void)?,
        _ onFlowEnd: ((UTSJSONObject) -> Void)?,
        _ onSilentDetectTimeout: (() -> Void)?,
        _ onAudioSaved: ((UTSJSONObject) -> Void)?
    ) -> Bool {
        let payload = UTSJSONObject()
        payload.set("message", "iOS 未启用腾讯实时语音原生库")
        payload.set("clientErrCode", 0)
        onError?(payload)
        return false
    }
}
