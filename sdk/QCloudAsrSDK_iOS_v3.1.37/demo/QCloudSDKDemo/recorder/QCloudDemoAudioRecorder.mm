//
//  QCloudDemoAudioRecorder.m
//  QCloudSDKDemo
//
//  Created by Sword on 2019/3/4.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QCloudDemoAudioRecorder.h"
#import "QCloudDemoAudioRecorder+Inner.h"
#import <AVFoundation/AVFoundation.h>
#import <VoiceCommon/QCloudVoiceLogger.h>
#include <string.h> // for memset, memcpy

#define kDemoNumberRecordBuffers 3

// float qcloud_demo_caculateVolume(void * const bytes, NSInteger length)
//{
//     double pcmAllLenght = 0;
//     short butterByte[length / 2];
//     memcpy(butterByte, bytes, length);//frame_size * sizeof(short)
//     // 将 buffer 内容取出，进行平方和运算
//     for (int i = 0; i < length / 2; i++) {
//         pcmAllLenght += butterByte[i] * butterByte[i];
//     }
//     // 平方和除以数据总长度，得到音量大小。
//     double mean = pcmAllLenght / (double)length;
//     float volume = 10 * log10(mean);//volume为分贝数大小
//     return volume;
// }

float qcloud_demo_caculate_bm_db(void *data, size_t length, int64_t timestamp,
                                 int channelModel, bool isAudioUnit) {
  int16_t *audioData = (int16_t *)data;
  int sDbChnnel = 0;
  int16_t curr = 0;
  int16_t max = 0;
  size_t traversalTimes = 0;

  if (isAudioUnit) {
    traversalTimes = length / 2; // 由于512后面的数据显示异常  需要全部忽略掉
  } else {
    traversalTimes = length;
  }

  for (int i = 0; i < traversalTimes; i++) {
    curr = *(audioData + i);
    if (curr > max) {
      max = curr;
    }
  }

  if (max < 1) {
    sDbChnnel = -100;
  } else {
    sDbChnnel = (20 * log10((0.0 + max) / 32767) - 0.5);
  }
  return sDbChnnel;
}

void QCloudDemoRecorderCallbackHandler(
    void *inUserData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer,
    const AudioTimeStamp *inStartTime, UInt32 inNumPackets,
    const AudioStreamPacketDescription *inPacketDesc) {
  /**
   * 此处必须添加autoreleasepool,
   * audioqueue回调这里在另外一个线程里，如果不添加自己的autoreleasepool
   * 整个app的autoreleasepool会强引用aqr.delegate导致内层泄漏
   */
  @autoreleasepool {
    [[NSThread currentThread] setName:@"QCloudDemoAudioRecorderThread"];
    QCloudDemoAudioRecorder *aqr =
        (__bridge QCloudDemoAudioRecorder *)inUserData;
    @synchronized(aqr) {
      if (!aqr.isRunning) {
        VOICE_LOG_DEBUG(
            @"QCloudDemoRecorderCallbackHandler is invalid isRunning %d",
            aqr.isRunning);
        return;
      }

      if (inNumPackets > 0) {
        // 是否将语音数据保存到成wav格式的文件
        if (aqr.shouldSaveAsFile && !aqr.shouldPauseAudioWritingToFile) {
          // write packets to file
          if (inBuffer->mAudioData) {
            OSStatus err = AudioFileWritePackets(
                aqr.recordFileId, FALSE, inBuffer->mAudioDataByteSize,
                inPacketDesc, aqr.recordTotalLength, &inNumPackets,
                inBuffer->mAudioData);
            aqr.recordTotalLength += inNumPackets;

            if (err != noErr) {
              VOICE_LOG_DEBUG(@"AudioFileWritePackets() error: %d", (int)err);
            }
          }
        }

        if ([aqr shouldCaculateAudioVolume]) {
          float volume = qcloud_demo_caculate_bm_db(
              inBuffer->mAudioData, inBuffer->mAudioDataByteSize, 0, 1, true);
          [aqr notifyDelegateDidUpdateVolume:volume];
        }
        [aqr notifyDelegateRecordAudioData:inBuffer->mAudioData
                                    length:inBuffer->mAudioDataByteSize];
      }
      // if we're not stopping, re-enqueue the buffe so that it gets filled
      // again
      AudioQueueEnqueueBuffer(inAQ, inBuffer, 0, NULL);
    }
  }
}

