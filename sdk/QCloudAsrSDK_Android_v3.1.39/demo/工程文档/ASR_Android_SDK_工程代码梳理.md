## 工程说明

本文档用于梳理本仓库（`cloud-asr-sdk-android2`）的**模块划分**、**关键源码入口**、**网络/签名实现**与**核心调用链**，便于维护与二次开发。

- 工程类型：Android Gradle 多模块工程
- 模块组成：`asr-realtime`、`asr-one-sentence`、`asr-file-recognize`、`speech-demo`
- 产物：3 个 SDK 的 `aar` + 1 个 Demo `apk`（并可打包到 `deliverable/`）

- **工程架构图**：见 `工程架构图.md`
- **业务流程/时序图**：见 `业务流程与时序图.md`

> 安全提醒：`ReadMe.md` 明确要求 **不要把 `secret_id` / `secret_key` 等密钥推送到仓库**。`speech-demo` 通过构建脚本把 `speech-demo-config.json` 里的密钥注入到 `BuildConfig`，仅建议本地测试使用。

---

## 模块总览

### Gradle 模块

`settings.gradle` 声明了 4 个模块：

- `asr-realtime`：实时流式识别 SDK（WebSocket + 音频分片 + 可选 Opus 压缩）
- `asr-one-sentence`：一句话识别 SDK（HTTPS + `TC3-HMAC-SHA256` 签名 + 可选内置录音器）
- `asr-file-recognize`：录音文件识别“极速版”SDK（HTTPS 上传二进制音频流 + HMAC-SHA1 签名）
- `speech-demo`：Demo App（UI + 3 种能力演示 + 本地配置注入）

### 工程级构建/发布脚本

- `config.gradle`：统一 `compileSdkVersion/minSdkVersion/targetSdkVersion`
- `sdk_version.gradle`：统一 SDK 版本号（如 `v3.1.38`），用于各模块 `BuildConfig.SDK_VERSION`
- `parse_json.gradle`：读取 `speech-demo-config.json`，在构建时将 `AppId/SecretId/Secretkey` 注入到 Demo 的 `BuildConfig`
- `clean-sdk.gradle`：把各 SDK 模块打出来的 release `aar` 同步复制到 `speech-demo/libs`
- `build.sh`：一键 clean/assemble（3 个 `aar` + demo `apk`），复制产物到 `deliverable/` 并打 zip

---

## 整体架构图（模块/层次）

工程架构 Mermaid 图已独立维护在 `工程架构图.md`。

---

## `speech-demo`（Demo App）

### 作用

- 提供 3 类 SDK 的**推荐接入方式样例**
- 展示参数配置、回调处理、音频保存（PCM/WAV）等常见业务接入点

### 配置注入

- Demo 通过 `speech-demo-config.json` 在构建期注入 `BuildConfig.AppId/SecretId/Secretkey`
- 代码中通过 `com.tencent.iot.speech.app.DemoConfig` 读取：
  - `DemoConfig.apppId`（注意变量名是 `apppId`）
  - `DemoConfig.secretId`
  - `DemoConfig.secretKey`

### 关键入口

- 实时识别演示：`com.tencent.iot.speech.app.asr.realtime.MainActivity`
  - 初始化 `AAIClient`
  - 组装 `AudioRecognizeRequest` 与 `AudioRecognizeConfiguration`
  - 处理 `onSliceSuccess/onSegmentSuccess/onSuccess/onFailure` 回调
  - 可选保存音频并把 PCM 转 WAV（`WavCache`）

### Demo 调用时序图

Demo 调用概览的 Mermaid 时序图已独立维护在 `业务流程与时序图.md`。

---

## `asr-realtime`（实时语音识别 SDK）

### 对外 API（调用入口）

- `com.tencent.aai.AAIClient`
  - 入口：`startAudioRecognize(...)` / `stopAudioRecognize()` / `cancelAudioRecognize()` / `release()`
  - 初始化时间校准：`initServiceTime()` 使用 `QCloudServiceTimeClient` 获取服务器时间，写入 `QCloudServiceTimeManager.diffTime`
  - 版本号：`getVersion()` → `BuildConfig.SDK_VERSION`

### 关键内部组件

- 任务编排：`com.tencent.aai.task.AudioRecognizeTask`
  - `start()`：启动音频采集 `mAudioRecognizer.start()`，设置 `voice_format`（压缩开→`10(opus)`，关→`1(pcm)`），再 `websocketConnect()`
  - `stop()`：停止采集并 `sendEnd()`（发送 `{"type":"end"}`），等待服务端 `final==1` 返回最终结果
  - `cancel()`：立即 stop + `websocketCloseNow()`，丢弃结果
  - 静音检测线程：`calculateSilentThread` 结合 `onVoiceSilent()` 与“长时间无回包”触发 `onSilentDetectTimeOut()`

- WebSocket 网络层：`com.tencent.aai.task.WebsocketHelper`
  - `websocketConnect()`：
    - `WebsocketParamUtils.buildWebsocketURL(...)` 组 query（含 `secretid/voice_id/timestamp/expired/nonce/voice_format` 等）
    - `WebsocketParamUtils.buildServerUrl(...)`：生成待签名字符串 `domain + path + appid + ?query`，并拼接 `signature=...`
  - `sendMessage()`：单线程池串行发送音频分片（二进制 `ByteString`）
  - `onMessage(String)`：解析 JSON 回包，缓存到 `recognizeResult`（按 `index`），并分发回调
  - `final==1`：触发 `onAllMessage(allAudioRecognizeResult())` 并 `onServiceCancel()`

