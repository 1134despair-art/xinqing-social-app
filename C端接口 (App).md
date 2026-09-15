# MoodSocial API 文档


**简介**:MoodSocial API 文档


**HOST**:http://117.72.185.92:19500


**联系人**:


**Version**:1.0


**接口路径**:/v3/api-docs/C端接口 (App)


[TOC]






# C端心情


## 获取心情详情


**接口地址**:`/api/moods/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>公开内容任何人可见；待审核、审核拒绝或违规下线内容仅作者本人可见</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|心情ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppMoodVo|AppMoodVo|
|&emsp;&emsp;id|心情ID|integer(int64)||
|&emsp;&emsp;userId|发布者用户ID|integer(int64)||
|&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer(int32)||
|&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;voiceDuration|语音时长（秒）|integer(int32)||
|&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;videoDuration|视频时长（秒）|integer(int32)||
|&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer(int32)||
|&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer(int64)||
|&emsp;&emsp;likeCount|点赞数|integer(int64)||
|&emsp;&emsp;commentCount|评论数|integer(int64)||
|&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer(int32)||
|&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer(int32)||
|&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;tags|标签列表|array|string|
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"userId": 0,
		"nickName": "",
		"avatar": "",
		"contentType": 0,
		"textContent": "",
		"voiceUrl": "",
		"voiceDuration": 0,
		"voiceTranscription": "",
		"videoUrl": "",
		"videoCoverUrl": "",
		"videoDuration": 0,
		"videoGenStatus": 0,
		"publishTime": 0,
		"likeCount": 0,
		"commentCount": 0,
		"auditStatus": 0,
		"auditReason": "",
		"status": 0,
		"offlineReason": "",
		"liked": true,
		"favorited": true,
		"tags": []
	},
	"traceId": ""
}
```


## 编辑心情


**接口地址**:`/api/moods/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>修改心情的文字内容或标签（不可更改内容类型）。只能编辑自己发布的、未下线的内容。tags 传空列表则清空标签，不传则不修改标签。需登录。</p>



**请求示例**:


```javascript
{
  "textContent": "修改后的心情内容",
  "tags": [
    "开心",
    "工作"
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|心情ID|path|true|integer(int64)||
|appEditMoodReq|编辑心情请求|body|true|AppEditMoodReq|AppEditMoodReq|
|&emsp;&emsp;textContent|文字内容（contentType=1时有效）||false|string||
|&emsp;&emsp;tags|标签列表（最多5个，传空列表则清空标签）||false|array|string|


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppMoodVo|AppMoodVo|
|&emsp;&emsp;id|心情ID|integer(int64)||
|&emsp;&emsp;userId|发布者用户ID|integer(int64)||
|&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer(int32)||
|&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;voiceDuration|语音时长（秒）|integer(int32)||
|&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;videoDuration|视频时长（秒）|integer(int32)||
|&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer(int32)||
|&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer(int64)||
|&emsp;&emsp;likeCount|点赞数|integer(int64)||
|&emsp;&emsp;commentCount|评论数|integer(int64)||
|&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer(int32)||
|&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer(int32)||
|&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;tags|标签列表|array|string|
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"userId": 0,
		"nickName": "",
		"avatar": "",
		"contentType": 0,
		"textContent": "",
		"voiceUrl": "",
		"voiceDuration": 0,
		"voiceTranscription": "",
		"videoUrl": "",
		"videoCoverUrl": "",
		"videoDuration": 0,
		"videoGenStatus": 0,
		"publishTime": 0,
		"likeCount": 0,
		"commentCount": 0,
		"auditStatus": 0,
		"auditReason": "",
		"status": 0,
		"offlineReason": "",
		"liked": true,
		"favorited": true,
		"tags": []
	},
	"traceId": ""
}
```


## 删除心情


**接口地址**:`/api/moods/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>软删除自己发布的心情，只能删除自己的内容。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|心情ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


## 获取心情列表


