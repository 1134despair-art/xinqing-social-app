//
//  QCloudPcmRecorder.m
//  QCloudSDK
//
//  Created by Sword on 2019/3/4.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import "QDPcmRecorder.h"
#include <string.h>    // for memset, memcpy

#define kNumberRecordBuffers    3
#define kAudioSampleRate        16000

void QDemoRecorderCallbackHandler(void *                               inUserData,
                                  AudioQueueRef                         inAQ,
                                  AudioQueueBufferRef                   inBuffer,
                                  const AudioTimeStamp *                inStartTime,
                                  UInt32                                inNumPackets,
                                  const AudioStreamPacketDescription*   inPacketDesc)
{
    
    QDPcmRecorder *aqr = (__bridge QDPcmRecorder *)inUserData;
    if (!aqr.isRunning) {
        NSLog(@"QCloudRecorderCallbackHandler is invalid");
        return;
    }
//    NSLog(@"QCloudRecorderCallbackHandler inNumPackets %ld", inNumPackets);
    if (inNumPackets > 0) {
        // write packets to file，取实时流式pcm数据不需要保存到wav本地文件
        AudioFileWritePackets(aqr.recordFileId, FALSE, inBuffer->mAudioDataByteSize,
                              inPacketDesc, aqr.recordPacket, &inNumPackets, inBuffer->mAudioData);
        aqr.recordPacket += inNumPackets;
        
        if (aqr.delegate && [aqr.delegate respondsToSelector:@selector(didRecordAudioData:length:)]) {
            [aqr.delegate didRecordAudioData:inBuffer->mAudioData length:inBuffer->mAudioDataByteSize];
        }
    }

    // if we're not stopping, re-enqueue the buffe so that it gets filled again
    AudioQueueEnqueueBuffer(inAQ, inBuffer, 0, NULL);
}


@interface QDPcmRecorder()
{
    
    AudioStreamBasicDescription    _recordFormat;            
    AudioQueueRef                  _audioQueue;
    AudioQueueBufferRef            _buffers[kNumberRecordBuffers];
}
@end

@implementation QDPcmRecorder

- (void)dealloc
{
    AudioQueueDispose(_audioQueue, YES);
    AudioFileClose(_recordFileId);
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        _isRunning = NO;
        _recordPacket = 0;
        memset(&_recordFormat, 0, sizeof(AudioStreamBasicDescription));
    }
    return self;
}

- (int)computeRecordBufferSize:(AudioStreamBasicDescription *)format seconds:(float)seconds
{
    return 600 * (kAudioSampleRate / 1000);
}


- (void)setupAudioFormat:(UInt32)inFormatID
{
    memset(&_recordFormat, 0, sizeof(_recordFormat));
    
    //    UInt32 size = sizeof(mRecordFormat.mSampleRate);
    //    XThrowIfError(AudioSessionGetProperty(    kAudioSessionProperty_CurrentHardwareSampleRate,
    //                                        &size,
    //                                        &mRecordFormat.mSampleRate), "couldn't get hardware sample rate");
    //
    //    size = sizeof(mRecordFormat.mChannelsPerFrame);
    //    XThrowIfError(AudioSessionGetProperty(    kAudioSessionProperty_CurrentHardwareInputNumberChannels,
    //                                        &size,
    //                                        &mRecordFormat.mChannelsPerFrame), "couldn't get input channel count");
    
    _recordFormat.mSampleRate = kAudioSampleRate;
    _recordFormat.mChannelsPerFrame = 1;
    _recordFormat.mFormatID = inFormatID;
    if (inFormatID == kAudioFormatLinearPCM)
    {
        // if we want pcm, default to signed 16-bit little-endian
        _recordFormat.mFormatFlags = kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked;
        _recordFormat.mBitsPerChannel = 16;
        _recordFormat.mBytesPerPacket = _recordFormat.mBytesPerFrame = (_recordFormat.mBitsPerChannel / 8) * _recordFormat.mChannelsPerFrame;
        _recordFormat.mFramesPerPacket = 1;
    }
}