- Opus 压缩：`com.tencent.aai.asr.QcloudAsrRealtimeUtils`
  - 设计约束：**同一条语音流共用一个 encoder handle**，避免分片之间波形不连续导致“听起来卡顿”
  - JNI：`QcloudAsrRealtimeUtilsNative`
  - Native：`qcloud_asr_realtime.cpp`
    - 明确警告：**会丢弃尾部不足 20ms 的音频**，调用方必须保障输入是 20ms 整数倍（16k 单声道下 20ms = 640 samples）

### 实时识别时序图（含可选 Opus）

实时识别的 Mermaid 时序图已独立维护在 `业务流程与时序图.md`。

---

## `asr-one-sentence`（一句话识别 SDK）

### 对外 API（调用入口）

- `com.tencent.cloud.qcloudasrsdk.onesentence.QCloudOneSentenceRecognizer`
  - `recognize(String audioUrl, ...)`：通过 URL 识别
  - `recognize(byte[] audioData, ...)`：通过音频数据识别
  - `recognizeWithRecorder()`：使用 SDK 内置 `QCloudRecorder` 录音并识别
  - 时间校准：`initServiceTime()` 获取 `diffTime`，请求前 `params.setTimestamp(now + diffTime)`

### 网络请求与签名

- 网络请求：`com.tencent.cloud.qcloudasrsdk.onesentence.network.QCloudRecognizeBaseAsyncTask`
  - `HttpURLConnection` + `POST` + JSON body
  - `User-Agent`：`Android-sdk-` + `BuildConfig.SDK_VERSION`

- 签名：`com.tencent.cloud.qcloudasrsdk.onesentence.network.utils.QCloudSignUtil`
  - 算法：`TC3-HMAC-SHA256`
  - 过程：构建 canonicalRequest → stringToSign → 派生 `TC3` key → 计算 signature → 拼接 `Authorization`

### 一句话识别时序图（含可选录音）

一句话识别的 Mermaid 时序图已独立维护在 `业务流程与时序图.md`。

---

## `asr-file-recognize`（录音文件识别极速版 SDK）

### 对外 API（调用入口）

- `com.tencent.cloud.qcloudasrsdk.filerecognize.QCloudFlashRecognizer`
  - `recognize(QCloudFlashRecognitionParams params)`：支持两种音频输入
    - `DATA`：直接传 `byte[]`
    - `PATH`：传文件路径（内部按块读取，避免 OOM）
  - 时间校准：`initServiceTime()` 获取 `diffTime`，请求前设置 `timestamp = now + diffTime`

### 网络请求与签名

- 网络请求：`com.tencent.cloud.qcloudasrsdk.filerecognize.network.QCloudFlashRecognizeBaseTask`
  - URL：拼接 `host + path + appid + ?query`，其中 query 里会加 `secretid`
  - `Content-Type: application/octet-stream`
  - body：音频 bytes（若 `PATH` 则用 1KB buffer 逐块写入）

- 签名：`com.tencent.cloud.qcloudasrsdk.filerecognize.network.utils.auth.LocalCredentialProvider`
  - 算法：HMAC-SHA1（`getAudioRecognizeSign("POST" + urlString)`）
  - 注意：这是 Demo/本地直签方式；线上更建议由业务服务端签名并下发临时凭证

### 极速文件识别时序图

极速文件识别的 Mermaid 时序图已独立维护在 `业务流程与时序图.md`。

---

## 关键实现细节与常见坑点

### 时间戳与签名失效

- `asr-realtime`、`asr-one-sentence`、`asr-file-recognize` 都实现了“服务器时间校准”，并在请求/建连前对 `timestamp` 做 `diffTime` 修正。
- `asr-realtime` 在 `WebsocketParamUtils.buildWebsocketURL(...)` 里会调用 `audioRecognizeRequest.UpdateTimestamp()`，避免复用 request 导致签名过期。

### Opus 压缩的 20ms 帧约束（实时识别）

- `qcloud_asr_realtime.cpp` 会丢弃尾部不足 20ms 的音频，因此：
  - 音频采样必须满足 16k 单声道 PCM（Demo 注释也明确强调）
  - 分片时长应为 20ms 的整数倍（Demo 里也提示“不是则会被自动调整”）

### 线程模型

- 实时识别：音频采集与网络发送是不同线程（音频回调触发网络发送队列）。调用方应避免在回调里做重 IO/重计算。
- 一句话/极速版：基于 `AsyncTask` 的后台线程请求，结果回调通过主线程 handler 分发（部分实现带 `QCloudMainHandler`）。

### Demo 密钥管理

- `speech-demo` 通过 `speech-demo-config.json` → `parse_json.gradle` → `BuildConfig` 注入密钥。
- 强烈建议：
  - 本地调试使用，避免提交；
  - 线上接入改用“服务端签名/STS 临时密钥下发”模式。

---

## 推荐阅读路径（从调用链读透）

- **实时识别**：`MainActivity` → `AAIClient` → `AudioRecognizeTask` → `WebsocketHelper` / `QcloudAsrRealtimeUtilsNative`
- **一句话识别**：`QCloudOneSentenceRecognizer` → `QCloudRecognizeBaseAsyncTask` → `QCloudSignUtil`
- **极速文件识别**：`QCloudFlashRecognizer` → `QCloudFlashRecognizeBaseTask` → `LocalCredentialProvider`
