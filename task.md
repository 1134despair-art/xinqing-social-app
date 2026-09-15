# 心情星球页面功能、接口与测试要点梳理

## 1. 项目概览

### 1.1 页面清单

当前 `pages.json` 中注册的页面如下：

| 页面名称 | 路径 | 说明 |
| --- | --- | --- |
| 登录页 | `pages/login/login` | 未登录时入口页 |
| 首页/心情广场 | `pages/index/index` | Tab 首页，展示全站心情流 |
| 发布页 | `pages/publish/publish` | Tab 页，发布心情和生成视频 |
| 匹配页 | `pages/match/match` | Tab 页，展示心情匹配结果 |
| 个人空间 | `pages/space/space` | Tab 页，查看个人资料与我的心情 |
| 设置页 | `pages/settings/settings` | Tab 页，编辑资料入口、关于我们、退出登录 |
| 心情详情 | `pages/space/detail` | 非 Tab 页，查看单条心情详情和评论 |
| 编辑资料 | `pages/settings/edit-profile` | 非 Tab 页，修改头像、昵称、签名 |
| 关于我们 | `pages/settings/about` | 非 Tab 页，展示协议与隐私入口 |

补充说明：

- `pages/profile/profile.vue` 存在于代码仓库中，但未注册到 `pages.json`，当前不会被正式路由访问。
- `App.vue` 在应用启动时会检查本地 `token`，无 token 时跳转登录页。

### 1.2 接口清单

统一请求封装：`utils/request.js`

| 接口模块 | 方法 | 接口地址 | 用途 |
| --- | --- | --- | --- |
| `api/auth.js` | `sendSmsCode(phone)` | `POST /api/app/sms/send` | 发送短信验证码 |
| `api/auth.js` | `login(phone, code)` | `POST /api/login/auth` | 手机号验证码登录 |
| `api/auth.js` | `logout()` | `POST /api/app/auth/logout` | 退出登录 |
| `api/mood.js` | `getMoodList(params)` | `GET /api/app/moods` | 获取心情列表 |
| `api/mood.js` | `getMoodDetail(id)` | `GET /api/app/moods/{id}` | 获取心情详情 |
| `api/mood.js` | `publishMood(data)` | `POST /api/app/moods` | 发布心情 |
| `api/mood.js` | `deleteMood(id)` | `DELETE /api/app/moods/{id}` | 删除心情 |
| `api/mood.js` | `generateVideo(data)` | `POST /api/app/moods/generate-video` | 生成视频 |
| `api/mood.js` | `matchMoods()` | `GET /api/app/moods/match` | 获取匹配结果 |
| `api/comment.js` | `getCommentList(moodId, params)` | `GET /api/app/comments` | 获取评论列表 |
| `api/comment.js` | `addComment(data)` | `POST /api/app/comments` | 发表评论 |
| `api/comment.js` | `deleteComment(id)` | `DELETE /api/app/comments/{id}` | 删除评论 |
| `api/like.js` | `toggleLike(targetId, targetType)` | `POST /api/app/likes/toggle` | 切换点赞状态 |
| `api/report.js` | `submitReport(data)` | `POST /api/app/reports` | 提交举报 |
| `api/tag.js` | `getPresetTags()` | `GET /api/app/tags` | 获取预设标签 |
| `api/user.js` | `getUserProfile()` | `GET /api/app/user/profile` | 获取当前用户资料 |
| `api/user.js` | `updateProfile(data)` | `PUT /api/app/user/profile` | 更新当前用户资料 |
| `api/user.js` | `uploadAvatar(filePath)` | `UPLOAD /api/app/user/avatar` | 上传头像 |

## 2. 页面逐页梳理

---

## 2.1 登录页 `pages/login/login`

### 页面功能

- 输入手机号与验证码
- 获取短信验证码
- 勾选用户协议和隐私政策
- 执行登录并写入本地 `token`
- 登录成功后跳转首页 Tab
- 点击协议/隐私政策跳转到关于页并带 `type` 参数

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 点击“获取验证码” | `sendSmsCode(phone)` | `POST /api/app/sms/send` | 发送验证码 |
| 点击“登录” | `login(phone, code)` | `POST /api/login/auth` | 登录并获取 token |

### 关键交互逻辑

- 手机号必须匹配 `^1[3-9]\d{9}$`
- 验证码按钮发送成功后进入 60 秒倒计时
- 登录按钮依赖手机号、验证码长度以及协议勾选状态
- 登录成功后会把 `res.data` 或 `res.token` 写入本地缓存

### 测试要点

- 输入非法手机号时，获取验证码按钮不能正常触发请求且应有提示
- 连续点击“获取验证码”时，倒计时期间不能重复发送
- 协议未勾选时，登录按钮应不可用
- 正确手机号 + 正确验证码时，应写入 `token` 并跳转到 `pages/index/index`
- 错误验证码、接口异常、网络超时场景下，应有错误提示且不能进入首页
- 点击用户协议和隐私政策时，页面跳转链路应正确

---

## 2.2 首页/心情广场 `pages/index/index`

### 页面功能

- 加载当前用户信息，用于评论/删除权限判断
- 按排序类型展示心情列表：最新、热度、历史最热
- 支持下拉刷新与上拉分页加载
- 展开/收起超长内容
- 展开后可播放已生成的视频
- 对心情进行点赞、评论、举报
- 通过弹窗处理评论与举报

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面加载 | `getUserProfile()` | `GET /api/app/user/profile` | 获取当前用户 ID |
| 页面加载/切换排序/刷新/分页 | `getMoodList(params)` | `GET /api/app/moods` | 获取心情列表 |
| 点击点赞 | `toggleLike(moodId, '0')` | `POST /api/app/likes/toggle` | 心情点赞/取消点赞 |
| 打开评论弹窗 | `getCommentList(moodId, params)` | `GET /api/app/comments` | 由 `CommentPopup` 触发 |
| 评论发送 | `addComment(data)` | `POST /api/app/comments` | 由 `CommentPopup` 触发 |
| 评论点赞 | `toggleLike(commentId, '1')` | `POST /api/app/likes/toggle` | 由 `CommentPopup` 触发 |
| 删除评论 | `deleteComment(commentId)` | `DELETE /api/app/comments/{id}` | 由 `CommentPopup` 触发 |
| 提交举报 | `submitReport(data)` | `POST /api/app/reports` | 由 `ReportPopup` 触发 |

