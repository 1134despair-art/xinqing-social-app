//
//  QCloudAECDataSource.h
//  QCloudSDKDemo
//
//  Created by tbolp on 2023/8/11.
//  Copyright © 2023 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <QCloudRealTime/QCloudAudioDataSource.h>

NS_ASSUME_NONNULL_BEGIN

@interface QCloudAECDataSource : NSObject<QCloudAudioDataSource>

@property Boolean enableAEC; // 开启AEC
@property NSString* playAudioFileUrl; // 需要播放的音频文件,设置后开始启动识别会播放此文件
@property NSString* saveWavUrl; // 保存的录音的文件,文件格式为wav,设置为nil将不会保存

@end

NS_ASSUME_NONNULL_END
