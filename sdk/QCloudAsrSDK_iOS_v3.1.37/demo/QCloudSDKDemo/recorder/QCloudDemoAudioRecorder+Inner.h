//
//  QCloudDemoAudioRecorder+Inner.h
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/19.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QCloudDemoAudioRecorder.h"

NS_ASSUME_NONNULL_BEGIN

@interface QCloudDemoAudioRecorder (Inner)

- (void)notifyDelegateDidUpdateVolume:(float)volume;

- (void)notifyDelegateRecordAudioData:(void *const)bytes
                               length:(NSInteger)length;

@end

NS_ASSUME_NONNULL_END
