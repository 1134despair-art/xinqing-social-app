## 开发准备
### SDK 下载
录音文件识别 Android SDK 及 Demo 下载地址：[接入 SDK 下载](https://console.cloud.tencent.com/asr/download)。

### 接入须知
- 开发者使用录音文件极速版识别功能前，需要先在 [腾讯云控制台](https://console.cloud.tencent.com/) 注册账号，并获得 AppID、SecretId 和 SecretKey 信息。
2. 手机必须要有网络（3G、4G、5G 或 Wi-Fi 等）。
3. 支持 **Android 5.0** 及其以上版本。

### 运行环境配置
1. 添加录音文件识别 SDK aar，将 **asr-file-recognize-release.aar** 放在 libs 目录下，在 App 的 build.gradle 文件中添加。
```groovy
  implementation(name: 'asr-file-recognize-release', ext: 'aar')
```
2. 添加其他依赖，在 App 的 build.gradle 文件中添加。
```groovy
 implementation 'com.google.code.gson:gson:2.8.5'
```
3. 在 AndroidManifest.xml 添加如下权限。
```xml
< uses-permission android:name="android.permission.INTERNET"/>
```
### 混淆规则
```java
-keepclasseswithmembernames class * { # 保持 native 方法不被混淆
native <methods>;
}
-keep public class com.tencent.cloud.qcloudasrsdk.*
```

## 快速接入
### 开发流程及接入示例
1. 创建 QCloudFileRecognizer 示例
```java
QCloudFlashRecognizer fileFlashRecognizer = new QCloudFlashRecognizer(this, appid, secretId, secretKey);

/**
也可以使用临时密钥鉴权
1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
2.通过临时密钥调用接口
**/
QCloudFlashRecognizer fileFlashRecognizer = new QCloudFlashRecognizer(DemoConfig.apppId, "临时secretId", "临时secretKey","对应的token");
```
2. 设置识别结果回调
```java
fileFlashRecognizer.setCallback(this);
```
3. 调用方式示例
```java
  InputStream is = null;
  AssetManager am = getResources().getAssets();
  is = am.open("test1.mp3");
  int length = is.available();
  byte[] audioData = new byte[length];
  is.read(audioData);

  QCloudFlashRecognitionParams params = (QCloudFlashRecognitionParams)              
  QCloudFlashRecognitionParams.defaultRequestParams();
   //支持传音频文件数据或者音频文件路径，如果同时调用setData和setPath，sdk内将忽略setPath的值
    params.setData(audioData);
//  params.setPath("/sdcard/test2.mp3"); //支持100MB以内音频文件的识别
    params.setVoiceFormat("mp3"); //音频格式。支持 wav、pcm、ogg-opus、speex、silk、mp3、m4a、aac。

/**以下参数不设置将使用默认值**/
    params.setEngineModelType("16k_zh");//引擎模型类型,默认16k_zh。8k_zh：8k 中文普通话通用；16k_zh：16k 中文普通话通用；16k_zh_video：16k 音视频领域。
    params.setFilterDirty(0);// 0 ：默认状态 不过滤脏话 1：过滤脏话
    params.setFilterModal(0);// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
    params.setFilterPunc(0);// 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
    params.setConvertNumMode(1);//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
    params.setSpeakerDiarization(0); //是否开启说话人分离（目前支持中文普通话引擎），默认为0，0：不开启，1：开启。
    params.setFirstChannelOnly(1); //是否只识别首个声道，默认为1。0：识别所有声道；1：识别首个声道。
    params.setWordInfo(0); //是否显示词级别时间戳，默认为0。0：不显示；1：显示，不包含标点时间戳，2：显示，包含标点时间戳。
    params.setCustomizationID(""); //自学习模型 id。如设置了该参数，将生效对应的自学习模型。
    params.setHotwordID(""); //热词表 id。如不设置该参数，自动生效默认热词表；如设置了该参数，那么将生效对应的热词表。


    /**网络超时时间。
    * 注意：如果设置过短的时间，网络超时断开将无法获取到识别结果;
    * 如果网络断开前音频文件已经上传完成，将会消耗该音频时长的识别额度
    * **/
    params.setConnectTimeout(30 * 1000);//单位:毫秒，默认30秒
    params.setReadTimeout(600 * 1000);//单位:毫秒，默认10分钟


    fileFlashRecognizer.recognize(params);
```

### 关键类说明
**QCloudFlashRecognizer**：录音文件识别入口类
```java
/**
 * 初始化方法
 * @param activity app activity
 * @param appId 腾讯云 appid
 * @param secretId 腾讯云 secretId
 * @param secretKey 腾讯云 secretKey
 */
public QCloudFlashRecognizer(String appId, String secretId, String secretKey);

 * 通过 url 或语音数据调用录音文件识别
 * @param params 请求参数
 * @return 返回本次请求的唯一标识别 requestId
 */
public long recognize(QCloudFlashRecognitionParams params) throws Exception;


/**
 * 获取版本信息
 */
public static String getVersion();
```
**QCloudFlashRecognizerListener**：识别结果回调

```java
public interface QCloudFlashRecognizerListener {
    /**
     * 识别结果回调
     * @param recognizer 录音文件识别实例
     * @param result 服务器返回的识别结果 api文档 https://cloud.tencent.com/document/product/1093/52097
     * @param exception 异常信息
     *
     */
    void recognizeResult(QCloudFlashFileRecognizer recognizer,String result, int status,Exception exception);
}
```

**AAILogger**：日志工具设置指引
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

