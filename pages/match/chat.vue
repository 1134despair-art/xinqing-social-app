<template>
	<view class="app-container">
		<view class="header" :style="headerStyle">
			<view class="header-back-btn" @click="goBack">
				<text class="header-back">‹</text>
			</view>
			<text class="page-title">{{ pageTitle }}</text>
			<view class="header-close-btn" @click="closeSession">
				<text class="header-close">结束</text>
			</view>
		</view>

		<view class="content-flex chat-page" :style="chatPageStyle">
			<view class="agent-card">
				<view class="agent-avatar">
					<image
						v-if="isImageAvatar(displayAgentAvatar)"
						class="agent-avatar-img"
						:src="displayAgentAvatar"
						mode="aspectFill"
					/>
					<text v-else>{{ displayAvatar(displayAgentAvatar) }}</text>
				</view>
				<view class="agent-main">
					<text class="agent-name">{{ displayAgentName }}</text>
					<text class="agent-summary">{{ displayAgentSummary }}</text>
					<text v-if="agentExpertiseText" class="agent-expertise">擅长：{{ agentExpertiseText }}</text>
				</view>
			</view>

			<scroll-view
				class="chat-list hide-scrollbar"
				scroll-y
				:scroll-into-view="scrollIntoView"
				scroll-with-animation
			>
				<view v-if="messages.length === 0" class="empty-wrap">
					<text class="empty-title">描述你遇到的问题</text>
					<text class="empty-desc">{{ emptyDesc }}</text>
				</view>

				<view
					v-for="item in messages"
					:id="item.viewId"
					:key="item.viewId"
					class="chat-row"
					:class="{ mine: item.mine }"
				>
					<view class="chat-bubble" :class="{ 'is-media': item.displayType === 'IMAGE' || item.displayType === 'VIDEO' }">
						<text v-if="item.displayType === 'TEXT'" class="text-message">{{ item.content }}</text>
						<image
							v-else-if="item.displayType === 'IMAGE' && item.payload.url"
							class="image-message"
							:src="item.payload.url"
							mode="widthFix"
							@click="previewImage(item.payload.url)"
						/>
						<video
							v-else-if="item.displayType === 'VIDEO' && item.payload.url"
							class="video-message"
							:src="item.payload.url"
							controls
						/>
						<view
							v-else-if="item.displayType === 'RICH_TEXT'"
							class="rich-message-wrap"
							@click="onRichBubbleClick(item)"
						>
							<rich-text
								class="rich-message"
								:nodes="item.html"
								@itemclick="onRichItemClick"
							/>
						</view>
						<view v-else class="file-message" @click="openFile(item.payload.url, item)">
							<text class="file-title">{{ attachmentTitle(item) }}</text>
							<text class="file-desc">{{ item.payload.name || item.content || '点击查看附件' }}</text>
						</view>
					</view>
				</view>
				<view id="chat-bottom" class="chat-bottom"></view>
			</scroll-view>

			<view v-if="sceneList.length" class="scene-card">
				<text class="scene-title">常见场景问题</text>
				<view class="scene-list">
					<view
						v-for="scene in sceneList"
						:key="scene.title"
						class="scene-btn"
						@click="sendText(scene.question)"
					>{{ scene.title }}</view>
				</view>
			</view>
		</view>

		<view class="chat-editor" :style="fixedBottomStyle">
			<input
				v-model="draftMessage"
				class="chat-editor-input"
				maxlength="500"
				confirm-type="send"
				placeholder="请输入你想咨询的问题"
				placeholder-class="input-placeholder"
				:disabled="sending"
				:adjust-position="false"
				:hold-keyboard="true"
				@keyboardheightchange="onKeyboardHeightChange"
				@confirm="sendText()"
			/>
			<button
				class="chat-editor-send"
				:disabled="sending"
				hover-class="chat-send-hover"
				@click="sendText()"
			>{{ sending ? '发送中' : '发送' }}</button>
		</view>
	</view>
</template>