### 关键交互逻辑

- 列表接口参数包含 `sortType`、`pageNum`、`pageSize`
- 点赞采用乐观更新，失败时回滚本地状态
- 评论数由评论弹窗通过 `commentCountChange` 回传并更新列表项
- 举报弹窗会携带 `contentId` 与 `reportedUserId`

### 测试要点

- 首次进入页面时，列表、用户信息、排序 tab 是否正常加载
- 下拉刷新后，列表是否重置为第一页
- 上拉加载时，分页是否累加且“没有更多了”状态正确
- 排序切换时，请求参数 `sortType` 是否变化且 UI 正常刷新
- 长文本展开/收起是否正常，视频状态为可播放时是否显示 video 组件
- 点赞成功、失败、快速连点时，数量和状态是否一致
- 评论弹窗打开、发表评论、删除评论、评论点赞后，首页评论数是否同步更新
- 举报提交成功后，弹窗是否关闭并给出反馈
- 空状态、加载失败状态、重试逻辑是否正确

---

## 2.3 发布页 `pages/publish/publish`

### 页面功能

- 输入心情内容，实时显示字数
- 长按录音，尝试进行语音输入前置能力接入
- 加载并选择预设标签
- 添加/删除自定义标签
- 基于文字内容生成视频
- 发布心情，成功后回到首页

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面加载 | `getPresetTags()` | `GET /api/app/tags` | 获取预设标签 |
| 点击“生成视频” | `generateVideo({ content })` | `POST /api/app/moods/generate-video` | 根据文本生成视频 |
| 点击“发布心情” | `publishMood(data)` | `POST /api/app/moods` | 发布心情 |

### 关键交互逻辑

- 心情内容为空时，不允许生成视频，也不允许发布
- 生成视频成功后，保存 `videoUrl` 与 `videoMoodId`
- 发布时提交 `content`、`tagIds`、`customTags`
- 如果已生成视频，会把 `videoMoodId` 作为 `moodId` 一并提交
- 录音功能当前仅处理录音与提示，未接入实际语音识别结果回填

### 测试要点

- 页面初始化时，预设标签是否正常展示
- 输入为空时，生成视频按钮与发布按钮应不可用或触发提示
- 输入接近 500 字时，字数警示样式是否正确
- 标签多选、自定义标签新增、重复标签拦截、删除标签是否符合预期
- 生成视频成功后，是否展示视频预览和重新生成按钮
- 生成视频失败、超时、后端未返回 `videoUrl` 时，提示是否合理
- 发布成功后，表单、标签、视频状态是否重置并跳转首页
- 录音权限拒绝、录音时长过短、当前环境不支持录音时，提示是否正确

---

## 2.4 匹配页 `pages/match/match`

### 页面功能

- 展示心情匹配结果列表
- 支持页面显示时自动刷新
- 支持下拉刷新
- 未发布心情时提示去发布
- 无结果时展示空状态

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面显示/下拉刷新 | `matchMoods()` | `GET /api/app/moods/match` | 获取匹配结果 |

### 关键交互逻辑

- 若接口 `msg` 包含“请先发布”，页面进入 `noMood` 状态
- 结果数据优先取 `res.data`，其次取 `res.rows`
- 点击“去发布”跳转到发布 Tab

### 测试要点

- 页面首次进入和每次切回时，是否重新加载匹配结果
- 未发布心情时，是否正确显示“去发布”入口
- 匹配结果为空但非异常时，是否显示空状态而非失败状态
- 接口异常时，是否进入加载失败状态并支持点击重试
- 匹配度、用户信息、标签、发布时间展示是否正确
- 点击“去发布”后，是否正确切换到 `pages/publish/publish`

---

## 2.5 个人空间 `pages/space/space`

### 页面功能

- 展示当前用户资料、心情数、获赞数
- 展示当前用户发布的心情列表
- 支持分页加载我的心情
- 点击心情进入详情页
- 支持删除自己发布的心情

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面显示 | `getUserProfile()` | `GET /api/app/user/profile` | 获取用户资料 |
| 页面显示/刷新/分页 | `getMoodList({ userId: 'self', ... })` | `GET /api/app/moods` | 获取当前用户心情列表 |
| 点击删除 | `deleteMood(moodId)` | `DELETE /api/app/moods/{id}` | 删除心情 |

### 关键交互逻辑

- 我的心情列表通过 `userId: 'self'` 区分个人数据
- 删除成功后会同时刷新用户资料和列表
- 点击卡片主体跳转详情，点击删除按钮阻止冒泡

### 测试要点

- 用户资料中的头像、昵称、签名、统计字段是否正确展示
- 我的心情列表为空时，是否展示空状态
- 上拉分页是否正常，分页数据是否累加且无重复
- 点击卡片是否进入对应详情页
- 删除确认弹窗是否正确出现，取消删除是否不发请求
- 删除成功后，列表数量和顶部统计是否同步刷新
- 删除失败时，是否给出提示且保留原数据

---

## 2.6 心情详情 `pages/space/detail`

### 页面功能

