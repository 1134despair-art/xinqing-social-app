//
//  QDKeyboardSkipViewController.m
//  asr-sdk-public
//
//  Created by 黄仁斌 on 2020/11/22.
//  Copyright © 2020 eagleychen. All rights reserved.
//

#import "QDKeyboardSkipViewController.h"
#import <AVFoundation/AVFoundation.h>
#import "QCloudDemoAudioDataSource.h"
#import "QDDemoModel.h"
#import "QDDefine.h"
#import "UIView+Toast.h"
#import "QDWaveView.h"
#import "DropdownListView.h"

#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>


#define USERDEFAULT_KEY_REORDTIME        @"USERDEFAULT_KEY_REORDTIME"
#define USERDEFAULT_KEY_OPENMICROPHONE   @"USERDEFAULT_KEY_OPENMICROPHONE"
#define USERDEFAULT_KEY_KEEPMICROPHONERECORDING  @"USERDEFAULT_KEY_KEEPMICROPHONERECORDING"

@interface QDKeyboardSkipViewController ()<QCloudRealTimeRecognizerDelegate>

@property (nonatomic, strong) QCloudRealTimeRecognizer *realTimeRecognizer;
@property (nonatomic, strong) QCloudConfig *config;
@property (nonatomic, strong) NSUserDefaults *userDefault;
@property (nonatomic, assign) BOOL isRecording;
@property (nonatomic, assign) float volume;
@property (nonatomic, assign) QCloudASRNetworkProtocol selectNetworkProtocol;

@property (weak, nonatomic) IBOutlet UITextView *textView;
@property (weak, nonatomic) IBOutlet UILabel *keepTimeLable;
@property (weak, nonatomic) IBOutlet UISlider *keepTimeSlider;
@property (weak, nonatomic) IBOutlet UIButton *recordButton;
@property (weak, nonatomic) IBOutlet UILabel *endRecordTimeLabel;
@property (weak, nonatomic) IBOutlet UIButton *stopMicrophoneButton;
@property (weak, nonatomic) IBOutlet UISwitch *keepMicrophoneRecordingSwitch;
@property (weak, nonatomic) IBOutlet UISwitch *silenceDetectEndSwitch;
@property (weak, nonatomic) IBOutlet UILabel *volumeLabel;

@property (nonatomic, assign) BOOL keepMicrophoneRecording;//识别停止后，保持麦克风持续录音
@property (nonatomic, assign) int microphoneRecordTime;//麦克风关闭时间
@property (nonatomic, strong) dispatch_source_t timer;

@end

@implementation QDKeyboardSkipViewController

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    //外置数据源需要设置下 此方法会卡线程 可以放子线程处理
//    NSLog(@"set set audio session category");
//    NSError *error = nil;
//    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&error];
//    if (error) {
//        NSLog(@"error %@", error);
//    }
//    [[AVAudioSession sharedInstance] setActive:YES error:nil];
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self stopRecognizeIfNeed];

}
- (void)viewDidLoad {
    [super viewDidLoad];
    self.navigationItem.title = @"实时语音识别关麦演示";
    
    self.userDefault = [NSUserDefaults standardUserDefaults];
    
    //设置免跳转时间
    NSNumber *time = [self.userDefault objectForKey:USERDEFAULT_KEY_REORDTIME];
    if (time && [time intValue] > 30) {
        self.keepTimeLable.text = [NSString stringWithFormat:@"%@s",time];
        self.keepTimeSlider.value = [time floatValue]/(300 - 30);
        self.microphoneRecordTime = [time intValue];
    }else {
        time = @(30);
        [self.userDefault setObject:time forKey:USERDEFAULT_KEY_REORDTIME];
        self.keepTimeLable.text = [NSString stringWithFormat:@"%@s",time];
        self.keepTimeSlider.value = 0;
        self.microphoneRecordTime = [time intValue];
    }
    
    
    //设置麦克风录音时间
    NSNumber *recordType = [self.userDefault objectForKey:USERDEFAULT_KEY_KEEPMICROPHONERECORDING];
    if (recordType && [recordType intValue] == 1) {
        self.keepMicrophoneRecordingSwitch.on = YES;
        self.keepMicrophoneRecording = YES;
        self.keepTimeSlider.enabled = YES;
    }else {
        self.keepMicrophoneRecordingSwitch.on = NO;
        self.keepMicrophoneRecording = NO;
        self.keepTimeSlider.enabled = NO;
        [self.userDefault setObject:@(0) forKey:USERDEFAULT_KEY_KEEPMICROPHONERECORDING];
    }
    //麦克风状态
    [self.userDefault setObject:@(0) forKey:USERDEFAULT_KEY_OPENMICROPHONE];
    
    [self createUI];
    
    //配置语音识别网络协议
    self.selectNetworkProtocol = QCloudASRNetworkProtocolWS;
    
}