@interface QCloudDemoAudioRecorder () {
  AudioStreamBasicDescription _recordFormat;
  AudioQueueRef _audioQueue;
  AudioQueueBufferRef _buffers[kDemoNumberRecordBuffers];
  NSLock *_stopRecordLock;
}

@end

@implementation QCloudDemoAudioRecorder

- (void)notifyDelegateDidUpdateVolume:(float)volume {
  if (self.delegate &&
      [self.delegate respondsToSelector:@selector(didRecordDidUpdateVolume:)]) {
    VOICE_LOG_DEBUG(@"volume--%f", volume);
    [self.delegate didRecordDidUpdateVolume:volume];
  }
}

- (void)notifyDelegateRecordAudioData:(void *const)bytes
                               length:(NSInteger)length {
  if (self.delegate && [self.delegate respondsToSelector:@selector
                                      (didRecordAudioData:length:)]) {
    [self.delegate didRecordAudioData:bytes length:length];
  }
}

- (void)dealloc {
  [_stopRecordLock lock];
  if (_audioQueue) {
    [self stopRecord];
  }
  [_stopRecordLock unlock];
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _shouldSaveAsFile = YES;
    _shouldPauseAudioWritingToFile = NO;
    _isRunning = NO;
    _recordTotalLength = 0;
    memset(&_recordFormat, 0, sizeof(AudioStreamBasicDescription));
    _stopRecordLock = [[NSLock alloc] init];
  }
  return self;
}

- (instancetype)init:(BOOL)shouldSaveAsFile {
  self = [super init];
  if (self) {
    _shouldSaveAsFile = shouldSaveAsFile;
    _shouldPauseAudioWritingToFile = NO;
    _isRunning = NO;
    _recordTotalLength = 0;
    memset(&_recordFormat, 0, sizeof(AudioStreamBasicDescription));
    _stopRecordLock = [[NSLock alloc] init];
  }
  return self;
}

- (BOOL)shouldCaculateAudioVolume {
  BOOL shouldDetect = NO;
  BOOL respond = _delegate && [_delegate respondsToSelector:@selector
                                         (shouldCaculateAudioVolume:)];
  if (respond) {
    shouldDetect = [_delegate shouldCaculateAudioVolume:self];
  }
  return shouldDetect;
}

- (int)computeRecordBufferSize:(AudioStreamBasicDescription *)format
                       seconds:(float)seconds {
  if (_bufferSize) {
    return (int)_bufferSize;
  } else {
    int packets, frames, bytes = 0;
    frames = (int)ceil(seconds * format->mSampleRate);

    if (format->mBytesPerFrame > 0) {
      bytes = 600 * (frames * format->mBytesPerFrame / 1000);
    } else {
      UInt32 maxPacketSize;
      if (format->mBytesPerPacket > 0) {
        maxPacketSize = format->mBytesPerPacket; // constant packet size
      } else {
        UInt32 propertySize = sizeof(maxPacketSize);
        AudioQueueGetProperty(_audioQueue,
                              kAudioQueueProperty_MaximumOutputPacketSize,
                              &maxPacketSize, &propertySize);
      }
      if (format->mFramesPerPacket > 0) {
        packets = frames / format->mFramesPerPacket;
      } else {
        packets = frames; // worst-case scenario: 1 frame in a packet
      }
      if (packets == 0) { // sanity check
        packets = 1;
      }
      bytes = packets * maxPacketSize;
    }
    return bytes;
  }
}

- (void)setupAudioFormat:(UInt32)inFormatID {
  memset(&_recordFormat, 0, sizeof(_recordFormat));
  _recordFormat.mSampleRate = 16000;
  _recordFormat.mChannelsPerFrame = 1;
  _recordFormat.mFormatID = inFormatID;
  if (inFormatID == kAudioFormatLinearPCM) {
    // if we want pcm, default to signed 16-bit little-endian
    _recordFormat.mFormatFlags =
        kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked;
    _recordFormat.mBitsPerChannel = 16;
    _recordFormat.mBytesPerPacket = _recordFormat.mBytesPerFrame =
        (_recordFormat.mBitsPerChannel / 8) * _recordFormat.mChannelsPerFrame;
    _recordFormat.mFramesPerPacket = 1;
  }
}

