<template>
	<view class="page-shell tab-page publish-tab-page">
		<view class="auth-card">
			<view class="header">
				<view class="header-inner">
					<view class="header-back" @click="goBack">
						<text class="back-icon">‹</text>
					</view>
					<text class="page-title">{{ pageTitle }}</text>
					<view class="header-right">
						<view class="draft-btn" :class="{ disabled: stashing }" @click="saveDraft">
							<text>{{ stashing ? '暂存中...' : '暂存' }}</text>
						</view>
						<view class="header-publish-btn" :class="{ disabled: !canPublish || publishing }" @click="handlePublish">
							<text>{{ publishing ? '处理中...' : submitButtonText }}</text>
						</view>
					</view>
				</view>
			</view>

			<scroll-view class="content-flex" scroll-y :style="{ height: scrollHeight }">
				<view class="tab-scroll-inner">
					<view class="publish-form">
						<!-- 输入方式 -->
						<view class="form-section">
							<view class="input-tabs">
								<view class="input-tab" :class="{ active: inputMode === 'text' }" @click="inputMode = 'text'">
									<text class="tab-emoji">✏️</text>
									<text>文字</text>
								</view>
								<view class="input-tab" :class="{ active: inputMode === 'voice' }" @click="inputMode = 'voice'">
									<IconFont name="microphone" :color="inputMode === 'voice' ? '#8f6fb0' : '#7d6e81'" :size="32" />
									<text>语音</text>
								</view>
							</view>
						</view>

						<!-- 文字输入 -->
						<view v-if="inputMode === 'text'" class="form-section">
							<textarea class="content-input" v-model="content" placeholder="写下你此刻的想法..." maxlength="500"
								:auto-height="true" :adjust-position="false" />
							<view class="char-count">
								<text :class="{ warning: content.length >= 480 }">{{ content.length }}/500</text>
							</view>
						</view>

						<!-- 语音输入（对齐 H5 Publish.vue） -->
						<view v-if="inputMode === 'voice'" class="form-section voice-form-section">
							<view class="voice-area">
								<view class="voice-btn-wrap">
									<view v-show="isRecording" class="voice-pulse-ring voice-pulse-ring-1" />
									<view v-show="isRecording" class="voice-pulse-ring voice-pulse-ring-2" />
									<view class="voice-btn" :class="{ recording: isRecording }" @tap="toggleRecording">
										<IconFont name="microphone" color="#ffffff" :size="72" />
									</view>
								</view>
								<text class="voice-tip">{{ voiceTipText }}</text>

								<view v-if="hasRecordedVoice" class="voice-publish-mode">
									<view class="voice-mode-btn" :class="{ active: voicePublishMode === 'voice' }"
										@click="setVoicePublishMode('voice')">
										<text>按语音发布</text>
									</view>
									<view class="voice-mode-btn" :class="{ active: voicePublishMode === 'text' }"
										@click="setVoicePublishMode('text')">
										<text>转为文字发布</text>
									</view>
								</view>

								<text v-if="transcribeError" class="voice-error-tip">{{ transcribeError }}</text>
								<text class="voice-transcribe-note">语音发布也需要对应文字，若未自动转写可手动补充</text>

								<view v-if="showVoiceTranscript" class="voice-result">
									<text class="voice-result-label">AI语音转文字：</text>
									<textarea v-if="!isRecording" class="voice-transcribe-input" v-model="voiceText" maxlength="500"
										:adjust-position="false"
										:placeholder="voicePublishMode === 'text' ? '自动转写失败时可在此手动输入文字' : '语音发布也需对应文字，可在此手动补充'" />
									<text v-else class="voice-result-text">{{ voiceTranscriptDisplay }}</text>
								</view>
								<view v-if="showVoiceTranscript && !isRecording && voiceText" class="char-count voice-char-count">
									<text :class="{ warning: voiceText.length >= 480 }">{{ voiceText.length }}/500</text>
								</view>

								<view v-if="hasRecordedVoice" class="voice-audio-actions">
									<view class="voice-audio-play-btn" @click="toggleVoiceAudioPlay">
										<IconFont :name="isVoiceAudioPlaying ? 'pause' : 'play'" color="#8f6fb0" :size="36" />
										<text>{{ isVoiceAudioPlaying ? '暂停语音' : '播放语音' }}</text>
									</view>
									<view class="voice-audio-delete-btn" @click="confirmDeleteRecordedVoice">
										<text>删除录音</text>
									</view>
								</view>
							</view>
						</view>

						<!-- 标签（逗号分隔，最多5个） -->
						<view class="form-section">
							<text class="form-label">内容标签</text>
							<input class="tag-input" v-model="tagText" placeholder="输入标签，多个用逗号分隔（最多5个）" maxlength="60"
								:adjust-position="false" />
						</view>

						<!-- AI 视频生成 -->
						<view class="form-section">
							<text class="form-label">AI视频生成</text>
							<view class="video-gen-card">
								<view class="video-gen-icon">
									<text class="video-gen-emoji">🎬</text>
								</view>
								<view class="video-gen-info">
									<text class="video-gen-title">将内容转为视频</text>
									<text class="video-gen-desc">使用AI将你的内容生成可视化视频场景</text>
								</view>
								<view class="video-gen-switch">
									<view class="switch" :class="{ on: enableVideo, disabled: !canEnableVideoGen && !enableVideo }"
										@click="toggleEnableVideo">
										<view class="switch-thumb" />
									</view>
								</view>
							</view>
							<text class="video-quota-tip">今日首发剩余：{{ quotaInfo.dailyRemain }} 次</text>
							<text class="video-quota-tip">{{ interactionRewardStatusText }}</text>
							<text class="video-quota-tip">累计拉新奖励：{{ quotaInfo.totalBonusEarned }} 次（每次拉新+1生成）</text>
							<text class="video-quota-tip">已消耗奖励额度：{{ quotaInfo.totalBonusConsumed }} 次</text>
							<text class="video-quota-tip">视频参数：固定时长 · 固定720P</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<AppTabBar :current="2" />
	</view>
</template>

<script>
import { publishMood, editMood, generateVideo } from '@/api/mood';
import { getDraft, saveDraft as saveDraftApi } from '@/api/draft';
import { getVideoQuota, getDefaultVideoQuota } from '@/api/quota';
import { uploadVoiceFile } from '@/api/upload';
import IconFont from '@/components/IconFont.vue';
import AppTabBar from '@/components/AppTabBar.vue';
import { getMoodContentType, MOOD_CONTENT_TYPE } from '@/utils/moodContent';
import { consumePublishEntryIntent } from '@/utils/publishEntryIntent';
import { detectViolationWords } from '@/utils/violation';
import {
	isRecordH5,
	ensureRecordPermission,
	getRecorderStartOptions,
	openRecordPermissionSettings
} from '@/utils/voiceRecord';
import { getCurrentPlatform, isAndroid } from '@/utils/adapt';
import {
	canUseTencentRealtimeSpeech,
	startTencentRealtimeSpeech,
	stopTencentRealtimeSpeech,
	cancelTencentRealtimeSpeech,
	isTencentRealtimeSpeechRunning
} from '@/utils/tencentSpeechAsr';
import { initCustomTabBar } from '@/utils/tabBar';