- (void)createUI {
    //网络协议选择器
    DropdownListItem *item1 = [[DropdownListItem alloc] initWithItem:@"0" itemName:@"WSS"];
    DropdownListItem *item2 = [[DropdownListItem alloc] initWithItem:@"1" itemName:@"WS"];
    
    DropdownListView *ListView = [[DropdownListView alloc] initWithDataSource:@[item1, item2]];
    ListView.frame = CGRectMake(20, 320, 150, 30);
    ListView.textColor = UIColor.systemYellowColor;
    ListView.selectedIndex = 0;
    [ListView setViewBorder:0.5 borderColor:[UIColor grayColor] cornerRadius:2];
    [self.view addSubview:ListView];
    
     __weak typeof(self) weakSelf = self;
    [ListView setDropdownListViewSelectedBlock:^(DropdownListView *dropdownListView) {
        __strong typeof(self) strongSelf = weakSelf;
        if (strongSelf.stopMicrophoneButton.isEnabled) {
            [strongSelf.view makeToast:@"请关闭麦克风后设置" duration:1.3 position:CSToastPositionCenter];
            dropdownListView.selectedIndex = strongSelf.selectNetworkProtocol;
            return;
        }
        strongSelf.selectNetworkProtocol = [dropdownListView.selectedItem.itemId integerValue];
        if (strongSelf.config) {
            strongSelf.config.netWorkProtocol = strongSelf.selectNetworkProtocol;
        }
    }];
}

- (void)stopRecognizeIfNeed {
    [self removeKeepMicrophoneRecordingTimer];

    if (_isRecording) {
        _isRecording = NO;
        [_realTimeRecognizer stop];
    }
}

- (void)startRecognizeIfNeed {
    [self removeKeepMicrophoneRecordingTimer];
    if (_isRecording) {
        _isRecording = NO;
        [_realTimeRecognizer stop];
    }
    else {
        //注意:使用内置录音器前需要先设置Category状态为可录音模式
        NSError *error = nil;
        [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord error:&error];
        if (error) {
            NSLog(@"AVAudioSession setCategory error %@", error);
        }
        [[AVAudioSession sharedInstance] setActive:YES error:nil];
        
        [_realTimeRecognizer start];
    }
}

- (void)startRecognize:(BOOL)didStart {
    if (didStart) {
        _textView.text = @"";
    }
}

- (void)updateButtonTitle {
    if (_isRecording) {
        [self.recordButton setTitle:@"停止" forState:UIControlStateNormal];
        self.stopMicrophoneButton.enabled = YES;
        [self.stopMicrophoneButton setTitle:@"麦克风已开启" forState:UIControlStateNormal];
    }
    else {
        [self.recordButton setTitle:@"开始" forState:UIControlStateNormal];
        if (!_keepMicrophoneRecording) {
            self.stopMicrophoneButton.enabled = NO;
            [self.stopMicrophoneButton setTitle:@"麦克风已关闭" forState:UIControlStateNormal];
        }
    }
}

//保持麦克风录音
- (IBAction)onOpenReCordSwitch:(UISwitch *)sender {
    BOOL on = !((UISwitch *)sender).on;
   if (_stopMicrophoneButton.isEnabled) {
       dispatch_async(dispatch_get_main_queue(), ^{
           ((UISwitch *)sender).on = on;
       });
       [self.view makeToast:@"请关闭麦克风后设置" duration:1.3 position:CSToastPositionCenter];
       return;
   }
    
    self.config.keepMicrophoneRecording = sender.on;
    self.keepMicrophoneRecording = sender.on;
    self.keepTimeSlider.enabled = sender.on;
    [self.userDefault setObject:@(sender.on ? 1 : 0) forKey:USERDEFAULT_KEY_KEEPMICROPHONERECORDING];
    [self.userDefault synchronize];
    [self removeKeepMicrophoneRecordingTimer];
}

//设置麦克风录音时长
- (IBAction)sliderforBackRecord:(UISlider *)sender {
    self.microphoneRecordTime = 30 + 270 * sender.value;
    self.keepTimeLable.text = [NSString stringWithFormat:@"%ds",self.microphoneRecordTime];
    [self.userDefault setObject:@(self.microphoneRecordTime) forKey:USERDEFAULT_KEY_REORDTIME];
}

//静音结束识别
- (IBAction)onSilenceEndSwitch:(id)sender {
    BOOL on = !((UISwitch *)sender).on;
   if (_stopMicrophoneButton.isEnabled) {
       dispatch_async(dispatch_get_main_queue(), ^{
           ((UISwitch *)sender).on = on;
       });
       [self.view makeToast:@"请关闭麦克风后设置" duration:1.3 position:CSToastPositionCenter];
       return;
   }else {
       _config.endRecognizeWhenDetectSilence = _silenceDetectEndSwitch.on; //是否开启静音检测
   }
}

