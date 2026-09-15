//
//  QDRealTimeRecognizeViewController.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QDRealTimeRecognizeViewController.h"

#import <AVFoundation/AVFoundation.h>
#import "QCloudDemoAudioDataSource.h"
#import "QDDemoModel.h"
#import "QDDefine.h"
#import "UIView+Toast.h"
#import "QDWaveView.h"
#import <VoiceCommon/QCloudVoiceLogger.h>
#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>
#import <QCloudRealTime/QCloudContextPrompt.h>


@interface QDRealTimeRecognizeViewController ()<QCloudRealTimeRecognizerDelegate>

@property (nonatomic, strong) QCloudRealTimeRecognizer *realTimeRecognizer;
@property (nonatomic, strong) QCloudDemoAudioDataSource *dataSource;
@property (nonatomic, assign) BOOL isRecording;
@property (nonatomic, assign) float volume;

@property (weak, nonatomic) IBOutlet UITextView *recognizedTextView;
@property (weak, nonatomic) IBOutlet UISwitch *volumeDetectSwitch;
@property (weak, nonatomic) IBOutlet UISwitch *silenceDetectEndSwitch;
@property (weak, nonatomic) IBOutlet UIButton *recognizeButton;

@property (strong, nonatomic) QDWaveView *recordWaveView;
@property (weak, nonatomic) IBOutlet UILabel *volumeLabel;

/** 域名输入框（storyboard，默认 asr.cloud.tencent.com） */
@property (weak, nonatomic) IBOutlet UITextField *hostTextField;
/** 引擎类型输入框（storyboard，默认 16k_zh） */
@property (weak, nonatomic) IBOutlet UITextField *engineTextField;

@end

@implementation QDRealTimeRecognizeViewController {
    float minVolume;
    float maxVolume;
}
- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    [self registerSDKLogger];
    NSLog(@"set set audio session category");
}
- (void)viewWillAppear:(BOOL)animated{
    
    [super viewWillAppear:YES];
    
}
- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self stopRecognizeIfNeed];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    self.navigationItem.title = @"实时语音识别";
    
    _volume = 0;
    __weak typeof(self)weakSelf = self;
    _recordWaveView = [[QDWaveView alloc] initWithFrame:CGRectMake(0, CGRectGetMaxY(_recognizeButton.frame) + 10, CGRectGetWidth(self.view.bounds), 100.0)];
    _recordWaveView.waverLevelCallback = ^(QDWaveView * waver) {
        CGFloat normalizedValue = weakSelf.volume / 200;
//        normalizedValue = pow (10, normalizedValue / 40.0);
        weakSelf.recordWaveView.level = normalizedValue;
    };
    _recordWaveView.hidden = YES;
    [self.view addSubview:_recordWaveView];

    // 输入框默认值由 storyboard 直接给：host = asr.cloud.tencent.com，engine = 16k_zh
    // 点击空白处收起键盘
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(dismissKeyboard)];
    tap.cancelsTouchesInView = NO;
    [self.view addGestureRecognizer:tap];

    // host / engine 修改后，下一次开始识别必须重建 recognizer 才能让新值生效
    [self.hostTextField addTarget:self
                           action:@selector(onConfigTextFieldChanged:)
                 forControlEvents:UIControlEventEditingChanged];
    [self.engineTextField addTarget:self
                             action:@selector(onConfigTextFieldChanged:)
                   forControlEvents:UIControlEventEditingChanged];
}

- (void)dismissKeyboard {
    [self.view endEditing:YES];
}

- (void)onConfigTextFieldChanged:(UITextField *)tf {
    if (_isRecording) { return; }
    _realTimeRecognizer = nil;
}
-(void)registerSDKLogger{
    //设置log等级为DEBUG级， 上生产环境可选择ERROR等级的log
    [QCloudVoiceLogger setLoggerLevel:VOICE_SDK_DEBUG_LEVEL];
    // 将log写入本地磁盘，上生产环境建议关闭。
    [QCloudVoiceLogger needLogFile:YES];
    // (可选)注册log回调
    [QCloudVoiceLogger registerLoggerListener:^(VoiceLoggerLevel loggerLevel, NSString * _Nonnull logInfo) {
        NSLog(@"[ASR]-%@",logInfo);
    } withNativeLog:NO];
}

- (void)viewDidLayoutSubviews
{
    _recordWaveView.center = CGPointMake(CGRectGetWidth(self.view.frame) / 2.0, CGRectGetMaxY(_recognizeButton.frame) + 10 + CGRectGetHeight(_recordWaveView.frame) / 2.0);
}



- (void)stopRecognizeIfNeed
{
    if (_isRecording) {
        [_realTimeRecognizer stop];
    }
}

- (void)startAnimation
{
    [_recordWaveView startAnimation];
}

