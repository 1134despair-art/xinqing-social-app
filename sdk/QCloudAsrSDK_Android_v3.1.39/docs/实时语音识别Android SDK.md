## 1. 接入准备
### 1.1 SDK 获取
实时语音识别 Android SDK 及 Demo 下载地址：[接入 SDK 下载](https://console.cloud.tencent.com/asr/download)。

### 1.2 接入须知
- 开发者在调用前请先查看实时语音识别的 [接口说明](https://cloud.tencent.com/document/product/1093/37138)，了解接口的**使用要求**和**使用步骤**。
- 该接口需要手机能够连接网络（3G、4G、5G 或 Wi-Fi 等），且系统为 **Android 5.0** 及其以上版本。

### 1.3 开发环境
- **添加实时语音识别 SDK aar**
  将 **asr-realtime-release.aar** 放在 libs 目录下，在 App 的 build.gradle 文件中添加以下代码。
```groovy
   implementation(name: 'asr-realtime-release', ext: 'aar')
```
- **添加其他依赖，在 App 的 build.gradle 文件中添加以下代码**。
```groovy
    implementation 'com.squareup.okhttp3:okhttp:4.2.2' 
```
- 在 AndroidManifest.xml 添加如下权限：
```xml
    < uses-permission android:name="android.permission.RECORD_AUDIO"/>
    < uses-permission android:name="android.permission.INTERNET"/>
    < uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```


### 1.4 混淆规则
```java
-keepclasseswithmembernames class * { # 保持 native 方法不被混淆
native <methods>;
}
-keep public class com.tencent.aai.*
```

## 2. 快速接入

### 2.1 启动实时语音识别
```java
int appid = XXX;
int projectid = 0; //此参数固定为0；
String secretId = "XXX";

final AAIClient aaiClient;
try {
   	/**直接鉴权**/
   	// 1、签名鉴权类，sdk中给出了一个本地的鉴权类，您也可以自行实现CredentialProvider接口，在您的服务器上实现鉴权签名
   	aaiClient = new AAIClient(MainActivity.this, appid, projectId, secretId ,new LocalCredentialProvider(secretKey));
   
   /**使用临时密钥鉴权
   * * (1).通过sts 获取到临时证书 （secretId secretKey token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
   *   (2).通过临时密钥调用接口
   * **/
		// aaiClient = new AAIClient(MainActivity.this, appid, projectId,"临时secretId", "临时secretKey","对应的token");

    // 2、初始化语音识别请求。
    final AudioRecognizeRequest audioRecognizeRequest = builder
           //设置数据源，数据源要求实现PcmAudioDataSource接口，您可以自己实现此接口来定制您的自定义数据源，例如从第三方推流中获
					.pcmAudioDataSource(new AudioRecordDataSource(false)) // 使用SDK内置录音器作为数据源,false:不保存音频
          .setEngineModelType("16k_zh") // 设置引擎参数("16k_zh" 通用引擎，支持中文普通话+英文)
          .setFilterDirty(0)  // 0 ：默认状态 不过滤脏话 1：过滤脏话
          .setFilterModal(0) // 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
          .setFilterPunc(0) // 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
          .setConvert_num_mode(1) //1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
          .setNeedvad(1) //0：关闭 vad，1：默认状态 开启 vad。语音时长超过一分钟需要开启,如果对实时性要求较高,并且时间较短的输入,建议关闭
					// .setHotWordId("")//热词 id。用于调用对应的热词表，如果在调用语音识别服务时，不进行单独的热词 id 设置，自动生效默认热词；如果进行了单独的热词 id 设置，那么将生效单独设置的热词 id。
					//.setCustomizationId("")//自学习模型 id。如果设置了该参数，那么将生效对应的自学习模型
           .build();

    // 3、初始化语音识别结果监听器。
    final AudioRecognizeResultListener audioRecognizeResultlistener = new AudioRecognizeResultListener() {

        @Override
        public void onSliceSuccess(AudioRecognizeRequest request, AudioRecognizeResult result, int seq) {
        		//返回分片的识别结果，此为中间态结果，会被持续修正
        }


        @Override
        public void onSegmentSuccess(AudioRecognizeRequest request, AudioRecognizeResult result, int seq) {
            //返回语音流的识别结果，此为稳定态结果，可做为识别结果用与业务
        }


        @Override
        public void onSuccess(AudioRecognizeRequest request, String result) {
        		//识别结束回调，返回所有的识别结果
        }

        @Override
        public void onFailure(AudioRecognizeRequest request, final ClientException clientException, final ServerException serverException,String response) {
        		// 识别失败
        }
     };
    
    // 4、自定义识别配置
    final AudioRecognizeConfiguration audioRecognizeConfiguration = new AudioRecognizeConfiguration.Builder()
          //分片默认40ms，可设置40-5000,必须为20的整倍数，
          //如果不是，sdk内将自动调整为20的整倍数，例如77将被调整为60，如果您不了解此参数不建议更改
          //.sliceTime(40)
          
          // 是否使能静音检测，
          .setSilentDetectTimeOut(false)
          
          // 静音检测超时停止录音可设置>2000ms，setSilentDetectTimeOut为true有效，超过指定时间没有说话将关闭识别；需要大于等于sliceTime，实际时间为sliceTime的倍数，如果小于sliceTime，则按sliceTime的时间为准
          .audioFlowSilenceTimeOut(5000)
          
           // 音量回调时间，需要大于等于sliceTime，实际时间为sliceTime的倍数，如果小于sliceTime，则按sliceTime的时间为准
          .minVolumeCallbackTime(80)
          
           //是否压缩音频。默认压缩，压缩音频有助于优化弱网或网络不稳定时的识别速度及稳定性
           //SDK历史版本均默认压缩且未提供配置开关，如无特殊需求，建议使用默认值
          .isCompress(true)
          .build();



    // 5、启动语音识别
    new Thread(new Runnable() {
        @Override
        public void run() {
            if (aaiClient!=null) {
                aaiClient.startAudioRecognize(audioRecognizeRequest,
                                              audioRecognizeResultlistener,
                                              audioRecognizeStateListener,
                                              audioRecognizeConfiguration);
            }
        }
    }).start();

} catch (ClientException e) {
    e.printStackTrace();
}
```

### 2.2 停止实时语音识别

```java
new Thread(new Runnable() {
    @Override
    public void run() {
        if (aaiClient!=null){
        		//停止语音识别，等待最终识别结果
            aaiClient.stopAudioRecognize();
        }
    }
}).start();
```

### 2.3 取消实时语音识别

```java
new Thread(new Runnable() {
    @Override
    public void run() {
        if (aaiClient!=null){
        		//取消语音识别，丢弃当前任务，丢弃最终结果
            aaiClient.cancelAudioRecognize();
        }
    }
}).start();
```

## 3. 主要接口类和方法说明
### 3.1 计算签名
调用者需要自己实现 AbsCredentialProvider 接口来计算签名，此方法为 SDK 内部调用，上层不用关心 source 来源。

**计算签名函数如下：**
```java
/**
* 签名函数：将原始字符串进行加密，具体的加密算法见以下说明。
* @param source 原文字符串
* @return 加密后返回的密文
*/
String getAudioRecognizeSign(String source);
```

**计算签名算法**   
先以 SecretKey 对 source 进行 HMAC-SHA1 加密，然后对密文进行 Base64 编码，获得最终的签名串。即：sign=Base64Encode(HmacSha1(source，secretKey))。

为方便用户测试，SDK 已提供一个实现类 **LocalCredentialProvider**，但为保证 SecretKey 的安全性，请仅在测试环境下使用，正式版本建议上层实现接口 **AbsCredentialProvider** 中的方法。

### 3.2初始化 AAIClient
AAIClient 是语音服务的核心类，用户可以调用该类来开始、停止以及取消语音识别。
```java
public AAIClient(Context context, int appid, int projectId, String secreteId, AbsCredentialProvider credentialProvider) throws ClientException
```

| 参数名称           | 类型                  | 是否必填 | 参数描述           |
| ------------------ | --------------------- | -------- | ------------------ |
| context            | Context               | 是       | 上下文             |
| appid              | Int                   | 是       | 腾讯云注册的 AppID |
| projectId          | Int                   | 否       | 此参数固定为0   |
| secreteId          | String                | 是       | 用户的 SecreteId   |
| credentialProvider | AbsCredentialProvider | 是       | 鉴权类             |

**示例：**
```java
try {
    AaiClient aaiClient = new AAIClient(context, appid, projectId, secretId, credentialProvider);
} catch (ClientException e) {
    e.printStackTrace();
}
```
如果 aaiClient 不再需要使用，请调用 release() 方法释放资源：
```java
aaiClient.release();
```

###  3.3 配置全局参数
用户调用 ClientConfiguration 类的静态方法来修改全局配置。

| 方法                            | 方法描述          | 默认值 | 有效范围      |
| ------------------------------- | ----------------- | ------ | ------------- |
| setAudioRecognizeSliceTimeout   | HTTP 读超时时间   | 5000ms | 500 - 10000ms |
| setAudioRecognizeConnectTimeout | HTTP 连接超时时间 | 5000ms | 500 - 10000ms |
| setAudioRecognizeWriteTimeout   | HTTP 写超时时间   | 5000ms | 500 - 10000ms |

**示例：**

```java
ClientConfiguration.setAudioRecognizeSliceTimeout(2000)
ClientConfiguration.setAudioRecognizeConnectTimeout(2000)
ClientConfiguration.setAudioRecognizeWriteTimeout(2000)
```

### 3.4 设置结果监听器
AudioRecognizeResultListener 可以用来监听语音识别的结果，共有如下四个接口：
- 语音分片的语音识别结果回调接口
```java
void onSliceSuccess(AudioRecognizeRequest request, AudioRecognizeResult result, int order);
```
<table>
<thead>
<tr>
<th>参数</th>
<th>参数类型</th>
<th>参数描述</th>
</tr>
</thead>
<tbody><tr>
<td>request</td>
<td>AudioRecognizeRequest</td>
<td>语音识别请求</td>
</tr>
<tr>
<td>result</td>
<td>AudioRecognizeResult</td>
<td>语音分片的语音识别结果</td>
</tr>
<tr>
<td>seq</td>
<td>Int</td>
<td>该语音分片所在语音流的次序</td>
</tr>
</tbody></table>

- 语音流的语音识别结果回调接口

```java
void onSegmentSuccess(AudioRecognizeRequest request, AudioRecognizeResult result, int seq);
```
| 参数    | 参数类型              | 参数描述               |
| ------- | --------------------- | ---------------------- |
| request | AudioRecognizeRequest | 语音识别请求           |
| result  | AudioRecognizeResult  | 语音分片的语音识别结果 |
| seq     | Int                   | 该语音流的次序         |

- 返回所有的识别结果
```java
void onSuccess(AudioRecognizeRequest request, String result);
```


| 参数    | 参数类型              | 参数描述       |
| ------- | --------------------- | -------------- |
| request | AudioRecognizeRequest | 语音识别请求   |
| result  | String                | 所有的识别结果 |

- 语音识别请求失败回调函数
```java
void onFailure(AudioRecognizeRequest request, final ClientException clientException, final ServerException serverException,String response);
```

| 参数            | 参数类型              | 参数描述                 |
| --------------- | --------------------- | ------------------------ |
| request         | AudioRecognizeRequest | 语音识别请求             |
| clientException | ClientException       | 客户端异常               |
| serverException | ServerException       | 服务端异常               |
| response        | String                | 服务端返回的 json 字符串 |


示例代码详见 [入门示例](#documen)。

### 3.5 设置语音识别参数
通过构建 AudioRecognizeConfiguration 类，可以设置语音识别时的配置：

| 参数名称                | 类型    | 是否必填 | 参数描述                                           | 默认值 |
| ----------------------- | ------- | -------- | -------------------------------------------------- | ------ |
| setSilentDetectTimeOut | Boolean | 否       | 是否开启静音检测，开启后检测到超时不说话将停止识别 | false |
| audioFlowSilenceTimeOut | Int     | 否       | 配置setSilentDetectTimeOut时间超时时间 | 5000ms |
| setSilentDetectTimeOutAutoStop | Boolean | 否      | 触发静音超时后是否停止识别，setSilentDetectTimeOut开启时此参数生效 | true |
| minVolumeCallbackTime | Int | 否 | 音量检测回调时间 | 80ms |

**示例：**

```java
AudioRecognizeConfiguration audioRecognizeConfiguration = new AudioRecognizeConfiguration.Builder()
    .setSilentDetectTimeOut(true)// 是否开启静音检测，开启后检测到超时不说话将触发静音超时
    .audioFlowSilenceTimeOut(5000) // 静音检测超时时间
    .setSilentDetectTimeOutAutoStop(true) //触发静音超时后是否停止识别
    .minVolumeCallbackTime(80) // 音量回调时间
    .build();
```

### 3.6 设置状态监听器
AudioRecognizeStateListener 可以用来监听语音识别的状态，一共有如下5个接口：

| 方法                       | 方法描述                                                     |
| -------------------------- | ------------------------------------------------------------ |
| onStartRecord              | 开始录音                                                     |
| onStopRecord               | 结束录音                                                     |
| onVoiceVolume         | 音量，该方法已废弃，建议使用onVoiceDb                                                         |
| onVoiceDb             | 音量分贝                                                         |
| onNextAudioData       | 返回音频流，用于返回宿主层做录音缓存业务。new AudioRecordDataSource(true) 传递 true 时生效 |
| onSilentDetectTimeOut | 静音检测超时回调，此时任务还未中止，仍会等待最终识别结果     |

**示例：**

```java
AudioRecognizeStateListener audioRecognizeStateListener = new AudioRecognizeStateListener() {
    @Override
    public void onStartRecord(AudioRecognizeRequest audioRecognizeRequest) {
    		// 开始录音
    }

    @Override
    public void onStopRecord(AudioRecognizeRequest audioRecognizeRequest) {
    		// 结束录音
    }

    /**
     * 该方法已废弃
     *
     * @deprecated 建议使用 {@link #onVoiceDb(float db)}.
     */
    @Override
    public void onVoiceVolume(AudioRecognizeRequest audioRecognizeRequest, int i) {
    		// 音量回调
    }

    @Override
    public void onVoiceDb(float volumeDb) {
        // 分贝回调
    }

		/**
      * 返回音频流，
      * 用于返回宿主层做录音缓存业务。
      * 由于方法跑在sdk线程上，这里多用于文件操作，宿主需要新开一条线程专门用于实现业务逻辑
      * new AudioRecordDataSource(true) 有效，否则不会回调该函数
      * @param audioDatas
      */
    @Override
    public void onNextAudioData(final short[] audioDatas, final int readBufferLength){
    }
    
    /**
    * 静音检测回调
    * 当设置AudioRecognizeConfiguration  setSilentDetectTimeOut为true时，如触发静音超时，将触发此回调
    * 当setSilentDetectTimeOutAutoStop 为true时，触发此回调的同时会停止本次识别，此时任务还未中止，仍然会等待最终识别结果
    */
    @Override
    void onSilentDetectTimeOut(){
    		//触发了静音检测事件
    }
};
```

### 3.7 writeContent 发送上下文提示
在识别会话进行中，调用 `AAIClient.writeContent` 可向服务端动态下发上下文提示（热词列表与场景/领域 Prompt），用于实时调优识别效果。

**方法签名：**
```java
public void writeContent(ContextPrompt contextPrompt) throws ClientException
```

**调用时机：**
必须在 `startAudioRecognize` 之后、`stopAudioRecognize` / `cancelAudioRecognize` 之前调用，否则会抛出 `ClientException`。

**异常说明：**
方法在以下场景会抛出 `ClientException`，业务侧需要 `try/catch` 处理（错误码详见 [4. 错误码](#4-错误码) 中的 -107 / -108 / -109）：

- 入参 `contextPrompt` 为 `null` —— 抛出 `WRITE_CONTENT_PARAM_NULL (-107)`
- WebSocket 连接尚未建立或已关闭（如未调用 `startAudioRecognize`、识别已停止/取消、网络异常断连等）—— 抛出 `WEBSOCKET_NOT_CONNECTED (-108)`
- 入参序列化失败或 WebSocket 发送过程中发生异常 —— 抛出 `WRITE_CONTENT_FAILED (-109)`

**入参 `ContextPrompt` 字段说明：**

| 参数名称     | 类型               | 是否必填 | 参数描述                                                     | 默认值 |
| ------------ | ------------------ | -------- | ------------------------------------------------------------ | ------ |
| contextType  | String             | 是       | 上下文类型，对应 JSON 键 `context_type`，固定填 `"context"`。 | 无     |
| hotwordList  | String             | 否       | 热词列表，对应 JSON 键 `hotword_list`，格式为 `词\|权重,词\|权重`，权重取值范围参考服务端文档。 | 无     |
| prompt       | List\<PromptItem\> | 否       | Prompt 列表，对应 JSON 键 `prompt`，每个 PromptItem 表示一个场景/领域的提示集合。 | 无     |

**`PromptItem` 字段说明：**

| 参数名称     | 类型                    | 是否必填 | 参数描述                                                     | 默认值 |
| ------------ | ----------------------- | -------- | ------------------------------------------------------------ | ------ |
| contextType  | String                  | 是       | 提示类型，对应 JSON 键 `context_type`，常用取值如 `scene`（场景）、`domain`（领域）。 | 无     |
| contextData  | List\<ContextDataItem\> | 是       | 上下文数据列表，对应 JSON 键 `context_data`。                | 无     |

**`ContextDataItem` 字段说明：**

| 参数名称 | 类型   | 是否必填 | 参数描述                              | 默认值 |
| -------- | ------ | -------- | ------------------------------------- | ------ |
| text     | String | 是       | 文本内容，对应 JSON 键 `text`。       | 无     |

**示例代码：**

```java
ContextPrompt contextPrompt = new ContextPrompt();
contextPrompt.setContextType("context");
contextPrompt.setHotwordList("订金|11,订金1|11,订金2|11");

PromptItem scenePrompt = new PromptItem("scene");
scenePrompt.addContextData(new ContextDataItem("订金的胶带"))
        .addContextData(new ContextDataItem("订金"))
        .addContextData(new ContextDataItem("胶带反应"));

PromptItem domainPrompt = new PromptItem("domain");
domainPrompt.addContextData(new ContextDataItem("订金"))
        .addContextData(new ContextDataItem("订金"))
        .addContextData(new ContextDataItem("订金"));

contextPrompt.addPrompt(scenePrompt).addPrompt(domainPrompt);

try {
    aaiClient.writeContent(contextPrompt);
} catch (ClientException e) {
    AAILogger.e(TAG, "writeContent failed, code=" + e.getCode() + ", message=" + e.getMessage());
}
```

**WebSocket 实际下行的 JSON 契约：**
```json
{
  "context_type": "context",
  "hotword_list": "订金|11,订金1|11",
  "prompt": [
    {"context_type": "scene", "context_data": [{"text": "..."}]},
    {"context_type": "domain", "context_data": [{"text": "..."}]}
  ]
}
```

### 3.8 其他重要类说明
#### 3.8.1 **AudioRecognizeRequest**
| 参数名称            | 类型               | 是否必填 | 参数描述                                               | 默认值   |
| ------------------- | ------------------ | -------- | ------------------------------------------------------ | -------- |
| pcmAudioDataSource  | PcmAudioDataSource | 是       | 音频数据源                                             | 无       |
| setEngineModelType  | String             | 否       | 设置引擎参数                                           | "16k_zh" |
| setFilterDirty      | int                | 否       | 0 ：不过滤脏话 1：过滤脏话                             | 0        |
| setFilterModal      | int                | 否       | 0 ：不过滤语气词 1：过滤部分语气词  2:严格过滤         | 0        |
| setFilterPunc       | int                | 否       | 0 ：不过滤句末的句号 1：滤句末的句号                   | 0        |
| setConvert_num_mode | int                | 否       | 1： 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。 | 1        |
| setVadSilenceTime   | int                | 否       | 语音断句检测阈值，静音时长超过该阈值会被认为断句（需配合 needvad = 1 使用） 默认不传递该参数，不建议更改 | 无       |
| setNeedvad          | int                | 否       | 0：关闭 vad，1： 开启 vad。语音时长超过一分钟需要开启,如果对实时性要求较高,。 | 1        |
| setHotWordId        | String             | 否       | 热词 id。用于调用对应的热词表，如果在调用语音识别服务时，不进行单独的热词 id 设置，自动生效默认热词；如果进行了单独的热词 id 设置，那么将生效单独设置的热词 id。 | 无       |
| setWordInfo         | int                | 否       | 是否显示词级别时间戳。0：不显示；1：显示，不包含标点时间戳，2：显示，包含标点时间戳。时间戳信息需要自行解析AudioRecognizeResult.resultJson获取 | 0        |
| setCustomizationId  | String             | 否       | 自学习模型 id。如果设置了该参数，那么将生效对应的自学习模型。 | 无       |
| setNoiseThreshold   | float              | 否       | 噪音参数阈值，默认为0，取值范围：[-1,1],详情见API文档  | 无       |
| setMaxSpeakTime     | int                | 否       | 强制断句功能，取值范围 5000-90000(单位:毫秒）。 在连续说话不间断情况下，该参数将实现强制断句。 | 默认值0(不开启)       |
| setApiParam         | Object             | 否       | 自定义请求参数,用于在请求中添加SDK尚未支持的参数       | 无       |
| setHost             | String             | 否       | 自定义服务端域名 | 无       |

#### 3.8.2 **AudioRecognizeResult**
语音识别结果对象，和 AudioRecognizeRequest 对象相对应，用于返回语音识别的结果。

| 参数名称   | 类型   | 参数描述                                                     |
| ---------- | ------ | ------------------------------------------------------------ |
| sliceType  | Int    | 0表示一小段话开始，1表示在小段话的进行中，2表示小段话的结束  |
| message    | String | 识别提示信息                                                 |
| text       | String | 识别结果                                                     |
| seq        | Int    | 当前一段话结果在整个音频流中的序号，从0开始逐句递增          |
| voiceId    | String | 该语音分片所在语音流的 ID                                    |
| startTime  | int    | 当前一段话结果在整个音频流中的起始时间                       |
| endTime    | int    | 当前一段话结果在整个音频流中的结束时间                       |
| resultJson | String | 后端返回的json原文本,可解析出上面列出的参数内容，如有需求，您可以自行解析获取更多信息 |



#### 3.8.3 **PcmAudioDataSource**

用户可以实现这个接口来识别单通道、采样率16k的 PCM 音频数据。主要包括如下几个接口：
- 向语音识别器添加数据，将长度为 length 的数据从下标0开始复制到 audioPcmData 数组中，并返回实际的复制的数据量的长度。
```java
int read(short[] audioPcmData, int length);
```
- 启动识别时回调函数，用户可以在这里做些初始化的工作。
```java
void start() throws AudioRecognizerException;
```
- 结束识别时回调函数，用户可以在这里进行一些清理工作。
```java
void stop();
```
- 是否保存语音源文件的开关，打开后，音频数据将通过onNextAudioData回调返回给调用层。
```java
boolean  isSetSaveAudioRecordFiles();
```
#### 3.8.4 **AudioRecordDataSource**

PcmAudioDataSource 接口的实现类，可以直接读取麦克风输入的音频数据，用于实时识别，其中demo也提供了一份录音器源码作为数据源的示例，源码与SDK内置录音器AudioRecordDataSource一致，您可以参考此源代码自由定制修改，详情查阅SDK包内DemoAudioRecordDataSource.java内注释。

#### 3.8.4 **AAILogger**
```java
public static void setNeedLogFile(boolean needLogFile, Context applicationContext);
```
- 是否将sdk 日志写入本地磁盘
```java
public static void setLogLevel(int level);
```
- 设置日志等级。可设置项如下：
```
AAILogger.ERROR_LEVEL
AAILogger.WARN_LEVEL 
AAILogger.INFO_LEVEL 
AAILogger.DEBUG_LEVEL
```
```java
public static void setLoggerListener(LoggerListener l);
```
- 设置日志回调接口，用于接受sdk的日志信息，做app层埋点等业务。



## 4. 错误码

- 后端错误码，详见[API文档](https://cloud.tencent.com/document/product/1093/48982)
- 客户端错误码如下

| 错误码 | 名称                                | 描述                           |
| ------ | ----------------------------------- | ------------------------------ |
| -100   | AUDIO_RECORD_INIT_FAILED            | 录音器初始化失败               |
| -101   | AUDIO_RECORD_START_FAILED           | 录音器启动失败                 |
| -102   | AUDIO_RECORD_MULTIPLE_START         | 录音器重复启动                 |
| -103   | AUDIO_RECOGNIZE_THREAD_START_FAILED | 创建线程失败，录音线程无法启动 |
| -104   | AUDIO_SOURCE_DATA_NULL              | 数据源为空                     |
| -105   | AUDIO_RECOGNIZE_REQUEST_NULL        | 请求参数为空                   |
| -106   | WEBSOCKET_NETWORK_FAILED            | websocket网络连接失败          |
| -107   | WRITE_CONTENT_PARAM_NULL            | 调用 writeContent 时传入的 ContextPrompt 为空 |
| -108   | WEBSOCKET_NOT_CONNECTED             | WebSocket 连接未建立或已关闭   |
| -109   | WRITE_CONTENT_FAILED                | writeContent 序列化或发送过程中发生异常 |
| -1     | UNKNOWN_ERROR                       | 未知异常，详见message信息      |



## 5. 常见问题指引

### 5.1 音频数据本地缓存指引

宿主层可根据自身业务需求选择将音频保存到本地或者不保存。若需要保存到本地可按照如下步骤进行操作：
1. `new AudioRecordDataSource(isSaveAudioRecordFiles)` 初始化时，`isSaveAudioRecordFiles` 设置为 true。
2. `AudioRecognizeStateListener.onStartRecord` 回调函数内添加创建本次录音的文件逻辑。路径、文件名可支持自定义。
3. `AudioRecognizeStateListener.onStopRecord` 回调函数内添加关流逻辑。（可选）将 PCM 文件转存为 WAV 文件。
4. `AudioRecognizeStateListener.onNextAudioData` 回调函数内添加将音频流写入本地文件的逻辑。
5. 由于回调函数均跑在 sdk 线程中。为了避免写入业务耗时问题影响 sdk 内部运行流畅度，建议将上述步骤放在单独线程池里完成，详情见 Demo 工程中的 `MainActivity` 类中的示例代码。

### 5.2 回音消除指引

本小节主要介绍如何通过Android原生API实现回音消除，下面将分章节详细展开（详情可参见Demo工程中的`DemoAudioRecordDataSource`类中的`start`方法）。
#### 5.2.1 设置音源的方式
```java

/**
 * 注: 部分android机型可以通过该方式解决回音消除失效的问题
 * https://blog.csdn.net/wyw0000/article/details/125195997
 */
// 1. 设置音频模式为AudioManager.MODE_IN_COMMUNICATION可以起到回音消除的作用
AudioManager audioManager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

// 2. 音频源使用MediaRecorder.AudioSource.VOICE_COMMUNICATION可以起到回音消除的作用
int audioSource = MediaRecorder.AudioSource.VOICE_COMMUNICATION;
AudioRecord audioRecord = new AudioRecord(audioSource, sampleRate, channel, audioFormat, bufferSize);
```

#### 5.2.2 尝试开启AEC和噪音抑制
```java
/**
 * 注: 以下两个能力(AcousticEchoCanceler和NoiseSuppressor)和手机硬件能力相关，有些机型(比如小米11)即使isAvailable()==true，回音消除也不生效
 */
// AcousticEchoCanceler回音消除
if (AcousticEchoCanceler.isAvailable()) {
    Log.d(TAG, "AcousticEchoCanceler isAvailable.");
    AcousticEchoCanceler acousticEchoCanceler = AcousticEchoCanceler
            .create(audioRecord.getAudioSessionId());
    int resultCode = acousticEchoCanceler.setEnabled(true);
    if (AudioEffect.SUCCESS == resultCode) {
        Log.d(TAG, "AcousticEchoCanceler AudioEffect SUCCESS");
    }
}

// NoiseSuppressor噪音抑制
if (NoiseSuppressor.isAvailable()) {
    Log.d(TAG, "NoiseSuppressor isAvailable.");
    NoiseSuppressor noiseSuppressor = NoiseSuppressor
            .create(audioRecord.getAudioSessionId());
    int resultCode = noiseSuppressor.setEnabled(true);
    if (AudioEffect.SUCCESS == resultCode) {
        Log.d(TAG, "NoiseSuppressor AudioEffect SUCCESS");
    }
}
```

#### 5.2.3 回音消除方案适配的机型列表

回声消除适配还会受到机型及系统的影响，下表列举已测试机型和系统的适配情况：

| 品牌   | 机型        | 系统版本       | CPU                      | GPU             | 是否适配 | 备注                     |
| ------ | ----------- | -------------- | ------------------------ | --------------- | -------- | ------------------------ |
| HONOR  | ANY-AN00    | 11             | SM6375                   | Adreno619       | 是       |                          |
| HONOR  | CMA-AN00    | 11             | MT6833                   | Mali-G57MC2     | 是       |                          |
| HUAWEI | JKM-AL00    | 9              | 海思 麒麟710             | Kirin710        | 是       |                          |
| HUAWEI | DVC-AN20    | 10             | MT6873                   | Mali-G57MC4     | 是       |                          |
| HUAWEI | STK-AL00    | 9              | 海思 麒麟710             | Mali-G51MP4     | 是       |                          |
| OPPO   | PBAM00      | 8.1.0          | SDM450                   | Adreno506       | 是       |                          |
| oppo   | PDVM00      | 10             | SM4250-AA                | Adreno610       | 是       |                          |
| oppo   | PDYM20      | 10             | MT6853                   | Mali-G57MC3     | 是       |                          |
| OPPO   | PBEM00      | 10             | SDM670                   | Adreno615       | 是       |                          |
| OPPO   | PFVM10      | 11             | MT6833                   | Mali-G57        | 是       |                          |
| OPPO   | PFTM20      | 12             | MT6833V                  | Mali-G57MC2     | 是       |                          |
| OPPO   | PEHM00      | 11             | SM4350                   | Adreno619       | 是       |                          |
| OPPO   | PEQM00      | 11             | MT6877                   | Mali-G68MC4     | 是       |                          |
| OPPO   | PFGM00      | 11             | MT6833                   | Mali-G57        | 是       |                          |
| OPPO   | PCAM00      | 9              | SDM710                   | Adreno616       | 是       |                          |
| OPPO   | PACM00      | 8.1.0          | MT6771                   | Mali-G72MP3     | 是       |                          |
| OPPO   | PFJM10      | 11             | Qualcomm Snapdragon 778G | SM7325          | 是       |                          |
| OPPO   | PHJ110      | 12             | MediaTek Dimensity 700   | Mali-G57MC2     | 是       |                          |
| oppo   | PEAM00      | 10             | MT6853                   | Mali-G57MC3     | 是       |                          |
| OPPO   | PECM30      | 10             | MT6853                   | Mali-G57MC3     | 是       |                          |
| OPPO   | PBBM00      | 9              | MT6771                   | Mali-G72MP3     | 是       |                          |
| OPPO   | PFTM10      | 13             | MT6833P                  | Mali-G57MC2     | 是       |                          |
| oppo   | PEGM00      | 11             | SM7250-AB                | Adreno620       | 是       |                          |
| OPPO   | OPPO R11    | 8.1.0          | SDM660                   | Adreno512       | 是       |                          |
| OPPO   | PCHM30      | 10             | SM6125                   | Adreno610       | 是       |                          |
| OPPO   | PERM10      | 11             | Qualcomm Snapdragon 778G | Adreno642L      | 是       |                          |
| OPPO   | PFUM10      | 12             | SM6375                   | Adreno619       | 是       |                          |
| OPPO   | BMH-AN10    | HarmonyOS2.0.0 | 海思 麒麟985 5G          | Mali-G77MP8     | 是       |                          |
| vivo   | V2055A      | 11             | SM8250-AC                | Adreno650       | 是       |                          |
| vivo   | V1829A      | 10             | SDM710                   | Adreno616       | 是       |                          |
| VIVO   | V1934A      | 9              | MT6768                   | Mali-G52 2EEMC2 | 是       |                          |
| vivo   | V2057A      | 10             | MT6853                   | Mali-G57MC3     | 是       |                          |
| VIVO   | V2002A      | 10             | Exynos880                | Mali-G76MP5     | 是       |                          |
| vivo   | V2073A      | 11             | SM7250-AC                | Adreno620       | 是       |                          |
| vivo   | V2068A      | 11             | MT6833                   | Mali-G57        | 是       |                          |
| vivo   | V2154A      | 11             | Qualcomm Snapdragon 888  | SM8350          | 是       |                          |
| VIVO   | V1813A      | 8.1.0          | MT6771                   | Mali-G72MP3     | 是       |                          |
| vivo   | V2046A      | 11             | Mali-G78MP10             | Exynos9815      | 是       |                          |
| VIVO   | V1981A      | 10             | SM8250                   | Adreno650       | 是       |                          |
| vivo   | V2072A      | 11             | MT6891Z                  | Mali-G77MC9     | 是       |                          |
| vivo   | V1818A      | 8.1.0          | SDM439                   | Adreno505       | 是       |                          |
| VIVO   | V1809A      | 9.0.0          | SDM670                   | Adreno615       | 是       |                          |
| vivo   | V2171A      | 12             | SM8450                   | Adreno730       | 是       |                          |
| vivo   | V2048A      | 11             | MT6875                   | Mali-G57MC5     | 是       |                          |
| vivo   | V2199A      | 12             | SM8250                   | Adreno650       | 是       |                          |
| vivo   | V2012A      | 10             | SM7250-AB                | Adreno620       | 是       |                          |
| vivo   | V2157A      | 12             | Qualcomm Snapdragon 870  | Adreno650       | 是       |                          |
| vivo   | V2118A      | 13             | SM8250-AC                | Adreno650       | 是       |                          |
| VIVO   | V2166A      | 12             | MediaTek Dimensity 700   | Mali-G57MC2     | 是       |                          |
| VIVO   | V2049A      | 12             | Qualcomm Snapdragon 888  | Adreno660       | 是       |                          |
| vivo   | vivo X21A   | 8.1.0          | 高通 骁龙660             | Adreno512       | 是       |                          |
| vivo   | V2148A      | 13             | SM7325                   | Adreno642L      | 是       |                          |
| vivo   | V1901A      | 9              | MT6765                   | PowerVR GE8320  | 是       |                          |
| Xiaomi | 21091116AC  | 11             | MediaTek Dimensity 810   | MT6833V         | 是       |                          |
| Xiaomi | MI 9        | 10             | 骁龙855                  | Adreno 640      | 是       |                          |
| Xiaomi | 22041211AC  | 12             | MediaTek Dimensity 8100  | Mali-G610MC6    | 是       |                          |
| Xiaomi | 22041216C   | 12             | MT6895Z                  | Mali-G610MC6    | 是       |                          |
| 华为   | HLK-AL00    | 9.1.1          | Kirin810                 | Mali-G52MP6     | 是       |                          |
| 华为   | SEA-AL10    | 10             | Kirin980                 | Mali-G76MP10    | 是       |                          |
| 华为   | NOH-AN00    | HarmonyOS3.0.0 | Kirin9000                | Mali-G78MP24    | 是       |                          |
| 华为   | TEL-AN00a   | 10             | Kirin8205G               | Mali-G57MP6     | 是       |                          |
| 华为   | LIO-AN00    | 10             | Kirin990                 | Mali-G76MP16    | 是       |                          |
| 华为   | CDY-AN00    | HarmonyOS2.0.0 | Kirin820                 | Mali-G57MP6     | 是       |                          |
| 华为   | ELE-AL00    | 10             | Kirin980                 | Mali-G76MP10    | 是       |                          |
| 华为   | JSN-AL00a   | 10             | Kirin710                 | Mali-G51MP4     | 是       |                          |
| 华为   | ELS-AN00    | HarmonyOS2.0.0 | Kirin990                 | Mali-G76MP16    | 是       |                          |
| 华为   | YAL-AL00    | 9              | Kirin980                 | Mali-G76MP10    | 是       |                          |
| 华为   | ANA-AN00    | 10             | Kirin990                 | Mali-G76MP16    | 是       |                          |
| 华为   | WLZ-AN00    | HarmonyOS2.0.0 | Kirin990                 | Mali-G76MP16    | 是       |                          |
| 华为   | JEF-AN20    | 10             | Kirin9855G               | Mali-G77MP8     | 是       |                          |
| 华为   | ASK-AL00x   | 9              | Kirin710                 | Mali-G51MP4     | 是       |                          |
| 华为   | FNE-AN00    | 12             | SM7325-AE                | Adreno642L      | 是       |                          |
| 小米   | M2012K11AC  | 11             | SM8250-AC                | Adreno650       | 是       |                          |
| 小米   | M2012K10C   | 11             | MT6893                   | Mali-G77MC9     | 是       |                          |
| 小米   | M2104K10AC  | 11             | MT6893                   | Mali-G77MC9     | 是       |                          |
| 小米   | M2011K2C    | 11             | SM8350                   | Adreno660       | 是       |                          |
| 小米   | M2006C3LC   | 10             | MediaTek Helio G25       | MT6762G         | 是       |                          |
| 小米   | M2007J22C   | 10             | MT6853T                  | Mali-G57MC3     | 是       |                          |
| 小米   | 22081212C   | 12             | SM8475                   | Adreno730       | 是       |                          |
| asus   | ASUS_I001DA | 9              | SM8150-AC                | Adreno640       | 否       | 回声消除不生效           |
| HONOR  | LSA-AN00    | 11             | SM7325                   | Adreno642L      | 否       | 回声消除不生效           |
| OPPO   | PCHM10      | 9              | SM6125                   | Adreno610       | 否       | 回声消除不生效           |
| OPPO   | PCAM10      | 9              | MT6771V                  | Mali-G72MP3     | 否       | 回声消除导致播放音量变化 |
| vivo   | V2020A      | 10             | Qualcomm Snapdragon 765G | Adreno620       | 否       | 回声消除导致播放音量变化 |
| vivo   | V2031A      | 10             | MT6853                   | Mali-G57MC3     | 否       | 回声消除导致播放音量变化 |
| vivo   | vivo X9     | 7.1.2          | MSM8953                  | Adreno506       | 否       | 回声消除不生效           |
| VIVO   | V1962A      | 10             | Exynos980                | Mali-G76MP5     | 否       | 回声消除不生效           |
| vivo   | V1938CT     | 10             | Exynos980                | Mali-G76MP5     | 否       | 回声消除导致播放音量变化 |
| vivo   | V2054A      | 11             | Qualcomm Snapdragon 480  | Adreno619       | 否       | 回声消除不生效           |
| vivo   | V2217A      | 10             | Kirin980                 | Mali-G76MP10    | 否       | 回声消除不生效           |
| vivo   | V2156A      | 11             | MT6833V                  | MT6833V         | 否       | 回声消除不生效           |
| vivo   | V2203A      | 13             | SM8250-AC                | Adreno650       | 否       | 回声消除导致播放音量变化 |
| 华为   | KOZ-AL00    | 10             | T610                     | Mali-G523EEMC2  | 否       | 回声消除不生效           |
| 华为   | NTH-AN00    | 11             | SM7325                   | Adreno642L      | 否       | 回声消除不生效           |
| 华为   | TAS-AN00    | 10             | Kirin990                 | Mali-G76MP16    | 否       | 回声消除不生效           |
| 华为   | VOG-AL00    | 9              | Kirin980                 | Mali-G76MP10    | 否       | 回声消除不生效           |
| 华为   | JEF-AN00    | HarmonyOS2.0.0 | Kirin9855G               | Mali-G77MP8     | 否       | 回声消除不生效           |
| 华为   | ART-AL00x   | HarmonyOS2.0.0 | Kirin710                 | Mali-G51MP4     | 否       | 回声消除不生效           |
| 小米   | M2007J17C   | 10             | SM7225                   | Adreno619       | 否       | 回声消除不生效           |
| 小米   | MI 8        | 9              | SDM845                   | Adreno630       | 否       | 回声消除不生效           |

#### 5.2.4 日志工具设置指引
```java
// 将log落盘到本地磁盘，needLogFile字段默认为false，接入调试期间建议设置为true，上线后此接口调用可删除。
AAILogger.setNeedLogFile(true, getApplicationContext());
// 设置日志级别，默认为DEBUG_LEVEL，接入调试期间建议设置为DEBUG_LEVEL。
AAILogger.setLogLevel(AAILogger.DEBUG_LEVEL);
// 设置日志监听器，用于监听日志信息。
AAILogger.setLoggerListener(new LoggerListener() {
	@Override
	public void onLogInfo(String s) {

	}
});
```
#### 5.2.5 获取SDK版本号指引
```java
// 获取SDK版本号
String version = AAIClient.getVersion();
```