**接口地址**:`/api/moods`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>广场分页查询。sortMode：time=最新（默认）、today_hot=今日最热、all_hot=历史最热。可按 contentType、keyword、tagName 过滤。onlyMine=true 查询自己的心情（需登录）。未登录时 liked 字段固定返回 false。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|pageNum|当前页，默认1|query|false|string||
|pageSize|每页条数，默认10|query|false|string||
|sortMode|排序模式：time=最新（默认）、today_hot=今日最热、all_hot=历史最热|query|false|string||
|contentType|内容类型过滤：1文字 2语音 3AI视频，不传则查全部|query|false|string||
|keyword|关键字搜索（模糊匹配文字内容）|query|false|string||
|tagName|标签名过滤|query|false|string||
|onlyMine|只看自己发布的（true=个人主页模式，需登录）|query|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultPageVoAppMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||PageVoAppMoodVo|PageVoAppMoodVo|
|&emsp;&emsp;total|总数|integer(int64)||
|&emsp;&emsp;size|每页显示条数，默认 10|integer(int64)||
|&emsp;&emsp;current|当前页|integer(int64)||
|&emsp;&emsp;records|心情详情|array|AppMoodVo|
|&emsp;&emsp;&emsp;&emsp;id|心情ID|integer||
|&emsp;&emsp;&emsp;&emsp;userId|发布者用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer||
|&emsp;&emsp;&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;&emsp;&emsp;voiceDuration|语音时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;&emsp;&emsp;videoDuration|视频时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer||
|&emsp;&emsp;&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer||
|&emsp;&emsp;&emsp;&emsp;likeCount|点赞数|integer||
|&emsp;&emsp;&emsp;&emsp;commentCount|评论数|integer||
|&emsp;&emsp;&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer||
|&emsp;&emsp;&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer||
|&emsp;&emsp;&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;&emsp;&emsp;tags|标签列表|array|string|
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"total": 0,
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"nickName": "",
				"avatar": "",
				"contentType": 0,
				"textContent": "",
				"voiceUrl": "",
				"voiceDuration": 0,
				"voiceTranscription": "",
				"videoUrl": "",
				"videoCoverUrl": "",
				"videoDuration": 0,
				"videoGenStatus": 0,
				"publishTime": 0,
				"likeCount": 0,
				"commentCount": 0,
				"auditStatus": 0,
				"auditReason": "",
				"status": 0,
				"offlineReason": "",
				"liked": true,
				"favorited": true,
				"tags": []
			}
		]
	},
	"traceId": ""
}
```


## 发布心情


**接口地址**:`/api/moods`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>contentType: 1=文字（textContent必填）、2=语音（voiceUrl必填）。generateVideo=true 时同步扣减视频配额并将内容标记为「视频生成中」，配额不足则发布失败，请先关闭视频开关。发布后直接出现在广场。需登录。</p>



**请求示例**:


```javascript
{
  "contentType": 1,
  "textContent": "今天心情很好！",
  "voiceUrl": "https://oss.example.com/voice/xxx.mp3",
  "voiceDuration": 30,
  "tags": [
    "开心",
    "工作"
  ],
  "generateVideo": false
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appPublishMoodReq|发布心情请求|body|true|AppPublishMoodReq|AppPublishMoodReq|
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频||true|integer(int32)||
|&emsp;&emsp;textContent|文字内容（contentType=1时必填）||false|string||
|&emsp;&emsp;voiceUrl|语音URL（contentType=2时必填，OSS预留）||false|string||
|&emsp;&emsp;voiceDuration|语音时长（秒，contentType=2时填写）||false|integer(int32)||
|&emsp;&emsp;tags|标签列表（最多5个）||false|array|string|
|&emsp;&emsp;generateVideo|是否开启 AI 视频生成（默认 false）。开启后系统在发布成功后扣减配额并标记视频生成中，后续由异步任务生成视频。配额优先级：今日首发 > 奖励额度。配额不足时发布失败。||false|boolean||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppMoodVo|AppMoodVo|
|&emsp;&emsp;id|心情ID|integer(int64)||
|&emsp;&emsp;userId|发布者用户ID|integer(int64)||
|&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer(int32)||
|&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;voiceDuration|语音时长（秒）|integer(int32)||
|&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;videoDuration|视频时长（秒）|integer(int32)||
|&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer(int32)||
|&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer(int64)||
|&emsp;&emsp;likeCount|点赞数|integer(int64)||
|&emsp;&emsp;commentCount|评论数|integer(int64)||
|&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer(int32)||
|&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer(int32)||
|&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;tags|标签列表|array|string|
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"userId": 0,
		"nickName": "",
		"avatar": "",
		"contentType": 0,
		"textContent": "",
		"voiceUrl": "",
		"voiceDuration": 0,
		"voiceTranscription": "",
		"videoUrl": "",
		"videoCoverUrl": "",
		"videoDuration": 0,
		"videoGenStatus": 0,
		"publishTime": 0,
		"likeCount": 0,
		"commentCount": 0,
		"auditStatus": 0,
		"auditReason": "",
		"status": 0,
		"offlineReason": "",
		"liked": true,
		"favorited": true,
		"tags": []
	},
	"traceId": ""
}
```


## 生成视频


**接口地址**:`/api/moods/generate-video`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>为已发布的文字/语音心情提交AI视频生成请求（文本转视频服务预留）。提交后 videoGenStatus=1（生成中）；生成结果写入展示内容时必须重新进入待审核。需登录。</p>



**请求示例**:


```javascript
{
  "moodId": 1000001
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appGenerateVideoReq|生成视频请求|body|true|AppGenerateVideoReq|AppGenerateVideoReq|
|&emsp;&emsp;moodId|关联心情ID（已发布的文字或语音心情，服务端据此获取文字内容生成视频）||true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppGenerateVideoVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppGenerateVideoVo|AppGenerateVideoVo|
|&emsp;&emsp;moodId|心情ID|integer(int64)||
|&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer(int32)||
|&emsp;&emsp;videoTaskId|第三方AI视频任务ID（预留，用于轮询进度）|string||
|&emsp;&emsp;durationSeconds|本次生成使用的视频时长（秒）|integer(int32)||
|&emsp;&emsp;resolution|本次生成使用的视频清晰度|string||
|&emsp;&emsp;message|提示信息|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"moodId": 0,
		"videoGenStatus": 0,
		"videoTaskId": "",
		"durationSeconds": 0,
		"resolution": "",
		"message": ""
	},
	"traceId": ""
}
```


## 获取匹配心情


**接口地址**:`/api/moods/match`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>从广场随机匹配一条与当前用户最近发布内容类型相近的心情（排除自己的内容）。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppMatchMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppMatchMoodVo|AppMatchMoodVo|
|&emsp;&emsp;mood|心情详情|AppMoodVo|AppMoodVo|
|&emsp;&emsp;&emsp;&emsp;id|心情ID|integer||
|&emsp;&emsp;&emsp;&emsp;userId|发布者用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer||
|&emsp;&emsp;&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;&emsp;&emsp;voiceDuration|语音时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;&emsp;&emsp;videoDuration|视频时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer||
|&emsp;&emsp;&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer||
|&emsp;&emsp;&emsp;&emsp;likeCount|点赞数|integer||
|&emsp;&emsp;&emsp;&emsp;commentCount|评论数|integer||
|&emsp;&emsp;&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer||
|&emsp;&emsp;&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer||
|&emsp;&emsp;&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;&emsp;&emsp;tags|标签列表|array|string|
|&emsp;&emsp;message|匹配状态描述|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"mood": {
			"id": 0,
			"userId": 0,
			"nickName": "",
			"avatar": "",
			"contentType": 0,
			"textContent": "",
			"voiceUrl": "",
			"voiceDuration": 0,
			"voiceTranscription": "",
			"videoUrl": "",
			"videoCoverUrl": "",
			"videoDuration": 0,
			"videoGenStatus": 0,
			"publishTime": 0,
			"likeCount": 0,
			"commentCount": 0,
			"auditStatus": 0,
			"auditReason": "",
			"status": 0,
			"offlineReason": "",
			"liked": true,
			"favorited": true,
			"tags": []
		},
		"message": "已为您找到一条相似心情"
	},
	"traceId": ""
}
```