- (void)stopAnimation
{
    [_recordWaveView stopAnimation];
}


- (void)startRecognizeIfNeed
{
    
    /**
        常规APP模式集成        
     */
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord error:&error];
    if (error) {
        NSLog(@"AVAudioSession setCategory error %@", error);
    }
    [[AVAudioSession sharedInstance] setActive:YES error:nil];
    
    /**
      如果应用需要支持画中画模式，需要使用如下方式配置录音
        AVAudioSession *audioSession = [AVAudioSession sharedInstance];
        NSError *error;
        if (![audioSession setCategory:AVAudioSessionCategoryRecord mode:AVAudioSessionModeDefault options:AVAudioSessionCategoryOptionDefaultToSpeaker
        error:&error]) {
            NSLog(@"Failed to set audio session category: %@", error.localizedDescription);
        }
        if (![audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error]) {
            NSLog(@"Failed to override output audio port: %@", error.localizedDescription);
        }
        if (![audioSession setActive:YES error:&error]) {
            NSLog(@"Failed to activate audio session: %@", error.localizedDescription);
        }*/
    
    [self updateVolumeDB:0];
    if (_isRecording) {
        [[AVAudioSession sharedInstance]
         setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:nil];
        [_realTimeRecognizer stop];
    }
    else {
        [_realTimeRecognizer start];
    }
}


- (void)updateButtonTitle
{
    if (_isRecording) {
        [_recognizeButton setTitle:@"停止" forState:UIControlStateNormal];
    }
    else {
        [_recognizeButton setTitle:@"开始" forState:UIControlStateNormal];
    }
}

- (void)updateVolumeDB:(float)volume
{
    if (_volumeDetectSwitch.on) {
        _volumeLabel.text = [NSString stringWithFormat:@"检测音量%.2lf, (%.2lf-%.2lf)", volume, minVolume, maxVolume];
    }
}

#pragma mark - QCloudRealTimeRecognizerDelegate
- (void)realTimeRecognizerOnSliceRecognize:(QCloudRealTimeRecognizer *)recognizer
                                  result:(QCloudRealTimeResult *)result
{
    if (0 == result.code) {
        NSMutableString *combinedText = [NSMutableString stringWithString:@""];
//      话者分离处理逻辑
//        if(result.speakerMessage && [result.speakerMessage count] > 0) {
//            for (SpeakerMessage *message in result.speakerMessage) {
//                NSString *allMessage = [NSString stringWithFormat:@"(speakerID:%ld) %@\n", (long)message.speakerId, message.voiceTextStr];
//                [combinedText appendString:allMessage];
//            }
//        }
        [combinedText appendString:result.recognizedText];
        self.recognizedTextView.text = combinedText;
    }
    NSLog(@"realTimeRecognizerOnSliceRecognize result %@", [result debugDescription]);
    NSLog(@"result json text= %@", result.jsonText);
}

- (void)realTimeRecognizerDidStartRecord:(QCloudRealTimeRecognizer *)recorder error:(NSError *)error
{
    NSLog(@"realTimeRecognizerDidStartRecord error %@", error);
    if (!error) {
        _isRecording = YES;
        self.recognizedTextView.text = @"";
        [self startAnimation];
        [self updateButtonTitle];
        [self setConfigInputsEnabled:NO];
        minVolume = 0; // MAXFLOAT，初始值设置为0，避免数值过大 误导用户为异常。
        maxVolume = 0;
    }
}

- (void)realTimeRecognizerDidStopRecord:(QCloudRealTimeRecognizer *)recorder
{
    NSLog(@"realTimeRecognizerDidStopRecord");
    _isRecording = NO;
    [self stopAnimation];
    [self updateButtonTitle];
    [self setConfigInputsEnabled:YES];
}

// 识别中禁用 host / engine 输入框，避免用户改了配置但当前会话还在跑产生歧义
- (void)setConfigInputsEnabled:(BOOL)enabled {
    self.hostTextField.enabled = enabled;
    self.engineTextField.enabled = enabled;
    CGFloat alpha = enabled ? 1.0 : 0.5;
    self.hostTextField.alpha = alpha;
    self.engineTextField.alpha = alpha;
    // 禁用瞬间如果正在编辑，主动收起键盘
    if (!enabled) {
        [self.view endEditing:YES];
    }
}

- (void)realTimeRecognizerDidUpdateVolumeDB:(QCloudRealTimeRecognizer *)recognizer volume:(float)volume
{
    NSLog(@"realTimeRecognizerDidUpdateVolume volume:%lf", volume);
    _volume = volume;
    maxVolume = volume > maxVolume ? volume : maxVolume;
    minVolume = minVolume == 0.0     ? volume
                : volume < minVolume ? volume
                                     : minVolume;
    [self updateVolumeDB:volume];
}