- 根据 `id` 加载单条心情详情
- 展示用户信息、心情内容、视频、标签
- 展示点赞数、评论数
- 展示前 50 条评论摘要
- 支持心情点赞
- 支持打开评论弹窗进行评论操作

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面加载 | `getMoodDetail(id)` | `GET /api/app/moods/{id}` | 获取详情 |
| 页面加载 | `getCommentList(moodId, { pageNum: 1, pageSize: 50 })` | `GET /api/app/comments` | 获取评论列表 |
| 页面加载 | `getUserProfile()` | `GET /api/app/user/profile` | 获取当前用户 ID |
| 点击点赞 | `toggleLike(moodId, '0')` | `POST /api/app/likes/toggle` | 心情点赞 |
| 打开评论弹窗 | `getCommentList(moodId, params)` | `GET /api/app/comments` | 由 `CommentPopup` 触发 |
| 评论发送 | `addComment(data)` | `POST /api/app/comments` | 由 `CommentPopup` 触发 |
| 评论点赞 | `toggleLike(commentId, '1')` | `POST /api/app/likes/toggle` | 由 `CommentPopup` 触发 |
| 删除评论 | `deleteComment(commentId)` | `DELETE /api/app/comments/{id}` | 由 `CommentPopup` 触发 |

### 关键交互逻辑

- 页面依赖路由参数 `id`
- 点赞同样使用乐观更新，失败后回滚
- 评论弹窗回传评论数后，会同步刷新详情页评论数并重新拉评论列表

### 测试要点

- 携带有效 `id` 进入页面时，详情和评论是否都能加载
- 无效 `id`、接口失败时，页面提示是否合理
- 有视频/无视频、有标签/无标签场景展示是否正确
- 点赞成功、失败、重复点击时，计数与状态是否一致
- 评论弹窗新增评论后，详情页评论数和评论列表是否刷新
- 评论列表为空时，空状态是否正常

---

## 2.7 设置页 `pages/settings/settings`

### 页面功能

- 展示当前用户头像和昵称
- 提供编辑资料入口
- 提供关于我们入口
- 支持退出登录

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面显示 | `getUserProfile()` | `GET /api/app/user/profile` | 获取当前用户信息 |
| 点击退出登录 | `logout()` | `POST /api/app/auth/logout` | 登出 |

### 关键交互逻辑

- 退出登录时，即使接口失败，也会在 `finally` 中清除本地 token 并跳转登录页
- 编辑资料与关于我们均为页面跳转入口

### 测试要点

- 页面展示时，头像和昵称是否正常获取
- 点击顶部卡片或“编辑资料”是否进入编辑资料页
- 点击“关于我们”是否进入关于页
- 点击退出登录后，确认弹窗是否正常
- 登出成功与登出失败场景下，是否都能清除 token 并跳转登录页

---

## 2.8 编辑资料页 `pages/settings/edit-profile`

### 页面功能

- 加载当前用户资料回填表单
- 选择相册或相机图片作为头像
- 上传头像并更新头像显示
- 修改昵称、个性签名
- 保存资料后返回上一页

### 请求接口

| 触发点 | 方法 | 接口 | 说明 |
| --- | --- | --- | --- |
| 页面加载 | `getUserProfile()` | `GET /api/app/user/profile` | 获取当前用户资料 |
| 选择头像后 | `uploadAvatar(filePath)` | `UPLOAD /api/app/user/avatar` | 上传头像 |
| 点击保存 | `updateProfile(data)` | `PUT /api/app/user/profile` | 更新昵称和签名 |

### 关键交互逻辑

- 昵称必填，长度限制 2 到 20 位
- 签名可为空，最大长度由输入控件限制为 100
- 上传头像成功后，接口返回的 `res.data` 会直接作为头像地址回填

### 测试要点

- 页面初始化时，头像、昵称、签名是否正确回填
- 昵称为空、昵称少于 2 位、超过 20 位时，保存应被拦截
- 选择相册/相机图片后，头像上传链路是否正常
- 拒绝相机或相册权限时，是否有提示
- 上传头像失败时，是否有错误提示且不覆盖原头像
- 保存成功后，是否返回上一页，并在设置页/个人空间中看到更新结果

---

## 2.9 关于我们 `pages/settings/about`

### 页面功能

- 展示应用 logo、名称、版本
- 展示“用户协议”和“隐私政策”入口
- 支持通过参数直接打开协议或隐私入口

### 请求接口

- 无接口请求

### 关键交互逻辑

- `onLoad` 中根据 `type=agreement` 或 `type=privacy` 自动调用对应方法
- 当前 `openAgreement` 和 `openPrivacy` 方法再次跳到本页自身路径，未接入真实 H5 协议页面
- 如果真实目标未配置，当前实现存在再次导航到本页的风险，功能上更像占位实现

### 测试要点

- 普通进入关于页时，静态信息是否正常展示
- 从登录页点击“用户协议”或“隐私政策”时，跳转是否符合预期
- 检查 `type=agreement`、`type=privacy` 场景是否存在重复跳转或递归进入本页的问题
- 在真实协议页未接入前，应确认产品预期是 toast 提示还是跳 H5 页面

---

## 2.10 未注册页面 `pages/profile/profile.vue`

### 页面现状

- 该页面是一个更通用的“个人中心模板页”
- 使用了 `store`、`CustomList`、大量占位路由与模拟登录逻辑
- 没有接入当前项目的真实用户接口体系
- 当前未注册进 `pages.json`，默认不会被访问到

### 已识别功能

- 显示用户头像、昵称、描述、统计信息
- 快捷功能区、功能列表、设置列表
- 可触发模拟登录和本地头像替换
- 大量页面跳转目标为占位页面，如订单、优惠券、钱包、帮助中心等

### 请求接口

- 无当前项目真实 API 调用

### 测试建议

- 若后续计划启用该页，应先确认是否保留、重构还是删除
- 在未注册状态下，可作为历史模板处理，不建议纳入当前正式测试范围

