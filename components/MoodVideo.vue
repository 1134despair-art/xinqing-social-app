<template>
	<view class="mood-video-wrap" :style="wrapStyle">
		<view :id="hostId" class="mood-video" :class="{ 'is-playing': isActive && isDomEngine && !regionFullscreen }">
			<image v-if="displayPoster" class="mood-video__poster" :src="displayPoster" mode="aspectFill" />
			<view v-else class="mood-video__poster mood-video__poster--placeholder" :class="{ 'is-loading': posterLoading }">
				<text class="mood-video__placeholder-text">{{ posterLoading ? '封面生成中' : '视频' }}</text>
			</view>

			<!-- 播放中隐藏按钮；安卓滑动隐藏原生层时仍露出封面跟手 -->
			<view v-if="!isActive" class="mood-video__mask">
				<view class="mood-video__play-btn">
					<text class="mood-video__play-icon">▶</text>
				</view>
			</view>

			<!-- 独立热区，保证安卓 scroll-view 内可点（只用 tap，避免 click 二次触发） -->
			<view v-if="!isActive" class="mood-video__hit" hover-class="mood-video__hit--hover" @tap.stop="handleTap" />

			<!-- 浮层按钮：不占文档流；原生层盖不住时仍可点关闭 -->
			<!-- <view v-if="isActive && !regionFullscreen && isDomEngine" class="mood-video__float-bar">
				<view class="mood-video__float-btn" @tap.stop="enterRegionFullscreen">
					<text>全屏</text>
				</view>
				<view class="mood-video__float-btn mood-video__float-btn--muted" @tap.stop="stopPlayback">
					<text>关闭</text>
				</view>
			</view> -->

			<!-- 仅 iOS：renderjs DOM video -->
			<MoodVideoDomHost v-if="isDomEngine" :cmd="domCmd" @ended="onDomEnded" @error="onDomError"
				@fullscreen="enterRegionFullscreen" @close="stopPlayback" />
		</view>
	</view>
</template>

<script>
import {
	clipMoodVideoRect,
	closeMoodVideo,
	getMoodVideoEngine,
	getMoodVideoRegionFullscreenRect,
	openMoodVideo,
	setMoodVideoRectSyncHandler,
	setMoodVideoRegionFullscreen,
	shouldAndroidUseRegionFullscreen,
	subscribeMoodVideo,
	updateMoodVideoRect
} from '@/utils/moodVideoPortal';
import {
	isAndroidNativeVideoOpen,
	openAndroidNativeVideo,
	requestAndroidNativeVideoFullScreen
} from '@/utils/androidNativeVideo';
import { resolveVideoPoster } from '@/utils/videoPoster';
import MoodVideoDomHost from '@/components/MoodVideoDomHost.vue';

let moodVideoSeq = 0;

