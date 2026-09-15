//
//  DemoViewController2.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QDDemoViewController.h"
#import "QDOneSentenceRecognizeViewController.h"
#import "QDRealTimeRecognizeViewController.h"
#import "QDKeyboardSkipViewController.h"
#import "QDFlashFileRecognizeViewController.h"
#import "QDRealTimeRecognizeAECViewController.h"
#import "QDConfigViewController.h"
#import "UIView+Toast.h"
#import "QDDefine.h"

#define kDemoListCellIdentifier @"kDemoListCellIdentifier"



#import <QCloudRealTime/QCloudRealTimeRecognizer.h>
#import <QCloudRealTime/QCloudConfig.h>
#import <QCloudRealTime/QCloudRealTimeResult.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>
#import <QCloudFileRecognizer/QCloudFlashFileRecognizer.h>
#import <QCloudOneSentence/QCloudSentenceRecognizer.h>

@interface QDDemoViewController ()<UITableViewDelegate, UITableViewDataSource>

@property (weak, nonatomic) IBOutlet UIButton *settingBtn;
@property (weak, nonatomic) IBOutlet UITableView *tableView;
@property (nonatomic, strong) NSArray *dataSource;

@end

@implementation QDDemoViewController

- (IBAction)onSetting:(id)sender {
    UIViewController *vc = [self.storyboard instantiateViewControllerWithIdentifier:NSStringFromClass([QDConfigViewController class])];
    [self.navigationController pushViewController:vc animated:YES];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    NSString *version = [QCloudRealTimeRecognizer getVersion];
    NSString *version2 = [QCloudFlashFileRecognizer getVersion];
    NSString *version3 = [QCloudSentenceRecognizer getVersion];
    NSLog(@"v1 = %@, v2 = %@, v3 = %@", version, version2, version3);
    
    self.navigationItem.title = @"示例";
    [self.tableView registerClass:[UITableViewCell class] forCellReuseIdentifier:kDemoListCellIdentifier];
    self.tableView.delegate = self;
    self.tableView.dataSource = self;
    _dataSource = @[
                    @{@"text": @"一句话识别", @"class" : NSStringFromClass([QDOneSentenceRecognizeViewController class])},
                    @{@"text" : @"实时语音识别", @"class" : NSStringFromClass([QDRealTimeRecognizeViewController class])},
                    @{@"text" : @"录音文件识别极速版", @"class" : NSStringFromClass([QDFlashFileRecognizeViewController class])},
                    @{@"text" : @"实时语音识别关麦演示", @"class" : NSStringFromClass([QDKeyboardSkipViewController class])},
                    @{@"text" : @"实时语音识别回声消除演示", @"class" : NSStringFromClass([QDRealTimeRecognizeAECViewController class])},
    ];
    
}


#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return [_dataSource count];
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kDemoListCellIdentifier forIndexPath:indexPath];
    cell.textLabel.text = _dataSource[indexPath.row][@"text"];
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
    
    if (indexPath.row == 3 ) {
        NSString *classname = _dataSource[indexPath.row][@"class"];
        UIViewController *vc = [NSClassFromString(classname) new];
        [self.navigationController pushViewController:vc animated:YES];
        return;
    }
    UIViewController *vc = [self.storyboard instantiateViewControllerWithIdentifier:_dataSource[indexPath.row][@"class"]];
    [self.navigationController pushViewController:vc animated:YES];
}

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    NSLog(@"seque %@", segue);
}



- (void)checkClick:(UIButton *)sender {
    sender.selected = !sender.selected;
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setInteger:sender.selected forKey:@"authorize"];
    [defaults synchronize];
}

@end
