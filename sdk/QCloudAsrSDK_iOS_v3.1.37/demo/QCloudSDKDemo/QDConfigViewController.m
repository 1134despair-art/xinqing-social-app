//
//  QDConfigViewController.m
//  QCloudSDKDemo
//
//  Created by tbolp on 2024/3/6.
//  Copyright © 2024 Tencent. All rights reserved.
//

#import "QDConfigViewController.h"
#import "QDDefine.h"

@interface QDConfigViewController () <UITextFieldDelegate>

@property (weak, nonatomic) IBOutlet UITextField *appid_editor;
@property (weak, nonatomic) IBOutlet UITextField *secretid_editor;
@property (weak, nonatomic) IBOutlet UITextField *secretkey_editor;
@property (weak, nonatomic) IBOutlet UITextField *token_editor;

@end

@implementation QDConfigViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.navigationItem.title = @"设置";
    [self.appid_editor setText:kQDAppId];
    [self.secretid_editor setText:kQDSecretId];
    [self.secretkey_editor setText:kQDSecretKey];
    [self.token_editor setText:kQDToken];
    self.appid_editor.delegate = self;
    self.secretid_editor.delegate = self;
    self.secretkey_editor.delegate = self;
    self.token_editor.delegate = self;
}

- (IBAction)onSave:(id)sender {
    kQDAppId = self.appid_editor.text;
    kQDSecretId = self.secretid_editor.text;
    kQDSecretKey = self.secretkey_editor.text;
    kQDToken = self.token_editor.text;
    [self hideInput];
}

- (IBAction)onClear:(id)sender {
    kQDAppId = @"";
    kQDSecretId = @"";
    kQDSecretKey = @"";
    [self.appid_editor setText:kQDAppId];
    [self.secretid_editor setText:kQDSecretId];
    [self.secretkey_editor setText:kQDSecretKey];
    [self.token_editor setText:kQDToken];
    [self hideInput];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
    [self hideInput];
    return YES;
}

- (void)hideInput {
    [self.appid_editor resignFirstResponder];
    [self.secretid_editor resignFirstResponder];
    [self.secretkey_editor resignFirstResponder];
    [self.token_editor resignFirstResponder];
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
