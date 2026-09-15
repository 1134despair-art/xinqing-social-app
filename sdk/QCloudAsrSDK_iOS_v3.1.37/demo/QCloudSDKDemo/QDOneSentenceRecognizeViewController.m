//
//  ViewController.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/2/26.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QDOneSentenceRecognizeViewController.h"

#import <AVFoundation/AVFoundation.h>
#import "UIView+Toast.h"
#import "QDDemoModel.h"
#import "QDDefine.h"
#import "QDWaveView.h"
#import <VoiceCommon/QCloudVoiceLogger.h>

#import <QCloudOneSentence/QCloudSentenceRecognizeParams.h>
#import <QCloudOneSentence/QCloudSentenceRecognizer.h>


#define kOneSentenceCellIdentifier @"kOneSentenceCellIdentifier"

@interface QDOneSentenceRecognizeViewController ()<QCloudSentenceRecognizerDelegate>

@property (nonatomic, assign) BOOL isRecording;
@property (nonatomic, assign) float volume;
@property (nonatomic, strong) NSArray *dataSource;
@property (nonatomic, strong) QCloudSentenceRecognizer *recognizer;

@property (strong, nonatomic) IBOutlet UITextView *recognizedTextView;
@property (weak,   nonatomic) IBOutlet UITableView *tableView;
@property (strong, nonatomic) QDWaveView *recordWaveView;


@end

@implementation QDOneSentenceRecognizeViewController
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self registerSDKLogger];
    self.navigationItem.title = @"一句话识别";
    _dataSource = [QDDemoModel getSentenceModels];
    self.recognizedTextView.text = @"";
    _tableView.tableFooterView = self.recognizedTextView;
    [_tableView registerClass:[UITableViewCell class] forCellReuseIdentifier:kOneSentenceCellIdentifier];
    
    //appid secretId secretKey参数，从腾讯云官网申请
    NSString *appId = kQDAppId;
    NSString *secretId = kQDSecretId;
    NSString *secretKey = kQDSecretKey;    
    
    //直接鉴权
    if([kQDToken isEqual:@""]){
        _recognizer = [[QCloudSentenceRecognizer alloc] initWithAppId:appId secretId:secretId secretKey:secretKey];
    }else{
        _recognizer = [[QCloudSentenceRecognizer alloc] initWithAppId:appId secretId:secretId secretKey:secretKey token:kQDToken];
    }
    
    
    /**使用临时密钥鉴权
       * * 1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
       *   2.通过临时密钥调用接口
    * **/
//    _recognizer = [[QCloudSentenceRecognizer alloc]  initWithAppId:kQDAppId secretId:@"填入临时SecretId" secretKey:@"填入临时SecretKey" token:@"对应的token"];
    
    
    //设置delegate，相关回调方法见QCloudOneSentenceRecognizerDelegate定义
    _recognizer.delegate = self;
    
    // Do any additional setup after loading the view, typically from a nib.
    _volume = -40;
    __weak typeof(self)weakSelf = self;
    _recordWaveView = [[QDWaveView alloc] initWithFrame:CGRectMake(0, CGRectGetHeight(self.view.bounds)/2.0 - 50.0, CGRectGetWidth(self.view.bounds), 100.0)];
    _recordWaveView.waverLevelCallback = ^(QDWaveView * waver) {
        CGFloat normalizedValue = weakSelf.volume;
        normalizedValue = pow (8, normalizedValue / 40.0);
        weakSelf.recordWaveView.level = normalizedValue;
    };
    _recordWaveView.hidden = YES;
    [self.view addSubview:_recordWaveView];
}

- (void)viewDidLayoutSubviews
{
    _recordWaveView.center = CGPointMake(CGRectGetWidth(self.view.frame) / 2.0, CGRectGetHeight(self.view.frame) / 2.0 + 20);
}

