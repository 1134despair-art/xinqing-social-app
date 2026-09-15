//
//  QRealTimeRecognizeAECViewController.m
//  QCloudSDKDemo
//
//  Created by tbolp on 2023/8/14.
//  Copyright © 2023 Tencent. All rights reserved.
//

#import "QDRealTimeRecognizeAECViewController.h"
#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import "QCloudAECDataSource.h"
#import "QDDefine.h"

@interface QDRealTimeRecognizeAECViewController ()<QCloudRealTimeRecognizerDelegate,UITextFieldDelegate> {
}
@property (weak, nonatomic) IBOutlet UISwitch *enableAEC;
@property (weak, nonatomic) IBOutlet UIButton *ctlBtn;

@property (strong, nonatomic) QCloudRealTimeRecognizer* asrTask;
@property (strong, nonatomic) QCloudAECDataSource* dataSource;
@property (nonatomic, assign) BOOL isRunning;
@property (nonatomic, strong) NSString *recognizedText;
@property (weak, nonatomic) IBOutlet UITextView *resultText;
@property (weak, nonatomic) IBOutlet UISwitch *switchBtn;
@property (weak, nonatomic) IBOutlet UITextView *file_name;
- (void)resetRecognitionTask;
@end

@implementation QDRealTimeRecognizeAECViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.isRunning = NO;
    self.recognizedText = @"";
    self.file_name.textContainer.maximumNumberOfLines = 1;
    self.file_name.delegate = self;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
    [self.file_name resignFirstResponder];
    return YES;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    [self.file_name resignFirstResponder];
}

- (BOOL)textView:(UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text {
    if([text isEqualToString:@"\n"]) {
        [textView resignFirstResponder];
        return NO;
    }
    return YES;
}

- (IBAction)onClick:(id)sender {
    if(self.isRunning) {
        [self.asrTask stop];
        [self.ctlBtn setEnabled:FALSE];
    }else {
        self.recognizedText = @"";
        self.resultText.text = @"";
        QCloudConfig *config = [[QCloudConfig alloc] initWithAppId:kQDAppId secretId:kQDSecretId secretKey:kQDSecretKey projectId:[kQDProjectId integerValue]];
        config.endRecognizeWhenDetectSilenceAutoStop = false;
        config.endRecognizeWhenDetectSilence = false;
        config.noiseThreshold = 0.5;
        self.dataSource = [[QCloudAECDataSource alloc] init];
        self.dataSource.enableAEC = [self.switchBtn isOn];
        self.dataSource.playAudioFileUrl = [[[NSBundle mainBundle] URLForResource:@"output" withExtension:@"wav"] absoluteString];
        self.dataSource.saveWavUrl = [NSTemporaryDirectory() stringByAppendingFormat:@"/%@.wav", self.file_name.text];
        self.asrTask = [[QCloudRealTimeRecognizer alloc] initWithConfig:config dataSource:self.dataSource];
        self.asrTask.delegate = self;
        self.isRunning = true;
        [self.ctlBtn setTitle:@"停止" forState:UIControlStateNormal];
        [self.asrTask start];
    }
}

- (void)viewWillDisappear:(BOOL)animated {
    if(self.isRunning) {
        [self.asrTask stop];
    }
}

- (IBAction)share:(id)sender {
    if(self.dataSource.saveWavUrl == nil) {
        self.resultText.text = @"没有找到该文件";
        return;
    }
    NSString *sharePath = self.dataSource.saveWavUrl;
    NSURL *fileURL = [NSURL fileURLWithPath:sharePath];
    UIActivityViewController *activityViewController = [[UIActivityViewController alloc] initWithActivityItems:@[fileURL] applicationActivities:nil];
    activityViewController.popoverPresentationController.sourceView = self.view;
    [self presentViewController:activityViewController animated:YES completion:nil];
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

- (void)realTimeRecognizerOnSegmentSuccessRecognize:(nonnull QCloudRealTimeRecognizer *)recognizer result:(nonnull QCloudRealTimeResult *)result { 
    self.recognizedText = [NSString stringWithFormat:@"%@%@", self.recognizedText, result.text];
    dispatch_async(dispatch_get_main_queue(), ^{
        self.resultText.text = self.recognizedText;
    });
}

- (void)realTimeRecognizerOnSliceRecognize:(nonnull QCloudRealTimeRecognizer *)recognizer result:(nonnull QCloudRealTimeResult *)result {
    NSString *currentText = [NSString stringWithFormat:@"%@%@", self.recognizedText, result.text];
    dispatch_async(dispatch_get_main_queue(), ^{
        self.resultText.text = currentText;
    });
}

- (void)realTimeRecognizerDidError:(QCloudRealTimeRecognizer *)recognizer result:(QCloudRealTimeResult *)result {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self resetRecognitionTask];
        if(result.clientErrCode == 0){
            self.resultText.text = result.message;
        }else{
            self.resultText.text = result.clientErrMessage;
        }
    });
}

- (void)realTimeRecognizerDidFinish:(QCloudRealTimeRecognizer *)recognizer result:(NSString *)result {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self resetRecognitionTask];
    });
}

- (void)resetRecognitionTask {
    [self.ctlBtn setTitle:@"识别" forState:UIControlStateNormal];
    [self.ctlBtn setEnabled:TRUE];
    self.asrTask = nil;
    self.isRunning = false;
}

@end