# C端认证


## 发送短信验证码


**接口地址**:`/api/sms/send`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>向指定手机号发送6位数字验证码，60秒内只能发送一次，验证码5分钟内有效。（短信服务预留，当前仅记录日志）</p>



**请求示例**:


```javascript
{
  "phone": "13800138000"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appSmsCodeReq|发送短信验证码请求|body|true|AppSmsCodeReq|AppSmsCodeReq|
|&emsp;&emsp;phone|手机号||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


## 手机号验证码登录


**接口地址**:`/api/login/auth`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>使用手机号 + 短信验证码登录，账号不存在时自动注册。登录成功返回 Token，后续请求在 Header 中携带：mood-social-satoken: Bearer {token}</p>



**请求示例**:


```javascript
{
  "phone": "13800138000",
  "code": "123456",
  "inviteCode": "ABC123"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appLoginReq|手机号验证码登录请求|body|true|AppLoginReq|AppLoginReq|
|&emsp;&emsp;phone|手机号||true|string||
|&emsp;&emsp;code|短信验证码（6位数字）||true|string||
|&emsp;&emsp;inviteCode|邀请码（注册时可填，可选）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppLoginVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppLoginVo|AppLoginVo|
|&emsp;&emsp;token|登录 Token（Bearer 前缀，放入请求头 mood-social-satoken）|string||
|&emsp;&emsp;userProfile|C端用户资料|AppUserProfileVo|AppUserProfileVo|
|&emsp;&emsp;&emsp;&emsp;userId|用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;phoneNumber|手机号（脱敏）|string||
|&emsp;&emsp;&emsp;&emsp;nickName|昵称|string||
|&emsp;&emsp;&emsp;&emsp;avatar|头像URL|string||
|&emsp;&emsp;&emsp;&emsp;bio|个人简介|string||
|&emsp;&emsp;&emsp;&emsp;sex|性别：0未知 1男 2女|integer||
|&emsp;&emsp;&emsp;&emsp;inviteCode|我的邀请码|string||
|&emsp;&emsp;&emsp;&emsp;status|账号状态：1正常 0停用|integer||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"token": "",
		"userProfile": {
			"userId": 0,
			"phoneNumber": "138****8000",
			"nickName": "",
			"avatar": "",
			"bio": "",
			"sex": 0,
			"inviteCode": "",
			"status": 0
		}
	},
	"traceId": ""
}
```


## 退出登录


**接口地址**:`/api/auth/logout`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>使当前 Token 失效，需登录后调用</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


# C端点赞


## 切换点赞状态


**接口地址**:`/api/likes/toggle`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>已点赞则取消，未点赞则添加（toggle 机制）。targetType: 1=心情 2=评论。返回操作后的最新点赞状态和点赞数。需登录。</p>



**请求示例**:


```javascript
{
  "targetId": 1000001,
  "targetType": 1
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appToggleLikeReq|切换点赞状态请求|body|true|AppToggleLikeReq|AppToggleLikeReq|
|&emsp;&emsp;targetId|目标ID（心情ID或评论ID）||true|integer(int64)||
|&emsp;&emsp;targetType|目标类型：1心情 2评论||true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppToggleLikeVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppToggleLikeVo|AppToggleLikeVo|
|&emsp;&emsp;liked|当前点赞状态：true=已点赞 false=已取消|boolean||
|&emsp;&emsp;likeCount|目标最新点赞数|integer(int64)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"liked": true,
		"likeCount": 0
	},
	"traceId": ""
}
```


# C端配额


## 查询视频生成配额


**接口地址**:`/api/quota/video`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回当前用户的视频生成配额状态，用于发布页展示「今日首发剩余」等信息。每日首发额度零点自动重置。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppVideoQuotaVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppVideoQuotaVo|AppVideoQuotaVo|
|&emsp;&emsp;dailyRemain|今日首发剩余次数（每日重置，用完后消耗奖励额度）|integer(int32)||
|&emsp;&emsp;bonusQuota|奖励额度余量（注册送3个 + 邀请每人+1，永久有效）|integer(int32)||
|&emsp;&emsp;hasDailyQuota|今日是否还有首发额度|boolean||
|&emsp;&emsp;totalBonusEarned|累计获得奖励额度总量|integer(int32)||
|&emsp;&emsp;totalBonusConsumed|累计消耗奖励额度总量|integer(int32)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"dailyRemain": 0,
		"bonusQuota": 0,
		"hasDailyQuota": true,
		"totalBonusEarned": 0,
		"totalBonusConsumed": 0
	},
	"traceId": ""
}
```