export default {
	name: 'PublishPage',
	components: { IconFont, AppTabBar },
	data() {
		return {
			statusBarHeight: 0,
			scrollHeight: '0px',
			inputMode: 'text',
			content: '',
			voiceText: '',
			voicePublishMode: 'voice',
			tagText: '',
			/** idle | recording | ready */
			voiceRecordStatus: 'idle',
			recordedAudioPath: '',
			recordDurationSec: 0,
			recordingStartedAt: 0,
			isTranscribing: false,
			transcribeError: '',
			isVoiceAudioPlaying: false,
			isUsingRealtimeSpeech: false,
			enableVideo: false,
			publishing: false,
			stashing: false,
			quotaInfo: getDefaultVideoQuota(),
			quotaLoading: false,
			recorderManager: null,
			innerAudioContext: null,
			isRealtimeSpeechAvailable: false,
			isH5Env: false,
			h5MediaRecorder: null,
			h5RecordChunks: [],
			h5RecordedFileName: '',
			h5RecordingStream: null,
			h5SpeechRecognition: null,
			uploadedVoiceUrl: '',
			uploadedVoiceSourcePath: '',
			realtimeSpeechSaveFilePath: '',
			voiceUploadPromise: null,
			awaitingAudioSave: false,
			audioSaveTimeout: null,
			launchScene: 'create',
			editMoodId: null,
			sourceMoodType: MOOD_CONTENT_TYPE.TEXT
		};
	},
	computed: {
		headerTotalHeight() {
			// page-shell 已承担 safe-area-inset-top + 24rpx，这里只算导航内容高度与外壳顶距
			const navBarPx = typeof uni.upx2px === 'function' ? uni.upx2px(104) : 52;
			const shellTopGapPx = typeof uni.upx2px === 'function' ? uni.upx2px(24) : 12;
			return this.statusBarHeight + shellTopGapPx + navBarPx;
		},
		pageTitle() {
			if (this.launchScene === 'edit') return '编辑内容';
			if (this.launchScene === 'convertVideo') return '转为视频';
			return '发布内容';
		},
		submitButtonText() {
			if (this.launchScene === 'edit') return '保存';
			if (this.launchScene === 'convertVideo') return '完成';
			return '发布';
		},
		isEditingExistingMood() {
			return Boolean(this.editMoodId);
		},
		displayContent() {
			if (this.inputMode === 'text') {
				return this.content;
			}
			if (this.voicePublishMode === 'text') {
				return this.publishTextContent || '';
			}
			return this.voiceText.trim() || '语音内容';
		},
		shouldPublishAsText() {
			if (this.inputMode === 'text') return true;
			return this.voicePublishMode === 'text';
		},
		publishTextContent() {
			if (this.inputMode === 'text') {
				return String(this.content || '').trim().slice(0, 500);
			}
			return String(this.voiceText || '').trim().slice(0, 500);
		},
		showVoiceTranscript() {
			if (this.isRecording) return true;
			return this.hasRecordedVoice || Boolean(this.voiceText.trim() || this.isTranscribing);
		},
		voiceTranscriptDisplay() {
			if (this.isTranscribing) return '转写中，请稍候...';
			return this.voiceText.trim() || '正在识别中...';
		},
		parsedCustomTags() {
			if (!this.tagText.trim()) return [];
			return Array.from(
				new Set(
					this.tagText
						.split(/[,，]/)
						.map(s => s.trim())
						.filter(Boolean)
				)
			).slice(0, 5);
		},
		canPublish() {
			if (this.inputMode === 'text') {
				if (!this.content.trim()) return false;
			} else {
				if (!this.hasVoiceAudioAsset) return false;
				if (!this.publishTextContent) return false;
			}
			if (this.inputMode === 'voice' && (this.isTranscribing || this.isRecording)) return false;
			return detectViolationWords(this.displayContent).length === 0;
		},
		canStash() {
			if (this.inputMode === 'voice' && this.isTranscribing) return false;
			if (this.inputMode === 'voice' && this.voiceRecordStatus === 'recording') return false;
			if (this.shouldPublishAsText) return Boolean(this.publishTextContent);
			return this.hasRecordedVoice;
		},
		interactionRewardStatusText() {
			return `互动奖励额度：${Number(this.quotaInfo.bonusQuota || 0)} 次`;
		},
		canEnableVideoGen() {
			return this.hasAvailableVideoQuota(this.quotaInfo);
		},
		isRecording() {
			return this.voiceRecordStatus === 'recording';
		},
		hasRecordedVoice() {
			return this.voiceRecordStatus === 'ready' && (
				this.hasVoiceAudioAsset || Boolean(this.voiceText.trim())
			);
		},
		hasVoiceAudioAsset() {
			return Boolean(this.recordedAudioPath || this.uploadedVoiceUrl);
		},
		voiceTipText() {
			if (this.voiceRecordStatus === 'recording') {
				return this.isH5Env
					? '正在录音识别中，再次点击可结束'
					: '正在录音中，再次点击可结束';
			}
			if (this.hasRecordedVoice) {
				return '录音已保存，可试听、删除或选择发布方式';
			}
			if (this.isTranscribing) {
				return '语音上传完成，AI 转写中...';
			}
			return '点击开始录音，结束后自动上传';
		}
	},
	watch: {
		inputMode(mode) {
			this.transcribeError = '';
			if (mode !== 'voice' && this.voiceRecordStatus === 'recording') {
				this.stopRecordingInternal();
			}
		},
		recordedAudioPath(path) {
			this.stopVoiceAudio();
			if (!path) {
				this.clearUploadedVoice();
				this.h5RecordedFileName = '';
				this.voiceRecordStatus = 'idle';
				this.recordDurationSec = 0;
			} else if (this.voiceRecordStatus !== 'recording') {
				this.voiceRecordStatus = 'ready';
			}
		}
	},
	onLoad() {
		try {
			const sys = uni.getSystemInfoSync();
			this.statusBarHeight = sys.statusBarHeight || 0;
		} catch (e) {
			this.statusBarHeight = 0;
		}
		this.calcScrollHeight();
		this.fetchVideoQuota({ loading: false, silent: true });
		this.isH5Env = isRecordH5();
		this.isRealtimeSpeechAvailable = canUseTencentRealtimeSpeech();
		this.initRecorder();
		this.initInnerAudio();
		if (!this.applyLaunchIntentIfNeeded()) {
			this.loadDraft();
		}
		this.logVoiceCapability('onLoad');
	},
	onShow() {
		initCustomTabBar();
		this.calcScrollHeight();
		this.fetchVideoQuota({ loading: false, silent: true });
		this.applyLaunchIntentIfNeeded();
	},
	onReady() {
		initCustomTabBar();
		if (!this.isH5Env && !this.recorderManager) {
			setTimeout(() => {
				this.initRecorder();
				this.logVoiceCapability('onReady-retry');
			}, 200);
		}
	},
	onUnload() {
		this.clearAudioSaveTimeout();
		this.stopRecordingInternal();
		cancelTencentRealtimeSpeech();
		this.stopH5RecordingStream();
		this.stopH5SpeechRecognition();
		this.stopVoiceAudio();
		if (this.innerAudioContext) {
			this.innerAudioContext.destroy();
		}
	},
	methods: {
		applyLaunchIntentIfNeeded() {
			const intent = consumePublishEntryIntent();
			if (!intent || !intent.mood) return false;
			this.applyLaunchMood(intent.mood, intent.scene);
			return true;
		},

		applyLaunchMood(mood = {}, scene = 'edit') {
			const sourceMoodType = getMoodContentType(mood);
			this.resetForm();
			this.launchScene = scene === 'convertVideo' ? 'convertVideo' : 'edit';
			this.editMoodId = mood.moodId || mood.id || null;
			this.sourceMoodType = sourceMoodType;
			this.tagText = Array.isArray(mood.tags)
				? mood.tags.map((tag) => (typeof tag === 'string' ? tag : tag && tag.tagName)).filter(Boolean).join('，')
				: '';
			this.content = String(mood.textContent || mood.content || '').trim();
			this.voiceText = String(mood.voiceTranscription || mood.textContent || mood.content || '').trim();
			this.uploadedVoiceUrl = mood.voiceUrl || '';
			this.uploadedVoiceSourcePath = '';
			this.recordDurationSec = Number(mood.voiceDuration || 0);
			if (this.uploadedVoiceUrl) {
				this.inputMode = 'voice';
				this.voicePublishMode = 'voice';
				this.voiceRecordStatus = 'ready';
			} else {
				this.inputMode = 'text';
				this.voicePublishMode = 'text';
			}
			if (this.launchScene === 'convertVideo' && this.canEnableVideoGen) {
				this.enableVideo = true;
			}
			if (sourceMoodType === MOOD_CONTENT_TYPE.VIDEO) {
				this.enableVideo = true;
			}
		},

		getSubmitSuccessTarget() {
			return this.isEditingExistingMood ? '/pages/index/index' : '/pages/space/space';
		},

		buildEditPayload() {
			const payload = {
				tags: this.parsedCustomTags
			};
			if (this.sourceMoodType === MOOD_CONTENT_TYPE.TEXT || this.sourceMoodType === MOOD_CONTENT_TYPE.VIDEO) {
				payload.textContent = this.content.trim();
			}
			return payload;
		},

		async saveExistingMoodChanges(options = {}) {
			if (!this.editMoodId) return null;
			const payload = this.buildEditPayload();
			const res = await editMood(this.editMoodId, payload, options);
			return res.data || null;
		},

		getVoiceCapabilityDebugInfo() {
			return {
				platform: getCurrentPlatform(),
				isH5Env: this.isH5Env,
				isRealtimeSpeechAvailable: this.isRealtimeSpeechAvailable,
				hasRecorderManagerApi: typeof uni.getRecorderManager === 'function',
				hasRecorderManagerInstance: Boolean(this.recorderManager),
				voiceRecordStatus: this.voiceRecordStatus
			};
		},

		logVoiceCapability(scene) {
			const info = this.getVoiceCapabilityDebugInfo();
			console.log(`[publish][voice][${scene}]`, info);
			return info;
		},

		canFallbackToUniRecorder() {
			return !this.isH5Env && typeof uni.getRecorderManager === 'function';
		},

		shouldFallbackToUniRecorder(err) {
			// App 端实时语音失败时一律回退普通录音，避免 iOS 上点录音无响应
			return this.canFallbackToUniRecorder();
		},

		getSpeechErrorMessage(err) {
			if (!err) return '';
			if (typeof err === 'string') return err;
			if (typeof err.getString === 'function') {
				return (
					err.getString('errMsg') ||
					err.getString('message') ||
					err.getString('clientErrMessage') ||
					''
				);
			}
			return err.errMsg || err.message || err.clientErrMessage || '';
		},

		fallbackToUniRecorder(reason = '') {
			if (!this.canFallbackToUniRecorder()) {
				return false;
			}
			this.isRealtimeSpeechAvailable = false;
			this.initRecorder();
			if (!this.recorderManager) {
				return false;
			}
			this.transcribeError = reason || '实时语音不可用，已切换为普通录音';
			this.startUniRecording();
			uni.showToast({ title: '已切换为普通录音', icon: 'none', duration: 1800 });
			return true;
		},

		getVoiceUnsupportedReason(info = {}) {
			if (info.isH5Env) return '当前运行在 H5 环境';
			if (!info.hasRecorderManagerApi) return '当前运行环境未提供 uni.getRecorderManager';
			if (!info.hasRecorderManagerInstance) return '录音管理器初始化失败';
			return '录音能力不可用';
		},

		showVoiceUnsupportedTip(info = {}) {
			const reason = this.getVoiceUnsupportedReason(info);
			const detail = [
				`原因：${reason}`,
				`platform=${info.platform || 'unknown'}`,
				`isH5Env=${info.isH5Env ? 'true' : 'false'}`,
				`hasRecorderManagerApi=${info.hasRecorderManagerApi ? 'true' : 'false'}`,
				`hasRecorderManagerInstance=${info.hasRecorderManagerInstance ? 'true' : 'false'}`
			].join('\n');
			uni.showModal({
				title: '录音不可用',
				content: detail,
				showCancel: false
			});
		},

		calcScrollHeight() {
			try {
				const sys = uni.getSystemInfoSync();
				const safeBottom = sys.safeAreaInsets?.bottom || 0;
				const tabBarPx = (typeof uni.upx2px === 'function' ? uni.upx2px(160) : 80) + safeBottom;
				const h = sys.windowHeight - this.headerTotalHeight - tabBarPx;
				this.scrollHeight = `${Math.max(h, 200)}px`;
			} catch (e) {
				this.scrollHeight = `calc(100vh - ${this.headerTotalHeight + 140}px)`;
			}
		},

		async fetchVideoQuota(options = {}) {
			const { force = false, ...requestOptions } = options;
			if (this.quotaLoading && !force) return this.quotaInfo;
			this.quotaLoading = true;
			try {
				const res = await getVideoQuota(requestOptions);
				this.quotaInfo = res.data || getDefaultVideoQuota();
				this.syncEnableVideoWithQuota();
				return this.quotaInfo;
			} catch (e) {
				console.error('获取视频额度失败', e);
				return this.quotaInfo;
			} finally {
				this.quotaLoading = false;
			}
		},

		hasAvailableVideoQuota(quota = this.quotaInfo) {
			return Number(quota?.dailyRemain || 0) > 0 || Number(quota?.bonusQuota || 0) > 0;
		},

		async refreshVideoQuotaForAction(options = {}) {
			const quota = await this.fetchVideoQuota({
				force: true,
				loading: false,
				silent: true,
				...options
			});
			if (this.hasAvailableVideoQuota(quota)) {
				return true;
			}
			this.enableVideo = false;
			uni.showToast({ title: '视频生成额度不足，请刷新额度后重试', icon: 'none' });
			return false;
		},

		syncEnableVideoWithQuota() {
			if (this.canEnableVideoGen) {
				if (this.launchScene === 'convertVideo') {
					this.enableVideo = true;
				}
				return;
			}
			if (this.sourceMoodType === MOOD_CONTENT_TYPE.VIDEO) return;
			if (this.enableVideo) {
				this.enableVideo = false;
			}
		},

		toggleEnableVideo() {
			if (this.enableVideo) {
				this.enableVideo = false;
				return;
			}
			if (!this.canEnableVideoGen) {
				uni.showToast({ title: '视频生成额度不足', icon: 'none' });
				return;
			}
			this.enableVideo = true;
		},

		clearUploadedVoice() {
			this.uploadedVoiceUrl = '';
			this.uploadedVoiceSourcePath = '';
			this.voiceUploadPromise = null;
		},

		getSupportedH5AudioConfig() {
			// 优先使用后端白名单中的格式，若浏览器不支持，再回退录制后转 wav。
			const Recorder = typeof MediaRecorder !== 'undefined' ? MediaRecorder : null;
			if (!Recorder || typeof Recorder.isTypeSupported !== 'function') {
				return null;
			}
			const candidates = [
				{ mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
				{ mimeType: 'audio/ogg', extension: 'ogg' },
				{ mimeType: 'audio/mp4', extension: 'm4a' },
				{ mimeType: 'audio/aac', extension: 'aac' }
			];
			return candidates.find((item) => Recorder.isTypeSupported(item.mimeType)) || null;
		},

		buildH5VoiceFileName(extension = 'ogg') {
			return `voice-${Date.now()}.${extension}`;
		},

		getVoiceExtensionByMimeType(mimeType = '') {
			const normalizedType = String(mimeType || '').toLowerCase();
			if (normalizedType.includes('ogg')) return 'ogg';
			if (normalizedType.includes('mp4')) return 'm4a';
			if (normalizedType.includes('aac')) return 'aac';
			if (normalizedType.includes('wav')) return 'wav';
			if (normalizedType.includes('mpeg') || normalizedType.includes('mp3')) return 'mp3';
			return '';
		},

		isAcceptedVoiceMimeType(mimeType = '') {
			return Boolean(this.getVoiceExtensionByMimeType(mimeType));
		},

		decodeAudioDataCompat(audioContext, arrayBuffer) {
			return new Promise((resolve, reject) => {
				const clonedBuffer = arrayBuffer.slice(0);
				const maybePromise = audioContext.decodeAudioData(
					clonedBuffer,
					(decoded) => resolve(decoded),
					(err) => reject(err)
				);
				if (maybePromise && typeof maybePromise.then === 'function') {
					maybePromise.then(resolve).catch(reject);
				}
			});
		},

		encodeAudioBufferToWav(audioBuffer) {
			const channelCount = Math.min(audioBuffer.numberOfChannels || 1, 2);
			const sampleRate = audioBuffer.sampleRate || 44100;
			const samples = audioBuffer.length || 0;
			const bytesPerSample = 2;
			const blockAlign = channelCount * bytesPerSample;
			const dataSize = samples * blockAlign;
			const buffer = new ArrayBuffer(44 + dataSize);
			const view = new DataView(buffer);
			let offset = 0;

			const writeString = (value) => {
				for (let i = 0; i < value.length; i += 1) {
					view.setUint8(offset, value.charCodeAt(i));
					offset += 1;
				}
			};

			const writeUint16 = (value) => {
				view.setUint16(offset, value, true);
				offset += 2;
			};

			const writeUint32 = (value) => {
				view.setUint32(offset, value, true);
				offset += 4;
			};

			writeString('RIFF');
			writeUint32(36 + dataSize);
			writeString('WAVE');
			writeString('fmt ');
			writeUint32(16);
			writeUint16(1);
			writeUint16(channelCount);
			writeUint32(sampleRate);
			writeUint32(sampleRate * blockAlign);
			writeUint16(blockAlign);
			writeUint16(16);
			writeString('data');
			writeUint32(dataSize);

			const channelData = [];
			for (let channel = 0; channel < channelCount; channel += 1) {
				channelData.push(audioBuffer.getChannelData(channel));
			}

			for (let index = 0; index < samples; index += 1) {
				for (let channel = 0; channel < channelCount; channel += 1) {
					const sample = Math.max(-1, Math.min(1, channelData[channel][index] || 0));
					view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
					offset += 2;
				}
			}

			return buffer;
		},

		async convertH5AudioBlobToWav(blob) {
			// #ifdef H5
			const win = typeof window !== 'undefined' ? window : null;
			const AudioContextCtor = win && (win.AudioContext || win.webkitAudioContext);
			if (!AudioContextCtor) {
				throw new Error('当前浏览器不支持音频转码');
			}
			const audioContext = new AudioContextCtor();
			try {
				const arrayBuffer = await blob.arrayBuffer();
				const audioBuffer = await this.decodeAudioDataCompat(audioContext, arrayBuffer);
				const wavBuffer = this.encodeAudioBufferToWav(audioBuffer);
				return new Blob([wavBuffer], { type: 'audio/wav' });
			} finally {
				if (audioContext && typeof audioContext.close === 'function') {
					await audioContext.close().catch(() => {});
				}
			}
			// #endif
			throw new Error('当前平台不支持音频转码');
		},

		async normalizeH5AudioBlobForUpload(blob) {
			const sourceType = String((blob && blob.type) || '').toLowerCase();
			if (this.isAcceptedVoiceMimeType(sourceType)) {
				return {
					blob,
					extension: this.getVoiceExtensionByMimeType(sourceType) || 'ogg'
				};
			}
			const wavBlob = await this.convertH5AudioBlobToWav(blob);
			return { blob: wavBlob, extension: 'wav' };
		},

		getVoiceUploadFileName(filePath = '') {
			const acceptedExtPattern = /\.(mp3|m4a|aac|wav|ogg)$/i;
			const rawPath = String(filePath || '');
			if (/^blob:/i.test(rawPath) && this.h5RecordedFileName) {
				return this.h5RecordedFileName;
			}
			const baseName = rawPath.split('?')[0].split('/').pop() || '';
			if (acceptedExtPattern.test(baseName)) {
				return baseName;
			}
			const recorderFormat = String(getRecorderStartOptions().format || 'aac').toLowerCase();
			const ext = acceptedExtPattern.test(`.${recorderFormat}`) ? recorderFormat : 'aac';
			return `voice-${Date.now()}.${ext}`;
		},

		clearAudioSaveTimeout() {
			if (this.audioSaveTimeout) {
				clearTimeout(this.audioSaveTimeout);
				this.audioSaveTimeout = null;
			}
			this.awaitingAudioSave = false;
		},

		buildRealtimeSpeechSaveFilePath() {
			const fileName = `tencent-realtime-${Date.now()}.wav`;
			try {
				if (typeof plus !== 'undefined' && plus.io && typeof plus.io.convertLocalFileSystemURL === 'function') {
					const baseDir = plus.io.convertLocalFileSystemURL('_doc/tencent-realtime-cache/');
					return `${baseDir}${fileName}`;
				}
			} catch (e) {
				console.warn('[publish][voice][realtime] resolve saveFilePath failed', e);
			}
			return `_doc/tencent-realtime-cache/${fileName}`;
		},

		ensureRealtimeSpeechSaveDir() {
			return new Promise((resolve) => {
				if (typeof plus === 'undefined' || !plus.io || typeof plus.io.resolveLocalFileSystemURL !== 'function') {
					resolve();
					return;
				}
				plus.io.resolveLocalFileSystemURL(
					'_doc/',
					(root) => {
						root.getDirectory(
							'tencent-realtime-cache',
							{ create: true },
							() => resolve(),
							() => resolve()
						);
					},
					() => resolve()
				);
			});
		},

		getAudioSavedPath(result = {}) {
			if (!result) return '';
			if (typeof result.getString === 'function') {
				return (
					result.getString('audioFilePath') ||
					result.getString('savedFilePath') ||
					result.getString('saveFilePath') ||
					result.getString('filePath') ||
					result.getString('tempFilePath') ||
					result.getString('audioPath') ||
					result.getString('path') ||
					''
				);
			}
			return (
				result.audioFilePath ||
				result.savedFilePath ||
				result.saveFilePath ||
				result.filePath ||
				result.tempFilePath ||
				result.audioPath ||
				result.path ||
				''
			);
		},

		scheduleAudioSaveTimeout() {
			this.clearAudioSaveTimeout();
			this.awaitingAudioSave = true;
			this.audioSaveTimeout = setTimeout(() => {
				this.audioSaveTimeout = null;
				if (!this.awaitingAudioSave || this.hasVoiceAudioAsset) {
					this.awaitingAudioSave = false;
					return;
				}
				this.awaitingAudioSave = false;
				this.transcribeError = '未保存到本地音频，按语音发布可能失败，可选择转为文字发布';
			}, 3000);
		},

		async ensureVoiceUploaded(options = {}) {
			const {
				filePath = this.recordedAudioPath,
				loading = true,
				loadingText = '上传语音中...',
				silent = false,
				force = false
			} = options;

			if (this.uploadedVoiceUrl && !filePath) {
				return this.uploadedVoiceUrl;
			}

			if (!filePath) {
				if (this.voiceUploadPromise) {
					return this.voiceUploadPromise;
				}
				throw new Error('请先完成语音录制');
			}

			if (!force && this.uploadedVoiceUrl && this.uploadedVoiceSourcePath === filePath) {
				return this.uploadedVoiceUrl;
			}

			if (!force && this.voiceUploadPromise && this.uploadedVoiceSourcePath === filePath) {
				return this.voiceUploadPromise;
			}

			this.uploadedVoiceSourcePath = filePath;
			console.log('[publish][voice] 开始上传语音', filePath);
			const uploadOptions = {
				loading,
				loadingText,
				silent,
				// 后端按 multipart 文件名后缀识别格式；request.js 会在路径已带合法后缀时仍走 uni.uploadFile
				fileName: this.getVoiceUploadFileName(filePath)
			};
			const uploadPromise = uploadVoiceFile(filePath, {
				...uploadOptions
			}).then((res) => {
				const url = String((res && res.url) || '').trim();
				if (!url) {
					throw new Error('语音上传成功但未返回地址');
				}
				this.uploadedVoiceUrl = url;
				console.log('[publish][voice] 语音上传成功', url);
				return url;
			}).catch((err) => {
				console.error('[publish][voice] 语音上传失败', err);
				if (this.uploadedVoiceSourcePath === filePath) {
					this.uploadedVoiceUrl = '';
				}
				throw err;
			}).finally(() => {
				if (this.voiceUploadPromise === uploadPromise) {
					this.voiceUploadPromise = null;
				}
			});

			this.voiceUploadPromise = uploadPromise;
			return uploadPromise;
		},

		async handleVoiceReadyByMode() {
			if (this.recordedAudioPath) {
				this.triggerVoiceUpload(this.recordedAudioPath);
			}
		},

		triggerVoiceUpload(filePath) {
			if (!filePath) return;
			this.ensureVoiceUploaded({ filePath, loading: false, silent: true, force: true }).catch((err) => {
				console.error('录音自动上传失败', err);
			});
		},

		initRecorder() {
			if (this.isH5Env) return;
			try {
				if (typeof uni.getRecorderManager !== 'function') {
					return;
				}
				this.recorderManager = uni.getRecorderManager();
				this.recorderManager.onStart(() => {
					this.voiceRecordStatus = 'recording';
				});
				this.recorderManager.onStop((res) => {
					console.log('[publish][voice] uni 录音结束', res);
					const elapsed = Date.now() - (this.recordingStartedAt || Date.now());
					const durationMs = res.duration > 0 ? res.duration : elapsed;
					if (!res.tempFilePath) {
						this.voiceRecordStatus = 'idle';
						this.transcribeError = '录音失败，请重试';
						return;
					}
					if (durationMs < 1000) {
						this.voiceRecordStatus = 'idle';
						this.transcribeError = '录音时间过短，请重新录制';
						return;
					}
					this.finishVoiceRecording(res.tempFilePath, durationMs);
				});
				this.recorderManager.onError((err) => {
					this.voiceRecordStatus = 'idle';
					console.error('录音错误', err);
					this.transcribeError = '录音失败，请检查麦克风权限';
					uni.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' });
				});
			} catch (e) {
				console.warn('录音不可用', e);
			}
		},

		async finishVoiceRecording(tempPath, durationMs, options = {}) {
			const {
				alreadySaved = false,
				keepTranscript = false,
				showToast = true,
				autoTranscribe = true
			} = options;
			const durationSec = Math.max(1, Math.round((durationMs || 0) / 1000));
			const applySaved = async (savedPath) => {
				this.clearAudioSaveTimeout();
				this.clearUploadedVoice();
				this.recordedAudioPath = savedPath;
				this.recordDurationSec = durationSec;
				this.voiceRecordStatus = 'ready';
				if (!keepTranscript) {
					this.voiceText = '';
				}
				this.voicePublishMode = 'voice';
				this.transcribeError = '';
				try {
					await this.ensureVoiceUploaded({
						filePath: savedPath,
						loading: true,
						silent: false,
						loadingText: '上传语音中...'
					});
					if (autoTranscribe) {
						await this.transcribeAfterVoiceUpload({ silent: false });
					}
				} catch (err) {
					console.error('录音自动上传失败', err);
					this.transcribeError = (err && err.message) || '语音上传失败，发布时将自动重试';
				}
				if (showToast) {
					uni.showToast({
						title: this.uploadedVoiceUrl ? '录音已保存并上传' : '录音已保存',
						icon: 'success',
						duration: 1200
					});
				}
			};
			const isTempPath =
				!alreadySaved &&
				tempPath &&
				!tempPath.startsWith('blob:') &&
				typeof uni.saveFile === 'function';
			if (isTempPath) {
				uni.saveFile({
					tempFilePath: tempPath,
					success: (res) => {
						applySaved(res.savedFilePath || tempPath);
					},
					fail: () => {
						applySaved(tempPath);
					}
				});
				return;
			}
			await applySaved(tempPath);
		},

		persistVoiceFile(tempPath, durationMs, options = {}) {
			return this.finishVoiceRecording(tempPath, durationMs, options);
		},

		async transcribeAfterVoiceUpload(options = {}) {
			const { silent = true } = options;
			const text = String(this.voiceText || '').trim().slice(0, 500);
			if (text) {
				this.transcribeError = '';
				return text;
			}
			if (silent) return '';
			return '';
		},

		initInnerAudio() {
			this.innerAudioContext = uni.createInnerAudioContext();
			this.innerAudioContext.onEnded(() => {
				this.isVoiceAudioPlaying = false;
			});
			this.innerAudioContext.onStop(() => {
				this.isVoiceAudioPlaying = false;
			});
		},

		goBack() {
			uni.switchTab({ url: '/pages/index/index' });
		},

		getRealtimeRecognizeText(result = {}) {
			if (!result) return '';
			if (typeof result.getString === 'function') {
				const text =
					result.getString('text') ||
					result.getString('recognizedText') ||
					result.getString('voiceText') ||
					result.getString('result') ||
					'';
				return String(text).trim().slice(0, 500);
			}
			const text = result.text || result.recognizedText || result.voiceText || result.result || '';
			return String(text).trim().slice(0, 500);
		},

		setVoiceTranscript(text = '') {
			const nextText = String(text || '').trim().slice(0, 500);
			if (!nextText) return '';
			this.voiceText = nextText;
			this.transcribeError = '';
			return nextText;
		},

		appendVoiceTranscript(text = '') {
			const nextText = String(text || '').trim();
			if (!nextText) return this.voiceText;
			const current = String(this.voiceText || '').trim();
			if (!current) {
				return this.setVoiceTranscript(nextText);
			}
			if (current.includes(nextText) || nextText.includes(current)) {
				return this.setVoiceTranscript(nextText.length >= current.length ? nextText : current);
			}
			return this.setVoiceTranscript(`${current}${nextText}`.slice(0, 500));
		},

		handleRealtimeSpeechSlice(result) {
			console.log('[publish][voice][realtime] slice', result, this.getRealtimeRecognizeText(result));
			this.setVoiceTranscript(this.getRealtimeRecognizeText(result));
		},

		handleRealtimeSpeechSegment(result) {
			console.log('[publish][voice][realtime] segment', result, this.getRealtimeRecognizeText(result));
			this.appendVoiceTranscript(this.getRealtimeRecognizeText(result));
		},

		handleRealtimeSpeechFinish(result) {
			this.isUsingRealtimeSpeech = false;
			console.log('[publish][voice][realtime] finish', result, {
				text: this.getRealtimeRecognizeText(result),
				recordedAudioPath: this.recordedAudioPath,
				uploadedVoiceUrl: this.uploadedVoiceUrl
			});
			this.setVoiceTranscript(this.getRealtimeRecognizeText(result));
			this.isTranscribing = false;
			this.recordDurationSec = Math.max(
				1,
				Math.round((Date.now() - (this.recordingStartedAt || Date.now())) / 1000)
			);
			if (this.recordedAudioPath || this.uploadedVoiceUrl) {
				this.clearAudioSaveTimeout();
				if (this.voiceRecordStatus !== 'ready') {
					this.voiceRecordStatus = 'ready';
					this.voicePublishMode = 'voice';
					uni.showToast({ title: '录音已保存', icon: 'success', duration: 1200 });
				}
				return;
			}
			if (this.voiceText.trim()) {
				this.voiceRecordStatus = 'ready';
				this.voicePublishMode = 'voice';
				this.transcribeError = '';
				this.scheduleAudioSaveTimeout();
				uni.showToast({ title: '语音识别完成', icon: 'success', duration: 1200 });
				return;
			}
			this.clearAudioSaveTimeout();
			this.voiceRecordStatus = 'idle';
			this.transcribeError = '未识别到有效语音，请重试';
		},

		handleRealtimeSpeechError(err) {
			console.error('实时语音识别失败', err);
			this.isUsingRealtimeSpeech = false;
			this.isTranscribing = false;
			this.voiceRecordStatus = 'idle';
			this.recordDurationSec = 0;
			const errMsg = this.getSpeechErrorMessage(err) || '实时识别失败，请重试';
			if (this.shouldFallbackToUniRecorder(err) && this.fallbackToUniRecorder('实时语音初始化失败，已切换为普通录音')) {
				return;
			}
			this.transcribeError = errMsg;
			uni.showToast({ title: errMsg.slice(0, 40), icon: 'none' });
		},

		handleRealtimeSpeechAudioSaved(result) {
			const savedPath = this.getAudioSavedPath(result) || this.realtimeSpeechSaveFilePath;
			console.log('[publish][voice][realtime] audioSaved', result, { savedPath });
			if (!savedPath || this.recordedAudioPath === savedPath) {
				return;
			}
			const durationMs = Math.max(1000, Date.now() - (this.recordingStartedAt || Date.now()));
			this.persistVoiceFile(savedPath, durationMs, {
				alreadySaved: true,
				keepTranscript: true,
				autoTranscribe: false
			}).catch((err) => {
				console.error('[publish][voice][realtime] audioSaved persist failed', err);
				this.transcribeError = (err && err.message) || '录音保存成功，但语音上传失败';
			}).finally(() => {
				if (this.realtimeSpeechSaveFilePath === savedPath) {
					this.realtimeSpeechSaveFilePath = '';
				}
			});
		},

		finishRealtimeSpeechByCancel() {
			this.isUsingRealtimeSpeech = false;
			this.isTranscribing = false;
			this.recordDurationSec = Math.max(
				1,
				Math.round((Date.now() - (this.recordingStartedAt || Date.now())) / 1000)
			);
			if (this.recordedAudioPath || this.uploadedVoiceUrl) {
				this.clearAudioSaveTimeout();
				if (this.voiceRecordStatus !== 'ready') {
					this.voiceRecordStatus = 'ready';
					this.voicePublishMode = 'voice';
				}
				return;
			}
			if (this.voiceText.trim()) {
				this.voiceRecordStatus = 'ready';
				this.voicePublishMode = 'voice';
				this.transcribeError = '';
				this.scheduleAudioSaveTimeout();
				return;
			}
			this.clearAudioSaveTimeout();
			this.voiceRecordStatus = 'idle';
			this.transcribeError = '未识别到有效语音，请重试';
		},

		setVoicePublishMode(mode) {
			if (mode !== 'voice' && mode !== 'text') return;
			this.voicePublishMode = mode;
			this.transcribeError = '';
			if (mode !== 'text') return;
			if (!this.hasVoiceAudioAsset) {
				this.transcribeError = '请先完成语音录制';
				return;
			}
		},

		async requestVoiceTranscription(options = {}) {
			const { silent = false } = options;
			const text = String(this.voiceText || '').trim().slice(0, 500);
			if (text) {
				return text;
			}
			if (!silent) {
				this.transcribeError = '';
			}
			return '';
		},

		async transcribeAudioToText(options = {}) {
			const { silent = false } = options;
			if (this.voiceRecordStatus !== 'ready' || this.isTranscribing) {
				return '';
			}
			if (!this.hasVoiceAudioAsset && !this.voiceText.trim()) {
				return '';
			}
			if (this.voiceText.trim()) {
				return this.voiceText.trim();
			}
			this.isTranscribing = true;
			this.transcribeError = '';
			try {
				const transcript = await this.requestVoiceTranscription({ silent });
				if (!transcript) {
					this.transcribeError = '未获取到实时识别文本，请手动输入文字';
					if (!silent) {
						uni.showToast({ title: this.transcribeError, icon: 'none' });
					}
					return '';
				}
				this.voicePublishMode = 'text';
				return transcript;
			} catch (e) {
				console.error('语音转写失败', e);
				this.transcribeError = (e && e.message) || 'AI转写失败，请重试';
				if (!silent) {
					uni.showToast({ title: this.transcribeError, icon: 'none' });
				}
				return '';
			} finally {
				this.isTranscribing = false;
			}
		},

		async ensureVoiceTranscript(options = {}) {
			const { required = false, silent = false, requiredMessage = '请先补充语音识别文本' } = options;
			const transcript = String(this.voiceText || '').trim().slice(0, 500);
			if (transcript) {
				return transcript;
			}

			const nextText = await this.transcribeAudioToText();
			if (String(nextText || '').trim()) {
				return String(nextText).trim().slice(0, 500);
			}

			if (required) {
				const message = requiredMessage;
				this.transcribeError = message;
				if (!silent) {
					uni.showToast({ title: message, icon: 'none' });
				}
				throw new Error(message);
			}

			return '';
		},

		toggleRecording() {
			if (this.voiceRecordStatus === 'recording') {
				this.stopRecordingInternal();
				return;
			}
			if (this.isH5Env) {
				this.startH5Recording();
				return;
			}
			if (!this.recorderManager) {
				this.initRecorder();
			}
			if (!this.recorderManager) {
				const debugInfo = this.logVoiceCapability('unsupported');
				console.warn('[publish][voice] 当前环境不支持录音', debugInfo);
				this.showVoiceUnsupportedTip(debugInfo);
				return;
			}
			ensureRecordPermission()
				.then(() => {
					if (this.isRealtimeSpeechAvailable) {
						return this.startRealtimeSpeechRecording();
					}
					return this.startUniRecording();
				})
				.catch((err) => {
					console.warn('[publish][voice] 录音权限校验失败', err);
					uni.showModal({
						title: '提示',
						content: '需要麦克风权限才能录音，请在设置中开启',
						confirmText: '去设置',
						success: (res) => {
							if (!res.confirm) return;
							if (getCurrentPlatform() === 'app-plus') {
								openRecordPermissionSettings().catch(() => {
									uni.showToast({ title: '无法打开系统设置，请手动开启麦克风权限', icon: 'none' });
								});
								return;
							}
							if (typeof uni.openSetting === 'function') {
								uni.openSetting();
							}
						}
					});
				});
		},

		async startRealtimeSpeechRecording() {
			const previousLocalPath = this.recordedAudioPath;
			const previousRealtimePath = this.realtimeSpeechSaveFilePath;
			this.clearAudioSaveTimeout();
			this.stopVoiceAudio();
			this.isUsingRealtimeSpeech = true;
			this.recordedAudioPath = '';
			this.clearUploadedVoice();
			this.realtimeSpeechSaveFilePath = '';
			this.recordDurationSec = 0;
			this.voiceText = '';
			this.voicePublishMode = 'voice';
			this.transcribeError = '';
			this.recordingStartedAt = Date.now();
			this.voiceRecordStatus = 'recording';
			const stalePaths = [previousLocalPath, previousRealtimePath].filter(
				(path, index, list) => path && list.indexOf(path) === index
			);
			stalePaths.forEach((path) => {
				this.removeLocalVoiceFile(path);
			});
			await this.ensureRealtimeSpeechSaveDir();
			const saveFilePath = this.buildRealtimeSpeechSaveFilePath();
			this.realtimeSpeechSaveFilePath = saveFilePath;

			try {
				await startTencentRealtimeSpeech({
					preferDevCredential: true,
					enableDetectVolume: true,
					endRecognizeWhenDetectSilence: false,
					endRecognizeWhenDetectSilenceAutoStop: false,
					shouldSaveAsFile: true,
					saveFilePath,
					onStartRecord: () => {
						console.log('[publish][voice][realtime] startRecord', { saveFilePath });
						this.voiceRecordStatus = 'recording';
					},
					onStopRecord: () => {
						console.log('[publish][voice][realtime] stopRecord', { saveFilePath });
					},
					onSliceRecognize: (result) => this.handleRealtimeSpeechSlice(result),
					onSegmentRecognize: (result) => this.handleRealtimeSpeechSegment(result),
					onFinish: (result) => this.handleRealtimeSpeechFinish(result),
					onError: (err) => this.handleRealtimeSpeechError(err),
					onAudioSaved: (result) => this.handleRealtimeSpeechAudioSaved(result)
				});
			} catch (e) {
				console.error('启动实时语音识别失败', e);
				this.isUsingRealtimeSpeech = false;
				this.isTranscribing = false;
				this.voiceRecordStatus = 'idle';
				const errMsg = this.getSpeechErrorMessage(e) || '启动实时识别失败，请重试';
				if (this.shouldFallbackToUniRecorder(e) && this.fallbackToUniRecorder('实时语音初始化失败，已切换为普通录音')) {
					return;
				}
				this.transcribeError = errMsg;
				uni.showToast({ title: errMsg.slice(0, 40), icon: 'none' });
			}
		},

		startUniRecording() {
			const previousLocalPath = this.recordedAudioPath;
			this.stopVoiceAudio();
			cancelTencentRealtimeSpeech();
			this.isUsingRealtimeSpeech = false;
			this.recordedAudioPath = '';
			this.clearUploadedVoice();
			this.recordDurationSec = 0;
			this.voiceText = '';
			this.voicePublishMode = 'voice';
			this.transcribeError = '';
			this.recordingStartedAt = Date.now();
			this.voiceRecordStatus = 'recording';
			if (previousLocalPath) {
				this.removeLocalVoiceFile(previousLocalPath);
			}
			try {
				if (!this.recorderManager) {
					this.initRecorder();
				}
				if (!this.recorderManager) {
					throw new Error('录音管理器不可用');
				}
				this.recorderManager.start(getRecorderStartOptions());
			} catch (e) {
				console.error('启动录音失败', e);
				this.voiceRecordStatus = 'idle';
				this.transcribeError = '启动录音失败，请重试';
				uni.showToast({ title: '启动录音失败，请重试', icon: 'none' });
			}
		},

		stopRecordingInternal() {
			if (this.isH5Env) {
				this.stopH5Recording();
				return;
			}
			if (this.isUsingRealtimeSpeech || isTencentRealtimeSpeechRunning()) {
				if (isAndroid()) {
					cancelTencentRealtimeSpeech();
					this.finishRealtimeSpeechByCancel();
					return;
				}
				stopTencentRealtimeSpeech();
				return;
			}
			cancelTencentRealtimeSpeech();
			if (this.recorderManager && this.voiceRecordStatus === 'recording') {
				this.recorderManager.stop();
				return;
			}
			this.voiceRecordStatus = 'idle';
		},

		stopH5RecordingStream() {
			if (!this.h5RecordingStream) return;
			this.h5RecordingStream.getTracks().forEach(track => track.stop());
			this.h5RecordingStream = null;
		},

		startH5SpeechRecognition() {
			// #ifdef H5
			const win = typeof window !== 'undefined' ? window : null;
			const SpeechRecognition = win && (win.SpeechRecognition || win.webkitSpeechRecognition);
			if (!SpeechRecognition) return;
			this.stopH5SpeechRecognition();
			const recognition = new SpeechRecognition();
			recognition.lang = 'zh-CN';
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.onresult = (event) => {
				let transcript = '';
				for (let i = 0; i < event.results.length; i += 1) {
					transcript += event.results[i][0].transcript || '';
				}
				this.appendVoiceTranscript(transcript);
			};
			recognition.onerror = (err) => {
				console.warn('[publish][voice] H5 语音识别失败', err);
			};
			this.h5SpeechRecognition = recognition;
			try {
				recognition.start();
			} catch (e) {
				console.warn('[publish][voice] H5 语音识别启动失败', e);
				this.h5SpeechRecognition = null;
			}
			// #endif
		},

		stopH5SpeechRecognition() {
			if (!this.h5SpeechRecognition) return;
			try {
				this.h5SpeechRecognition.stop();
			} catch (e) {
				/* ignore */
			}
			this.h5SpeechRecognition = null;
		},

		blobToObjectUrl(blob) {
			// #ifdef H5
			if (typeof URL !== 'undefined' && URL.createObjectURL) {
				return URL.createObjectURL(blob);
			}
			// #endif
			return '';
		},

		async startH5Recording() {
			const nav = typeof navigator !== 'undefined' ? navigator : null;
			if (!nav?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
				uni.showToast({ title: '当前浏览器不支持录音', icon: 'none' });
				return;
			}
			const h5AudioConfig = this.getSupportedH5AudioConfig();
			try {
				const previousLocalPath = this.recordedAudioPath;
				this.stopVoiceAudio();
				this.isUsingRealtimeSpeech = false;
				this.recordedAudioPath = '';
				this.clearUploadedVoice();
				this.h5RecordedFileName = '';
				this.recordDurationSec = 0;
				this.voiceText = '';
				this.voicePublishMode = 'voice';
				if (previousLocalPath) {
					this.removeLocalVoiceFile(previousLocalPath);
				}
				const stream = await nav.mediaDevices.getUserMedia({ audio: true });
				this.stopH5RecordingStream();
				this.h5RecordingStream = stream;
				const recorder = h5AudioConfig
					? new MediaRecorder(stream, { mimeType: h5AudioConfig.mimeType })
					: new MediaRecorder(stream);
				this.h5MediaRecorder = recorder;
				this.h5RecordChunks = [];
				let chunkMimeType = '';
				recorder.ondataavailable = (event) => {
					if (event.data && event.data.size > 0) {
						chunkMimeType = chunkMimeType || event.data.type || '';
						this.h5RecordChunks.push(event.data);
					}
				};
				recorder.onstop = async () => {
					this.stopH5SpeechRecognition();
					this.stopH5RecordingStream();
					this.h5MediaRecorder = null;
					if (this.h5RecordChunks.length === 0) {
						this.voiceRecordStatus = 'idle';
						this.transcribeError = '录音失败，请重试';
						return;
					}
					const durationMs = Date.now() - (this.recordingStartedAt || Date.now());
					if (durationMs < 1000) {
						this.voiceRecordStatus = 'idle';
						this.transcribeError = '录音时间过短，请重新录制';
						return;
					}
					try {
						const rawMimeType = chunkMimeType || recorder.mimeType || (h5AudioConfig && h5AudioConfig.mimeType) || 'audio/webm';
						const rawBlob = new Blob(this.h5RecordChunks, { type: rawMimeType });
						const normalizedAudio = await this.normalizeH5AudioBlobForUpload(rawBlob);
						const url = this.blobToObjectUrl(normalizedAudio.blob);
						if (!url) {
							this.voiceRecordStatus = 'idle';
							this.transcribeError = '录音保存失败';
							return;
						}
						this.h5RecordedFileName = this.buildH5VoiceFileName(normalizedAudio.extension);
						await this.persistVoiceFile(url, durationMs);
					} catch (error) {
						console.error('[publish][voice] H5 音频格式转换失败', error);
						this.voiceRecordStatus = 'idle';
						this.transcribeError = (error && error.message) || '录音格式转换失败';
					} finally {
						this.h5RecordChunks = [];
					}
				};
				recorder.onerror = () => {
					this.voiceRecordStatus = 'idle';
					this.transcribeError = '录音失败，请检查麦克风权限';
					this.stopH5RecordingStream();
				};
				this.transcribeError = '';
				this.recordingStartedAt = Date.now();
				this.voiceRecordStatus = 'recording';
				this.startH5SpeechRecognition();
				recorder.start();
			} catch (e) {
				console.error('H5 录音启动失败', e);
				this.voiceRecordStatus = 'idle';
				uni.showToast({ title: '麦克风权限未开启', icon: 'none' });
			}
		},

		stopH5Recording() {
			this.stopH5SpeechRecognition();
			if (this.h5MediaRecorder && this.h5MediaRecorder.state !== 'inactive') {
				this.h5MediaRecorder.stop();
				return;
			}
			this.voiceRecordStatus = 'idle';
			this.stopH5RecordingStream();
		},

		toggleVoiceAudioPlay() {
			if (this.voiceRecordStatus !== 'ready') {
				uni.showToast({ title: '当前没有可播放的语音文件', icon: 'none' });
				return;
			}
			const playSrc = this.recordedAudioPath || this.uploadedVoiceUrl;
			if (!playSrc) {
				if (this.awaitingAudioSave) {
					uni.showToast({ title: '语音文件保存中，请稍候', icon: 'none' });
					return;
				}
				uni.showToast({ title: '当前没有可播放的语音文件', icon: 'none' });
				return;
			}
			if (!this.innerAudioContext) return;
			if (this.isVoiceAudioPlaying) {
				this.stopVoiceAudio();
				return;
			}
			this.innerAudioContext.src = playSrc;
			this.innerAudioContext.play();
			this.isVoiceAudioPlaying = true;
		},

		stopVoiceAudio() {
			if (this.innerAudioContext) {
				this.innerAudioContext.stop();
			}
			this.isVoiceAudioPlaying = false;
		},

		removePlusLocalFile(filePath) {
			return new Promise((resolve, reject) => {
				if (typeof plus === 'undefined' || !plus.io || typeof plus.io.resolveLocalFileSystemURL !== 'function') {
					reject(new Error('unsupported'));
					return;
				}
				plus.io.resolveLocalFileSystemURL(
					filePath,
					(entry) => {
						entry.remove(
							() => resolve(true),
							() => reject(new Error('remove failed'))
						);
					},
					() => reject(new Error('resolve failed'))
				);
			});
		},

		removeLocalVoiceFile(filePath) {
			const path = String(filePath || '').trim();
			if (!path) return Promise.resolve(false);
			if (/^https?:\/\//i.test(path)) return Promise.resolve(false);
			if (/^blob:/i.test(path)) {
				try {
					if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
						URL.revokeObjectURL(path);
					}
				} catch (e) {
					/* ignore */
				}
				return Promise.resolve(true);
			}
			return new Promise((resolve) => {
				const tryPlus = () => {
					this.removePlusLocalFile(path)
						.then(() => resolve(true))
						.catch(() => resolve(false));
				};
				if (typeof uni.removeSavedFile === 'function') {
					uni.removeSavedFile({
						filePath: path,
						success: () => resolve(true),
						fail: () => tryPlus()
					});
					return;
				}
				tryPlus();
			});
		},

		confirmDeleteRecordedVoice() {
			if (!this.hasRecordedVoice && !this.hasVoiceAudioAsset) {
				uni.showToast({ title: '当前没有可删除的录音', icon: 'none' });
				return;
			}
			if (this.isRecording || this.isTranscribing) {
				uni.showToast({ title: '录音或转写进行中，请稍后再删', icon: 'none' });
				return;
			}
			uni.showModal({
				title: '删除录音',
				content: '确定删除当前录音吗？删除后可重新录制。',
				confirmText: '删除',
				confirmColor: '#ff4d4f',
				success: (res) => {
					if (!res.confirm) return;
					this.deleteRecordedVoice();
				}
			});
		},

		async deleteRecordedVoice() {
			const localPath = this.recordedAudioPath;
			const realtimePath = this.realtimeSpeechSaveFilePath;
			this.stopVoiceAudio();
			this.clearAudioSaveTimeout();
			this.voiceUploadPromise = null;
			this.isTranscribing = false;
			this.transcribeError = '';
			this.voiceText = '';
			this.voicePublishMode = 'voice';
			this.h5RecordedFileName = '';
			this.realtimeSpeechSaveFilePath = '';
			this.recordDurationSec = 0;
			this.clearUploadedVoice();
			this.recordedAudioPath = '';
			this.voiceRecordStatus = 'idle';

			const pathsToRemove = [localPath, realtimePath].filter(
				(path, index, list) => path && list.indexOf(path) === index
			);
			await Promise.all(pathsToRemove.map((path) => this.removeLocalVoiceFile(path)));
			uni.showToast({ title: '录音已删除', icon: 'success' });
		},

		async buildPublishPayload() {
			const tags = this.parsedCustomTags;
			const generateVideo = Boolean(this.enableVideo);

			if (this.inputMode === 'text') {
				return {
					contentType: generateVideo ? 3 : 1,
					textContent: this.content.trim(),
					customTags: tags,
					generateVideo
				};
			}

			const voiceUrl = await this.ensureVoiceUploaded();
			const voiceDuration = this.recordDurationSec || 0;
			let voiceTranscription = String(this.voiceText || '').trim().slice(0, 500);
			if (!voiceTranscription) {
				voiceTranscription = await this.ensureVoiceTranscript({ silent: true });
			}
			const requiredTranscriptMessage = this.voicePublishMode === 'text'
				? '转为文字发布时，需要先生成识别文本'
				: '语音发布也需要对应文字，请先完成转写或手动补充';
			const transcript = voiceTranscription || await this.ensureVoiceTranscript({
				required: true,
				requiredMessage: requiredTranscriptMessage
			});

			// 语音 Tab：仅切换发布类型，音频和识别文本都随发布请求提交给后端
			if (this.voicePublishMode === 'text') {
				return {
					contentType: generateVideo ? 3 : 2,
					textContent: transcript,
					voiceUrl,
					voiceDuration,
					voiceTranscription: transcript,
					customTags: tags,
					generateVideo
				};
			}

			const payload = {
				contentType: generateVideo ? 3 : 2,
				voiceUrl,
				voiceDuration,
				textContent: transcript,
				voiceTranscription: transcript,
				customTags: tags,
				generateVideo
			};
			if (generateVideo) {
				payload.textContent = transcript;
				payload.voiceTranscription = transcript;
			}
			return payload;
		},

		async buildDraftPayload() {
			const tags = this.parsedCustomTags;
			const generateVideo = Boolean(this.enableVideo);

			if (this.inputMode === 'voice') {
				let voiceUrl = this.uploadedVoiceUrl;
				if (this.recordedAudioPath) {
					voiceUrl = await this.ensureVoiceUploaded({ loading: false, silent: true });
				}
				const payload = {
					contentType: generateVideo ? 3 : 2,
					voiceUrl: voiceUrl || '',
					voiceDuration: this.recordDurationSec || 0,
					customTags: tags,
					generateVideo
				};
				if (this.voiceText.trim()) {
					payload.textContent = this.voiceText.trim();
					payload.voiceTranscription = this.voiceText.trim();
				}
				return payload;
			}

			return {
				contentType: generateVideo ? 3 : 1,
				textContent: this.content.trim(),
				customTags: tags,
				generateVideo
			};
		},

		applyDraftData(draft = {}) {
			const tags = Array.isArray(draft.tags) ? draft.tags.filter(Boolean) : [];
			this.tagText = tags.join('，');
			this.transcribeError = '';

			if (draft.voiceUrl) {
				this.inputMode = 'voice';
				this.uploadedVoiceUrl = draft.voiceUrl || '';
				this.uploadedVoiceSourcePath = '';
				this.recordDurationSec = draft.voiceDuration || 0;
				this.voiceText = draft.textContent || '';
				this.voiceRecordStatus = draft.voiceUrl ? 'ready' : 'idle';
				this.voicePublishMode = draft.textContent ? 'text' : 'voice';
			} else {
				this.inputMode = 'text';
				this.content = draft.textContent || '';
				this.voicePublishMode = 'voice';
			}

			if (draft.videoUrl || Number(draft.contentType) === MOOD_CONTENT_TYPE.VIDEO) {
				if (this.canEnableVideoGen) {
					this.enableVideo = true;
				}
			}
		},

		async saveDraft() {
			if (this.stashing) return;
			if (!this.canStash) {
				uni.showToast({ title: '请先准备可暂存的内容', icon: 'none' });
				return;
			}
			this.stashing = true;
			try {
				const payload = await this.buildDraftPayload();
				await saveDraftApi(payload, { loadingText: '暂存中...' });
				uni.showToast({ title: '已暂存', icon: 'success' });
			} catch (e) {
				console.error('暂存失败', e);
				uni.showToast({ title: (e && e.message) || '暂存失败', icon: 'none' });
			} finally {
				this.stashing = false;
			}
		},

		async loadDraft() {
			try {
				const [textRes, voiceRes, videoRes] = await Promise.all([
					getDraft(1, { loading: false, silent: true }),
					getDraft(2, { loading: false, silent: true }),
					getDraft(3, { loading: false, silent: true })
				]);
				const textDraft = textRes.data;
				const voiceDraft = voiceRes.data;
				const videoDraft = videoRes.data;
				let draft = null;
				const drafts = [textDraft, voiceDraft, videoDraft].filter(Boolean);
				if (drafts.length) {
					draft = drafts.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0))[0];
				}
				if (!draft) return;
				this.applyDraftData(draft);
			} catch (e) {
				console.error('加载草稿失败', e);
			}
		},

		resetForm() {
			this.content = '';
			this.voiceText = '';
			this.tagText = '';
			this.isUsingRealtimeSpeech = false;
			this.recordedAudioPath = '';
			this.clearUploadedVoice();
			this.voiceRecordStatus = 'idle';
			this.recordDurationSec = 0;
			this.isTranscribing = false;
			this.transcribeError = '';
			this.enableVideo = false;
			this.inputMode = 'text';
			this.voicePublishMode = 'voice';
			this.h5RecordedFileName = '';
			this.launchScene = 'create';
			this.editMoodId = null;
			this.sourceMoodType = MOOD_CONTENT_TYPE.TEXT;
		},

		async handlePublish() {
			if (this.publishing) return;

			if (this.inputMode === 'text' && !this.content.trim()) {
				uni.showToast({ title: '请先输入发布内容', icon: 'none' });
				return;
			}
			if (this.inputMode === 'voice' && this.isRecording) {
				uni.showToast({ title: '请先结束录音', icon: 'none' });
				return;
			}
			if (this.inputMode === 'voice' && this.isTranscribing) {
				uni.showToast({ title: '语音转写中，请稍候', icon: 'none' });
				return;
			}

			const violations = detectViolationWords(this.displayContent);
			if (violations.length) {
				uni.showToast({
					title: `内容包含违规词：${violations.join('、')}`,
					icon: 'none'
				});
				return;
			}

			if (
				this.inputMode === 'voice' &&
				this.voicePublishMode === 'voice' &&
				!this.hasVoiceAudioAsset
			) {
				uni.showToast({ title: '请先完成语音录制', icon: 'none' });
				return;
			}

			if (this.inputMode === 'voice' && !this.publishTextContent) {
				uni.showToast({ title: '请先完成语音转写或手动补充文字', icon: 'none' });
				return;
			}

			this.publishing = true;
			try {
				if (this.enableVideo && !this.previewMoodId) {
					const hasQuota = await this.refreshVideoQuotaForAction();
					if (!hasQuota) {
						return;
					}
				}

				if (this.isEditingExistingMood) {
					const targetUrl = this.getSubmitSuccessTarget();
					await this.saveExistingMoodChanges({ loadingText: '保存中...' });

					if (this.enableVideo && this.launchScene === 'convertVideo') {
						await generateVideo({ moodId: this.editMoodId }, { loadingText: '提交视频生成...' });
						await this.fetchVideoQuota({ loading: false, silent: true });
						this.resetForm();
						uni.showToast({ title: '视频生成已提交', icon: 'success' });
						setTimeout(() => {
							uni.switchTab({ url: targetUrl });
						}, 500);
						return;
					}

					this.resetForm();
					uni.showToast({ title: '保存成功', icon: 'success' });
					setTimeout(() => {
						uni.switchTab({ url: targetUrl });
					}, 500);
					return;
				}

				const payload = await this.buildPublishPayload();
				await publishMood(payload);
				this.resetForm();
				await this.fetchVideoQuota({ loading: false, silent: true });
				uni.showToast({ title: '发布成功', icon: 'success' });
				setTimeout(() => {
					uni.switchTab({ url: this.getSubmitSuccessTarget() });
				}, 500);
			} catch (e) {
				console.error('发布失败', e);
			} finally {
				this.publishing = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.header-inner {
	height: 104rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 0 24rpx;
}

.header-back {
	position: absolute;
	left: 16rpx;
	display: flex;
	align-items: center;
	padding: 8rpx;
}

.back-icon {
	font-size: 48rpx;
	color: #57465b;
	line-height: 1;
}

.tab-emoji {
	font-size: 28rpx;
}

.video-gen-emoji {
	font-size: 56rpx;
}

.page-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #57465b;
}

.header-right {
	position: absolute;
	right: 16rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.draft-btn {
	padding: 10rpx 20rpx;
	border-radius: 36rpx;
	border: 1rpx solid #ccd3ff;
	background: #fffefe;
}

.draft-btn text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.header-publish-btn {
	padding: 10rpx 28rpx;
	border-radius: 40rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
}

.header-publish-btn text {
	font-size: 26rpx;
	color: #ffffff;
	font-weight: 500;
}

.header-publish-btn.disabled {
	opacity: 0.4;
}

.content-flex {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}

.publish-form {
	padding: 32rpx;
}

.form-section {
	margin-bottom: 32rpx;
}

.form-label {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #57465b;
	margin-bottom: 20rpx;
}

.input-tabs {
	display: flex;
	background: #f0f0f0;
	border-radius: 20rpx;
	padding: 6rpx;
}

.input-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 16rpx 0;
	border-radius: 16rpx;
	font-size: 28rpx;
	color: #7d6e81;
}

.input-tab.active {
	background: #fffefe;
	color: #8f6fb0;
	font-weight: 600;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.08);
}

.content-input {
	width: 100%;
	min-height: 280rpx;
	padding: 28rpx;
	border: 1rpx solid #eee4ef;
	border-radius: 24rpx;
	font-size: 30rpx;
	line-height: 1.6;
	background: #fffefe;
	box-sizing: border-box;
}

.tag-input {
	width: 100%;
	height: 80rpx;
	padding: 0 24rpx;
	border: 1rpx solid #e6e6e6;
	border-radius: 20rpx;
	font-size: 28rpx;
	background: #fffefe;
	box-sizing: border-box;
}

.char-count {
	text-align: right;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9f92a2;
}

.char-count .warning {
	color: #ff4d4f;
}

.voice-form-section {
	margin-bottom: 32rpx;
}

.voice-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 24rpx;
	text-align: center;
}

