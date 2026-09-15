//
//  QDDemoModel.h
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, QDDemoModelType) {
    QDDemoModelNone = -1,                 // 未知
    QDDemoModelSentenceUrl = 0,           // 语音url
    QDDemoModelSentenceData,              // 语音数据
    QDDemoModelSentenceCustom,
    QDDemoModelSentenceRecorder,
    QDDemoModelRealTimeDefault,
    QDDemoModelRealTimeCustom,
};

@interface QDDemoModel : NSObject

@property (nonatomic, strong) NSString *name;
@property (nonatomic, assign) BOOL recording;
@property (nonatomic, assign) QDDemoModelType type;

+ (NSArray *)getSentenceModels;
+ (NSArray *)getRealTimeModels;

@end

NS_ASSUME_NONNULL_END