# C端文件上传


## 上传语音


**接口地址**:`/api/upload/voice`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>上传语音文件（multipart/form-data，字段名：file）。支持 mp3/m4a/aac/wav/ogg，大小不超过 20MB。上传成功后返回 URL，发布心情时将 url 填入 voiceUrl 字段。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUploadVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUploadVo|AppUploadVo|
|&emsp;&emsp;ossId|OSS 记录ID（可用于后续文件追溯）|integer(int64)||
|&emsp;&emsp;url|文件访问 URL（可直接用于头像/语音等字段赋值）|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"ossId": 0,
		"url": ""
	},
	"traceId": ""
}
```


## 上传通用文件


**接口地址**:`/api/upload/common`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>上传任意类型文件（multipart/form-data，字段名：file），大小不超过 20MB。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUploadVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUploadVo|AppUploadVo|
|&emsp;&emsp;ossId|OSS 记录ID（可用于后续文件追溯）|integer(int64)||
|&emsp;&emsp;url|文件访问 URL（可直接用于头像/语音等字段赋值）|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"ossId": 0,
		"url": ""
	},
	"traceId": ""
}
```


## 上传头像


**接口地址**:`/api/upload/avatar`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>上传用户头像图片（multipart/form-data，字段名：file）。支持 jpg/png/gif/webp，大小不超过 5MB。上传成功后返回 URL，再调用「更新用户资料」接口或「上传头像」接口完成头像绑定。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUploadVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUploadVo|AppUploadVo|
|&emsp;&emsp;ossId|OSS 记录ID（可用于后续文件追溯）|integer(int64)||
|&emsp;&emsp;url|文件访问 URL（可直接用于头像/语音等字段赋值）|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"ossId": 0,
		"url": ""
	},
	"traceId": ""
}
```


# C端举报


## 提交举报


**接口地址**:`/api/reports`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>举报内容、评论或用户。targetType: 1=内容 2=评论 3=用户。举报提交后进入待处理状态，由管理员后台审核处理。需登录。</p>



**请求示例**:


```javascript
{
  "targetType": 1,
  "targetId": 1000001,
  "reason": "包含不雅内容",
  "extra": "该内容涉及广告宣传"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appSubmitReportReq|提交举报请求|body|true|AppSubmitReportReq|AppSubmitReportReq|
|&emsp;&emsp;targetType|举报对象类型：1内容 2评论 3用户||true|integer(int32)||
|&emsp;&emsp;targetId|举报对象ID||true|integer(int64)||
|&emsp;&emsp;reason|举报原因,可用值:包含不雅内容,垃圾广告,虚假信息,违法违规,其他||true|string||
|&emsp;&emsp;extra|补充说明（可选，最多200字）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


# 腾讯云回调（内部）


## 腾讯云 VOD 事件通知回调


**接口地址**:`/api/pipeline/vod/callback`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>由 VOD 控制台配置的事件通知 URL 推送，无需前端调用</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```javascript

```


## 腾讯云 ASR 识别结果回调


**接口地址**:`/api/asr/callback`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>由腾讯云 ASR 服务主动推送，无需前端调用</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|code||query|false|integer(int32)||
|requestId||query|false|integer(int64)||
|text||query|false|string||
|message||query|false|string||
|audioTime||query|false|number(double)||
|appid||query|false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```javascript

```


# C端标签


## 获取预设标签列表


**接口地址**:`/api/tags`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>返回按使用次数倒序排列的前50个热门标签，供用户发布心情时选择。无需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultListAppTagVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|array|AppTagVo|
|&emsp;&emsp;id|标签ID|integer(int64)||
|&emsp;&emsp;tagName|标签名称|string||
|&emsp;&emsp;refCount|使用次数|integer(int64)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": [
		{
			"id": 0,
			"tagName": "",
			"refCount": 0
		}
	],
	"traceId": ""
}
```


# 腾讯云回调（内部）


## 腾讯云 VOD 事件通知回调


**接口地址**:`/api/pipeline/vod/callback`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>由 VOD 控制台配置的事件通知 URL 推送，无需前端调用</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```javascript