## 3. 组件级补充说明

### 3.1 评论弹窗 `components/CommentPopup.vue`

#### 功能

- 打开时按 `moodId` 拉取评论列表
- 发表评论
- 点赞评论
- 删除当前用户自己的评论
- 通过 `commentCountChange` 事件把最新评论总数回传父页面

#### 接口

- `getCommentList(moodId, { pageNum, pageSize })`
- `addComment({ moodId, content })`
- `toggleLike(commentId, '1')`
- `deleteComment(commentId)`

#### 测试要点

- 弹窗打开/关闭是否正常
- 评论内容为空、超长、成功提交、失败提交场景是否正确
- 删除评论后总数和列表是否同步更新
- 评论点赞失败时，本地乐观更新是否回滚

### 3.2 举报弹窗 `components/ReportPopup.vue`

#### 功能

- 输入举报原因并提交
- 打开时重置举报原因

#### 接口

- `submitReport({ contentId, reportedUserId, reason })`

#### 测试要点

- 举报原因为空时应拦截提交
- 提交成功后应关闭弹窗
- 重复点击提交时，`submitting` 状态是否生效
- 提交失败时是否保留输入内容并提示问题

## 4. 建议优先测试链路

建议按下面顺序进行联调和冒烟测试：

1. 登录页：验证码发送、登录成功、登录失败
2. 首页：列表加载、排序切换、点赞、评论、举报
3. 发布页：加载标签、发布心情、生成视频
4. 个人空间：我的资料、我的心情、删除心情、进入详情
5. 心情详情：详情加载、评论同步、点赞同步
6. 设置页：编辑资料、头像上传、退出登录
7. 匹配页：正常结果、无结果、未发布心情提示

## 5. 当前发现的风险点

- `pages/settings/about.vue` 的协议/隐私入口仍是占位实现，存在重复跳回本页的风险
- `pages/publish/publish.vue` 的语音输入只完成录音能力接入，未真正把识别结果写回文本框
- `pages/profile/profile.vue` 与当前项目主流程脱节，属于未启用模板页
- 评论、举报逻辑分散在弹窗组件里，测试时不能只测页面本体，需要把弹窗链路一起验证

## 6. 接口维度测试用例表

### 6.1 认证类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `POST /api/app/sms/send` | 正常发送验证码 | 合法手机号 | 返回成功，前端进入 60 秒倒计时 |
| `POST /api/app/sms/send` | 非法手机号拦截 | 少位数、非手机号段 | 前端不发请求或接口返回失败提示 |
| `POST /api/app/sms/send` | 重复点击 | 倒计时期间再次点击 | 不应重复发送请求 |
| `POST /api/app/sms/send` | 网络异常 | 断网/超时 | 提示发送失败，倒计时不开始 |
| `POST /api/login/auth` | 正常登录 | 正确手机号 + 正确验证码 | 返回 token，写入本地缓存并跳首页 |
| `POST /api/login/auth` | 错误验证码 | 正确手机号 + 错误验证码 | 登录失败，停留登录页 |
| `POST /api/login/auth` | token 字段兼容 | 分别返回 `data` 或 `token` | 前端都能正确取到 token |
| `POST /api/login/auth` | 未勾选协议 | 不勾选协议直接点登录 | 前端拦截，按钮不可用或不发请求 |
| `POST /api/app/auth/logout` | 正常退出 | 已登录状态 | 返回成功，清除 token 并跳登录页 |
| `POST /api/app/auth/logout` | 接口失败兜底 | 后端 500/断网 | 前端仍清除 token 并跳登录页 |

### 6.2 用户资料类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `GET /api/app/user/profile` | 正常获取资料 | 已登录且 token 有效 | 返回头像、昵称、签名、统计等字段 |
| `GET /api/app/user/profile` | 未登录/过期 token | token 无效 | 触发 401 逻辑，清 token 并跳登录 |
| `GET /api/app/user/profile` | 字段缺失兼容 | avatar/nickname/signature 为空 | 页面使用默认值展示，不崩溃 |
| `PUT /api/app/user/profile` | 正常更新资料 | 合法昵称 + 合法签名 | 返回成功，页面提示成功并返回 |
| `PUT /api/app/user/profile` | 昵称为空 | 空昵称 | 前端拦截，不发请求 |
| `PUT /api/app/user/profile` | 昵称长度越界 | 小于 2 位或大于 20 位 | 前端拦截，不发请求 |
| `PUT /api/app/user/profile` | 保存失败 | 后端报错/网络异常 | 停留当前页，保留输入内容 |
| `UPLOAD /api/app/user/avatar` | 正常上传头像 | 选择有效图片 | 返回图片地址，头像立即刷新 |
| `UPLOAD /api/app/user/avatar` | 图片权限拒绝 | 相册/相机权限拒绝 | 弹出授权相关提示 |
| `UPLOAD /api/app/user/avatar` | 上传失败 | 网络异常/服务端失败 | 给出失败提示，头像不变 |

### 6.3 心情列表与详情类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `GET /api/app/moods` | 首页最新排序 | `sortType=latest` | 按最新顺序返回列表 |
| `GET /api/app/moods` | 首页热度排序 | `sortType=hot` | 按热度顺序返回列表 |
| `GET /api/app/moods` | 首页历史最热排序 | `sortType=allTimeHot` | 按历史最热顺序返回列表 |
| `GET /api/app/moods` | 分页加载 | `pageNum` 递增 | 返回不同页数据，前端可拼接 |
| `GET /api/app/moods` | 我的心情 | `userId=self` | 仅返回当前登录用户的数据 |
| `GET /api/app/moods` | 空列表 | 当前无数据 | 返回空数组，页面展示空状态 |
| `GET /api/app/moods` | 接口失败 | 服务异常/断网 | 页面展示失败态并支持重试 |
| `GET /api/app/moods/{id}` | 正常获取详情 | 有效 `moodId` | 返回完整心情详情 |
| `GET /api/app/moods/{id}` | 无效详情 ID | 不存在的 `moodId` | 返回失败或空数据，页面提示加载失败 |
| `GET /api/app/moods/{id}` | 视频字段校验 | `videoStatus=2` 且有 `videoUrl` | 详情页和首页展开后都能播放视频 |

