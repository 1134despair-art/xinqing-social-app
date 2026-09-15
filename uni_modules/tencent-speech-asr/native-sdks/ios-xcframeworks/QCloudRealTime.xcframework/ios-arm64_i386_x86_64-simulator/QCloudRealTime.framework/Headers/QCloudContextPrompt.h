//
//  QCloudContextPrompt.h
//  QCloudSDK
//
//  Created by Tencent on 2026/05/15.
//  Copyright © 2026 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface QCloudPromptItem : NSObject

@property(nonatomic, copy) NSString *contextType;

@property(nonatomic, copy) NSArray<NSString *> *texts;

+ (instancetype)itemWithContextType:(NSString *)contextType
                              texts:(NSArray<NSString *> *)texts;

@end


@interface QCloudContextPrompt : NSObject

@property(nonatomic, copy) NSString *contextType;

@property(nonatomic, copy, nullable) NSArray<QCloudPromptItem *> *prompt;

@property(nonatomic, copy, nullable) NSString *hotwordList;

/** 序列化为 JSON 字符串；失败返回 nil（仅在内部数据非法时发生，正常调用不会失败）。 */
- (nullable NSString *)JSONString;

@end

NS_ASSUME_NONNULL_END
