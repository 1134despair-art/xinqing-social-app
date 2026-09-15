//
//  QCloudDemoAudioRecorder.h
//  QCloudSDKDemo
//
//  Created by Sword on 2019/3/4.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <AudioToolbox/AudioToolbox.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

float qcloud_demo_caculate_bm_db(void *data, size_t length, int64_t timestamp,
                                 int channelModel, bool isAudioUnit);

@class QCloudDemoAudioRecorder;

@protocol QCloudDemoAudioRecorderDelegate <NSObject>

@optional
- (BOOL)shouldCaculateAudioVolume:(QCloudDemoAudioRecorder *)recorder;

- (void)didRecordAudioData:(void *const)bytes length:(NSInteger)length;

- (void)didRecordDidUpdateVolume:(float)volume;
@end

@interface QCloudDemoAudioRecorder : NSObject

@property(nonatomic, weak) id<QCloudDemoAudioRecorderDelegate> delegate;

@property(nonatomic, assign)
    SInt64 recordTotalLength; // current record total audio length
@property(nonatomic, assign) NSInteger bufferSize;
@property(nonatomic, assign, readonly) AudioFileID recordFileId;
@property(nonatomic, assign, readonly) BOOL isRunning;
@property(nonatomic, assign, readonly) BOOL shouldSaveAsFile;
@property(nonatomic, assign, readonly) BOOL shouldPauseAudioWritingToFile;
@property(nonatomic, copy, readonly) NSString *audioFilePath;
@property(nonatomic, assign) float volume;
@property(nonatomic, copy) NSString *sessionCategory;

/**
 * @param shouldSaveAsFile 是否将音频文件以wav格式保存到本地
 */
- (instancetype)init:(BOOL)shouldSaveAsFile;

- (BOOL)shouldCaculateAudioVolume;

- (BOOL)prepareRecord:(NSString *)fileName;

- (void)startRecord;

- (void)stopRecord;

/**
 * @param isPaused 是否暂停将音频文件以wav格式保存到本地
 */
- (void)pauseAudioWritingToFile:(BOOL)isPaused;
@end

NS_ASSUME_NONNULL_END