export default {
	name: 'MoodVideo',
	components: { MoodVideoDomHost },
	props: {
		src: {
			type: String,
			default: ''
		},
		poster: {
			type: String,
			default: ''
		},
		height: {
			type: String,
			default: '400rpx'
		},
		moodId: {
			type: [Number, String],
			default: ''
		},
		title: {
			type: String,
			default: ''
		},
		autoPoster: {
			type: Boolean,
			default: true
		}
	},
	data() {
		const seq = ++moodVideoSeq;
		return {
			hostId: `mood-video-host-${Date.now()}-${seq}`,
			anchorKey: `mood-video-${Date.now()}-${seq}`,
			engine: getMoodVideoEngine(),
			resolvedPoster: '',
			posterLoading: false,
			posterRequestId: 0,
			isActive: false,
			regionFullscreen: false,
			unsubscribe: null,
			syncTimer: null,
			reportingRect: false,
			clearRectSyncHandler: null,
			_tapLock: false,
			domCmd: {
				token: 0,
				action: 'idle',
				src: '',
				poster: '',
				hostId: ''
			}
		};
	},
	computed: {
		posterSrc() {
			return String(this.poster || '').trim();
		},
		displayPoster() {
			return this.posterSrc || this.resolvedPoster;
		},
		wrapStyle() {
			return { height: this.height };
		},
		isDomEngine() {
			return this.engine === 'dom';
		},
		isAndroidEngine() {
			return this.engine === 'android-native';
		}
	},
	watch: {
		src: {
			immediate: true,
			handler() {
				this.syncPoster();
			}
		},
		poster: {
			immediate: true,
			handler() {
				this.syncPoster();
			}
		},
		autoPoster() {
			this.syncPoster();
		}
	},
	mounted() {
		this.engine = this.resolveEngine();
		this.unsubscribe = subscribeMoodVideo((payload) => {
			const active = Boolean(payload && payload.anchorKey === this.anchorKey);
			const regionFs = Boolean(payload && payload.regionFullscreen);

			if (active !== this.isActive) {
				this.isActive = active;
				this.regionFullscreen = regionFs;
				if (active) {
					this.onBecomeActive(payload);
				} else {
					this.onBecomeInactive();
				}
				return;
			}

			if (active && regionFs !== this.regionFullscreen) {
				this.regionFullscreen = regionFs;
				this.onRegionFullscreenChange(payload);
			}
		});
	},
	beforeUnmount() {
		this.posterRequestId += 1;
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		const wasActive = this.isActive;
		this.onBecomeInactive();
		if (wasActive) {
			closeMoodVideo();
		}
	},
	methods: {
		resolveEngine() {
			const engine = getMoodVideoEngine();
			try {
				const sys = uni.getSystemInfoSync() || {};
				const platform = String(sys.platform || sys.osName || '').toLowerCase();
				if (platform === 'android') return 'android-native';
				if (
					typeof plus !== 'undefined' &&
					plus.os &&
					String(plus.os.name || '').toLowerCase().indexOf('android') !== -1
				) {
					return 'android-native';
				}
			} catch (e) {
				/* ignore */
			}
			return engine;
		},
		syncPoster() {
			this.posterRequestId += 1;
			const requestId = this.posterRequestId;

			if (this.posterSrc) {
				this.resolvedPoster = '';
				this.posterLoading = false;
				return;
			}

			if (!this.autoPoster || !this.src) {
				this.resolvedPoster = '';
				this.posterLoading = false;
				return;
			}

			this.posterLoading = true;
			resolveVideoPoster(this.src)
				.then((poster) => {
					if (requestId !== this.posterRequestId) return;
					this.resolvedPoster = poster || '';
				})
				.finally(() => {
					if (requestId !== this.posterRequestId) return;
					this.posterLoading = false;
				});
		},
		measureRect() {
			return new Promise((resolve) => {
				let settled = false;
				const done = (rect) => {
					if (settled) return;
					settled = true;
					clearTimeout(timer);
					if (rect && Number(rect.width) > 2 && Number(rect.height) > 2) {
						resolve(rect);
						return;
					}
					resolve(null);
				};
				const timer = setTimeout(() => done(null), 280);
				try {
					uni.createSelectorQuery()
						.in(this)
						.select(`#${this.hostId}`)
						.boundingClientRect((rect) => done(rect))
						.exec();
				} catch (e) {
					done(null);
				}
				try {
					uni.createSelectorQuery()
						.select(`#${this.hostId}`)
						.boundingClientRect((rect) => done(rect))
						.exec();
				} catch (e) {
					/* ignore */
				}
			});
		},
		fallbackAndroidRect() {
			try {
				const sys = uni.getSystemInfoSync() || {};
				const width = Number(sys.windowWidth) || 375;
				const height = Number(sys.windowHeight) || 667;
				const top = Math.round(height * 0.22);
				const h = Math.round(Math.min(width * 0.56, height * 0.4));
				return {
					top,
					left: 16,
					width: Math.max(120, width - 32),
					height: Math.max(160, h),
					right: 16 + Math.max(120, width - 32),
					bottom: top + Math.max(160, h)
				};
			} catch (e) {
				return { top: 200, left: 16, width: 340, height: 180 };
			}
		},
		async reportRect() {
			if (!this.isActive || this.regionFullscreen || this.reportingRect) return;
			this.reportingRect = true;
			try {
				const rect = await this.measureRect();
				if (!this.isActive || this.regionFullscreen) return;
				if (rect) updateMoodVideoRect(rect);
			} finally {
				this.reportingRect = false;
			}
		},
		startRectSync() {
			this.stopRectSync();
			this.clearRectSyncHandler = setMoodVideoRectSyncHandler(() => {
				this.reportRect();
			});
			// 安卓跟手以「滑动隐藏 + 停稳测量」为主，低频兜底即可
			this.syncTimer = setTimeout(() => {
				this.syncTimer = null;
				if (!this.isActive || this.regionFullscreen) return;
				this.reportRect();
				this.syncTimer = setInterval(() => {
					this.reportRect();
				}, 200);
			}, 280);
		},
		stopRectSync() {
			if (this.syncTimer) {
				clearTimeout(this.syncTimer);
				clearInterval(this.syncTimer);
				this.syncTimer = null;
			}
			if (typeof this.clearRectSyncHandler === 'function') {
				this.clearRectSyncHandler();
				this.clearRectSyncHandler = null;
			}
		},
		emitDomCmd(action, payload = {}) {
			this.domCmd = {
				token: Date.now(),
				action,
				src: payload.src || '',
				poster: payload.poster || '',
				hostId: this.hostId
			};
		},
		playInlineDom(payload) {
			this.emitDomCmd('play', {
				src: (payload && payload.src) || this.src,
				poster: (payload && payload.poster) || this.displayPoster
			});
		},
		onBecomeActive(payload) {
			if (payload && payload.regionFullscreen) {
				this.stopRectSync();
				if (this.isDomEngine) this.emitDomCmd('stop');
				return;
			}
			if (this.isDomEngine) {
				this.playInlineDom(payload);
				return;
			}
			this.$nextTick(() => {
				if (!this.isActive || this.regionFullscreen) return;
				// 安卓：点击时已 open 原生播放器，这里只负责跟手
				this.startRectSync();
			});
		},
		onBecomeInactive() {
			this.stopRectSync();
			if (this.isDomEngine) {
				this.emitDomCmd('stop');
			}
			this.isActive = false;
			this.regionFullscreen = false;
		},
		onRegionFullscreenChange(payload) {
			if (this.regionFullscreen) {
				this.stopRectSync();
				if (this.isDomEngine) this.emitDomCmd('stop');
				return;
			}
			if (this.isDomEngine) {
				this.playInlineDom(payload);
			} else {
				this.startRectSync();
			}
		},
		enterRegionFullscreen() {
			if (this.isAndroidEngine) {
				const ok = requestAndroidNativeVideoFullScreen();
				if (ok) return;
			}
			if (!this.isActive) {
				uni.showToast({ title: '请先播放视频', icon: 'none' });
				return;
			}
			setMoodVideoRegionFullscreen(true);
		},
		stopPlayback() {
			closeMoodVideo();
		},
		onDomEnded() {
			closeMoodVideo();
		},
		onDomError() {
			uni.showToast({ title: '视频播放失败', icon: 'none' });
			closeMoodVideo();
		},
		async handleTap() {
			if (this._tapLock) return;
			this._tapLock = true;
			setTimeout(() => {
				this._tapLock = false;
			}, 500);

			if (!this.src) {
				uni.showToast({ title: '视频暂不可用', icon: 'none' });
				return;
			}
			if (this.isActive) {
				if (this.isAndroidEngine && !isAndroidNativeVideoOpen()) {
					closeMoodVideo();
				} else {
					return;
				}
			}

			const engine = this.resolveEngine();
			this.engine = engine;
			let rect = await this.measureRect();
			let regionFullscreen = false;
			if (engine === 'android-native') {
				rect = rect || this.fallbackAndroidRect();
				// 列表底部会被 tabBar 挡住：裁切；裁后过小则直接区域内全屏
				if (shouldAndroidUseRegionFullscreen(rect)) {
					regionFullscreen = true;
					rect = getMoodVideoRegionFullscreenRect();
				} else {
					const clipped = clipMoodVideoRect(rect);
					rect = clipped.rect;
					if (!rect) {
						uni.showToast({ title: '请上滑后播放', icon: 'none' });
						return;
					}
				}
				const ok = openAndroidNativeVideo({
					src: this.src,
					poster: this.displayPoster,
					rect
				});
				if (!ok) {
					uni.showToast({ title: '视频播放失败', icon: 'none' });
					return;
				}
			}

			openMoodVideo({
				src: this.src,
				poster: this.displayPoster,
				moodId: this.moodId,
				title: this.title,
				anchorKey: this.anchorKey,
				engine,
				rect,
				regionFullscreen
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.mood-video-wrap {
	width: 100%;
	position: relative;
}

.mood-video {
	width: 100%;
	height: 100%;
	position: relative;
	border-radius: 20rpx;
	overflow: hidden;
	background: #1a1a1a;
}

.mood-video.is-playing {
	background: #000000;
}

.mood-video__poster {
	width: 100%;
	height: 100%;
	display: block;
	pointer-events: none;
}

.mood-video.is-playing .mood-video__poster {
	opacity: 0;
}

.mood-video__poster--placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #2a2438 0%, #4a3f63 100%);
	pointer-events: none;
}

.mood-video__poster--placeholder.is-loading {
	background: linear-gradient(135deg, #2f2940 0%, #3f3658 50%, #2f2940 100%);
	background-size: 200% 100%;
	animation: mood-video-poster-loading 1.4s ease infinite;
}

@keyframes mood-video-poster-loading {
	0% {
		background-position: 100% 0;
	}

	100% {
		background-position: -100% 0;
	}
}

.mood-video__placeholder-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.72);
}

.mood-video__mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.18);
	pointer-events: none;
}

.mood-video__play-btn {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.92);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.24);
}

.mood-video__play-icon {
	margin-left: 8rpx;
	font-size: 36rpx;
	line-height: 1;
	color: #8f6fb0;
	font-weight: 700;
}

.mood-video__hit {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 6;
	background: rgba(0, 0, 0, 0.01);
}

.mood-video__hit--hover {
	background: rgba(255, 255, 255, 0.06);
}

.mood-video__float-bar {
	position: absolute;
	top: 12rpx;
	right: 12rpx;
	left: 12rpx;
	z-index: 30;
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
	gap: 12rpx;
	pointer-events: none;
}

.mood-video__float-btn {
	pointer-events: auto;
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(0, 0, 0, 0.55);
	border: 1px solid rgba(255, 255, 255, 0.28);
}

.mood-video__float-btn text {
	font-size: 24rpx;
	color: #ffffff;
	line-height: 1.2;
}

.mood-video__float-btn--muted {
	background: rgba(0, 0, 0, 0.4);
}
</style>
