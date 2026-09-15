//
//  QCloudAECDataSource.m
//  QCloudSDKDemo
//
//  Created by tbolp on 2023/8/11.
//  Copyright © 2023 Tencent. All rights reserved.
//

#include <cassert>
#include <vector>
#include <mutex>
#include <fstream>

struct Ring {
    struct Info {
        char* data;
        int len;
    };

    std::vector<char> cache;
    int start = 0;
    int end = 0;
    int remain_len = 0;
    Ring(int size) {
        assert(size < 100000000);
        remain_len = size + 1;
        cache.resize(remain_len);
    }
    int size() {
        if (end >= start) {
            return end - start;
        } else {
            return end + remain_len - start;
        }
    }

    void push(char* data, int len) {
        if (len > remain_len - 1) {
            data = data + len - remain_len + 1;
            len = remain_len - 1;
        }
        int remain = remain_len - 1 - size();
        if (remain < len) {
            pop(len - remain);
        }
        if (end >= start) {
            if (remain_len - end > len) {
                memcpy(&cache[end], data, len);
                end = end + len;
            } else {
                int l1 = remain_len - end;
                memcpy(&cache[end], data, l1);
                int l2 = len - l1;
                memcpy(&cache[0], data + l1, l2);
                end = l2;
            }
        } else {
            memcpy(&cache[end], data, len);
            end = end + len;
        }
    }

    std::vector<Info> data() {
        if (end < start) {
            return {Info{.data = &cache[start], .len = remain_len - start},
                    Info{.data = &cache[0], .len = end}};
        } else {
            return {Info{.data = &cache[start], .len = size()}};
        }
    }

    void pop(int len) {
        if (len >= size()) {
            start = end;
        } else {
            start = (start + len) % remain_len;
        }
    }

    void clear() { start = end; }

    size_t capacity() { return cache.size() - 1; }
};

#import "QCloudAECDataSource.h"
#import "AVFoundation/AVFoundation.h"

@interface QCloudAECDataSource()

@property AVAudioEngine* engine;
@property AVAudioPlayerNode* play_node;

@end

@implementation QCloudAECDataSource {
    std::unique_ptr<Ring> cache;
    std::mutex mt;
    std::ofstream of;
    uint32_t datasize;
}


@synthesize audioFilePath;

@synthesize recording;

@synthesize running;

- (instancetype)init {
    self = [super init];
    std::unique_ptr<Ring>(new Ring(5000 * 16 * 2)).swap(cache);
    self.enableAEC = true;
    datasize = 0;
    return self;
}

- (nullable NSData *)readData:(NSInteger)expectLength {
    if(running == false) {
        return nil;
    }
    int remain = expectLength;
    std::unique_ptr<char[]> data(new char[expectLength]);
    std::unique_lock<decltype(self->mt)> lock(self->mt);
    for(auto& it : self->cache->data()) {
        if(it.len >= remain) {
            memcpy(data.get() + expectLength - remain, it.data, remain);
            remain = 0;
            break;
        }else {
            memcpy(data.get() + expectLength - remain, it.data, it.len);
            remain -= it.len;
        }
    }
    self->cache->pop(expectLength - remain);
    lock.unlock();
    if(of.is_open()) {
        of.write(data.get(), expectLength-remain);
        datasize += expectLength - remain;
        of.flush();
    }
    return [[NSData alloc] initWithBytes:data.get() length:expectLength-remain];
}

- (void)start:(nonnull void (^)(BOOL, NSError * _Nonnull))completion {
    NSError* error;
    AVAudioSession* session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeDefault options:AVAudioSessionCategoryOptionDefaultToSpeaker error:&error];