- (void)realTimeRecognizerOnFlowRecognizeStart:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq
{
    NSLog(@"realTimeRecognizerOnFlowRecognizeStart:%@ seq:%ld", voiceId, seq);
}
/**
 * 检测到语音流结束识别
 * @param voiceId 本次识别对应的voiceId
 */
- (void)realTimeRecognizerOnFlowRecognizeEnd:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq
{
    NSLog(@"realTimeRecognizerOnFlowRecognizeEnd:%@ seq:%ld", voiceId, seq);
}

- (void)realTimeRecognizerOnSegmentSuccessRecognize:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result
{
    QCloudRealTimeResultResponse *currentResult = [result.resultList firstObject];
    NSLog(@"realTimeRecognizerOnSegmentSuccessRecognize:%@ index:%ld", currentResult.voiceTextStr, currentResult.index);
}

- (void)realTimeRecognizerDidFinish:(QCloudRealTimeRecognizer *)recorder result:(NSString *)result
{
    NSLog(@"realTimeRecognizerDidFinish:%@", result);
}

- (void)realTimeRecognizerDidError:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result;
{
    NSString* msg = nil;
    if(result.clientErrCode != QCloudRealTimeClientErrCode_Success){ //客户端返回的错误
        msg = [NSString stringWithFormat:@"realTimeRecognizerDidError:code=%@ errmsg=%@", @(result.clientErrCode),result.clientErrMessage];
        NSLog(@"%@", msg);
        self.recognizedTextView.text = msg;
        
    }else{ //后端返回的错误
        msg = [NSString stringWithFormat:@"realTimeRecognizerDidError:code=%@ errmsg=%@", @(result.code),result.jsonText];
        NSLog(@"%@", msg);
        self.recognizedTextView.text = msg;
    }
}
-(void)realTimeRecognizerOnSliceDetectTimeOut{
    NSLog(@"realTimeRecognizeronSliceDetectTimeOut：触发了静音超时");
    //当QCloudConfig.endRecognizeWhenDetectSilence 打开时，触发静音超时事件会回调此事件
    //当QCloudConfig.endRecognizeWhenDetectSilenceAutoStop 打开时，回调此事件的同时会停止本次识别，此配置默认打开
    
}


- (IBAction)onVolumeDetectSwitch:(id)sender
{
     BOOL on = !((UISwitch *)sender).on;
    if (_isRecording) {
        dispatch_async(dispatch_get_main_queue(), ^{
            ((UISwitch *)sender).on = on;
        });
        [self.view makeToast:@"正在识别中，请停止后设置" duration:1.3 position:CSToastPositionCenter];
    }
    else {
        if (!on) {
            [self updateVolumeDB:0];
        }
        _realTimeRecognizer = nil;
    }
}

- (IBAction)onSilenceEndSwitch:(id)sender
{
    if (_isRecording) {
        BOOL on = !((UISwitch *)sender).on;
        dispatch_async(dispatch_get_main_queue(), ^{
            ((UISwitch *)sender).on = on;
        });
        [self.view makeToast:@"正在识别中，请停止后设置" duration:1.3 position:CSToastPositionCenter];
    }
    else {
        _realTimeRecognizer = nil;
    }
}

- (IBAction)onStartButtonTouched:(id)sender
{
   
    if (!_realTimeRecognizer) {
        //1.创建QCloudConfig实例
        //直接鉴权
        QCloudConfig *config = nil;
        if([kQDToken isEqual:@""]){
            config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey projectId:[kQDProjectId integerValue]];
        }else{
            config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey token:kQDToken projectId:[kQDProjectId integerValue]];
        }
        