<script>
import {
	closeCurrentImSession,
	getCurrentImMessages,
	getCurrentImSession,
	getImCustomers,
	prepareImMessage,
	uploadImFile
} from '@/api/im';
import {
	loginTencentIm,
	logoutTencentIm,
	sendTencentCustomMessage,
	sendTencentTextMessage
} from '@/utils/tencentImClient';
import { getAgentById, loadCustomerAgents } from '@/utils/customerAgents';
import { getStatusBarHeight } from '@/utils/adapt';
import { getDisplayAvatar, isImageAvatar } from '@/utils/avatar';
import { keyboardMixin } from '@/utils/keyboard';
import { extractHtmlImages, parseImMessage } from '@/utils/imMessage';

const APP_FROM_TYPE = 1;
const DEFAULT_AGENT_ID = '';

export default {
	name: 'CustomerChatPage',
	mixins: [keyboardMixin],
	data() {
		return {
			statusBarHeight: 0,
			session: null,
			messages: [],
			messageSignature: '',
			draftMessage: '',
			scrollIntoView: '',
			sending: false,
			connected: false,
			connecting: false,
			pollTimer: null,
			agentId: DEFAULT_AGENT_ID,
			explicitAgentSelected: false,
			agentProfile: null
		};
	},
	computed: {
		currentAgent() {
			return this.agentProfile || getAgentById(this.agentId) || getAgentById(DEFAULT_AGENT_ID) || {};
		},
		sceneList() {
			return this.currentAgent.scenarios || [];
		},
		pageTitle() {
			return this.displayAgentName || '客服会话';
		},
		shouldUseSessionCustomer() {
			if (!this.session || !this.session.sessionId || !this.session.customerSysUserId) {
				return false;
			}
			if (!this.explicitAgentSelected) {
				return true;
			}
			return String(this.session.customerSysUserId) === String(this.agentId);
		},
		displayAgentName() {
			if (this.shouldUseSessionCustomer && this.session.customerNickName) {
				return this.session.customerNickName;
			}
			return this.currentAgent.name || '在线客服';
		},
		displayAgentAvatar() {
			if (this.shouldUseSessionCustomer) {
				return this.session.customerAvatar || '';
			}
			return this.currentAgent.avatar || '';
		},
		displayAgentSummary() {
			if (!this.shouldUseSessionCustomer) {
				return this.currentAgent.summary || '发送第一条消息后会自动创建会话';
			}
			if (this.session.status === 0) return '当前正在排队，客服上线后会自动分配';
			if (this.session.status === 1) return this.session.customerSummary || '客服已接入，可以继续沟通';
			return this.session.statusName || this.session.customerSummary || '会话已结束';
		},
		agentExpertiseText() {
			const source = this.shouldUseSessionCustomer
				? this.session.customerExpertise
				: this.currentAgent.expertise;
			const list = this.parseExpertise(source);
			return list.length ? list.join('、') : '';
		},
		emptyDesc() {
			return (this.shouldUseSessionCustomer
					? this.session.customerWelcomeMessage
					: this.currentAgent.welcomeMessage)
				|| '客服在线后会自动接入，会话记录会保存在当前页面。';
		},
		headerStyle() {
			return {
				height: `calc(112rpx + ${this.statusBarHeight}px)`,
				paddingTop: `${this.statusBarHeight}px`
			};
		},
		chatPageStyle() {
			if (!this.keyboardHeight) return {};
			return {
				paddingBottom: `calc(148rpx + env(safe-area-inset-bottom) + ${this.keyboardHeight}px)`
			};
		}
	},
	async onLoad(options) {
		this.statusBarHeight = getStatusBarHeight();
		if (options.staffId) {
			this.agentId = options.staffId;
			this.explicitAgentSelected = true;
		}
		if (options.question) {
			this.draftMessage = decodeURIComponent(options.question);
		}
		await this.ensureAgentLoaded();
	},
	onShow() {
		this.bindKeyboardListener();
		this.initChat();
	},
	onHide() {
		this.stopPolling();
		this.unbindKeyboardListener();
	},
	onUnload() {
		this.stopPolling();
		this.unbindKeyboardListener();
		logoutTencentIm();
	},
	methods: {
		goBack() {
			uni.navigateBack();
		},

		onKeyboardOpened() {
			this.scrollToBottom();
		},

		async ensureAgentLoaded() {
			if (this.agentId && getAgentById(this.agentId)) {
				return;
			}
			try {
				await loadCustomerAgents({ loading: false, silent: true });
			} catch (e) {
				// 客服信息仅用于展示，加载失败不阻断聊天
			}
		},

		async initChat() {
			await this.loadCustomerProfile();
			await this.connectIm();
			await this.refreshSessionAndMessages({ force: true });
			this.startPolling();
		},

		async loadCustomerProfile() {
			try {
				const list = await getImCustomers({ loading: false, silent: true });
				const match = (Array.isArray(list) ? list : []).find(item => {
					return String(item.sysUserId || '') === String(this.agentId)
						|| String(item.imUserId || '') === String(this.agentId);
				});
				this.agentProfile = match ? this.normalizeCustomer(match) : null;
			} catch (e) {
				this.agentProfile = null;
			}
		},

		async connectIm() {
			this.connecting = true;
			try {
				await loginTencentIm({
					onMessage: () => {
						this.refreshSessionAndMessages({ silent: true, force: true });
					}
				});
				this.connected = true;
			} catch (e) {
				this.connected = false;
			} finally {
				this.connecting = false;
			}
		},

		startPolling() {
			this.stopPolling();
			this.pollTimer = setInterval(() => {
				this.refreshSessionAndMessages({ silent: true });
				// 定期刷新客服资料，更新在线状态
				this.loadCustomerProfile();
			}, 5000);
		},

		stopPolling() {
			if (this.pollTimer) {
				clearInterval(this.pollTimer);
				this.pollTimer = null;
			}
		},

		async refreshSessionAndMessages(options = {}) {
			try {
				const session = await getCurrentImSession({
					loading: false,
					silent: Boolean(options.silent)
				});
				const sessionBelongsToSelectedAgent = !this.explicitAgentSelected
					|| !session
					|| !session.customerSysUserId
					|| String(session.customerSysUserId) === String(this.agentId);
				this.session = sessionBelongsToSelectedAgent ? session : null;
				if (!sessionBelongsToSelectedAgent) {
					this.messages = [];
					this.messageSignature = '';
					return;
				}
				const list = await getCurrentImMessages({
					loading: false,
					silent: Boolean(options.silent)
				});
				const nextMessages = this.normalizeMessages(list);
				const nextSignature = this.buildMessageSignature(nextMessages);
				if (options.force || nextSignature !== this.messageSignature) {
					this.messages = nextMessages;
					this.messageSignature = nextSignature;
					this.scrollToBottom();
				}
			} catch (e) {
				if (!options.silent) {
					uni.showToast({ title: e.message || '会话加载失败', icon: 'none' });
				}
			}
		},

		normalizeMessages(list = []) {
			return (Array.isArray(list) ? list : []).map((item, index) => {
				const parsed = parseImMessage(item);
				return {
					...item,
					viewId: `msg_${item.messageId || index}_${item.sendTime || 0}`,
					mine: Number(item.fromType) === APP_FROM_TYPE,
					msgType: parsed.displayType,
					displayType: parsed.displayType,
					content: parsed.text || item.content || '',
					html: parsed.html || '',
					payload: parsed.payload || {}
				};
			});
		},

		buildMessageSignature(messages = []) {
			return messages.map((item) => [
				item.messageId || '',
				item.sendTime || '',
				item.fromType || '',
				item.msgType || '',
				item.content || ''
			].join(':')).join('|');
		},

		parsePayload(content, msgType) {
			return parseImMessage({ content, msgType }).payload || {};
		},

		async sendText(text) {
			const content = String(text || this.draftMessage || '').trim();
			if (!content || this.sending) return;
			if (!text) this.draftMessage = '';
			await this.sendMessage('TEXT', content);
		},

		async sendMessage(msgType, content) {
			this.sending = true;
			try {
				const prepared = await prepareImMessage(content, msgType, '', {
					loading: false,
					customerSysUserId: this.explicitAgentSelected ? this.agentId : ''
				});
				this.session = {
					...(this.session || {}),
					sessionId: prepared.sessionId,
					status: prepared.sessionStatus,
					customerSysUserId: prepared.customerSysUserId,
					customerImUserId: prepared.toImUserId,
					customerNickName: prepared.customerNickName,
					customerAvatar: prepared.customerAvatar,
					customerSummary: prepared.customerSummary,
					customerExpertise: prepared.customerExpertise,
					customerWelcomeMessage: prepared.customerWelcomeMessage
				};

				if (!prepared.waiting && prepared.toImUserId) {
					try {
						if (msgType === 'TEXT') {
							await sendTencentTextMessage(prepared.toImUserId, content);
						} else {
							await sendTencentCustomMessage(prepared.toImUserId, msgType, content);
						}
					} catch (e) {
						uni.showToast({ title: '消息已保存，实时送达稍后重试', icon: 'none' });
					}
				} else {
					uni.showToast({ title: '已进入客服队列', icon: 'none' });
				}
				await this.refreshSessionAndMessages({ silent: true, force: true });
			} catch (e) {
				uni.showToast({ title: e.message || '发送失败', icon: 'none' });
			} finally {
				this.sending = false;
			}
		},

		chooseAttachment() {
			uni.showActionSheet({
				itemList: ['图片', '视频', '音频文件'],
				success: ({ tapIndex }) => {
					if (tapIndex === 0) this.chooseImage();
					if (tapIndex === 1) this.chooseVideo();
					if (tapIndex === 2) this.chooseAudioFile();
				}
			});
		},

		chooseImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const file = res.tempFiles?.[0] || {};
					this.uploadAndSend(res.tempFilePaths?.[0], 'IMAGE', file);
				}
			});
		},

		chooseVideo() {
			uni.chooseVideo({
				sourceType: ['album', 'camera'],
				compressed: true,
				success: (res) => {
					this.uploadAndSend(res.tempFilePath, 'VIDEO', {
						name: res.name || 'video.mp4',
						size: res.size,
						duration: res.duration
					});
				}
			});
		},

		chooseAudioFile() {
			// #ifdef H5
			uni.chooseFile({
				count: 1,
				type: 'audio',
				success: (res) => {
					const file = res.tempFiles?.[0] || {};
					this.uploadAndSend(file.path, 'AUDIO', file);
				}
			});
			// #endif
			// #ifndef H5
			uni.showToast({ title: '当前端暂不支持选择音频文件', icon: 'none' });
			// #endif
		},

		async uploadAndSend(filePath, msgType, file = {}) {
			if (!filePath || this.sending) return;
			this.sending = true;
			try {
				const uploaded = await uploadImFile(filePath, {
					loadingText: '上传中...'
				});
				const payload = JSON.stringify({
					url: uploaded.url,
					ossId: uploaded.ossId,
					name: file.name || this.fileNameFromPath(filePath, msgType),
					size: file.size || 0,
					duration: file.duration || 0
				});
				this.sending = false;
				await this.sendMessage(msgType, payload);
			} catch (e) {
				this.sending = false;
				uni.showToast({ title: e.message || '附件发送失败', icon: 'none' });
			}
		},

		fileNameFromPath(filePath, msgType) {
			const name = String(filePath || '').split('?')[0].split('/').pop();
			if (name) return name;
			return msgType === 'IMAGE' ? 'image.jpg' : msgType === 'VIDEO' ? 'video.mp4' : 'audio';
		},

		async closeSession() {
			if (!this.session || !this.session.sessionId) {
				uni.navigateBack();
				return;
			}
			uni.showModal({
				title: '结束会话',
				content: '结束后如需咨询可重新发起客服会话。',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await closeCurrentImSession({ loading: false });
						this.session = null;
						this.messages = [];
						this.messageSignature = '';
						uni.showToast({ title: '会话已结束', icon: 'none' });
						setTimeout(() => uni.navigateBack(), 500);
					} catch (e) {
						uni.showToast({ title: e.message || '结束失败', icon: 'none' });
					}
				}
			});
		},

		scrollToBottom() {
			this.$nextTick(() => {
				this.scrollIntoView = 'chat-bottom';
			});
		},

		previewImage(url) {
			if (!url) return;
			const urls = this.messages
				.map((item) => {
					if (item.displayType === 'IMAGE' && item.payload && item.payload.url) return item.payload.url;
					if (item.displayType === 'RICH_TEXT') return extractHtmlImages(item.html);
					return [];
				})
				.flat()
				.filter(Boolean);
			uni.previewImage({
				urls: urls.length ? urls : [url],
				current: url
			});
		},

		onRichItemClick(e) {
			const node = (e && e.detail && e.detail.node) || {};
			const name = String(node.name || node.type || '').toLowerCase();
			const attrs = node.attrs || {};
			if (name === 'img' && attrs.src) {
				this.previewImage(attrs.src);
				return;
			}
			const href = attrs.href || attrs.src;
			if (href) this.openLink(href);
		},

		onRichBubbleClick(item) {
			const images = extractHtmlImages(item && item.html);
			const html = String((item && item.html) || '');
			const hasLink = /<a[^>]+href=/i.test(html);
			if (images.length && !hasLink) {
				this.previewImage(images[0]);
			}
		},

		openLink(url) {
			if (!url) return;
			// #ifdef H5
			window.open(url, '_blank');
			return;
			// #endif
			// #ifdef APP-PLUS
			if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
				plus.runtime.openURL(String(url));
				return;
			}
			// #endif
			uni.setClipboardData({
				data: String(url),
				success: () => uni.showToast({ title: '链接已复制', icon: 'none' })
			});
		},

		openFile(url, item) {
			const fileUrl = url || (item && item.payload && item.payload.url);
			if (!fileUrl) {
				uni.showToast({ title: '暂无法打开该内容', icon: 'none' });
				return;
			}
			if (item && item.displayType === 'IMAGE') {
				this.previewImage(fileUrl);
				return;
			}
			// #ifdef H5
			window.open(fileUrl, '_blank');
			return;
			// #endif
			uni.showLoading({ title: '打开中...', mask: true });
			uni.downloadFile({
				url: fileUrl,
				success: (res) => {
					uni.hideLoading();
					if (res.statusCode !== 200 || !res.tempFilePath) {
						this.openLink(fileUrl);
						return;
					}
					uni.openDocument({
						filePath: res.tempFilePath,
						showMenu: true,
						fail: () => this.openLink(fileUrl)
					});
				},
				fail: () => {
					uni.hideLoading();
					this.openLink(fileUrl);
				}
			});
		},

		attachmentTitle(item) {
			if (item.displayType === 'AUDIO' || item.msgType === 'AUDIO') return '语音附件';
			if (item.displayType === 'VIDEO' || item.msgType === 'VIDEO') return '视频附件';
			if (item.displayType === 'IMAGE' || item.msgType === 'IMAGE') return '图片附件';
			if (item.displayType === 'RICH_TEXT') return '图文消息';
			return '附件';
		},

		normalizeCustomer(item = {}) {
			return {
				id: String(item.sysUserId || item.imUserId || DEFAULT_AGENT_ID),
				sysUserId: item.sysUserId,
				imUserId: item.imUserId,
				name: item.nickName || '在线客服',
				avatar: item.avatar,
				summary: item.summary || '在线客服，随时为你处理问题。',
				expertise: this.parseExpertise(item.expertise),
				welcomeMessage: item.welcomeMessage || '',
				scenarios: []
			};
		},

		parseExpertise(value) {
			if (Array.isArray(value)) return value.filter(Boolean);
			return String(value || '')
				.split(/[，,、]/)
				.map(item => item.trim())
				.filter(Boolean);
		},

		isImageAvatar,

		displayAvatar(value) {
			return getDisplayAvatar(value || '👩‍💼');
		},

		formatTime(value) {
			if (!value) return '';
			const date = new Date(Number(value));
			if (Number.isNaN(date.getTime())) return '';
			const pad = (n) => String(n).padStart(2, '0');
			return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
		}
	}
};
</script>