//    [session setCategory:AVAudioSessionCategoryPlayback error:&error];
    if(error != nil) {
        completion(false, error);
        return;
    }
    [session setActive:TRUE error:&error];
    if(error != nil) {
        completion(false, error);
        return;
    }
    self.engine = [[AVAudioEngine alloc] init];
    self.play_node = [[AVAudioPlayerNode alloc] init];
    [self.engine attachNode:self.play_node];
    [self.engine connect:self.play_node to:self.engine.outputNode format:nil];
    if (@available(iOS 13.0, *)) {
        if(self.enableAEC) {
            @try{
                [self.engine.inputNode setVoiceProcessingEnabled:YES error:&error];
            }
            @catch(NSException* e){
                self.engine = nil;
                completion(false, [NSError errorWithDomain:@"aec" code:-1 userInfo:@{NSLocalizedDescriptionKey:@"Please Check AudioSession"}]);
                return;
            }
            if(error != nil) {
                completion(false, error);
                return;
            }
        }
    } else {
        NSError* err = [[NSError alloc] init];
        completion(false, err);
        return;
    }
    
    AVAudioFormat* format = [[AVAudioFormat alloc] initWithCommonFormat:AVAudioPCMFormatInt16 sampleRate:16000 channels:1 interleaved:false];
    AVAudioConverter* converter = [[AVAudioConverter alloc] initFromFormat:[self.engine.inputNode inputFormatForBus:0] toFormat:format];
    [self.engine.inputNode installTapOnBus:0 bufferSize:32000 format:nil block:^(AVAudioPCMBuffer * _Nonnull buffer, AVAudioTime * _Nonnull when) {
        NSError* error;
        AVAudioPCMBuffer* out_buf = [[AVAudioPCMBuffer alloc] initWithPCMFormat:format frameCapacity:(AVAudioFrameCount)format.sampleRate * buffer.frameCapacity / (AVAudioFrameCount)buffer.format.sampleRate];
        __block int num = 0;
        AVAudioConverterOutputStatus status = [converter convertToBuffer:out_buf error:&error withInputFromBlock:^AVAudioBuffer * _Nullable(AVAudioPacketCount inNumberOfPackets, AVAudioConverterInputStatus * _Nonnull outStatus) {
            if(num == 0){
                *outStatus = AVAudioConverterInputStatus_HaveData;
                num = 1;
                return buffer;
            }else{
                *outStatus = AVAudioConverterInputStatus_NoDataNow;
                return nil;
            }
        }];
        if(error != nil) {
            NSLog(@"error %@", [error localizedDescription]);
        }
        if(status == AVAudioConverterOutputStatus_HaveData) {
            std::unique_lock<decltype(self->mt)> lock(self->mt);
            self->cache->push((char*)out_buf.int16ChannelData[0], out_buf.frameLength * out_buf.format.streamDescription->mBytesPerFrame);
        }
    }];
    [self.engine startAndReturnError:&error];
    AVAudioFile* audio_file = [[AVAudioFile alloc] initForReading:[NSURL URLWithString:self.playAudioFileUrl] error:&error];
    [self.play_node scheduleFile:audio_file atTime:nil completionHandler:nil];
    [self.play_node play];
    if(error != nil) {
        completion(false, error);
        return;
    }
    running = true;
    if(self.saveWavUrl) {
        of = std::ofstream([self.saveWavUrl UTF8String]);
        if(!of.is_open()) {
            completion(false, error);
        }
        
        // 写入RIFF头
        of.write("RIFF", 4);
        int32_t filesize = 0; // 文件大小，先占位
        of.write((char*)&filesize, 4);
        of.write("WAVE", 4);

        // 写入fmt子块
        of.write("fmt ", 4);
        int32_t fmtsize = 16; // fmt子块大小
        of.write((char*)&fmtsize, 4);
        int16_t audioformat = 1; // 音频格式
        of.write((char*)&audioformat, 2);
        int16_t channels = 1; // 声道数
        of.write((char*)&channels, 2);
        int32_t samplerate = 16000; // 采样率
        of.write((char*)&samplerate, 4);
        int32_t byterate = samplerate * channels * 2; // 每秒字节数
        of.write((char*)&byterate, 4);
        int16_t blockalign = channels * 2; // 数据块对齐字节数
        of.write((char*)&blockalign, 2);
        int16_t bitspersample = 16; // 每个采样位数
        of.write((char*)&bitspersample, 2);

        // 写入data子块头
        of.write("data", 4);
        of.write((char*)&datasize, 4);
    }
    completion(true, nil);
}

- (void)stop {
    [self.play_node stop];
    [self.engine stop];
    [self.engine disconnectNodeInput:self.engine.outputNode];
    self.play_node = nil;
    self.engine = nil;
    of.seekp(40, of.beg);
    of.write((char*)&datasize, 4);
    datasize += 44;
    of.seekp(4, of.beg);
    of.write((char*)&datasize, 4);
    of.close();
    running = false;
}

@end