- (IBAction)stopMicrophone:(id)sender {
    [self removeKeepMicrophoneRecordingTimer];
    
    if (self.keepMicrophoneRecordingSwitch.on) {
        
        dispatch_async(dispatch_get_main_queue(), ^{
            self.stopMicrophoneButton.enabled = NO;
            [self.stopMicrophoneButton setTitle:@"麦克风已关闭" forState:UIControlStateNormal];
            self.endRecordTimeLabel.text = @"";
        });
        
        [self.realTimeRecognizer stopMicrophone];
        
    }else {
        if (_isRecording) {
            [self.realTimeRecognizer stopMicrophone];
        }
    }
}

- (IBAction)onStartButtonTouched:(id)sender {
   
    if (!_realTimeRecognizer) {
        //1.创建QCloudConfig实例
        //直接鉴权
        _config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey projectId:[kQDProjectId integerValue]];
        
        /**使用临时密钥鉴权
           * * 1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
           *   2.通过临时密钥调用接口
        * **/
//        _config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretId:@"填入临时SecretId" secretKey:@"填入临时SecretKey" token:@"对应的token" projectId:[kQDProjectId integerValue]];
        
        _config.sliceTime = 100;          //语音分片时长100ms
        _config.enableDetectVolume = YES; //是否检测音量
        _config.endRecognizeWhenDetectSilence = _silenceDetectEndSwitch.on; //是否检测静音
        _config.endRecognizeWhenDetectSilenceAutoStop = YES; //检测到静音是否停止识别，默认开启
        _config.silenceDetectDuration = 3.0f;
        _config.requestTimeout = 5;
        _config.shouldSaveAsFile = YES;//音频文件缓存本地
        _config.keepMicrophoneRecording = _keepMicrophoneRecording;
        _config.netWorkProtocol = self.selectNetworkProtocol;

        _config.engineType = @"16k_zh";//设置引擎，不设置默认16k_zh
        
        //是否压缩音频。默认压缩，压缩音频有助于优化弱网或网络不稳定时的识别速度及稳定性，但会对嘈杂环境音频识别准确度产生轻微影响，
        //SDK历史版本均默认压缩且不提供配置开关，如无特殊需求，建议使用默认值
        _config.compression = YES;
        
        //2.创建QCloudRealTimeRecognizer实例
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

        _realTimeRecognizer = [[QCloudRealTimeRecognizer alloc] initWithConfig:_config];

        //3.设置delegate
        _realTimeRecognizer.delegate = self;
        
    }
    [self startRecognizeIfNeed];

}

- (void)keepMicrophoneRecordingCountdown:(NSInteger)microphoneRecordDuration {
    if (!_keepMicrophoneRecording || !_stopMicrophoneButton.isEnabled) {
        [self.userDefault setObject:@(0) forKey:USERDEFAULT_KEY_OPENMICROPHONE];
        return;
    }else {
        [self.userDefault setObject:@(1) forKey:USERDEFAULT_KEY_OPENMICROPHONE];
    }
    [self removeKeepMicrophoneRecordingTimer];
    __block NSInteger time = microphoneRecordDuration;
    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
    dispatch_source_t _timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
    dispatch_source_set_timer(_timer, dispatch_walltime(NULL, 0), 1.0 * NSEC_PER_SEC, 0);
    
    __weak __typeof__(self) weakSelf = self;
    dispatch_source_set_event_handler(_timer, ^{
        __strong __typeof(self) strongSelf = weakSelf;
        
        if(time <= 0){
            dispatch_source_cancel(_timer);
            self.timer = nil;
            [strongSelf.realTimeRecognizer stopMicrophone];
            [strongSelf.userDefault setObject:@(0) forKey:USERDEFAULT_KEY_OPENMICROPHONE];
            
            __weak __typeof__(self) weakSelf = self;
            dispatch_async(dispatch_get_main_queue(), ^{
                __strong __typeof(self) strongSelf = weakSelf;
                
                strongSelf.endRecordTimeLabel.text = @"";
                strongSelf.stopMicrophoneButton.enabled = NO;
                [strongSelf.stopMicrophoneButton setTitle:@"麦克风已关闭" forState:UIControlStateNormal];
            });
            
        } else {
            __weak __typeof__(self) weakSelf = self;
            dispatch_async(dispatch_get_main_queue(), ^{
                __strong __typeof(self) strongSelf = weakSelf;
                strongSelf.endRecordTimeLabel.text = [NSString stringWithFormat:@"剩余录音时间%lds", (long)time];
                NSLog(@"%@,%@",self->_endRecordTimeLabel.text,[NSThread currentThread]);
                time--;
            });
        }
    });
    
    dispatch_resume(_timer);
    self.timer = _timer;
}

