# SDK 2.x版本到3.x版本升级指引

- 腾讯云语音识别SDK v3.0版本进行了一次重构优化，如果您的应用曾经集成了2.x版本的SDK ，可以阅读本文档，本文档将列出升级所需要关注的点;



#### 1、SDK模块变动

为减小集成SDK的体积增量，SDK已经对 实时语音识别 、一句话识别、录音文件识别、语音合成 模块进行了解耦，SDK目录中的framework有如下对应关系:

- QCloudFileRecognizer.framework :录音文件识别极速版(SDK内仍然保留普通版录音文件识别接口，建议升级录音文件识别极速版，未来SDK将会移除普通版录音文件识别接口)
- QCloudOneSentence.framework :一句话识别
- QCloudRealTime.framework : 实时语音识别

**注意**：语音合成TTS SDK已经分离，如果您还使用了2.x版本内置的语音合成TTS SDK, 请访问 [https://console.cloud.tencent.com/tts/download](https://console.cloud.tencent.com/tts/download) 下载



#### 2、接口变动



- ##### 录音文件识别极速版

 导入如下头文件，其他与原版一致

```
#import <QCloudFileRecognizer/QCloudFlashFileRecognizeParams.h>
#import <QCloudFileRecognizer/QCloudFlashFileRecognizer.h>
```



- ##### 一句话识别

1、导入如下头文件

```
#import <QCloudOneSentence/QCloudSentenceRecognizeParams.h>
#import <QCloudOneSentence/QCloudSentenceRecognizer.h>
```

2、音频格式类型  voiceFormat参数类型由枚举改为NSString，SDK内部不再做限制，您可以直接传字符串来指定音频文件类型，支持的类型参数详情请看API文档 [https://cloud.tencent.com/document/product/1093/35646](https://cloud.tencent.com/document/product/1093/35646)  VoiceFormat参数 ;

3、引擎模型类型 EngSerViceType 参数类型由枚举改为NSString，SDK内部不再做限制，您可以直接传字符串来指定引擎模型，，支持的类型参数详情请看API文档 [https://cloud.tencent.com/document/product/1093/35646](https://cloud.tencent.com/document/product/1093/35646)  EngSerViceType参数;



- ##### 实时语音识别

  1、导入如下头文件

  ```
  #import <QCloudRealTime/QCloudRealTimeRecognizer.h>
  #import <QCloudRealTime/QCloudConfig.h>
  #import <QCloudRealTime/QCloudRealTimeResult.h>
  #import <QCloudRealTime/QCloudAudioDataSource.h>
  ```

  

  2、识别结果QCloudRealTimeResponse变化: 

   改名为QCloudRealTimeResult；

   区分了后端错误码及客户端错误码，识别成功或者识别失败均会返回QCloudRealTimeResult，详见QCloudRealTimeResult.h内定  义；

   QCloudRealTimeResult.jsonText包含了后端返回的未解析的json原文本，如有需求，可拿到后按业务需求自定义处理。

  

  3、QCloudRealTimeRecognizerDelegate协议变动

   结果回调QCloudRealTimeResponse 改为 QCloudRealTimeResult；

   错误回调接口返回信息改为 QCloudRealTimeResult，具体的错误信息将在QCloudRealTimeResult中体现；

  

  

    