.voice-btn-wrap {
	position: relative;
	width: 200rpx;
	height: 200rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 24rpx;
}

.voice-pulse-ring {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 160rpx;
	height: 160rpx;
	margin-left: -80rpx;
	margin-top: -80rpx;
	border-radius: 50%;
	background: rgba(255, 71, 87, 0.25);
	pointer-events: none;
}

.voice-pulse-ring-1 {
	animation: voice-pulse-outer 1.5s ease-out infinite;
}

.voice-pulse-ring-2 {
	animation: voice-pulse-outer 1.5s ease-out 0.75s infinite;
}

@keyframes voice-pulse-outer {
	0% {
		transform: scale(1);
		opacity: 0.55;
	}

	70% {
		transform: scale(1.45);
		opacity: 0;
	}

	100% {
		transform: scale(1.45);
		opacity: 0;
	}
}

.voice-btn {
	position: relative;
	z-index: 2;
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.3s ease;
}

.voice-btn.recording {
	background: #ea6f88;
	animation: voice-btn-pulse 1.5s ease-out infinite;
}

@keyframes voice-btn-pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.45);
	}

	70% {
		box-shadow: 0 0 0 28rpx rgba(255, 71, 87, 0);
	}

	100% {
		box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
	}
}

.voice-tip {
	display: block;
	font-size: 26rpx;
	color: #9f92a2;
	line-height: 1.5;
}

