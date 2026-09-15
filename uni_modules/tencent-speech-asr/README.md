# Tencent Speech ASR

这个 `UTS` 插件接的是腾讯云实时语音识别原生 SDK：

- Android：`asr-realtime-release.aar`
- iOS：`QCloudRealTime.xcframework` + `VoiceCommon.xcframework`

## 鉴权方式

不建议把正式 `SecretKey` 放在 App 中。

推荐做法：

1. App 先请求你自己的后端
2. 后端返回腾讯云临时凭证：`appId`、`secretId`、`secretKey`、`token`
3. 前端再调用插件开始实时识别

项目里已经提供了一个默认 helper：

- `api/speech.js`
- `utils/tencentSpeechAsr.js`

默认会请求：`POST /api/app/speech/tencent-sts`

## 开发期前端临时凭证

联调阶段如果还没接后端临时凭证接口，可以先把测试凭证写到本地缓存中。

也可以直接编辑本地文件：`utils/tencentSpeechAsr.dev.local.js`

```js
export function getTencentRealtimeSpeechLocalDevCredential() {
	return {
		appId: 1234567890,
		secretId: 'TMPxxxxxxxx',
		secretKey: 'xxxxxxxx',
		token: 'xxxxxxxx',
		projectId: 0
	};
}
```

这个文件已加入 `.gitignore`，适合本机真机联调使用。

```js
import { setTencentRealtimeSpeechDevCredential } from '@/utils/tencentSpeechAsr';

setTencentRealtimeSpeechDevCredential({
	appId: 1234567890,
	secretId: 'TMPxxxxxxxx',
	secretKey: 'xxxxxxxx',
	token: 'xxxxxxxx',
	projectId: 0
});
```

默认开发环境会优先读取这个本地凭证；如果本地没有，再回退到后端 `POST /api/app/speech/tencent-sts`。

清理本地测试凭证：

```js
import { clearTencentRealtimeSpeechDevCredential } from '@/utils/tencentSpeechAsr';

clearTencentRealtimeSpeechDevCredential();
```

## 前端示例

```js
import {
	startTencentRealtimeSpeech,
	stopTencentRealtimeSpeech,
	cancelTencentRealtimeSpeech
} from '@/utils/tencentSpeechAsr';

await startTencentRealtimeSpeech({
	onSliceRecognize(res) {
		console.log('中间结果', res.text);
	},
	onSegmentRecognize(res) {
		console.log('稳态结果', res.text);
	},
	onFinish(res) {
		console.log('最终文本', res.text);
	},
	onError(err) {
		console.log('识别失败', err);
	},
	onVolumeChange(volume) {
		console.log('音量', volume);
	}
});

stopTencentRealtimeSpeech();
cancelTencentRealtimeSpeech();
```

## 后端临时凭证接口建议返回

```json
{
	"code": 0,
	"data": {
		"appId": 1234567890,
		"secretId": "TMPxxxxxxxx",
		"secretKey": "xxxxxxxx",
		"token": "xxxxxxxx",
		"projectId": 0
	}
}
```
