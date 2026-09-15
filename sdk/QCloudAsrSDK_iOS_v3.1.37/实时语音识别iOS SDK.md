##  1. 接入准备
###  1.1 SDK 获取
实时语音识别的 iOS SDK 以及 Demo 的下载地址：[接入 SDK 下载](https://console.cloud.tencent.com/asr/download)。

###  1.2 接入须知
- 开发者在调用前请先查看实时语音识别的[ 接口说明](https://cloud.tencent.com/document/product/1093/37138)，了解接口的**使用要求**和**使用步骤**。   
- 该接口需要手机能够连接网络（GPRS、3G 或 Wi-Fi 网络等），且系统为 **iOS 9.0** 及以上版本。
- 运行 Demo 必须设置 AppID、SecretID、SecretKey，可在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取。

### 1.3 SDK 导入
1. 下载并解压 iOS SDK 压缩包，压缩包中包含 Demo 和 SDK, 其中QCloudRealTime.xcframework为实时语音识别framework包；VoiceCommon.framework为语音SDK公共组件framework包
2. XcodeFile > Add Files to "Your Project"，在弹出 Panel 选中所下载SDK包QCloudRealTime.xcframework和VoiceCommon.framework > Add（选中“Copy items if needed”）。

###  1.4 工程配置
**在工程的 info.plist 中申请系统麦克风权限，添加如下内容：**

```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>需要使用您的麦克风采集音频</string>
```

**在工程中添加依赖库，在 build Phases Link Binary With Libraries 中添加以下库：**

  + QCloudRealTime.xcframework
  + libc++.tbd
  + AVFoundation.framework
  + AudioToolbox.framework
  + VoiceCommon.framework
##  2. 快速接入
### 2.1 开发流程及接入示例
下面分别介绍**使用内置录音器采集语音识别**和**调用者提供语音数据**接入流程和示例。

#### 2.1.1 使用内置录音器采集语音识别示例
1. **引入SDK 的头文件**
```objective-c
#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>
```
2. **创建 QCloudConfig 实例**
```objective-c
 //1.创建 QCloudConfig 实例
 QCloudConfig *config = [[QCloudConfig alloc] initWithAppId:kQDAppId 
  						      secretId:kQDSecretId 
					          secretKey:kQDSecretKey 
					          projectId:0];

// 以下为可选配置参数
 config.requestTimeout = 10;  // 请求超时时间（秒）
 // config.sliceTime = 40;  // 语音分片时长默认40ms（无特殊需求不建议更改）
 config.enableDetectVolume = YES;  // 是否检测音量
 config.endRecognizeWhenDetectSilence = YES;  // 是否检测到静音停止识别
 config.shouldSaveAsFile = YES;  // 仅限使用SDK内置录音器有效，是否保存录音文件到本地 默认关闭
 config.saveFilePath = [NSTemporaryDirectory() stringByAppendingPathComponent:@"recordaudio.wav"];  // 开启shouldSaveAsFile后音频保存的路径，仅限使用SDK内置录音器有效，默认路径为[NSTemporaryDirectory() stringByAppendingPathComponent:@"recordaudio.wav"]

// 以下为API参数配置，参数描述见API文档：https://cloud.tencent.com/document/product/1093/48982
 config.engineType = @"16k_zh";  // 设置引擎，不设置默认16k_zh
 config.filterDirty = 0;  // 是否过滤脏词，具体的取值见API文档的filter_dirty参数
 config.filterModal = 0;  // 过滤语气词，具体的取值见API文档的filter_modal参数
 config.filterPunc = 0;  // 过滤句末的句号，具体的取值见API文档的filter_punc参数
 config.convertNumMode = 1;  // 是否进行阿拉伯数字智能转换。具体的取值见API文档的convert_num_mode参数
 // config.hotwordId = @"";  // 热词id。具体的取值见API文档的hotword_id参数
 // config.customizationId = @"";  // 自学习模型id，详情见API文档
 // config.vadSilenceTime = -1;  // 语音断句检测阈值，详情见API文档
 config.needvad = 1;  // 默认1 0：关闭 vad，1：开启 vad。如果语音分片长度超过60秒，用户需开启 vad。
 config.wordInfo = 0;  // 是否显示词级别时间戳。详情见API文档
 config.reinforceHotword = 0;  // 热词增强功能 0：关闭，1：开启 默认0
 config.noiseThreshold = 0;  // 噪音参数阈值，默认为0，取值范围：[-1,1]
```
3. **创建 QCloudRealTimeRecognizer 实例** 
```objective-c
 QCloudRealTimeRecognizer *recognizer = [[QCloudRealTimeRecognizer alloc] initWithConfig:config];
```
4. **设置 delegate，实现 [QCloudRealTimeRecognizerDelegate](#QCloudRealTimeRecognizerDelegate) 方法**
```objective-c
recognizer.delegate = self;
```
5. **开始识别**
```objective-c
  //使用内置录音器前需要先设置AVAudioSession状态为可录音的模式
  NSError *error = nil;
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord error:&error];
  if (error) {
		//错误处理
  }
  [[AVAudioSession sharedInstance] setActive:YES error:nil];
//启动识别
 [recognizer start];
```
6. **结束识别**
```objective-c
 [recognizer stop];
```

#### 2.1.2 调用者提供语音数据示例
1. **引入  SDK 的头文件**
```objective-c
#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>
```
2. **创建 QCloudConfig 实例** 
```objective-c
 //1.创建 QCloudConfig 实例
 QCloudConfig *config = [[QCloudConfig alloc] initWithAppId:kQDAppId 
  						      secretId:kQDSecretId 
					          secretKey:kQDSecretKey 
					          projectId:0];

// 以下为可选配置参数
 config.requestTimeout = 10;  // 请求超时时间（秒）
 // config.sliceTime = 40;  // 语音分片时长默认40ms（无特殊需求不建议更改）
 config.enableDetectVolume = YES;  // 是否检测音量
 config.endRecognizeWhenDetectSilence = YES;  // 是否检测静音，默认YES
 config.silenceDetectDuration = 3.0;  // 最大静音时间阈值，单位：秒
 config.endRecognizeWhenDetectSilenceAutoStop = YES;  // 是否检测到静音停止识别，默认YES

// 以下为API参数配置，参数描述见API文档：https://cloud.tencent.com/document/product/1093/48982
 config.engineType = @"16k_zh";  // 设置引擎，不设置默认16k_zh
 config.filterDirty = 0;  // 是否过滤脏词，具体的取值见API文档的filter_dirty参数
 config.filterModal = 0;  // 过滤语气词，具体的取值见API文档的filter_modal参数
 config.filterPunc = 0;  // 过滤句末的句号，具体的取值见API文档的filter_punc参数
 config.convertNumMode = 1;  // 是否进行阿拉伯数字智能转换。具体的取值见API文档的convert_num_mode参数
 // config.hotwordId = @"";  // 热词id。具体的取值见API文档的hotword_id参数
 // config.customizationId = @"";  // 自学习模型id，详情见API文档
 // config.vadSilenceTime = -1;  // 语音断句检测阈值，详情见API文档
 config.needvad = 1;  // 默认1 0：关闭 vad，1：开启 vad。如果语音分片长度超过60秒，用户需开启 vad。
 config.wordInfo = 0;  // 是否显示词级别时间戳，详情见API文档
 config.noiseThreshold = 0;  // 噪音参数阈值，默认为0，取值范围：[-1,1]，详情见API文档
 // [config setApiParam:@"custom_param" value:@"value"];  // 设置自定义请求参数，用于在请求中添加SDK尚未支持的参数
```
3. **自定义 QCloudDemoAudioDataSource，QCloudDemoAudioDataSource 实现 [QCloudAudioDataSource](#QCloudAudioDataSource) 协议**
```objective-c
// QCloudDemoAudioDataSource 具体源代码详见 SDK demo 目录
QCloudDemoAudioDataSource *dataSource = [[QCloudDemoAudioDataSource alloc] init];
```
4. **创建 QCloudRealTimeRecognizer 实例**
```objective-c
 QCloudRealTimeRecognizer *recognizer = [[QCloudRealTimeRecognizer alloc] initWithConfig:config dataSource:dataSource];
```
5. **设置 delegate，实现 [QCloudRealTimeRecognizerDelegate](#QCloudRealTimeRecognizerDelegate) 方法**
```objective-c
 recognizer.delegate = self;
```
6. **开始识别** 
```objective-c
 [recognizer start];
```
7. **结束识别**
```objective-c
 [recognizer stop];
```

### 2.2 主要接口类说明
#### 2.2.1 QCloudRealTimeRecognizer 初始化说明
QCloudRealTimeRecognizer 是实时语音识别类，提供两种初始化方法。
```objective-c
/**
 * 初始化方法，调用者使用内置录音器采集音频
 * @param config 配置参数，详见QCloudConfig定义
 */
- (instancetype)initWithConfig:(QCloudConfig *)config;

/**
 * 初始化方法，调用者传递语音数据调用此初始化方法
 * @param config 配置参数，详见QCloudConfig定义
 * @param dataSource 语音数据数据源，必须实现QCloudAudioDataSource协议
 */
- (instancetype)initWithConfig:(QCloudConfig *)config dataSource:(id<QCloudAudioDataSource>)dataSource;
```

#### 2.2.2 QCloudConfig 初始化方法说明
```objective-c
/**
 * 初始化方法-直接鉴权
 * @param appid     腾讯云 appId 
 * @param secretId  腾讯云 secretId
 * @param secretKey 腾讯云 secretKey
 * @param projectId 腾讯云 projectId
 */
- (instancetype)initWithAppId:(NSString *)appid
                     secretId:(NSString *)secretId
                    secretKey:(NSString *)secretKey
                    projectId:(NSString *)projectId;

/**
 * 初始化方法-通过STS临时证书鉴权，详见https://cloud.tencent.com/document/product/598/33416
 * @param appid     腾讯云appId 
 * @param secretId  腾讯云临时secretId  
 * @param secretKey 腾讯云临时secretKey
 * @param token     对应的token
 */
- (instancetype)initWithAppId:(NSString *)appid
    				    secretId:(NSString *)secretId
       					secretKey:(NSString *)secretKey
            			token:(NSString *)token;
```

#### 2.2.3 获取SDK版本号接口说明
```objective-c
/**
 * 获取SDK版本号
 */
+ (NSString*) getVersion;
```

[](id:QCloudRealTimeRecognizerDelegate)
#### 2.2.3 QCloudRealTimeRecognizerDelegate 方法说明
```objective-c
@protocol QCloudRealTimeRecognizerDelegate <NSObject>

@required
/**
 * 每个语音包分片识别结果
 * @param result 语音分片的识别结果（非稳态结果，会持续修正）
 */
- (void)realTimeRecognizerOnSliceRecognize:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result;


/**
 * 语音流的识别结果
 * 一次识别中可以包括多句话，这里持续返回的每句话的识别结果
 * @param recognizer 实时语音识别实例
 * @param result 语音分片的识别结果 （稳态结果）
 */
- (void)realTimeRecognizerOnSegmentSuccessRecognize:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result;


@optional
/**
 * 一次识别成功回调
 @param recognizer 实时语音识别实例
 @param result 一次识别出的总文本, 实际是由SDK本地处理，将本次识别的realTimeRecognizerOnSegmentSuccessRecognize 识别结果拼接后一次性返回
 */
- (void)realTimeRecognizerDidFinish:(QCloudRealTimeRecognizer *)recognizer result:(NSString *)result;
/**
 * 一次识别失败回调
 * @param recognizer 实时语音识别实例
 * @param result 识别结果信息，错误信息详情看QCloudRealTimeResponse内错误码
 */
- (void)realTimeRecognizerDidError:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result;


/**
 * 开始录音回调
 * @param recognizer 实时语音识别实例
 * @param error 开启录音失败，错误信息
 */
- (void)realTimeRecognizerDidStartRecord:(QCloudRealTimeRecognizer *)recognizer error:(NSError *)error;
/**
 * 结束录音回调
 * @param recognizer 实时语音识别实例
 */
- (void)realTimeRecognizerDidStopRecord:(QCloudRealTimeRecognizer *)recognizer;
/**
 * 录音音量实时回调用
 * @param recognizer 实时语音识别实例
 * @param volume 声音音量，取值范围（-40-0)
 */
- (void)realTimeRecognizerDidUpdateVolume:(QCloudRealTimeRecognizer *)recognizer volume:(float)volume;
/**
 * 录音音量实时回调用
 * @param recognizer 实时语音识别实例
 * @param volume 声音音量，计算方式如下$A_{i}$为采集音频振幅值
 * $$A_{mean} = \frac{1}{n} \sum_{i=1}^{n} A_{i}^{2}$$
 * $$volume=\max (10*\log_{10}(A_{mean}), 0)$$
 */
- (void)realTimeRecognizerDidUpdateVolumeDB:(QCloudRealTimeRecognizer *)recognizer volume:(float)volume;



/**
 * 语音流的开始识别
 * @param recognizer 实时语音识别实例
 * @param voiceId 语音流对应的voiceId，唯一标识
 * @param seq flow的序列号
 */
- (void)realTimeRecognizerOnFlowRecognizeStart:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq;
/**
 * 语音流的结束识别
 * @param recognizer 实时语音识别实例
 * @param voiceId 语音流对应的voiceId，唯一标识
 * @param seq flow的序列号
 */
- (void)realTimeRecognizerOnFlowRecognizeEnd:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq;

/**
 * 触发静音事件时回调
 */
-(void)realTimeRecognizerOnSliceDetectTimeOut;

/**
 * 录音停止后回调一次，再次开始录音会清空上一次保存的文件
 * @param recognizer 实时语音识别实例
 * @param audioFilePath 音频文件路径
 */
- (void)realTimeRecognizerDidSaveAudioDataAsFile:(QCloudRealTimeRecognizer *)recognizer
                                   audioFilePath:(NSString *)audioFilePath;

@end
```

[](id:QCloudAudioDataSource)

#### 2.2.4 QCloudAudioDataSource 协议说明
调用者不使用 SDK 内置录音器进行语音数据采集，自己提供语音数据需要实现此协议所有方法，可见 Demo 工程中的 QDAudioDataSource 实现。
```objective-c
/**
 * 语音数据数据源，如果调用者需要自己提供语音数据需要, 调用者实现此协议中所有方法
 * 提供符合以下要求的语音数据:
 * 采样率：16k
 * 音频格式：pcm
 * 编码：16bit位深的单声道
 */
@protocol QCloudAudioDataSource <NSObject>

@required

/**
 * 标识data source是否开始工作，执行完start后需要设置成YES， 执行完stop后需要设置成NO
 */
@property (nonatomic, assign) BOOL running;

@property (nonatomic, copy, readonly) NSString *audioFilePath;

/**
 * 标识QCloudAudioRecorder是否正在录音
 */
@property (nonatomic, assign, readonly) BOOL recording;

/**
 * SDK会调用start方法，实现此协议的类需要初始化数据源。didStart 是否开始  YES 往下执行，NO不会往下执行
 */
- (void)start:(void(^)(BOOL didStart, NSError *error))completion;
/**
 * SDK会调用stop方法，实现此协议的类需要停止提供数据
 */
- (void)stop;
/**
 * SDK会调用实现此协议的对象的此方法读取语音数据, 如果语音数据不足expectLength，read线程进入休眠。
 * @param expectLength 期望读取的字节数，如果返回的NSData不足expectLength个字节，SDK会抛出异常。
 */
- (nullable NSData *)readData:(NSInteger)expectLength;

@end
```
#### 2.2.5 QCloudVoiceLogger 日志设置说明
```objective-c
// 设置log等级为DEBUG级，上生产环境可选择VOICE_SDK_ERROR_LEVEL级别的log
[QCloudVoiceLogger setLoggerLevel:VOICE_SDK_DEBUG_LEVEL];
// 将log写入本地磁盘，demo工程默认打开，宿主层接入上生产环境需要关闭。
[QCloudVoiceLogger needLogFile:YES];
// (可选)注册log回调
[QCloudVoiceLogger registerLoggerListener:^(VoiceLoggerLevel loggerLevel, NSString * _Nonnull logInfo) {
        NSLog(@"[ASR]-%@",logInfo);
} withNativeLog:NO];
```
## 3. 常见问题指引

### 3.1 回音消除指引

本小节主要介绍如何通过iOS原生API实现回音消除，下面将介绍实现方案（完整代码参考Demo工程中的QCloudAECDataSource类的实现方法）。

#### 3.1.1 回声消除方案介绍

1. 设置AVAudioSession支持边播放边录音的模式

```objectivec
AVAudioSession* session = [AVAudioSession sharedInstance];
[session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeDefault options:AVAudioSessionCategoryOptionDefaultToSpeaker error:&error];
```

2. 通过AVAudioEngine添加播放节点构建音频处理图

```objectivec
self.engine = [[AVAudioEngine alloc] init];
self.play_node = [[AVAudioPlayerNode alloc] init];
[self.engine attachNode:self.play_node];
[self.engine connect:self.play_node to:self.engine.outputNode format:nil];
```

3. 通过调用输入节点的setVoiceProcessingEnabled开启回声消除

```objectivec
[self.engine.inputNode setVoiceProcessingEnabled:YES error:&error];
```

4. 启动音频处理图

```objectivec
[self.engine startAndReturnError:&error];
```

#### 3.1.2 回音消除方案适配的机型列表

1. 回声消除要求系统版本不低于iOS 13.0

2. 回声消除适配还会受到机型及系统的影响,以下列举已测试机型和系统的适配情况

   | 机型              | 系统          | 适配 | 备注                     |
   | ----------------- | ------------- | ---- | ------------------------ |
   | iPhone 11 Pro     | 13.4          | 否   | 回声消除导致播放音量变化 |
   | iPhone 11 Pro max | 14.4.2        | 否   | 回声消除导致播放音量变化 |
   | iPhone 12         | 14.1          | 否   | 回声消除导致播放音量变化 |
   | iPhone 12 pro     | 14.1          | 否   | 回声消除导致播放音量变化 |
   | iPhone 6s Plus    | 15.1          | 否   | 回声消除导致播放音量变化 |
   | iPhone 8 Plus     | 14.0.1        | 否   | 回声消除导致播放音量变化 |
   | iPhone SE2        | 17.0（beta5） | 否   | 回声消除导致播放音量变化 |
   | iPhone X          | 15            | 否   | 回声消除导致播放音量变化 |
   | iPhone XR         | 16.6          | 否   | 回声消除导致播放音量变化 |
   | iPhone Xs max     | 14.2          | 否   | 回声消除导致播放音量变化 |
   | iPhone 12 mini    | 14.1          | 否   | 回声消除不生效           |
   | iPhone 13 mini    | 15            | 否   | 回声消除不生效           |
   | iPhone 14         | 16            | 否   | 回声消除不生效           |
   | iPhone 14 Plus    | 16.0.2        | 否   | 回声消除不生效           |
   | iPhone 14 Pro     | 16            | 否   | 回声消除不生效           |
   | iPhone 14 Pro max | 16            | 否   | 回声消除不生效           |
   | iPhone 11         | 16.1.1        | 是   |                          |
   | iPhone 12 pro max | 16.3.1        | 是   |                          |
   | iPhone 13         | 15.0.1        | 是   |                          |
   | iPhone 13 Pro     | 15.0.2        | 是   |                          |
   | iPhone 13 Pro max | 15.0.2        | 是   |                          |
   | iPhone SE3        | 15.4          | 是   |                          |
   | iPhone Xs         | 14.4          | 是   |                          |

   