.voice-saved-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	margin-top: 16rpx;
	padding: 12rpx 24rpx;
	border-radius: 32rpx;
	background: rgba(143, 111, 176, 0.12);
}

.voice-saved-icon {
	font-size: 28rpx;
	color: #8f6fb0;
	font-weight: 700;
}

.voice-saved-text {
	font-size: 26rpx;
	color: #8f6fb0;
}

.voice-actions-panel {
	width: 100%;
	margin-top: 8rpx;
}

.voice-publish-mode {
	margin-top: 24rpx;
	display: flex;
	flex-direction: row;
	justify-content: center;
	gap: 16rpx;
	width: 100%;
}

.voice-mode-btn {
	padding: 12rpx 24rpx;
	border: 1rpx solid #d3dcff;
	border-radius: 32rpx;
	background: #fffefe;
}

.voice-mode-btn text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.voice-mode-btn.active {
	border-color: #8f6fb0;
	background: #f1ebf6;
}

.voice-mode-btn.is-disabled {
	opacity: 0.45;
}

.voice-rerecord-btn {
	margin-top: 16rpx;
	padding: 8rpx 0;
}

.voice-rerecord-btn text {
	font-size: 26rpx;
	color: #8f6fb0;
	text-decoration: underline;
}

.voice-result {
	margin-top: 24rpx;
	width: 100%;
	background: #f8f9fa;
	border-radius: 20rpx;
	padding: 24rpx;
	box-sizing: border-box;
}