```


## 腾讯云 ASR 识别结果回调


**接口地址**:`/api/asr/callback`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>由腾讯云 ASR 服务主动推送，无需前端调用</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|code||query|false|integer(int32)||
|requestId||query|false|integer(int64)||
|text||query|false|string||
|message||query|false|string||
|audioTime||query|false|number(double)||
|appid||query|false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```javascript

```


# C端评论


## 获取评论列表


**接口地址**:`/api/comments`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询指定心情的顶层评论，按时间倒序。parentId=0 的为顶层评论，replyCount 为该评论下的回复数。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|moodId|心情ID|query|true|integer(int64)||
|pageNum|当前页，默认1|query|false|integer(int32)||
|pageSize|每页条数，默认10|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultPageVoAppCommentVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||PageVoAppCommentVo|PageVoAppCommentVo|
|&emsp;&emsp;total|总数|integer(int64)||
|&emsp;&emsp;size|每页显示条数，默认 10|integer(int64)||
|&emsp;&emsp;current|当前页|integer(int64)||
|&emsp;&emsp;records|评论信息|array|AppCommentVo|
|&emsp;&emsp;&emsp;&emsp;id|评论ID|integer||
|&emsp;&emsp;&emsp;&emsp;moodId|心情ID|integer||
|&emsp;&emsp;&emsp;&emsp;userId|评论用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;nickName|评论用户昵称|string||
|&emsp;&emsp;&emsp;&emsp;avatar|评论用户头像URL|string||
|&emsp;&emsp;&emsp;&emsp;parentId|父评论ID（顶层评论为0）|integer||
|&emsp;&emsp;&emsp;&emsp;rootId|根评论ID（顶层评论为自身ID）|integer||
|&emsp;&emsp;&emsp;&emsp;replyUserId|被回复用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;replyNickName|被回复用户昵称|string||
|&emsp;&emsp;&emsp;&emsp;commentText|评论文本|string||
|&emsp;&emsp;&emsp;&emsp;replyCount|子回复数|integer||
|&emsp;&emsp;&emsp;&emsp;likeCount|点赞数|integer||
|&emsp;&emsp;&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;&emsp;&emsp;createTime|评论时间（毫秒时间戳）|integer||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"total": 0,
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"moodId": 0,
				"userId": 0,
				"nickName": "",
				"avatar": "",
				"parentId": 0,
				"rootId": 0,
				"replyUserId": 0,
				"replyNickName": "",
				"commentText": "",
				"replyCount": 0,
				"createTime": 0
			}
		]
	},
	"traceId": ""
}
```