### 6.4 发布与视频生成类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `GET /api/app/tags` | 正常获取标签 | 页面进入发布页 | 返回预设标签列表并渲染 |
| `GET /api/app/tags` | 空标签集 | 后端无标签数据 | 页面可正常显示，无报错 |
| `POST /api/app/moods/generate-video` | 正常生成视频 | 有效 `content` | 返回 `videoUrl`，页面展示视频预览 |
| `POST /api/app/moods/generate-video` | 内容为空 | 空 `content` | 前端拦截，不应发请求 |
| `POST /api/app/moods/generate-video` | 生成失败 | 后端失败/未返回 `videoUrl` | 页面提示生成失败 |
| `POST /api/app/moods/generate-video` | 重复生成 | 连续点击重新生成 | 能正确覆盖旧视频预览 |
| `POST /api/app/moods` | 普通发布 | `content + tagIds + customTags` | 发布成功并跳转首页 |
| `POST /api/app/moods` | 携带视频发布 | 额外带 `moodId=videoMoodId` | 后端正确关联视频内容 |
| `POST /api/app/moods` | 内容为空 | 空 `content` | 前端拦截，不发请求 |
| `POST /api/app/moods` | 内容超长 | 超过 500 字 | 前端拦截并提示 |
| `POST /api/app/moods` | 发布失败 | 网络异常/后端失败 | 表单内容保留，不跳转 |

### 6.5 匹配类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `GET /api/app/moods/match` | 正常匹配 | 当前用户已发布心情 | 返回匹配结果列表 |
| `GET /api/app/moods/match` | 无匹配结果 | 已发布但暂无匹配 | 返回空数组，页面展示空状态 |
| `GET /api/app/moods/match` | 未发布心情 | 接口返回“请先发布”提示 | 页面展示去发布引导 |
| `GET /api/app/moods/match` | 接口失败 | 网络异常/服务异常 | 页面展示失败态并支持重试 |

### 6.6 评论类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `GET /api/app/comments` | 正常获取评论 | 有效 `moodId` | 返回评论列表和总数 |
| `GET /api/app/comments` | 评论为空 | 该心情无评论 | 返回空数组，页面/弹窗展示空状态 |
| `GET /api/app/comments` | 分页参数校验 | `pageNum=1,pageSize=50/100` | 能按参数返回数据 |
| `POST /api/app/comments` | 正常发表评论 | 合法 `moodId + content` | 评论成功，评论数更新 |
| `POST /api/app/comments` | 空评论 | 空字符串或空白字符 | 前端拦截，不发请求 |
| `POST /api/app/comments` | 超长评论 | 超过 200 字 | 前端拦截，不发请求 |
| `POST /api/app/comments` | 发布失败 | 网络异常/后端失败 | 弹窗保留输入内容，并提示失败 |
| `DELETE /api/app/comments/{id}` | 正常删除评论 | 当前用户自己的评论 | 删除成功，列表刷新，评论数同步 |
| `DELETE /api/app/comments/{id}` | 删除他人评论 | 非本人评论 | 前端不展示删除入口或后端拒绝 |
| `DELETE /api/app/comments/{id}` | 删除失败 | 网络异常/权限异常 | 列表不变并提示失败 |

### 6.7 点赞类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `POST /api/app/likes/toggle` | 点赞心情 | `targetType='0'` | 返回最新 `liked` 和 `likeCount` |
| `POST /api/app/likes/toggle` | 取消点赞心情 | 对已点赞心情再次调用 | 状态变未点赞，数量减 1 |
| `POST /api/app/likes/toggle` | 点赞评论 | `targetType='1'` | 评论点赞状态和数量更新 |
| `POST /api/app/likes/toggle` | 接口失败回滚 | 断网/服务异常 | 前端乐观更新回滚到原值 |
| `POST /api/app/likes/toggle` | 快速重复点击 | 短时间内多次触发 | 最终状态应与最后一次真实返回一致 |

### 6.8 举报类接口

| 接口 | 测试场景 | 输入/前置条件 | 预期结果 |
| --- | --- | --- | --- |
| `POST /api/app/reports` | 正常举报 | `contentId + reportedUserId + reason` 合法 | 举报成功，弹窗关闭 |
| `POST /api/app/reports` | 举报理由为空 | 空 `reason` | 前端拦截，不发请求 |
| `POST /api/app/reports` | 连续点击提交 | `submitting=true` 时重复点击 | 不应重复提交 |
| `POST /api/app/reports` | 举报失败 | 网络异常/服务异常 | 停留当前弹窗，保留举报内容 |

## 7. 推荐执行顺序

如果要按接口维度做联调，建议按照下面顺序执行：

1. 先测 `认证类接口`，保证登录态稳定
2. 再测 `用户资料类接口`，保证头像、昵称、签名链路可用
3. 再测 `心情列表与详情类接口`，验证主数据流
4. 接着测 `发布与视频生成类接口`，验证内容生产链路
5. 再测 `评论类接口` 与 `点赞类接口`，验证互动能力
6. 最后测 `举报类接口` 与 `匹配类接口`

这样执行的好处是：

- 先解决登录和用户信息依赖
- 再验证页面主数据流
- 最后验证衍生和辅助功能

## 8. 接口测试数据样例

以下样例主要用于联调、自测、接口回归时快速复用。实际测试时请按你的环境替换真实 ID、token、图片路径和用户数据。