.voice-result-label {
	display: block;
	font-size: 24rpx;
	color: #9f92a2;
	margin-bottom: 12rpx;
}

.voice-result-text {
	font-size: 28rpx;
	color: #57465b;
	line-height: 1.6;
}

.voice-transcribe-input {
	width: 100%;
	min-height: 156rpx;
	border: 1rpx solid #e2e7ff;
	border-radius: 20rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.voice-transcribe-btn {
	margin-top: 20rpx;
	padding: 12rpx 28rpx;
	border: 1rpx solid #d3dcff;
	border-radius: 32rpx;
	background: #fffefe;
	align-self: center;
}

.voice-transcribe-btn text {
	font-size: 24rpx;
	color: #8f6fb0;
	line-height: 1.4;
}

.voice-transcribe-btn.disabled {
	opacity: 0.6;
}

.voice-transcribe-note {
	display: block;
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #7c86ba;
	line-height: 1.5;
	text-align: center;
}

.voice-char-count {
	width: 100%;
	text-align: right;
}

.voice-error-tip {
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #ff4d4f;
}

.voice-audio-actions {
	margin-top: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	gap: 16rpx;
}

.voice-audio-play-btn {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 12rpx 24rpx;
	border: 1rpx solid #e8deff;
	border-radius: 36rpx;
	background: #f9f5ff;
}

.voice-audio-play-btn text {
	font-size: 26rpx;
	color: #8f6fb0;
}

.voice-audio-play-btn.is-disabled {
	opacity: 0.45;
}

.voice-audio-delete-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12rpx 24rpx;
	border: 1rpx solid #f5d0d6;
	border-radius: 36rpx;
	background: #fff7f8;
}