## 发表评论


**接口地址**:`/api/comments`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>发表评论或回复。顶层评论：parentId 和 rootId 不填（或填0）。回复顶层评论：parentId=顶层评论ID, rootId=顶层评论ID, replyUserId=被回复人ID。回复子评论：parentId=直接父评论ID, rootId=根顶层评论ID, replyUserId=被回复人ID。评论发布后进入待审核状态，审核通过后展示。需登录。</p>



**请求示例**:


```javascript
{
  "moodId": 1000001,
  "commentText": "说得很有道理！",
  "parentId": 0,
  "rootId": 0,
  "replyUserId": 10001
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appAddCommentReq|发表评论请求|body|true|AppAddCommentReq|AppAddCommentReq|
|&emsp;&emsp;moodId|心情ID||true|integer(int64)||
|&emsp;&emsp;commentText|评论内容||true|string||
|&emsp;&emsp;parentId|父评论ID（回复评论时填写，顶层评论不填/填0）||false|integer(int64)||
|&emsp;&emsp;rootId|根评论ID（回复子评论时填写，顶层评论不填/填0）||false|integer(int64)||
|&emsp;&emsp;replyUserId|被回复用户ID（回复评论时填写）||false|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppCommentVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppCommentVo|AppCommentVo|
|&emsp;&emsp;id|评论ID|integer(int64)||
|&emsp;&emsp;moodId|心情ID|integer(int64)||
|&emsp;&emsp;userId|评论用户ID|integer(int64)||
|&emsp;&emsp;nickName|评论用户昵称|string||
|&emsp;&emsp;avatar|评论用户头像URL|string||
|&emsp;&emsp;parentId|父评论ID（顶层评论为0）|integer(int64)||
|&emsp;&emsp;rootId|根评论ID（顶层评论为自身ID）|integer(int64)||
|&emsp;&emsp;replyUserId|被回复用户ID|integer(int64)||
|&emsp;&emsp;replyNickName|被回复用户昵称|string||
|&emsp;&emsp;commentText|评论文本|string||
|&emsp;&emsp;replyCount|子回复数|integer(int32)||
|&emsp;&emsp;likeCount|点赞数|integer(int64)||
|&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;createTime|评论时间（毫秒时间戳）|integer(int64)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"moodId": 0,
		"userId": 0,
		"nickName": "",
		"avatar": "",
		"parentId": 0,
		"rootId": 0,
		"replyUserId": 0,
		"replyNickName": "",
		"commentText": "",
		"replyCount": 0,
		"createTime": 0
	},
	"traceId": ""
}
```


## 删除评论


**接口地址**:`/api/comments/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>软删除自己发表的评论，只能删除自己的评论。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|评论ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


# C端草稿


## 获取草稿


**接口地址**:`/api/drafts`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>获取当前用户指定内容类型的最新草稿。不存在时 data 返回 null，前端据此判断是否显示「继续编辑」入口。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|contentType|内容类型：1文字 2语音 3AI视频|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppDraftVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppDraftVo|AppDraftVo|
|&emsp;&emsp;id|草稿ID|integer(int64)||
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer(int32)||
|&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;voiceDuration|语音时长（秒）|integer(int32)||
|&emsp;&emsp;videoUrl|视频URL|string||
|&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;tags|标签列表|array|string|
|&emsp;&emsp;updateTime|最后保存时间（毫秒时间戳）|integer(int64)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"contentType": 0,
		"textContent": "",
		"voiceUrl": "",
		"voiceDuration": 0,
		"videoUrl": "",
		"videoCoverUrl": "",
		"tags": [],
		"updateTime": 0
	},
	"traceId": ""
}
```


## 保存草稿


**接口地址**:`/api/drafts`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>保存或覆盖当前用户指定类型的草稿（每种 contentType 只保留一条最新草稿）。发布心情前可多次调用本接口暂存内容；成功发布后草稿会自动清除。需登录。</p>



**请求示例**:


```javascript
{
  "contentType": 1,
  "textContent": "今天心情很好！",
  "voiceUrl": "http://minio/mood-social/voice/2026/06/02/xxx.mp3",
  "voiceDuration": 30,
  "videoUrl": "",
  "videoCoverUrl": "",
  "tags": [
    "开心",
    "工作"
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appDraftReq|保存草稿请求|body|true|AppDraftReq|AppDraftReq|
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频||true|integer(int32)||
|&emsp;&emsp;textContent|文字内容（contentType=1时填写）||false|string||
|&emsp;&emsp;voiceUrl|语音 URL（contentType=2时填写，先调上传接口获取）||false|string||
|&emsp;&emsp;voiceDuration|语音时长（秒，contentType=2时填写）||false|integer(int32)||
|&emsp;&emsp;videoUrl|视频 URL（contentType=3时填写）||false|string||
|&emsp;&emsp;videoCoverUrl|视频封面 URL（contentType=3时填写）||false|string||
|&emsp;&emsp;tags|标签列表（最多5个）||false|array|string|


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppDraftVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppDraftVo|AppDraftVo|
|&emsp;&emsp;id|草稿ID|integer(int64)||
|&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer(int32)||
|&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;voiceDuration|语音时长（秒）|integer(int32)||
|&emsp;&emsp;videoUrl|视频URL|string||
|&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;tags|标签列表|array|string|
|&emsp;&emsp;updateTime|最后保存时间（毫秒时间戳）|integer(int64)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"id": 0,
		"contentType": 0,
		"textContent": "",
		"voiceUrl": "",
		"voiceDuration": 0,
		"videoUrl": "",
		"videoCoverUrl": "",
		"tags": [],
		"updateTime": 0
	},
	"traceId": ""
}
```


## 删除草稿


**接口地址**:`/api/drafts`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>手动删除当前用户指定内容类型的草稿。发布成功后系统会自动删除，一般无需手动调用。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|contentType|内容类型：1文字 2语音 3AI视频|query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultVoid|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data|响应数据体|object||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {},
	"traceId": ""
}
```


# C端用户


## 获取当前用户资料


**接口地址**:`/api/user/profile`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>获取当前登录用户的个人资料，手机号脱敏返回（138****8000）。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUserProfileVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUserProfileVo|AppUserProfileVo|
|&emsp;&emsp;userId|用户ID|integer(int64)||
|&emsp;&emsp;phoneNumber|手机号（脱敏）|string||
|&emsp;&emsp;nickName|昵称|string||
|&emsp;&emsp;avatar|头像URL|string||
|&emsp;&emsp;bio|个人简介|string||
|&emsp;&emsp;sex|性别：0未知 1男 2女|integer(int32)||
|&emsp;&emsp;inviteCode|我的邀请码|string||
|&emsp;&emsp;status|账号状态：1正常 0停用|integer(int32)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"userId": 0,
		"phoneNumber": "138****8000",
		"nickName": "",
		"avatar": "",
		"bio": "",
		"sex": 0,
		"inviteCode": "",
		"status": 0
	},
	"traceId": ""
}
```


## 更新当前用户资料


**接口地址**:`/api/user/profile`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>更新昵称、个人简介、性别（部分更新，传哪个字段改哪个，不传则不变）。需登录。</p>



**请求示例**:


```javascript
{
  "nickName": "心情小达人",
  "bio": "每天记录心情，分享美好生活",
  "sex": 1
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appUpdateProfileReq|更新用户资料请求|body|true|AppUpdateProfileReq|AppUpdateProfileReq|
|&emsp;&emsp;nickName|昵称（2-16个字符）||false|string||
|&emsp;&emsp;bio|个人简介（最多100字）||false|string||
|&emsp;&emsp;sex|性别：0未知 1男 2女||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUserProfileVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUserProfileVo|AppUserProfileVo|
|&emsp;&emsp;userId|用户ID|integer(int64)||
|&emsp;&emsp;phoneNumber|手机号（脱敏）|string||
|&emsp;&emsp;nickName|昵称|string||
|&emsp;&emsp;avatar|头像URL|string||
|&emsp;&emsp;bio|个人简介|string||
|&emsp;&emsp;sex|性别：0未知 1男 2女|integer(int32)||
|&emsp;&emsp;inviteCode|我的邀请码|string||
|&emsp;&emsp;status|账号状态：1正常 0停用|integer(int32)||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"userId": 0,
		"phoneNumber": "138****8000",
		"nickName": "",
		"avatar": "",
		"bio": "",
		"sex": 0,
		"inviteCode": "",
		"status": 0
	},
	"traceId": ""
}
```


## 上传头像


**接口地址**:`/api/user/avatar`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>上传用户头像图片（multipart/form-data，字段名：file）。OSS 存储预留，当前接口返回空 avatarUrl，接入 OSS 后返回可访问的图片 URL。支持 jpg/png/gif，建议不超过 2MB。需登录。</p>