### 8.1 认证类样例

#### 发送验证码

```json
{
  "phone": "13800138000"
}
```

#### 登录

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

#### 认证类异常样例

```json
[
  {
    "phone": "1380013800"
  },
  {
    "phone": "12345678901"
  },
  {
    "phone": "13800138000",
    "code": "000000"
  }
]
```

### 8.2 用户资料类样例

#### 获取用户资料

- 无需请求体
- 需要请求头中带有效 `Authorization`

#### 更新用户资料

```json
{
  "nickname": "晴天也有小情绪",
  "signature": "把今天的心情写成明天的勇气。"
}
```

#### 更新资料边界样例

```json
[
  {
    "nickname": "A",
    "signature": "昵称过短"
  },
  {
    "nickname": "这是一个超过二十个字的昵称测试样例",
    "signature": "昵称过长"
  },
  {
    "nickname": "正常昵称",
    "signature": ""
  }
]
```

#### 上传头像样例

- 文件路径示例：`/var/mobile/Containers/Data/test/avatar.jpg`
- H5 可用本地临时图片路径
- Android 真机可用 `uni.chooseImage` 选择后的临时路径

### 8.3 心情列表与详情类样例

#### 首页最新列表

```json
{
  "sortType": "latest",
  "pageNum": 1,
  "pageSize": 20
}
```

#### 首页热度列表

```json
{
  "sortType": "hot",
  "pageNum": 1,
  "pageSize": 20
}
```

#### 首页历史最热列表

```json
{
  "sortType": "allTimeHot",
  "pageNum": 1,
  "pageSize": 20
}
```

#### 我的心情列表

```json
{
  "userId": "self",
  "sortType": "latest",
  "pageNum": 1,
  "pageSize": 20
}
```

#### 心情详情路径参数样例

```json
{
  "id": 1001
}
```

#### 列表分页边界样例

```json
[
  {
    "sortType": "latest",
    "pageNum": 1,
    "pageSize": 1
  },
  {
    "sortType": "latest",
    "pageNum": 999,
    "pageSize": 20
  }
]
```

### 8.4 发布与视频生成类样例

#### 获取预设标签

- 无需请求体

#### 生成视频

```json
{
  "content": "今天下班后一个人散步，晚风很轻，突然觉得很多烦恼都可以慢慢放下。"
}
```

#### 生成视频边界样例

```json
[
  {
    "content": ""
  },
  {
    "content": "难过"
  },
  {
    "content": "这是一段较长的测试文本，用于验证视频生成接口在长文本条件下的处理能力，以及前端加载中状态、失败提示和成功回显逻辑是否正常。"
  }
]
```

#### 发布普通心情

```json
{
  "content": "今天终于把项目的主要流程跑通了，虽然还有细节要修，但已经看到成果了。",
  "tagIds": [1, 3, 5],
  "customTags": ["阶段性胜利", "继续加油"]
}
```

#### 发布带视频的心情

```json
{
  "moodId": 1001,
  "content": "把今天的情绪做成了一段短视频，希望以后回看的时候还能记住这一刻。",
  "tagIds": [2, 4],
  "customTags": ["视频记录"]
}
```

#### 发布边界样例

```json
[
  {
    "content": "",
    "tagIds": [],
    "customTags": []
  },
  {
    "content": "仅有文本，不带标签",
    "tagIds": [],
    "customTags": []
  },
  {
    "content": "这是一条超过长度限制时需要在前端拦截的测试数据，请在实际执行时构造一段超过五百个字符的文本，用来确认输入限制和发布拦截逻辑是否正确。",
    "tagIds": [1],
    "customTags": ["超长测试"]
  }
]
```

### 8.5 匹配类样例

#### 匹配结果查询

- 无需请求体
- 前置条件：当前登录用户至少已发布一条心情

#### 匹配结果验证建议

- 准备 1 条偏积极情绪心情，例如：`今天很开心，工作推进顺利。`
- 准备 1 条偏低落情绪心情，例如：`最近状态有点差，想找个人聊聊。`
- 观察匹配结果是否更接近语义相似内容

### 8.6 评论类样例

#### 获取评论列表

```json
{
  "moodId": 1001,
  "pageNum": 1,
  "pageSize": 50
}
```

#### 发表评论

```json
{
  "moodId": 1001,
  "content": "抱抱你，愿你今天也能被温柔对待。"
}
```

#### 评论边界样例

```json
[
  {
    "moodId": 1001,
    "content": ""
  },
  {
    "moodId": 1001,
    "content": "     "
  },
  {
    "moodId": 1001,
    "content": "这是一条用于测试评论长度边界的内容，请在实际执行时扩充到超过二百字，验证前端输入限制和提交拦截是否正常。"
  }
]
```

#### 删除评论样例

```json
{
  "commentId": 5001
}
```

### 8.7 点赞类样例

#### 点赞心情

```json
{
  "targetId": 1001,
  "targetType": "0"
}
```

#### 点赞评论

```json
{
  "targetId": 5001,
  "targetType": "1"
}
```

#### 点赞回归建议

- 用同一条数据连续调用两次，验证点赞和取消点赞是否都正确
- 在首页、详情页、评论弹窗分别操作，观察计数是否一致

### 8.8 举报类样例

#### 提交举报

```json
{
  "contentId": 1001,
  "reportedUserId": 2001,
  "reason": "发布内容含有明显的人身攻击和不适当言论，希望平台尽快处理。"
}
```

#### 举报边界样例

```json
[
  {
    "contentId": 1001,
    "reportedUserId": 2001,
    "reason": ""
  },
  {
    "contentId": 1001,
    "reportedUserId": 2001,
    "reason": "     "
  },
  {
    "contentId": 1001,
    "reportedUserId": 2001,
    "reason": "疑似恶意刷屏，多次发布相同内容，影响正常浏览体验。"
  }
]
```