- (void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
    [self stopRecognizeIfNeed];
  
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


- (void)stopRecognizeIfNeed
{
    if (_isRecording) {
        _isRecording = NO;
        [_recognizer stopRecognizeWithRecorder];
    }
}

- (void)updateUIForRecognitionStart:(BOOL)didStart
{
    if (didStart) {
        self.recognizedTextView.text = @"";
        [self.view makeToastActivity:CSToastPositionCenter];
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

/**
 * 通过传递语音数据调用一句话识别
 */
- (void)recognizeWithData
{
    //语音数据
//    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"recordedFile" ofType:@"wav"];
    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"30s" ofType:@"wav"];
    NSData *audioData = [[NSData alloc] initWithContentsOfFile:filePath];
    //指定语音数据 语音数据格式 采样率
    BOOL didStart = [_recognizer recoginizeWithData:audioData voiceFormat:@"wav" EngSerViceType:@"16k_zh"];
    [self updateUIForRecognitionStart:didStart];
}

/**
 * 通过传递语音url调用一句话识别
 */
- (void)recognizeWithUrl
{    
    //语音数据url
    NSString *url = @"https://asr-audio-1256237915.cos.ap-shanghai.myqcloud.com/30s.wav";
    //指定语音数据url 语音数据格式 识别引擎
    BOOL didStart = [_recognizer recoginizeWithUrl:url voiceFormat:@"wav" EngSerViceType:@"16k_zh"];
    [self updateUIForRecognitionStart:didStart];
}

/**
 * 通过传递自定义参数调用一句话识别
 */
- (void)recognizeWithParams
{
    //获取一个已设置默认参数params
    QCloudSentenceRecognizeParams *params = [_recognizer defaultRecognitionParams];
    
//  通过语音url请求, 此4个参数必须设置
//    params.url = url;
//    params.voiceFormat = @"mp3";
//    params.sourceType = QCloudAudioSourceTypeUrl;
//    params.engSerViceType = @"16k_zh";
    
    
    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"test2" ofType:@"mp3"];
    NSData *audioData = [[NSData alloc] initWithContentsOfFile:filePath];
    //通过语音数据发起请求, 此4个参数必须设置
    params.data = audioData;
    params.voiceFormat = @"mp3";  
    params.sourceType = QCloudAudioSourceTypeAudioData; // QCloudAudioSourceTypeUrl or QCloudAudioSourceTypeAudioData
    params.engSerViceType = @"16k_zh"; //"16k_zh"通用普通话引擎 引擎模型，具体类型参数详见官网API文档，例如粤语：params.engSerViceType = @“16k_ca”;

    //以下参数选填
    params.filterDirty = 0; //是否过滤脏词
    params.filterModal = 0;//是否过语气词
    params.filterPunc = 0; //是否过滤标点符号
    params.convertNumMode = 1;//是否进行阿拉伯数字智能转换
    params.wordInfo = 1;//是否显示词级别时间戳,
    //params.hotwordId = @"" //热词id
    params.reinforceHotword = 1;// 开启热词增强
    
    BOOL didStart = [_recognizer recognizeWithParams:params];
    
    [self updateUIForRecognitionStart:didStart];
}

/**
 * 通过SDK内置录音器调用一句话识别
 */
- (void)recognizeWithRecorder
{
    if (_isRecording) {
        _isRecording = NO;
        [_recognizer stopRecognizeWithRecorder];
    }
    else {
//        if (![[AVAudioSession sharedInstance].category isEqualToString:AVAudioSessionCategoryRecord]) {
            NSLog(@"set set audio session category");
            NSError *error = nil;
            [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord error:&error];
            if (error) {
                NSLog(@"error %@", error);
                self.recognizedTextView.text = [NSString stringWithFormat:@"%@", error];
                return;
            }
            [[AVAudioSession sharedInstance] setActive:YES error:nil];
//        }
        self.recognizedTextView.text = @"";
        [_recognizer startRecognizeWithRecorder:@"16k_zh"];
    }
}

#pragma mark - QCloudOneSentenceRecognizerDelegate
- (void)oneSentenceRecognizerDidRecognize:(QCloudSentenceRecognizer *)recognizer text:(NSString *)text error:(NSError *)error resultData:(NSDictionary *)resultData
{
    
   // NSDictionary *response = resultData[@"Response"];
   // NSString* RequestId = response[@"RequestId"];
    
    NSString *rawDataString = @"";
    if (resultData) {
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:resultData options:0 error:nil];
        rawDataString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
//    NSLog(@"oneSentenceRecognizerDidRecognize 识别结果: %@ error : %@ callStackSymbols:%@", rawDataString, error, [NSThread callStackSymbols]);
    if (error) {
        NSLog(@"oneSentenceRecognizerDidRecognize 识别结果: error: %@ resultData:%@", [error localizedDescription], rawDataString);
    }
    else {
        NSLog(@"oneSentenceRecognizerDidRecognize 识别结果: %@", text);
    }
    self.recognizedTextView.text = rawDataString;
    [self.view hideToastActivity];
}


- (void)oneSentenceRecognizerDidStartRecord:(QCloudSentenceRecognizer *)recognizer error:(NSError *)error
{
    NSLog(@"oneSentenceRecognizerDidStartRecord");
    if (error) {
        NSLog(@"oneSentenceRecognizerDidStartRecord error %@", error);
    }
    else {
        _isRecording = YES;
        [self startAnimation];
        QDDemoModel *model = _dataSource[[_dataSource count] - 1];
        model.recording = _isRecording;
        //一句话识别音频文件限制60s以内，超过60s将会识别失败，这里做个定时限制
        [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(AutoStop) object:nil];
        [self performSelector:@selector(AutoStop) withObject:nil afterDelay:59];
    }
    [_tableView reloadData];
}

- (void)oneSentenceRecognizerDidEndRecord:(QCloudSentenceRecognizer *)recognizer audioFilePath:(nonnull NSString *)audioFilePath
{
    NSLog(@"oneSentenceRecognizerDidEndRecord audioFilePath %@",audioFilePath);
    _isRecording = NO;
    [self stopAnimation];
    [self updateUIForRecognitionStart:YES];
}

- (void)oneSentenceRecognizerDidUpdateVolume:(QCloudSentenceRecognizer *)recognizer volume:(float)volume
{
    NSLog(@"oneSentenceRecognizerDidUpdateVolume %f", volume);  
    _volume = volume;
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return [_dataSource count];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    QDDemoModel *model = _dataSource[indexPath.row];
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kOneSentenceCellIdentifier forIndexPath:indexPath];
    cell.textLabel.text = model.name;
    if (QDDemoModelSentenceRecorder == model.type) {
        if (model.recording) {
            NSString *highlightText = @"停止录音";
            NSString *text = [NSString stringWithFormat:@"一句话识别(%@)", highlightText];
            NSMutableAttributedString *attributedString = [[NSMutableAttributedString alloc] initWithString:text];
            [attributedString addAttribute:NSForegroundColorAttributeName value:(id)cell.textLabel.textColor range:NSMakeRange(0, [text length])];
            [attributedString addAttribute:NSForegroundColorAttributeName value:(id)[UIColor colorWithRed:0 green:142/ 255.0 blue:0 alpha:1.0] range:NSMakeRange(5, [highlightText length] + 1)];
            cell.textLabel.attributedText = attributedString;
        }
        else {
            cell.textLabel.text = @"一句话识别(开始录音)";
        }
    }
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
    
    QDDemoModel *model = _dataSource[indexPath.row];
    switch (model.type) {
        case QDDemoModelSentenceUrl:
            [self recognizeWithUrl];
            break;
        case QDDemoModelSentenceData:
            [self recognizeWithData];
            break;
        case QDDemoModelSentenceCustom:
            [self recognizeWithParams];
            break;
        case QDDemoModelSentenceRecorder: {
            [self recognizeWithRecorder];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                model.recording = self->_isRecording;
                [tableView reloadRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationNone];
            });
            break;
        }
        default:
            break;
    }
}

-(void)AutoStop {
    if (!_isRecording){
        return;
    }
    [self recognizeWithRecorder];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        QDDemoModel *model = self->_dataSource[3];
        model.recording = self->_isRecording;
        [self->_tableView reloadData];
    });
}



@end