**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppUploadAvatarVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppUploadAvatarVo|AppUploadAvatarVo|
|&emsp;&emsp;avatarUrl|头像访问URL（OSS预留，暂时返回空）|string||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"avatarUrl": ""
	},
	"traceId": ""
}
```


# C端收藏


## 切换收藏状态


**接口地址**:`/api/favorites/toggle/{moodId}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>已收藏则取消，未收藏则添加（toggle 机制）。返回操作后的最新收藏状态。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|moodId|心情ID|path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultAppToggleFavoriteVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||AppToggleFavoriteVo|AppToggleFavoriteVo|
|&emsp;&emsp;favorited|是否已收藏|boolean||
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"favorited": true
	},
	"traceId": ""
}
```


## 我的收藏列表


**接口地址**:`/api/favorites/mine`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询当前用户收藏的心情，按收藏时间倒序。需登录。</p>



**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|pageNum|当前页，默认1|query|false|integer(int32)||
|pageSize|每页条数，默认10|query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|HttpResultPageVoAppMoodVo|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code|状态码|integer(int32)|integer(int32)|
|message|描述|string||
|jumpRouter|跳转路由|string||
|data||PageVoAppMoodVo|PageVoAppMoodVo|
|&emsp;&emsp;total|总数|integer(int64)||
|&emsp;&emsp;size|每页显示条数，默认 10|integer(int64)||
|&emsp;&emsp;current|当前页|integer(int64)||
|&emsp;&emsp;records|心情详情|array|AppMoodVo|
|&emsp;&emsp;&emsp;&emsp;id|心情ID|integer||
|&emsp;&emsp;&emsp;&emsp;userId|发布者用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;nickName|发布者昵称|string||
|&emsp;&emsp;&emsp;&emsp;avatar|发布者头像URL|string||
|&emsp;&emsp;&emsp;&emsp;contentType|内容类型：1文字 2语音 3AI视频|integer||
|&emsp;&emsp;&emsp;&emsp;textContent|文字内容|string||
|&emsp;&emsp;&emsp;&emsp;voiceUrl|语音URL|string||
|&emsp;&emsp;&emsp;&emsp;voiceDuration|语音时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;voiceTranscription|语音AI转写文字（有则显示，用于视频生成输入展示）|string||
|&emsp;&emsp;&emsp;&emsp;videoUrl|视频URL（AI生成或人工替换）|string||
|&emsp;&emsp;&emsp;&emsp;videoCoverUrl|视频封面URL|string||
|&emsp;&emsp;&emsp;&emsp;videoDuration|视频时长（秒）|integer||
|&emsp;&emsp;&emsp;&emsp;videoGenStatus|视频生成状态：0未生成 1生成中 2成功 3失败|integer||
|&emsp;&emsp;&emsp;&emsp;publishTime|发布时间（毫秒时间戳）|integer||
|&emsp;&emsp;&emsp;&emsp;likeCount|点赞数|integer||
|&emsp;&emsp;&emsp;&emsp;commentCount|评论数|integer||
|&emsp;&emsp;&emsp;&emsp;auditStatus|审核状态：0待审核 1通过 2拒绝|integer||
|&emsp;&emsp;&emsp;&emsp;auditReason|审核拒绝原因（auditStatus=2时有值）|string||
|&emsp;&emsp;&emsp;&emsp;status|展示状态：0停用 1正常 2违规下线|integer||
|&emsp;&emsp;&emsp;&emsp;offlineReason|违规下线原因（仅作者本人查看非正常内容时使用）|string||
|&emsp;&emsp;&emsp;&emsp;liked|当前登录用户是否已点赞|boolean||
|&emsp;&emsp;&emsp;&emsp;favorited|当前登录用户是否已收藏|boolean||
|&emsp;&emsp;&emsp;&emsp;tags|标签列表|array|string|
|traceId|链路追踪ID|string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"jumpRouter": "",
	"data": {
		"total": 0,
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"nickName": "",
				"avatar": "",
				"contentType": 0,
				"textContent": "",
				"voiceUrl": "",
				"voiceDuration": 0,
				"voiceTranscription": "",
				"videoUrl": "",
				"videoCoverUrl": "",
				"videoDuration": 0,
				"videoGenStatus": 0,
				"publishTime": 0,
				"likeCount": 0,
				"commentCount": 0,
				"auditStatus": 0,
				"auditReason": "",
				"status": 0,
				"offlineReason": "",
				"liked": true,
				"favorited": true,
				"tags": []
			}
		]
	},
	"traceId": ""
}
```


# test-controller


## test


**接口地址**:`/api/test/test`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```javascript

```