## 9. 联调建议数据准备

为了提高测试效率，建议你提前准备以下几组固定数据：

### 9.1 测试账号

| 用途 | 手机号 | 说明 |
| --- | --- | --- |
| 主测试账号 | `13800138000` | 用于正常登录、发布、评论、点赞 |
| 第二测试账号 | `13900139000` | 用于互评、互赞、举报、匹配 |
| 异常账号样例 | `12345678901` | 用于校验手机号非法场景 |

### 9.2 测试心情文案

| 类型 | 示例 |
| --- | --- |
| 积极情绪 | `今天做完了积压很久的任务，终于能轻松一点了。` |
| 平静情绪 | `晚饭后散步二十分钟，感觉整个人都慢下来了。` |
| 低落情绪 | `最近总觉得有点疲惫，想找个地方安静待一会儿。` |
| 超长文本 | 准备一段超过 500 字的长文本，用于发布拦截测试 |

### 9.3 测试评论文案

| 类型 | 示例 |
| --- | --- |
| 正常评论 | `谢谢分享，看完有点共鸣。` |
| 安慰评论 | `抱抱你，愿你慢慢好起来。` |
| 空白评论 | `     ` |
| 超长评论 | 准备一段超过 200 字的评论内容 |

### 9.4 测试举报原因

| 类型 | 示例 |
| --- | --- |
| 人身攻击 | `内容中含有明显攻击性表达。` |
| 重复刷屏 | `短时间重复发布相同内容。` |
| 不良内容 | `疑似包含不适宜展示的信息。` |

## 10. 测试 Checklist

下面的清单可直接用于手工测试执行。建议测试时按顺序勾选，并记录实际结果、截图和异常日志。

### 10.1 页面功能 Checklist

#### 登录页 `pages/login/login`

- [ ] 页面首次打开正常，无白屏、无布局错乱
- [ ] 输入合法手机号后，可以点击“获取验证码”
- [ ] 输入非法手机号时，获取验证码应被拦截并提示
- [ ] 获取验证码成功后，出现 60 秒倒计时
- [ ] 倒计时期间重复点击不会再次发送请求
- [ ] 未勾选协议时，登录按钮不可用或不可触发登录
- [ ] 输入正确验证码后，登录成功并跳转首页
- [ ] 输入错误验证码后，登录失败且停留当前页
- [ ] 点击“用户协议”能正确跳转
- [ ] 点击“隐私政策”能正确跳转

#### 首页/心情广场 `pages/index/index`

- [ ] 页面打开后能正常加载心情列表
- [ ] 页面打开后能正常获取当前用户信息
- [ ] 切换“最新”排序后列表刷新正常
- [ ] 切换“热度”排序后列表刷新正常
- [ ] 切换“历史最热”排序后列表刷新正常
- [ ] 下拉刷新后列表重置为第一页
- [ ] 上拉到底后可以继续加载下一页
- [ ] 没有更多数据时显示“没有更多了”
- [ ] 超长内容可展开和收起
- [ ] 已生成视频的内容在展开后可播放
- [ ] 点击心情点赞后数量和状态正确变化
- [ ] 点赞失败时状态会回滚
- [ ] 点击评论可打开评论弹窗
- [ ] 评论完成后首页评论数同步更新
- [ ] 点击举报可打开举报弹窗
- [ ] 举报成功后弹窗关闭并有提示
- [ ] 列表为空时显示空状态
- [ ] 列表加载失败时显示失败态并支持重试

#### 发布页 `pages/publish/publish`

- [ ] 页面进入后能正常加载预设标签
- [ ] 输入内容时字数统计正确
- [ ] 内容接近 500 字时有警示样式
- [ ] 可选择和取消预设标签
- [ ] 可新增自定义标签
- [ ] 重复自定义标签会被拦截
- [ ] 可删除已添加的自定义标签
- [ ] 内容为空时不能生成视频
- [ ] 内容不为空时可点击生成视频
- [ ] 视频生成成功后展示视频预览
- [ ] 点击“重新生成”后能覆盖原视频结果
- [ ] 内容为空时不能发布心情
- [ ] 正常发布成功后会回到首页
- [ ] 发布成功后内容、标签、视频状态会重置
- [ ] 录音权限拒绝时有正确提示
- [ ] 录音时间过短时有正确提示
- [ ] 当前环境不支持录音时有正确提示

#### 匹配页 `pages/match/match`

- [ ] 页面显示时自动加载匹配结果
- [ ] 下拉刷新后重新请求匹配结果
- [ ] 已发布心情时能看到匹配列表
- [ ] 未发布心情时显示“去发布”引导
- [ ] 点击“去发布”后跳转发布页
- [ ] 无匹配结果时显示空状态
- [ ] 接口异常时显示失败态并支持重试

#### 个人空间 `pages/space/space`

- [ ] 页面显示时能获取当前用户资料
- [ ] 能展示头像、昵称、签名、心情数、获赞数
- [ ] 能加载“我的心情”列表
- [ ] 心情列表为空时显示空状态
- [ ] 上拉分页加载正常
- [ ] 点击心情卡片能进入详情页
- [ ] 点击删除按钮会弹出确认框
- [ ] 取消删除时不会发起删除请求
- [ ] 删除成功后列表刷新
- [ ] 删除成功后顶部统计同步刷新
- [ ] 删除失败时有错误提示

#### 心情详情 `pages/space/detail`

- [ ] 携带有效 `id` 进入页面时能正常加载详情
- [ ] 能展示用户信息、正文、标签
- [ ] 有视频时能正常播放
- [ ] 能展示评论列表
- [ ] 评论为空时显示空状态
- [ ] 点击点赞后数量和状态更新正常
- [ ] 点赞失败时状态会回滚
- [ ] 点击评论按钮可打开评论弹窗
- [ ] 评论新增后详情页评论数同步更新
- [ ] 评论新增后评论列表刷新正常