<style lang="scss" scoped>
.app-container {
	width: 100%;
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #fffefe;
	overflow: hidden;
	position: relative;
}

.header {
	position: relative;
	flex-shrink: 0;
	height: 112rpx;
	background: rgba(255, 252, 253, 0.92);
	border-bottom: 1rpx solid #eee4ef;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	z-index: 20;
}

.header-back-btn,
.header-close-btn {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-back-btn {
	left: 20rpx;
	width: 72rpx;
	height: 72rpx;
}

.header-close-btn {
	right: 24rpx;
	padding: 0 8rpx;
}

.header-back {
	font-size: 44rpx;
	color: #7d6e81;
	line-height: 1;
}

.header-close {
	font-size: 26rpx;
	color: #8f6fb0;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
}

.content-flex {
	flex: 1;
	min-height: 0;
	background: linear-gradient(180deg, #fffcfd 0%, #f9f4fb 100%);
}

.chat-page {
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	padding-bottom: calc(148rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.agent-card {
	background: #fffefe;
	border-radius: 24rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	display: flex;
	align-items: center;
	gap: 20rpx;
	flex-shrink: 0;
}

.agent-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #f0f3ff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	flex-shrink: 0;
	overflow: hidden;
}

.agent-avatar-img {
	width: 100%;
	height: 100%;
	display: block;
}

.agent-main {
	flex: 1;
	min-width: 0;
}

.agent-name {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #57465b;
}

.agent-summary {
	display: block;
	margin-top: 4rpx;
	font-size: 24rpx;
	color: #7d6e81;
	line-height: 1.5;
}

.agent-expertise {
	display: block;
	margin-top: 4rpx;
	font-size: 24rpx;
	color: #5f6bc2;
	line-height: 1.5;
}

.chat-list {
	flex: 1;
	min-height: 0;
	background: #fffefe;
	border-radius: 24rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	box-sizing: border-box;
}

.hide-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.empty-wrap {
	padding: 40rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.empty-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
}

.empty-desc {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #9f92a2;
	line-height: 1.6;
}

.chat-row {
	display: flex;
	justify-content: flex-start;
	margin-bottom: 16rpx;
}

.chat-row:last-child {
	margin-bottom: 0;
}

.chat-row.mine {
	justify-content: flex-end;
}

.chat-bubble {
	max-width: 78%;
	padding: 16rpx 20rpx;
	border-radius: 20rpx;
	background: #f6f8ff;
	box-sizing: border-box;
	overflow: hidden;
}

.chat-row.mine .chat-bubble {
	background: #e8ecff;
}

.text-message {
	display: block;
	font-size: 26rpx;
	color: #57465b;
	line-height: 1.5;
	white-space: pre-wrap;
	word-break: break-word;
}

.chat-row.mine .text-message {
	color: #4d5cb2;
}

.chat-bubble.is-media {
	padding: 8rpx;
	background: transparent;
}

.chat-row.mine .chat-bubble.is-media {
	background: transparent;
}

.rich-message-wrap {
	max-width: 100%;
}

.rich-message {
	display: block;
	font-size: 26rpx;
	color: #57465b;
	line-height: 1.6;
	word-break: break-word;
	overflow: hidden;
}

.chat-row.mine .rich-message {
	color: #4d5cb2;
}

.image-message {
	width: 360rpx;
	max-height: 520rpx;
	border-radius: 12rpx;
	display: block;
}

.video-message {
	width: 420rpx;
	height: 260rpx;
	border-radius: 12rpx;
	display: block;
	overflow: hidden;
}

.file-message {
	min-width: 240rpx;
}

.file-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #57465b;
}

.chat-row.mine .file-title {
	color: #4d5cb2;
}

.file-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #7d6e81;
	word-break: break-all;
}

.chat-row.mine .file-desc {
	color: #5f6bc2;
}

.chat-bottom {
	height: 8rpx;
}

.scene-card {
	background: #fffefe;
	border-radius: 24rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	flex-shrink: 0;
}

.scene-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #57465b;
}

.scene-list {
	margin-top: 16rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.scene-btn {
	border: 1rpx solid #dbe3ff;
	background: #f8faff;
	color: #8f6fb0;
	border-radius: 28rpx;
	font-size: 24rpx;
	padding: 8rpx 20rpx;
}

.chat-editor {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
	background: #fffefe;
	border-top: 1rpx solid #eef1fb;
	box-sizing: border-box;
	z-index: 10;
}

.chat-editor-input {
	flex: 1;
	height: 72rpx;
	border: 1rpx solid #dfe5fb;
	border-radius: 40rpx;
	background: #fffefe;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #57465b;
	box-sizing: border-box;
}

.input-placeholder {
	color: #b8bdd4;
	font-size: 28rpx;
}

.chat-editor-send {
	width: 136rpx;
	height: 72rpx;
	border: 0;
	border-radius: 40rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	color: #ffffff;
	font-size: 26rpx;
	line-height: 72rpx;
	padding: 0;
	flex-shrink: 0;
}

.chat-editor-send[disabled] {
	background: #c5cae8;
	color: #ffffff;
}

.chat-send-hover {
	opacity: 0.9;
}
</style>