- (void)copyEncoderCookieToFile {
  UInt32 propertySize;
  // get the magic cookie, if any, from the converter
  OSStatus err = AudioQueueGetPropertySize(
      _audioQueue, kAudioQueueProperty_MagicCookie, &propertySize);

  // we can get a noErr result and also a propertySize == 0
  // -- if the file format does support magic cookies, but this file doesn't
  // have one.
  if (err == noErr && propertySize > 0) {
    Byte *magicCookie = new Byte[propertySize];
    UInt32 magicCookieSize;
    AudioQueueGetProperty(_audioQueue, kAudioQueueProperty_MagicCookie,
                          magicCookie, &propertySize);
    magicCookieSize =
        propertySize; // the converter lies and tell us the wrong size

    // now set the magic cookie on the output file
    UInt32 willEatTheCookie = false;
    // the converter wants to give us one; will the file take it?
    err = AudioFileGetPropertyInfo(_recordFileId,
                                   kAudioFilePropertyMagicCookieData, NULL,
                                   &willEatTheCookie);
    if (err == noErr && willEatTheCookie) {
      err =
          AudioFileSetProperty(_recordFileId, kAudioFilePropertyMagicCookieData,
                               magicCookieSize, magicCookie);
    }
    if (magicCookie) {
      delete[] magicCookie;
      magicCookie = NULL;
    }
  }
}

- (BOOL)prepareRecord:(NSString *)fileName {
  [_stopRecordLock lock];
  OSStatus status;
  int i;
  int bufferByteSize;
  UInt32 size;
  CFURLRef url = nil;
  // specify the recording format
  [self setupAudioFormat:kAudioFormatLinearPCM];
  if (_recordFormat.mSampleRate <= 0 || _recordFormat.mChannelsPerFrame <= 0) {
    VOICE_LOG_ERROR(@"Invalid audio format configuration");
    return NO;
  }
  // create the queue
  status = AudioQueueNewInput(&_recordFormat, QCloudDemoRecorderCallbackHandler,
                              (__bridge void *_Nullable)(self) /* userData */,
                              NULL /* run loop */, NULL /* run loop mode */,
                              0 /* flags */, &_audioQueue);
  if (status != noErr) {
    [_stopRecordLock unlock];
    return NO; // 提前返回
  }

  VOICE_LOG_DEBUG(@"AudioQueueNewInput status %ld", status);
  // get the record format back from the queue's audio converter --
  // the file may require a more specific stream description than was necessary
  // to create the encoder.
  _recordTotalLength = 0;

  size = sizeof(_recordFormat);
  AudioQueueGetProperty(_audioQueue, kAudioQueueProperty_StreamDescription,
                        &_recordFormat, &size);

  if (_shouldSaveAsFile) {
    NSURL *fileURL = [NSURL fileURLWithPath:fileName isDirectory:NO];
    if (!fileURL || fileURL.pathComponents.count == 0) {
      [_stopRecordLock unlock];
      VOICE_LOG_ERROR(@"Invalid file path: %@", fileName);
      return NO;
    }
    _audioFilePath = fileURL.path;
    VOICE_LOG_DEBUG(@"record audio file path %@", _audioFilePath);
    url = CFURLCreateWithString(kCFAllocatorDefault,
                                (__bridge CFStringRef)_audioFilePath, NULL);

    // create the audio file
    status = AudioFileCreateWithURL(url, kAudioFileWAVEType, &_recordFormat,
                                    kAudioFileFlags_EraseFile, &_recordFileId);
    CFRelease(url);
    if (status != noErr) {
      [_stopRecordLock unlock];
      // 替换NSAssert为日志记录和返回错误
      VOICE_LOG_ERROR(@"prepareRecord: AudioFileCreateWithURL失败，错误码：%ld",
                      (long)status);
      return NO;
    }
  }
  // copy the cookie first to give the file object as much info as we can about
  // the data going in not necessary for pcm, but required for some compressed
  // audio
  [self copyEncoderCookieToFile];

#define kDemoBufferDurationSeconds .5

  // allocate and enqueue buffers
  bufferByteSize = [self
      computeRecordBufferSize:&_recordFormat
                      seconds:kDemoBufferDurationSeconds]; // enough bytes for
                                                           // half a second
  for (i = 0; i < kDemoNumberRecordBuffers; ++i) {
    AudioQueueAllocateBuffer(_audioQueue, bufferByteSize, &_buffers[i]);
    AudioQueueEnqueueBuffer(_audioQueue, _buffers[i], 0, NULL);
  }
  [_stopRecordLock unlock];
  return status == 0;
}