#### 设置页 `pages/settings/settings`

- [ ] 页面显示时能正常获取用户资料
- [ ] 顶部卡片点击后进入编辑资料页
- [ ] “编辑资料”项点击后进入编辑资料页
- [ ] “关于我们”项点击后进入关于页
- [ ] 点击“退出登录”会弹出确认框
- [ ] 确认退出后清除 token 并跳转登录页
- [ ] 即使登出接口失败，也会跳转登录页

#### 编辑资料页 `pages/settings/edit-profile`

- [ ] 页面进入后能正确回填头像、昵称、签名
- [ ] 点击头像可唤起相册/相机选择
- [ ] 上传头像成功后页面头像即时更新
- [ ] 上传头像失败时有提示
- [ ] 昵称为空时不能保存
- [ ] 昵称少于 2 位时不能保存
- [ ] 昵称超过 20 位时不能保存
- [ ] 正常保存后提示成功并返回上一页
- [ ] 返回上一页后，设置页中的资料同步更新

#### 关于我们 `pages/settings/about`

- [ ] 页面展示应用名称、版本、版权信息正常
- [ ] 点击“用户协议”入口时行为符合预期
- [ ] 点击“隐私政策”入口时行为符合预期
- [ ] 从登录页带 `type=agreement` 进入时行为符合预期
- [ ] 从登录页带 `type=privacy` 进入时行为符合预期
- [ ] 不存在重复跳转、无限导航或死循环问题

### 10.2 组件功能 Checklist

#### 评论弹窗 `components/CommentPopup.vue`

- [ ] 打开弹窗后自动加载评论列表
- [ ] 评论为空时显示空状态
- [ ] 输入为空时不能发送评论
- [ ] 评论超过 200 字时不能发送
- [ ] 正常发送评论后输入框被清空
- [ ] 发送评论后评论列表刷新
- [ ] 发送评论后总评论数同步回传父页面
- [ ] 点赞评论后数量和状态正确更新
- [ ] 评论点赞失败时状态回滚
- [ ] 自己的评论显示删除入口
- [ ] 删除评论成功后列表刷新
- [ ] 删除评论成功后评论总数同步更新

#### 举报弹窗 `components/ReportPopup.vue`

- [ ] 打开弹窗时举报原因会被重置
- [ ] 举报原因为空时不能提交
- [ ] 正常提交举报后弹窗关闭
- [ ] 提交中重复点击不会重复发起请求
- [ ] 举报失败时保留输入内容并有提示

### 10.3 接口联调 Checklist

#### 认证类

- [ ] `POST /api/app/sms/send` 合法手机号发送成功
- [ ] `POST /api/app/sms/send` 非法手机号被拦截或返回失败
- [ ] `POST /api/login/auth` 正确验证码登录成功
- [ ] `POST /api/login/auth` 错误验证码登录失败
- [ ] `POST /api/app/auth/logout` 正常退出成功
- [ ] `POST /api/app/auth/logout` 接口失败兜底逻辑正常

#### 用户资料类

- [ ] `GET /api/app/user/profile` 可正常返回资料
- [ ] `GET /api/app/user/profile` token 失效时触发 401 跳登录
- [ ] `PUT /api/app/user/profile` 正常更新资料成功
- [ ] `PUT /api/app/user/profile` 非法昵称被拦截
- [ ] `UPLOAD /api/app/user/avatar` 正常上传头像成功
- [ ] `UPLOAD /api/app/user/avatar` 上传失败时提示正常

#### 心情类

- [ ] `GET /api/app/moods` latest 排序正常
- [ ] `GET /api/app/moods` hot 排序正常
- [ ] `GET /api/app/moods` allTimeHot 排序正常
- [ ] `GET /api/app/moods` 分页返回正常
- [ ] `GET /api/app/moods` userId=self 返回个人数据正常
- [ ] `GET /api/app/moods/{id}` 返回详情正常
- [ ] `POST /api/app/moods` 普通发布成功
- [ ] `POST /api/app/moods` 带视频发布成功
- [ ] `DELETE /api/app/moods/{id}` 删除成功
- [ ] `POST /api/app/moods/generate-video` 视频生成成功
- [ ] `GET /api/app/moods/match` 匹配结果返回正常

#### 评论、点赞、举报类

- [ ] `GET /api/app/comments` 返回评论列表正常
- [ ] `POST /api/app/comments` 正常发表评论成功
- [ ] `DELETE /api/app/comments/{id}` 正常删除评论成功
- [ ] `POST /api/app/likes/toggle` 心情点赞/取消点赞正常
- [ ] `POST /api/app/likes/toggle` 评论点赞/取消点赞正常
- [ ] `POST /api/app/reports` 正常举报成功

### 10.4 异常与兼容性 Checklist

- [ ] 断网时首页、详情页、匹配页都能正确提示异常
- [ ] 请求超时时，统一请求封装能返回正确提示
- [ ] token 过期时，统一请求封装会清 token 并跳登录页
- [ ] 页面默认值处理正常，不会因后端字段缺失导致报错
- [ ] H5 下输入框、评论框、文本域都能正常聚焦和输入
- [ ] 真机环境下图片上传、录音授权、视频播放都能正常工作

### 10.5 测试记录模板

可按下面格式记录每一项执行结果：

| 模块 | 测试项 | 结果 | 备注 |
| --- | --- | --- | --- |
| 登录页 | 获取验证码 | 通过/失败 | 可记录请求日志、截图、失败现象 |
| 首页 | 点赞心情 | 通过/失败 | 可记录点赞前后数量变化 |
| 评论弹窗 | 删除评论 | 通过/失败 | 可记录是否同步评论数 |