- (void)copyEncoderCookieToFile
{
    UInt32 propertySize;
    // get the magic cookie, if any, from the converter
    OSStatus err = AudioQueueGetPropertySize(_audioQueue, kAudioQueueProperty_MagicCookie, &propertySize);
    
    // we can get a noErr result and also a propertySize == 0
    // -- if the file format does support magic cookies, but this file doesn't have one.
    if (err == noErr && propertySize > 0) {
        Byte *magicCookie = new Byte[propertySize];
        UInt32 magicCookieSize;
        AudioQueueGetProperty(_audioQueue, kAudioQueueProperty_MagicCookie, magicCookie, &propertySize);
        magicCookieSize = propertySize;    // the converter lies and tell us the wrong size
        
        // now set the magic cookie on the output file
        UInt32 willEatTheCookie = false;
        // the converter wants to give us one; will the file take it?
        err = AudioFileGetPropertyInfo(_recordFileId, kAudioFilePropertyMagicCookieData, NULL, &willEatTheCookie);
        if (err == noErr && willEatTheCookie) {
            err = AudioFileSetProperty(_recordFileId, kAudioFilePropertyMagicCookieData, magicCookieSize, magicCookie);
        }
        delete[] magicCookie;
        magicCookie = NULL;
    }
}

- (BOOL)prepareRecord:(NSString *)fileName
{
    OSStatus status;
    int i;
    int bufferByteSize;
    UInt32 size;
    CFURLRef url = nil;
    // specify the recording format
    [self setupAudioFormat:kAudioFormatLinearPCM];
    // create the queue
    status = AudioQueueNewInput(
                       &_recordFormat,
                       QDemoRecorderCallbackHandler,
                        (__bridge void * _Nullable)(self) /* userData */,
                       NULL /* run loop */, NULL /* run loop mode */,
                       0 /* flags */, &_audioQueue);
    NSLog(@"AudioQueueNewInput status %d", (int)status);
    // get the record format back from the queue's audio converter --
    // the file may require a more specific stream description than was necessary to create the encoder.
    _recordPacket = 0;
    
    size = sizeof(_recordFormat);
    AudioQueueGetProperty(_audioQueue, kAudioQueueProperty_StreamDescription,
                          &_recordFormat, &size);

    _audioFilePath = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
    NSLog(@"record audio file path %@", _audioFilePath);
    url = CFURLCreateWithString(kCFAllocatorDefault, (__bridge CFStringRef)_audioFilePath, NULL);

    // create the audio file
    status = AudioFileCreateWithURL(url, kAudioFileWAVEType, &_recordFormat, kAudioFileFlags_EraseFile, &_recordFileId);
    CFRelease(url);
    NSAssert(status == 0, @"AudioFileCreateWithURL failed");

    // copy the cookie first to give the file object as much info as we can about the data going in
    // not necessary for pcm, but required for some compressed audio
    [self copyEncoderCookieToFile];

    #define kBufferDurationSeconds .5

    // allocate and enqueue buffers
    bufferByteSize = [self computeRecordBufferSize:&_recordFormat seconds:kBufferDurationSeconds];// enough bytes for half a second
    for (i = 0; i < kNumberRecordBuffers; ++i) {
        AudioQueueAllocateBuffer(_audioQueue, bufferByteSize, &_buffers[i]);
        AudioQueueEnqueueBuffer(_audioQueue, _buffers[i], 0, NULL);
    }    
    return status == 0;
}

- (void)startRecord
{
//    BOOL success = [self prepareRecord:@"pcmaudio.wav"];
//    if (success) {
        // start the queue
        _isRunning = true;
        OSStatus status = AudioQueueStart(_audioQueue, NULL);
        NSLog(@"AudioQueueStart status %d", (int)status);
//    }
}

- (void)stopRecord
{
    // end recording    
    _isRunning = NO;
    AudioQueueStop(_audioQueue, YES);
    // a codec may update its cookie at the end of an encoding session, so reapply it to the file now
    [self copyEncoderCookieToFile];
    AudioQueueDispose(_audioQueue, YES);
    AudioFileClose(_recordFileId);
    for (int i = 0; i < kNumberRecordBuffers; ++i) {
        AudioQueueFreeBuffer(_audioQueue, _buffers[i]);
    }
}
@end
