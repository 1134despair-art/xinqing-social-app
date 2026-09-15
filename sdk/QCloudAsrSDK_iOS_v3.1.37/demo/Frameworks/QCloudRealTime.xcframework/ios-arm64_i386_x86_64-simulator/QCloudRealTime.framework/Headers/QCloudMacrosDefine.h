//
//  MWMacrosDefine.h
//  MWVoiceAssistant
//
//  Created by Sword on 02/04/2018.
//  Copyright © 2018 Tencent. All rights reserved.
//

#ifndef QCloudMacrosDefine_h
#define QCloudMacrosDefine_h

#import <Foundation/Foundation.h>


// 操作系统版本号
#define IOS_VERSION ([[[UIDevice currentDevice] systemVersion] floatValue])

// UIColor 相关的宏，用于快速创建一个 UIColor 对象，更多创建的宏可查看 UIColor+QMUI.h
#define UIColorMake(r, g, b) [UIColor colorWithRed:r/255.0 green:g/255.0 blue:b/255.0 alpha:1]

#define UIColorMakeWithRGBA(r, g, b, a) [UIColor colorWithRed:r/255.0 green:g/255.0 blue:b/255.0 alpha:a/1.0]


// Whether is Dictionary class
#define QCloudIsDictionaryClass(__obj) ((__obj) && [(__obj) isKindOfClass:[NSDictionary class]])
// Whether is Array class
#define QCloudIsArrayClass(__obj) ((__obj) && [(__obj) isKindOfClass:[NSArray class]])
// Whether is String class
#define QCloudIsStringClass(__obj) ((__obj) && [(__obj) isKindOfClass:[NSString class]])
// Value to Dictionary or nil
#define QCloudToDictionaryOrNil(__obj) ([(__obj) isKindOfClass:[NSDictionary class]] ? (__obj) : nil)
// Value to Array or nil
#define QCloudToArrayOrNil(__obj) ([(__obj) isKindOfClass:[NSArray class]] ? (__obj) : nil)
// Value to String or nil
#define QCloudToString(__obj) ([(__obj) isKindOfClass:[NSString class]] ? (__obj) : @"")

#define QCloudToIsValidString(__obj) (__obj && [(__obj) isKindOfClass:[NSString class]] && [(__obj) length] ? YES : NO)

// Use dummy class for category in static library.
#ifndef QCloudTEGORYDUMMY_CLASS
#define QCloudTEGORYDUMMY_CLASS(name) \
@interface QCloudTEGORYDUMMY_CLASS_ ## name : NSObject @end \
@implementation QCloudTEGORYDUMMY_CLASS_ ## name @end
#endif


#define kQCloudKeyAppid             @"kQCloudKeyAppid"
#define kQCloudKeyAudioData         @"Data"
#define kQCloudKeyAuthorization     @"Authorization"
#define kQCloudMaxAudioDuration     60 * 20
#define kQCloudDataBufferSize       4
#define kQCloudDefaultSampleRate    16000
#define kQCloudDefaultBitsPerChannel 16
#define kQCloudVADMinSensitive      1
#define kQCloudVADMaxSensitive      5
#define kQCloudVADMinFlowTimeout    0
#define kQCloudVADMaxFlowTimeout    3000
#define kQCloudMinSliceTime         40
#define kQCloudMinVadSilenceTime    240
#define kQCloudMaxVadSilenceTime    2000


// 默认内置请求域名（仅域名部分，不含路径），同时也是签名串使用的域名（签名固定不变）
// 如需切换请求域名（如境外），通过 QCloudConfig.host 传入纯域名即可，签名仍使用此默认值
#define kQCloudDomainASRRealTimeWSSURL @"asr.cloud.tencent.com"
// ASR 实时识别请求路径
#define kQCloudPathASRRealTime @"/asr/v2/"


typedef NS_ENUM(NSInteger, QCloudASRRealTimeAudioType) {
//    QCloudASRRealTimeAudioTypeNone = -1,
    QCloudASRRealTimeAudioTypePCM = 1,
//    QCloudASRRealTimeAudioTypeSpeex = 4,
    QCloudASRRealTimeAudioTypeOpus = 10,
//    QCloudASRRealTimeAudioTypeSilk = 6
};


#endif /* MWMacrosDefine_h */
