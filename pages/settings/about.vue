<template>
	<view class="about-page">
		<template v-if="pageMode === 'menu'">
			<!-- Logo区域 -->
			<view class="logo-area">
				<view class="logo-icon">🌟</view>
				<text class="app-name">心情星球</text>
				<text class="version">v1.0.0</text>
			</view>

			<!-- 信息列表 -->
			<view class="info-group">
				<view class="info-item" @click="openAgreement">
					<text class="info-icon">📄</text>
					<text class="info-label">用户协议</text>
					<text class="arrow">›</text>
				</view>
				<view class="info-item" @click="openPrivacy">
					<text class="info-icon">🔒</text>
					<text class="info-label">隐私政策</text>
					<text class="arrow">›</text>
				</view>
				<view class="info-item" @click="openPermissions">
					<text class="info-icon">🔐</text>
					<text class="info-label">协议与规则和信息收集</text>
					<text class="arrow">›</text>
				</view>
			</view>
		</template>

		<template v-else>
			<view class="doc-header">
				<text class="doc-title">{{ pageTitle }}</text>
				<text class="doc-desc">请在使用前仔细阅读以下内容</text>
			</view>
			<scroll-view class="doc-scroll" scroll-y>
				<view class="doc-card">
					<text class="doc-text">{{ pageContent }}</text>
				</view>
			</scroll-view>
			<view class="back-btn" @click="goMenu">
				<text>返回列表</text>
			</view>
		</template>

		<!-- 底部版权 -->
		<view class="copyright">
			<text>© 2025 心情星球 All Rights Reserved</text>
		</view>
	</view>
</template>

<script>
const AGREEMENT_TEXT = [
	'欢迎使用心情星球。使用本应用即表示你同意遵守本平台的服务规则与社区规范。',
	'你在平台发布的心情、评论、头像、昵称等内容，应保证合法、真实、文明，不得包含攻击、辱骂、骚扰、违法或其他不适宜展示的信息。',
	'平台有权依据运营规则对违规内容进行删除、限制展示、限制互动或账号处置。',
	'为保障服务稳定性，平台可能在必要范围内收集与你使用行为相关的信息，用于登录鉴权、内容展示、异常排查和安全风控。',
	'若你继续使用本服务，即视为你已阅读并接受本协议全部内容。'
].join('\n\n');

const PRIVACY_TEXT = [
	'心情星球重视你的个人信息与隐私安全。我们会在提供基础服务所需的最小范围内收集信息。',
	'当你登录、发布心情、上传头像、发表评论、使用录音等功能时，平台可能会申请并使用手机号、头像、昵称、相册、相机、麦克风等相关权限或信息。',
	'这些信息主要用于账号识别、内容发布、资料编辑、互动功能实现和服务安全保障。',
	'未经你的明确授权，平台不会将你的个人信息用于与当前服务无关的用途。法律法规另有规定的除外。',
	'如你对隐私保护有疑问，可在后续正式版本中通过客服或反馈渠道与我们联系。'
].join('\n\n');

const PERMISSION_TEXT = [
	'为保障功能正常使用，心情星球会在你主动使用相关功能时申请必要权限。你可以在系统设置中管理或关闭授权，关闭后对应功能可能无法使用。',
	'相册权限：用于选择头像、上传图片或从相册选择发布素材。仅在你主动选择图片时调用。',
	'相机权限：用于拍摄头像、拍摄图片或后续发布素材。仅在你主动点击拍摄入口时调用。',
	'录音权限：用于发布语音心情、语音转文字和相关语音识别能力。录音内容仅用于你当前选择的发布或识别流程。',
	'存储权限：用于保存录音临时文件、读取待上传文件、缓存图片和保障上传流程稳定。不会扫描与你当前功能无关的文件。',
	'网络权限：用于登录鉴权、内容加载、消息通知、在线客服、上传下载和安全风控。',
	'设备与日志信息：用于排查异常、统计崩溃和保障账号安全，收集范围以实现服务稳定所必需为限。',
	'你拒绝授权时，应用会提示原因；再次使用相关功能时，可能需要你在系统设置中重新开启权限。'
].join('\n\n');

export default {
	name: 'AboutPage',
	data() {
		return {
			pageMode: 'menu'
		};
	},
	computed: {
		pageTitle() {
			if (this.pageMode === 'agreement') return '用户协议';
			if (this.pageMode === 'permissions') return '协议与规则和信息收集';
			return '隐私政策';
		},
		pageContent() {
			if (this.pageMode === 'agreement') return AGREEMENT_TEXT;
			if (this.pageMode === 'permissions') return PERMISSION_TEXT;
			return PRIVACY_TEXT;
		}
	},
	onLoad(options) {
		this.pageMode = options && options.type === 'agreement'
			? 'agreement'
			: options && options.type === 'privacy'
				? 'privacy'
				: options && options.type === 'permissions'
					? 'permissions'
					: 'menu';
	},
	methods: {
		/** 打开用户协议 */
		openAgreement() {
			this.pageMode = 'agreement';
		},

		/** 打开隐私政策 */
		openPrivacy() {
			this.pageMode = 'privacy';
		},

		openPermissions() {
			this.pageMode = 'permissions';
		},

		goMenu() {
			this.pageMode = 'menu';
		}
	}
};
</script>

<style lang="scss" scoped>
.about-page {
	min-height: 100vh;
	background: #f7f1f8;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 24rpx;
}

/* Logo区域 */
.logo-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 120rpx;
	margin-bottom: 80rpx;
}
.logo-icon { font-size: 120rpx; margin-bottom: 20rpx; }
.app-name {
	font-size: 40rpx;
	font-weight: bold;
	color: #57465b;
	margin-bottom: 12rpx;
}
.version {
	font-size: 28rpx;
	color: #9f92a2;
	padding: 6rpx 24rpx;
	background: #f0f2f5;
	border-radius: 20rpx;
}

/* 信息列表 */
.info-group {
	width: 100%;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.info-item {
	display: flex;
	align-items: center;
	padding: 32rpx 28rpx;
	border-bottom: 1rpx solid #f7f1f8;
	&:last-child { border-bottom: none; }
}
.info-icon { font-size: 36rpx; margin-right: 20rpx; }
.info-label { flex: 1; font-size: 30rpx; color: #57465b; }
.arrow { font-size: 36rpx; color: #ccc; }

/* 协议正文 */
.doc-header {
	width: 100%;
	padding: 60rpx 12rpx 24rpx;
}
.doc-title {
	display: block;
	font-size: 40rpx;
	font-weight: bold;
	color: #57465b;
	margin-bottom: 12rpx;
}
.doc-desc {
	font-size: 26rpx;
	color: #9f92a2;
}
.doc-scroll {
	width: 100%;
	flex: 1;
	min-height: 0;
}
.doc-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 32rpx 28rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	margin-bottom: 24rpx;
}
.doc-text {
	font-size: 28rpx;
	line-height: 1.9;
	color: #57465b;
	white-space: pre-wrap;
}
.back-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	background: linear-gradient(135deg, #5B86E5 0%, #36D1DC 100%);
	border-radius: 44rpx;
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	margin-bottom: 140rpx;
}

/* 版权 */
.copyright {
	position: fixed;
	bottom: 60rpx;
	font-size: 24rpx;
	color: #ccc;
}
</style>
