//
//  QCloudDemoAudioDataSource.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/4/12.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QCloudDemoAudioDataSource.h"
#import "QCloudDemoAudioRecorder.h"
#import <AVFoundation/AVFoundation.h>
#import <QCloudRealTime/QCloudMacrosDefine.h>
#import <VoiceCommon/QCloudVoiceLogger.h>
#import <pthread.h>

@interface QCloudDemoAudioDataSource () <QCloudDemoAudioRecorderDelegate>

@property(nonatomic, strong) QCloudDemoAudioRecorder *recorder;
@property(nonatomic, strong) NSMutableData *data;
@property(nonatomic, assign) NSInteger offset;
@property(nonatomic, assign) NSInteger expectLength;
@property(nonatomic, assign) BOOL isRunning;

@property(nonatomic, assign) pthread_mutex_t mutex;
@property(nonatomic, assign) pthread_cond_t cond;

@end

@implementation QCloudDemoAudioDataSource

@synthesize running = _running;

- (instancetype)init {
  self = [super init];
  if (self) {
    _data = [[NSMutableData alloc] init];
    _shouldSave = NO;
    _savePath = [NSTemporaryDirectory()
        stringByAppendingPathComponent:@"recordaudio.wav"];
    _sliceTime = 40;
    pthread_mutexattr_t attr;
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_NORMAL);
    pthread_mutex_init(&_mutex, &attr);
    pthread_mutexattr_destroy(&attr);
    pthread_cond_init(&_cond, NULL);
  }
  return self;
}

- (void)dealloc {
  pthread_mutex_destroy(&_mutex);
  pthread_cond_destroy(&_cond);
}

/**
 * SDK会调用start方法，实现此协议的类需要初始化数据源。didStart 是否开始  YES 往下执行，NO不会往下执行
 */
- (void)start:(void (^)(BOOL didStart, NSError *error))completion {
  [self startRecognizeWithRecorder:completion];
}

- (void)stop
{
  dispatch_semaphore_t stopSemaphore = dispatch_semaphore_create(0);
  dispatch_time_t timeout =
      dispatch_time(DISPATCH_TIME_NOW, (int64_t).3 * NSEC_PER_SEC);
  dispatch_semaphore_wait(stopSemaphore, timeout);

  if (_recorder && [_recorder isRunning]) {
    [_recorder stopRecord];
    _isRunning = NO;
  }
  pthread_cond_broadcast(&_cond);
}

/**
 * SDK会调用此方法读取语音数据，如果缓存的数据不足expectLength字节返回nil
 */
- (NSData *)readData:(NSInteger)expectLength {
  NSData *data = nil;

  pthread_mutex_lock(&_mutex);

  _expectLength = expectLength;
  if (_isRunning &&
      (![_data length] || [_data length] < _offset + expectLength)) {
    struct timespec ts;
    // 获取当前时间
    clock_gettime(CLOCK_REALTIME, &ts);
    // 设置超时时间
    ts.tv_sec += 0;             // 秒
    ts.tv_nsec += 10 * 1000000; // 纳秒
    if (ts.tv_nsec >= 1000000000) {
      ts.tv_sec += 1;
      ts.tv_nsec -= 1000000000;
    }
    pthread_cond_timedwait(&_cond, &_mutex, &ts);
  }

  if ([_data length] >= _offset + expectLength) {
    data = [_data subdataWithRange:NSMakeRange(_offset, expectLength)];
    _offset += expectLength;

    if (_offset > 80000) {
      [_data replaceBytesInRange:NSMakeRange(0, _offset)
                       withBytes:NULL
                          length:0];
      _offset = 0;
    }
  }

  pthread_mutex_unlock(&_mutex);
  return data;
}

- (BOOL)running
{
  return _isRunning;
}

- (NSString *)audioFilePath {
  return self.recorder.audioFilePath ?: @"";
}

- (BOOL)recording {
  return self.recorder ? [_recorder isRunning] : NO;
}

- (void)setRunning:(BOOL)running {
  _isRunning = running;
  if (_recorder
          .shouldSaveAsFile) { // 如果保存录音文件到本地，数据源停止的时候，录音文件也暂停写入
    [_recorder pauseAudioWritingToFile:!_isRunning];
  }

  if (!_isRunning) {
    pthread_cond_broadcast(&_cond);
  }
}

