//
//  QDFlashFileRecognizeViewController+QDFlashFileRecognizeViewController.m
//  TheOneDemo
//
//  Created by dgw on 2021/6/10.
//  Copyright © 2021 eagleychen. All rights reserved.
//

#import "QDFlashFileRecognizeViewController.h"
#import "QDDefine.h"
#import "UIView+Toast.h"
#import <VoiceCommon/QCloudVoiceLogger.h>

#import <QCloudFileRecognizer/QCloudFlashFileRecognizeParams.h>
#import <QCloudFileRecognizer/QCloudFlashFileRecognizer.h>




@interface QDFlashFileRecognizeViewController() <QCloudFlashFileRecognizerDelegate>
@property (weak, nonatomic) IBOutlet UITextView *TextView;
- (IBAction)onRecognizeButtonTouched:(id)sender;

@property (nonatomic, strong) QCloudFlashFileRecognizer *recognizer;
@property (nonatomic, strong) NSString *taskId;
@property (nonatomic, strong) NSString *requestId;

@end

@implementation QDFlashFileRecognizeViewController


- (void)viewDidLoad {
    [super viewDidLoad];
    self.navigationItem.title = @"录音文件识别极速版";
    [self registerSDKLogger];
        //直接鉴权
    if([kQDToken isEqual:@""]){
        _recognizer = [[QCloudFlashFileRecognizer alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey];
    }else{
        _recognizer = [[QCloudFlashFileRecognizer alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey token:kQDToken];
    }
        
        /**使用临时密钥鉴权
           * * 1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
           *   2.通过临时密钥调用接口
        * **/
//        _recognizer = [[QCloudFlashFileRecognizer alloc] initWithAppId:kQDAppId secretId:@"填入临时SecretId" secretKey:@"填入临时SecretKey" token:@"对应的token"];
    _recognizer.delegate = self;
    // Do any additional setup after loading the view.
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

- (IBAction)onRecognizeButtonTouched:(id)sender {
    
    [self.view makeToastActivity:CSToastPositionCenter];
    
    //必须使用[QCloudFlashFileRecognizeParams defaultRequestParams]初始化
    QCloudFlashFileRecognizeParams *params = [QCloudFlashFileRecognizeParams defaultRequestParams];
    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"test1" ofType:@"mp3"];
    NSData *audioData = [[NSData alloc] initWithContentsOfFile:filePath];
    params.audioData = audioData;
    //音频格式。支持 wav、pcm、ogg-opus、speex、silk、mp3、m4a、aac。
    params.voiceFormat = @"mp3";
    
    //以下参数不设置将使用默认值
//    params.engineModelType = @"16k_zh";//引擎模型类型,默认16k_zh。8k_zh：8k 中文普通话通用；16k_zh：16k 中文普通话通用；16k_zh_video：16k 音视频领域。
//    params.filterDirty = 0;;// 0 ：默认状态 不过滤脏话 1：过滤脏话
//    params.filterModal = 0;// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
//    params.filterPunc = 0;// 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
//    params.convertNumMode = 1;;//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
//    params.speakerDiarization = 0; //是否开启说话人分离（目前支持中文普通话引擎），默认为0，0：不开启，1：开启。
//    params.firstChannelOnly = 1; //是否只识别首个声道，默认为1。0：识别所有声道；1：识别首个声道。
//    params.wordInfo = 0; //是否显示词级别时间戳，默认为0。0：不显示；1：显示，不包含标点时间戳，2：显示，包含标点时间戳。
    
//    params.requestTimeoutInternval = 600;//网络超时时间，默认600s,您可以根据业务需求更改此值；
//注意：如果设置过短的时间，网络超时断开将无法获取到识别结果，并且会消耗该音频时长的识别额度
    // params.reinforceHotword = 1; // 开启热词增强
    // params.sentenceMaxLength = 10;
    
    [_recognizer recognize:params];
    
}


#pragma mark - QCloudFlashFileRecognizerDelegate
//上传文件成功回调
- (void)flashFileRecognizer:(QCloudFlashFileRecognizer *_Nullable)recognizer status:(nullable NSInteger *) status text:(nullable NSString *)text resultData:(nullable NSDictionary *) resultData
{
    
    if(status != nil && *status == 0){
        NSLog(@"识别成功");
        //text为识别结果
    }else{
        NSLog(@"上传文件成功，但服务器端识别失败");
        //text为错误原因
    }
    
    NSLog(@"QCloudFlashFileRecognizer text:%@", text);
    self.TextView.text = text;
    
/*以上只解析整段话内容，如需精确解析词级别时间戳 请根据业务需求自行解析resultData，以下为直接打印json结果，格式参考api文档
    https://cloud.tencent.com/document/product/1093/52097
 */
    
//        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:resultData options:NSJSONWritingPrettyPrinted error:nil];
//        NSString* text2 =  [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
//    NSLog(@"QCloudFlashFileRecognizer text2:%@", text2);
//        self.TextView.text = text2;


    
    [self.view hideToastActivity];
}

//识别错误回调，网络错误，返回结果无法解析等
- (void)flashFileRecognizer:(QCloudFlashFileRecognizer *_Nullable)recognizer error:(nullable NSError *)error resultData:(nullable NSDictionary *)resultData
{
    NSLog(@"QCloudFlashFileRecognizer error:%@", error);
        NSString *errorText = [error localizedDescription]; // 默认使用外部错误信息

        if (resultData != nil) {
            NSError *serializationError = nil;
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:resultData options:NSJSONWritingPrettyPrinted error:&serializationError];
            
            if (serializationError) {
                errorText = [serializationError localizedDescription]; // 如果序列化出错，则显示序列化错误
            } else {
                errorText = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            }
        }
        
        self.TextView.text = errorText;
        [self.view hideToastActivity];
}


@end