- (void)removeKeepMicrophoneRecordingTimer {
    if (self.timer) {
        dispatch_cancel(self.timer);
        self.endRecordTimeLabel.text = @"";
        self.timer = nil;
    }
}


#pragma mark - QCloudRealTimeRecognizerDelegate
- (void)realTimeRecognizerOnSliceRecognize:(QCloudRealTimeRecognizer *)recognizer
                                  result:(QCloudRealTimeResult *)result {
    if (0 == result.code) {
        self.textView.text = result.recognizedText;
    }
    
    NSLog(@"realTimeRecognizerOnSliceRecognize result %@", [result debugDescription]);
}

- (void)realTimeRecognizerDidStartRecord:(QCloudRealTimeRecognizer *)recorder error:(NSError *)error {
    NSLog(@"realTimeRecognizerDidStartRecord error %@", error);
    if (!error) {
        _isRecording = YES;
        [self startRecognize:YES];
        [self updateButtonTitle];
        [self.userDefault setObject:@(1) forKey:USERDEFAULT_KEY_OPENMICROPHONE];
        [self removeKeepMicrophoneRecordingTimer];
    }
}

- (void)realTimeRecognizerDidStopRecord:(QCloudRealTimeRecognizer *)recorder {
    NSLog(@"realTimeRecognizerDidStopRecord,Thread %@",[NSThread currentThread]);

    _isRecording = NO;
    [self updateButtonTitle];
    
    if (self.timer) {
        [self removeKeepMicrophoneRecordingTimer];
        [self keepMicrophoneRecordingCountdown:self.microphoneRecordTime];
    }else {
        [self keepMicrophoneRecordingCountdown:self.microphoneRecordTime];
    }
    
}

- (void)realTimeRecognizerDidUpdateVolume:(QCloudRealTimeRecognizer *)recognizer volume:(float)volume {
    NSLog(@"realTimeRecognizerDidUpdateVolume volume:%lf", volume);
    _volume = volume;
    _volumeLabel.text = [NSString stringWithFormat:@"音量：%.f",volume];
}


- (void)realTimeRecognizerOnFlowRecognizeStart:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq {
    NSLog(@"realTimeRecognizerOnFlowRecognizeStart:%@ seq:%ld", voiceId, seq);
}
/**
 * 检测到语音流结束识别
 * @param voiceId 本次识别对应的voiceId
 */
- (void)realTimeRecognizerOnFlowRecognizeEnd:(QCloudRealTimeRecognizer *)recognizer voiceId:(NSString *)voiceId seq:(NSInteger)seq {
    NSLog(@"realTimeRecognizerOnFlowRecognizeEnd:%@ seq:%ld", voiceId, seq);
}

- (void)realTimeRecognizerOnSegmentSuccessRecognize:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result {
    QCloudRealTimeResultResponse *currentResult = [result.resultList firstObject];
    NSLog(@"realTimeRecognizerOnSegmentSuccessRecognize:%@ index:%ld", currentResult.voiceTextStr, currentResult.index);
}

- (void)realTimeRecognizerDidFinish:(QCloudRealTimeRecognizer *)recorder result:(NSString *)result {
    NSLog(@"realTimeRecognizerDidFinish:%@", result);
}

- (void)realTimeRecognizerDidError:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result;
{
    NSString* msg = nil;
    if(result.clientErrCode != QCloudRealTimeClientErrCode_Success){ //客户端返回的错误
        msg = [NSString stringWithFormat:@"realTimeRecognizerDidError:code=%@ errmsg=%@", @(result.clientErrCode),result.clientErrMessage];
        NSLog(@"%@", msg);
        
    }else{ //后端返回的错误
        msg = [NSString stringWithFormat:@"realTimeRecognizerDidError:code=%@ errmsg=%@", @(result.code),result.message];
        NSLog(@"%@", msg);
    }

    [self.view makeToast:msg duration:1.3 position:CSToastPositionCenter];
}
-(void)realTimeRecognizerOnSliceDetectTimeOut{
    NSLog(@"realTimeRecognizeronSliceDetectTimeOut：触发了静音超时");
    //当QCloudConfig.endRecognizeWhenDetectSilence 打开时，触发静音超时事件会回调此事件
    //当QCloudConfig.endRecognizeWhenDetectSilenceAutoStop 打开时，回调此事件的同时会停止本次识别，此配置默认打开
    
}
/**
 * 设置音频文件保存本地后，每次识别完成保存路径，再次开始识别会清空文件
 * @param audioFilePath 音频文件路径
 */
- (void)realTimeRecognizerDidSaveAudioDataAsFile:(QCloudRealTimeRecognizer *)recognizer
                                   audioFilePath:(NSString *)audioFilePath {
    NSLog(@"realTimeRecognizerDidSaveAudioDataAsFile:%@", audioFilePath);
}

@end