/*使用临时密钥鉴权
1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
2.通过临时密钥调用接口
*/
//    QCloudConfig *config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretId:@"填入临时SecretId" secretKey:@"填入临时SecretKey" token:@"对应的token" projectId:[kQDProjectId integerValue]];
        
        
        config.sliceTime = 40;                             //语音分片时长40ms
        config.enableDetectVolume = _volumeDetectSwitch.on; //是否检测音量
        config.endRecognizeWhenDetectSilence = _silenceDetectEndSwitch.on; //是否检测静音
        config.endRecognizeWhenDetectSilenceAutoStop = YES;//是否检测到静音停止识别，默认YES
        config.silenceDetectDuration = 3.0;
        // 引擎类型从输入框读取（去前后空格，为空时回落到默认 16k_zh）
        NSString *engineInput = [self.engineTextField.text stringByTrimmingCharactersInSet:
                                 [NSCharacterSet whitespaceAndNewlineCharacterSet]];
        config.engineType = engineInput.length > 0 ? engineInput : @"16k_zh"; //设置引擎(16k_zh--通用引擎，支持中文普通话+英文),16k_zh_en_sd话者分离引擎，更多引擎请关注官网文档https://cloud.tencent.com/document/product/1093/48982 ，引擎种类持续增加中
         config.reinforceHotword = 1;
        config.requestTimeout = 5;//设置超时时间
         config.noiseThreshold = 0.5;
        // 域名从输入框读取（去前后空格，为空时回落到默认）
        NSString *hostInput = [self.hostTextField.text stringByTrimmingCharactersInSet:
                               [NSCharacterSet whitespaceAndNewlineCharacterSet]];
        config.host = hostInput.length > 0 ? hostInput : @"asr.cloud.tencent.com";
        //是否压缩音频。默认压缩，压缩音频有助于优化弱网或网络不稳定时的识别速度及稳定性
        //SDK历史版本均默认压缩且不提供配置开关，如无特殊需求，建议使用默认值
        config.compression = YES;
        [config setApiParam:@"hotword_list" value:@"腾讯云|10,语音识别|5,ASR|11"];
        [config setApiParam:@"speaker_diarization" value:@(0)];//话者分离开关， 0 关闭 1打开
        //是否保存录音文件到本地 默认关闭，仅限使用SDK内置录音器有效，
//        config.shouldSaveAsFile = YES;
//        config.saveFilePath = [NSTemporaryDirectory() stringByAppendingPathComponent:@"recordaudio.wav"];
        
 
 //2.创建QCloudRealTimeRecognizer实例

        // 使用外部数据源传入语音数据，自定义data
        // source需要实现QCloudAudioDataSource协议
        //         QCloudDemoAudioDataSource *dataSource =
        //         [[QCloudDemoAudioDataSource alloc] init];
        //         dataSource.shouldSave = YES;
        //         NSString *logPath =
        //         [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,
        //         NSUserDomainMask, YES) firstObject]
        //         stringByAppendingString:@"/test"]; dataSource.savePath =
        //         [logPath stringByAppendingPathComponent:[NSString
        //         stringWithFormat:@"VOICE.wav"]]; dataSource.sliceTime = 40;
        //         _realTimeRecognizer = [[QCloudRealTimeRecognizer alloc]
        //         initWithConfig:config dataSource:dataSource];

        //使用SDK内置录音器传入语音数据
        _realTimeRecognizer = [[QCloudRealTimeRecognizer alloc] initWithConfig:config];
        
        
        //3.设置delegate
        _realTimeRecognizer.delegate = self;

    }

    [self startRecognizeIfNeed];
}

- (IBAction)onCancelButtonTouched:(id)sender {
    if (_realTimeRecognizer != nil) {
        [_realTimeRecognizer cancel];
    }
}

/**
 * 设置音频文件保存本地后，每次识别完成保存路径，再次开始识别会清空文件
 * @param audioFilePath 音频文件路径
 * config.shouldSaveAsFile = YES 时此方法才会生效
 */
//- (void)realTimeRecognizerDidSaveAudioDataAsFile:(QCloudRealTimeRecognizer *)recognizer
//                                   audioFilePath:(NSString *)audioFilePath {
//    NSLog(@"realTimeRecognizerDidSaveAudioDataAsFile:%@", audioFilePath);
//}


#pragma mark - 临时热词（writeContent）按钮

- (IBAction)onWriteContentButtonTouched:(id)sender {
    if (!_realTimeRecognizer) {
        [self.view makeToast:@"请先点击开始识别" duration:1.3 position:CSToastPositionCenter];
        return;
    }
    if (!_isRecording) {
        [self.view makeToast:@"识别未开始，无法发送" duration:1.3 position:CSToastPositionCenter];
        return;
    }
    [self sendContextPromptOnce];
}

// 发送一次结构化临时热词，对该会话之后的音频生效
- (void)sendContextPromptOnce {
    QCloudContextPrompt *prompt = [[QCloudContextPrompt alloc] init];
    prompt.hotwordList = @"订金|11,订金1|11,订金2|11";
    prompt.prompt = @[
        [QCloudPromptItem itemWithContextType:@"scene"
                                        texts:@[@"订金的胶带", @"订金", @"胶带反应"]],
        [QCloudPromptItem itemWithContextType:@"domain"
                                        texts:@[@"订金"]],
    ];
    NSError *writeError = [_realTimeRecognizer writeContent:prompt];
    if (writeError) {
        NSLog(@"writeContent failed: %@", writeError);
        [self.view makeToast:[NSString stringWithFormat:@"writeContent 失败: %@", writeError.localizedDescription]
                    duration:1.5
                    position:CSToastPositionCenter];
    } else {
        NSLog(@"writeContent sent");
        [self.view makeToast:@"writeContent 已发送" duration:1.0 position:CSToastPositionCenter];
    }
}


@end