.voice-audio-delete-btn text {
	font-size: 26rpx;
	color: #ea6f88;
}

.video-gen-card {
	display: flex;
	align-items: center;
	background: #fffefe;
	border-radius: 24rpx;
	padding: 28rpx;
	border: 1rpx solid #eee4ef;
}

.video-gen-icon {
	margin-right: 24rpx;
	flex-shrink: 0;
}

.video-gen-info {
	flex: 1;
	min-width: 0;
}

.video-gen-title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
}

.video-gen-desc {
	display: block;
	font-size: 24rpx;
	color: #9f92a2;
	margin-top: 4rpx;
}

.video-gen-switch {
	margin-left: 16rpx;
	flex-shrink: 0;
}

.switch {
	width: 88rpx;
	height: 48rpx;
	border-radius: 24rpx;
	background: #dddddd;
	position: relative;
	transition: background 0.3s;
}

.switch.on {
	background: #8f6fb0;
}

.switch.disabled {
	opacity: 0.45;
}

.switch-thumb {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #fffefe;
	position: absolute;
	top: 4rpx;
	left: 4rpx;
	transition: left 0.3s;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
}

.switch.on .switch-thumb {
	left: 44rpx;
}

.video-quota-tip {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #8f6fb0;
	line-height: 1.5;
}
</style>