- (void)__startRecognizeWithRecorder:(void (^)(BOOL didStart,
                                               NSError *error))completion {
  if (!_recorder) {
    _recorder = [[QCloudDemoAudioRecorder alloc] init:self.savePath];
    _recorder.bufferSize = self.sliceTime * (kQCloudDefaultSampleRate / 1000) *
                           (kQCloudDefaultBitsPerChannel /
                            8); // 由于录制的位深是16(2byte),读取时也要乘以位深;
    _expectLength = _recorder.bufferSize;
    _recorder.delegate = self;
  }

  if (![_recorder isRunning]) {
    BOOL result = [_recorder prepareRecord:self.savePath];
    if (result) {
      if (completion) {
        completion(YES, nil);
      }
      _offset = 0;
      pthread_mutex_lock(&_mutex);
      _data = [[NSMutableData alloc] init];
      pthread_mutex_unlock(&_mutex);
      [_recorder startRecord];
    }
  } else {

    if (_recorder.shouldSaveAsFile) {
      [_recorder pauseAudioWritingToFile:NO];
    }

    if (completion) {
      completion(YES, nil);
    }
  }
  _isRunning = YES;
}

- (void)startRecognizeWithRecorder:(void (^)(BOOL didStart,
                                             NSError *error))completion {
  VOICE_LOG_DEBUG(@"QCloudDemoAudioDataSource startRecognizeWithRecorder");

  AVAuthorizationStatus status = [AVCaptureDevice
      authorizationStatusForMediaType:AVMediaTypeAudio]; // 麦克风权限
  BOOL granted = NO;
  switch (status) {
  case AVAuthorizationStatusAuthorized:
    granted = YES;
    VOICE_LOG_DEBUG(
        @"QCloudDemoAudioDataSource QCloudMicrophonePermission Authorized");
    break;
  case AVAuthorizationStatusDenied:
    VOICE_LOG_DEBUG(
        @"QCloudDemoAudioDataSource QCloudMicrophonePermission Denied");
    break;
  case AVAuthorizationStatusNotDetermined: {
    VOICE_LOG_DEBUG(@"QCloudDemoAudioDataSource QCloudMicrophonePermission not "
                    @"Determined request");
    [AVCaptureDevice
        requestAccessForMediaType:AVMediaTypeAudio
                completionHandler:^(BOOL granted) { // 麦克风权限
                  if (granted) {
                    VOICE_LOG_DEBUG(@"QCloudDemoAudioDataSource Authorized");
                    [self __startRecognizeWithRecorder:completion];
                  } else {
                    VOICE_LOG_DEBUG(
                        @"QCloudDemoAudioDataSource QCloudMicrophonePermission "
                        @"Denied or Restricted");
                    NSError *error = [[NSError alloc]
                        initWithDomain:@"QCloudDemoAudioDataSource "
                                       @"QCloudMicrophonePermission"
                                  code:-1
                              userInfo:@{
                                @"Reason" : @"please guarantee microphone "
                                            @"permission is granted"
                              }];
                    if (completion) {
                      completion(NO, error);
                    }
                  }
                }];
    break;
  }
  case AVAuthorizationStatusRestricted:
    VOICE_LOG_DEBUG(
        @"QCloudDemoAudioDataSource QCloudMicrophonePermission Restricted");
    break;
  default:
    break;
  }

  if (![self checkAudioCategory]) {
    VOICE_LOG_DEBUG(@"QCloudDemoAudioDataSource QCloudMicrophonePermission "
                    @"Denied or Restricted");
    NSError *error = [[NSError alloc]
        initWithDomain:@"QCloudDemoAudioDataSource QCloudMicrophonePermission"
                  code:-1
              userInfo:@{
                @"Reason" : @"please guarantee microphone permission is granted"
              }];
    if (completion) {
      completion(NO, error);
    }
    return;
  }

  if (granted) {
    [self __startRecognizeWithRecorder:completion];
  } else {
    NSError *error = [[NSError alloc]
        initWithDomain:@"QCloudMicrophonePermission"
                  code:-1
              userInfo:@{
                @"Reason" : @"please guarantee microphone permission is granted"
              }];
    if (completion) {
      completion(NO, error);
    }
  }
}

- (BOOL)checkAudioCategory {
  if ([[AVAudioSession sharedInstance].category
          isEqualToString:AVAudioSessionCategoryRecord] ||
      [[AVAudioSession sharedInstance].category
          isEqualToString:AVAudioSessionCategoryPlayAndRecord] ||
      [[AVAudioSession sharedInstance].category
          isEqualToString:AVAudioSessionCategoryMultiRoute]) {
    return YES;
  }
  return NO;
}

- (void)didRecordAudioData:(void *const)bytes length:(NSInteger)length {
  if (!_isRunning) {
    return;
  }
  pthread_mutex_lock(&_mutex);
  if (_data) {
    [_data appendBytes:bytes length:length];
    if ([_data length] >= _offset + _expectLength) {
      pthread_cond_signal(&_cond);
    }
  }
  pthread_mutex_unlock(&_mutex);
}

// 获取当前data长度
- (NSInteger)dataLength {
  NSInteger dataLength = 0;
  pthread_mutex_lock(&_mutex);
  dataLength = _data.length - _offset;
  pthread_mutex_unlock(&_mutex);
  return dataLength;
}

@end