- (void)startRecord {
  /*
   2021/05/11--sdk内部将不再调用setCategory，客户在频繁调用setCategory设置扬声器参数时，
   在低端设备中会偶发setCategory失败，在与TTS语音合成频繁交互使用时导致tts合成声音从听筒播放
   */

  //    _sessionCategory = [AVAudioSession sharedInstance].category;
  //    NSError *error = nil;
  //    [[AVAudioSession sharedInstance]
  //    setCategory:AVAudioSessionCategoryPlayAndRecord error:&error]; if
  //    (error) {
  //         QCloudASRLogError(@"error %@", error);
  //    }
  //    [[AVAudioSession sharedInstance] setActive:YES error:nil];

  // start the queue
  _isRunning = true;

  if (_shouldSaveAsFile) {
    [self pauseAudioWritingToFile:NO];
  }

  OSStatus status = AudioQueueStart(_audioQueue, NULL);
  VOICE_LOG_DEBUG(@"AudioQueueStart startRecord status %d",
                  static_cast<int>(status));
}

- (void)stopRecord {
  [_stopRecordLock lock];
  if (!_audioQueue || !_isRunning) {
    return;
  }
  // end recording
  VOICE_LOG_DEBUG(@"QCloudDemoAudioRecorder stopRecord running %d", _isRunning);
  _isRunning = NO;
  OSStatus err;
  err = AudioQueueStop(_audioQueue, YES);
  if (err != noErr) {
    VOICE_LOG_DEBUG(@"AudioQueueStop() error: %d", (int)err);
  }

  err = AudioQueueReset(_audioQueue);
  if (err != noErr) {
    VOICE_LOG_DEBUG(@"AudioQueueReset() error: %d", (int)err);
  }

  // a codec may update its cookie at the end of an encoding session, so reapply
  // it to the file now
  [self copyEncoderCookieToFile];
  // 存在过度释放Buffer
  //    for (int i = 0; i < kDemoNumberRecordBuffers; ++i) {
  //        AudioQueueFreeBuffer(_audioQueue, _buffers[i]);
  //    }
  err = AudioQueueDispose(_audioQueue, YES);
  if (err != noErr) {
    VOICE_LOG_DEBUG(@"AudioQueueDispose() error: %d", (int)err);
  }
  _audioQueue = nil;
  // 释放所有缓冲区
  for (int i = 0; i < kDemoNumberRecordBuffers; ++i) {
    if (_buffers[i]) {
      AudioQueueFreeBuffer(
          nil, _buffers[i]); // 传递nil作为audioQueue，因为队列已被释放
      _buffers[i] = nil;
    }
  }
  if (_shouldSaveAsFile) {
    err = AudioFileClose(_recordFileId);
    if (err != noErr) {
      VOICE_LOG_DEBUG(@"AudioFileClose() error: %d", (int)err);
    }
    _recordFileId = nil;
  }
  [_stopRecordLock unlock];
  /*
   2021/05/11--sdk内部将不再调用setCategory，客户在频繁调用setCategory设置扬声器参数时，
   在低端设备中会偶发setCategory失败，在与TTS语音合成频繁交互使用时导致tts合成声音从听筒播放
   */
  //    NSError *error = nil;
  //    [[AVAudioSession sharedInstance] setCategory:_sessionCategory
  //    error:&error]; if (error) {
  //         QCloudASRLogError(@"error %@", error);
  //    }
}

- (void)pauseAudioWritingToFile:(BOOL)isPaused {
  if (_shouldSaveAsFile) {
    _shouldPauseAudioWritingToFile = isPaused;
  } else {
    VOICE_LOG_DEBUG(@"The audio file is not set to be saved locally, please "
                    @"set shouldSaveAsFile = YES");
  }
}

@end
