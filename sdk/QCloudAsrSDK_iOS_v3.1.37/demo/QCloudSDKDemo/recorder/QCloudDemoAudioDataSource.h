//
//  QCloudDemoAudioDataSource.h
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>

NS_ASSUME_NONNULL_BEGIN

@class QCloudConfig;

@interface QCloudDemoAudioDataSource : NSObject<QCloudAudioDataSource>

@property(nonatomic, assign) BOOL shouldSave; // YES or NO
@property(nonatomic, strong)
    NSString *savePath; // 文件路径NSString *savePath = [NSTemporaryDirectory()
                        // stringByAppendingPathComponent:@"recordaudio.wav"];
@property(nonatomic, assign) int sliceTime; // 40

// 获取当前data长度
- (NSInteger)dataLength;

@end

NS_ASSUME_NONNULL_END
