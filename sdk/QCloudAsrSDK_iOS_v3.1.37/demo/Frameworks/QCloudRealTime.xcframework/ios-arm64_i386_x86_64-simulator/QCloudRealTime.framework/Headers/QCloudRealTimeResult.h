//
//  QCloudRealTimeResponse.h
//  QCloudSDK
//
//  Created by Sword on 2019/4/3.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <QCloudRealTime/QCloudConfig.h>


NS_ASSUME_NONNULL_BEGIN


//客户端错误码
typedef NS_ENUM(NSInteger, QCloudRealTimeClientErrCode) {
    QCloudRealTimeClientErrCode_Success = 0,                    //成功
    QCloudRealTimeClientErrCode_NetworkError = -100,         //无网络
    QCloudRealTimeClientErrCode_Timeout = -101,     //手机网路存在问题，请求超时
    QCloudRealTimeClientErrCode_MicError = -102,  //录音过程音频通道被占用，录音失败，比如电话
    QCloudRealTimeClientErrCode_AudioInitError = -103, //音频源初始化失败（麦克风启动失败，权限拒绝等，如果使用自定义音频源start方法返回错误也会触发）
    QCloudRealTimeClientErrCode_NotRunning      = -104, // 识别未启动或已结束，writeContent: 等会话内接口在此状态下调用会失败
    QCloudRealTimeClientErrCode_InvalidParam    = -105, // 参数非法，如 writeContent: 传入的 contextPrompt 为 nil 或 prompt 为空
    QCloudRealTimeClientErrCode_WriteContentFailed = -106, // writeContent: 在序列化或发送过程中发生异常
};
/**
 * 话者分离模式识别结果
 */
@interface SpeakerMessage : NSObject
/** 开始时间 */
@property (nonatomic, assign) NSInteger startTime;
/** 结束时间 */
@property (nonatomic, assign) NSInteger endTime;
/** 识别文本 */
@property (nonatomic, copy) NSString *voiceTextStr;
/** 讲话者id */
@property (nonatomic, assign) NSInteger speakerId;
@end

/**
 * 新版角色分离接口模式识别结果
 */
@interface SpeakerSentences : NSObject
/** 当前句子的文本内容 */
@property (nonatomic, copy) NSString *sentence;
/** 当前句子的状态，0为不确定，1为确定 */
@property (nonatomic, assign) NSInteger sentenceType;
/** 当前句子的 ID，从0开始，每产生一个稳态的句子，会进行自增 */
@property (nonatomic, assign) NSInteger sentenceId;
/** 代表当前句的说话人信息，起始会从-1开始展示，表示未产生准确的说话人信息，产生准确说话人信息后，该字段将替换为一个正数来指代具体的说话人角色信息，说话人角色 ID,有效取值范围 0 - 9, 最多分离10个说话人。 */
@property (nonatomic, assign) NSInteger speakerId;
/** 当前一段话结果在整个音频流中的起始时间 */
@property (nonatomic, assign) NSInteger startTime;
/** 当前一段话结果在整个音频流中的结束时间 */
@property (nonatomic, assign) NSInteger endTime;

@end

/**
 * 识别结果类
 */
@interface QCloudRealTimeResult : NSObject

/*客户端错误码 QCloudRealTimeClientErrCode */
@property(nonatomic, assign) NSInteger clientErrCode;
/** clientErrCode对应的描述信息 */
@property(nonatomic, copy) NSString *clientErrMessage;


/*未解析的json原文本，如有需求，可拿到后按业务需求自定义处理，
 注：以下结果仅当QCloudRealTimeClientErrCode==QCloudRealTimeClientErrCode_Success时不为nil*/
@property(nonatomic, copy) NSString *jsonText;

/*----------以下是jsonText解析出来的内容--------------------*/
/** 后台错误码Code = 0时表示成功，其他表示为失败 */
//后台错误码见https://cloud.tencent.com/document/product/1093/48982
@property(nonatomic, assign) NSInteger code;
/** code对应的描述信息 */
@property(nonatomic, copy) NSString *message;
/** 语音流的识别id */
@property(nonatomic, copy) NSString *voiceId;
/** 当前语音流的识别结果 */
@property(nonatomic, copy) NSString *text;
/** 语音包序列号，注意:不是语音流序列号*/
@property(nonatomic, assign) NSInteger seq;

/** result_list */
@property(nonatomic, copy) NSArray *resultList;
/** 话者分离模式识别结果 */
@property (nonatomic, strong) NSMutableArray<SpeakerMessage *> *speakerMessage;
/** 新版角色分离接口模式识别结果 */
@property (nonatomic, strong) NSMutableArray<SpeakerSentences *> *speakerSentences;
/** 若开启断点续传能力，会返回唯一声纹 ID（24h 有效），用于下次任务断点续传 **/
@property(nonatomic, copy) NSString *speakerContextId;
/** 识别到的总文本 */
@property(nonatomic, copy) NSString *recognizedText;

@property(nonatomic, assign) NSInteger finalN;

/** 本 message 唯一 id */
@property(nonatomic, copy) NSString *messageId;
@property(nonatomic, assign) NSInteger messageNo;
/*----------以上为解析好的内容--------------------*/

/*——————————————以下参数非后端返回————————————————*/
/** 记录语音流请求参数 */
@property(nonatomic, strong) NSDictionary *requestParameters;
/** 表示后面的 result_list 里面有几段结果，如果是0表示没有结果，遇到中间是静音。如果是1表示 result_list 有一个结果， 在发给服务器分片很大的情况下可能会出现多个结果，正常情况下都是1个结果。*/
@property(nonatomic, assign) NSInteger resultNumber;

/*————————————————————————————————————————————————*/

- (instancetype)initWithDictionary:(NSDictionary *)dic requestParameters:(NSDictionary *)requestParameters;


@end

/**
* 语音识别请求回包的result_list
*/
@interface QCloudRealTimeResultResponse : NSObject

/** 返回分片类型标记， 0表示一小段话开始，1表示在小段话的进行中，2表示小段话的结束 */
@property(nonatomic, assign) NSInteger sliceType;
/** 表示第几段话 */
@property(nonatomic, assign) NSInteger index;
/** 这个分片在整个音频流中的开始时间 */
@property(nonatomic, assign) NSInteger startTime;
/** 这个分片在整个音频流中的结束时间 */
@property(nonatomic, assign) NSInteger endTime;
/** 识别结果 */
@property(nonatomic, strong) NSString *voiceTextStr;

/** word_list */
@property(nonatomic, copy) NSArray *wordList;
/** 话者分离模式识别结果 */
@property (nonatomic, strong) NSMutableArray<SpeakerMessage *> *speakerMessage;
/** 新版角色分离接口模式识别结果 */
@property (nonatomic, strong) NSMutableArray<SpeakerSentences *> *speakerSentences;

- (instancetype)initWithDictionary:(NSDictionary *)dic;

@end

NS_ASSUME_NONNULL_END

