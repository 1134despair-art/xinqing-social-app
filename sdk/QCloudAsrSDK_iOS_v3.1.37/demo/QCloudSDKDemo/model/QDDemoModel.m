//
//  QDDemoModel.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QDDemoModel.h"

@implementation QDDemoModel

- (instancetype)initWithName:(NSString *)name type:(QDDemoModelType)type
{
    self = [super init];
    if (self) {
        _name = name;
        _type = type;
    }
    return self;
}
+ (NSArray *)getSentenceModels
{
    NSMutableArray *models = [[NSMutableArray alloc] init];
    [models addObject:[[QDDemoModel alloc] initWithName:@"一句话识别(Url)" type:QDDemoModelSentenceUrl]];
    [models addObject:[[QDDemoModel alloc] initWithName:@"一句话识别(Data)" type:QDDemoModelSentenceData]];
    [models addObject:[[QDDemoModel alloc] initWithName:@"一句话识别(Params)" type:QDDemoModelSentenceCustom]];
    [models addObject:[[QDDemoModel alloc] initWithName:@"一句话识别(开始录音)" type:QDDemoModelSentenceRecorder]];
    return models;
}

+ (NSArray *)getRealTimeModels
{
    NSMutableArray *models = [[NSMutableArray alloc] init];
    [models addObject:[[QDDemoModel alloc] initWithName:@"实时语音识别(内置录音器)" type:QDDemoModelRealTimeDefault]];
    [models addObject:[[QDDemoModel alloc] initWithName:@"实时语音识别(上层传入语音数据)" type:QDDemoModelRealTimeCustom]];
    return models;
}

@end
