//
//  QCloudPcmRecorder.h
//  QCloudSDK
//
//  Created by Sword on 2019/3/4.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AudioToolbox/AudioToolbox.h>

NS_ASSUME_NONNULL_BEGIN

@protocol QDPcmRecorderDelegate <NSObject>

@optional
- (void)didRecordAudioData:(void * const )bytes length:(NSInteger)length;

@end

@interface QDPcmRecorder : NSObject

@property (nonatomic, weak) id<QDPcmRecorderDelegate>delegate;
@property (nonatomic, assign) SInt64 recordPacket; // current packet number in record file
@property (nonatomic, assign, readonly) AudioFileID recordFileId;
@property (nonatomic, assign, readonly) BOOL isRunning;
@property (nonatomic, strong, readonly) NSString *audioFilePath;

- (BOOL)prepareRecord:(NSString *)fileName;
- (void)startRecord;
- (void)stopRecord;

@end

NS_ASSUME_NONNULL_END
