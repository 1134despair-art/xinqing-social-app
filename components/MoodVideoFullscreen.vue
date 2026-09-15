<template>
	<!-- 不用 0x0 裁切容器，避免 iOS fixed 全屏层被吃掉 -->
	<view class="mood-video-fullscreen-root">
		<!-- Android 区域内全屏：关闭条；画面由 plus.video 铺满 -->
		<view
			v-if="showAndroidRegionChrome"
			class="mood-video-region mood-video-region--chrome"
			@touchmove.stop.prevent
		>
			<view class="mood-video-region__close" @tap.stop="exitRegionFullscreen">
				<text class="mood-video-region__close-icon">✕</text>
			</view>
		</view>

		<!-- iOS 区域内全屏：本组件内 renderjs，避免子组件挂载时序丢 play -->
		<view
			v-if="showDomRegionLayer"
			:id="regionHostId"
			class="mood-video-region"
			:region-cmd="regionCmd"
			:change:region-cmd="regionDomPlayer.onCmdChange"
			@touchmove.stop.prevent
			@tap.stop
		>
			<view class="mood-video-region__close" @tap.stop="exitRegionFullscreen">
				<text class="mood-video-region__close-icon">✕</text>
			</view>
		</view>
	</view>
</template>

<script>
import {
	closeAndroidNativeVideo,
	getAndroidNativeVideoSrc,
	isAndroidNativeVideoOpen,
	openAndroidNativeVideo,
	updateAndroidNativeVideoRect
} from '@/utils/androidNativeVideo';
import {
	closeMoodVideo,
	setMoodVideoRegionFullscreen,
	subscribeMoodVideo
} from '@/utils/moodVideoPortal';

export default {
	name: 'MoodVideoFullscreen',
	data() {
		return {
			active: null,
			unsubscribe: null,
			regionHostId: `mood-video-region-host-${Date.now()}`,
			regionCmd: {
				token: 0,
				action: 'idle',
				src: '',
				poster: '',
				hostId: ''
			},
			playTimer: null
		};
	},
	computed: {
		showAndroidRegionChrome() {
			return Boolean(
				this.active &&
					this.active.regionFullscreen &&
					this.active.engine === 'android-native'
			);
		},
		showDomRegionLayer() {
			return Boolean(
				this.active && this.active.regionFullscreen && this.active.engine === 'dom'
			);
		}
	},
	mounted() {
		this.unsubscribe = subscribeMoodVideo((payload) => {
			this.applyPayload(payload);
		});
	},
	beforeUnmount() {
		if (this.playTimer) {
			clearTimeout(this.playTimer);
			this.playTimer = null;
		}
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		this.emitRegionCmd('stop');
		closeAndroidNativeVideo();
	},
	methods: {
		sameSource(a, b) {
			if (!a || !b) return false;
			return a.anchorKey === b.anchorKey && a.src === b.src;
		},
		emitRegionCmd(action, payload = {}) {
			this.regionCmd = {
				token: Date.now(),
				action,
				src: payload.src || '',
				poster: payload.poster || '',
				hostId: this.regionHostId
			};
		},
		scheduleDomPlay(payload) {
			if (this.playTimer) {
				clearTimeout(this.playTimer);
				this.playTimer = null;
			}
			// 等全屏层真正挂到 DOM 后再发 play，避免 getElementById 失败
			this.$nextTick(() => {
				this.playTimer = setTimeout(() => {
					this.playTimer = null;
					if (!this.active || !this.active.regionFullscreen) return;
					this.emitRegionCmd('play', {
						src: payload.src,
						poster: payload.poster
					});
				}, 48);
			});
		},
		exitRegionFullscreen() {
			setMoodVideoRegionFullscreen(false);
		},
		onRegionDomEnded() {
			closeMoodVideo();
		},
		onRegionDomError() {
			uni.showToast({ title: '视频播放失败', icon: 'none' });
			closeMoodVideo();
		},
		applyPayload(payload) {
			const prev = this.active;
			this.active = payload;

			if (!payload) {
				this.emitRegionCmd('stop');
				closeAndroidNativeVideo();
				return;
			}

			const regionFs = Boolean(payload.regionFullscreen);

			if (payload.engine === 'android-native') {
				this.emitRegionCmd('stop');
				this.applyAndroid(payload, prev);
				return;
			}

			if (regionFs) {
				closeAndroidNativeVideo();
				this.scheduleDomPlay(payload);
				return;
			}

			this.emitRegionCmd('stop');
		},
		applyAndroid(payload, prev) {
			if (!payload.rect) {
				if (payload.regionFullscreen) {
					uni.showToast({ title: '视频区域无效', icon: 'none' });
					closeMoodVideo();
				}
				return;
			}

			const enteringRegionFs =
				payload.regionFullscreen && !(prev && prev.regionFullscreen);
			const sameSrc =
				this.sameSource(prev, payload) ||
				getAndroidNativeVideoSrc() === payload.src;

			if (enteringRegionFs) {
				// 点击底部视频时可能已按全屏 rect 打开，避免再 close+重建
				if (isAndroidNativeVideoOpen() && sameSrc) {
					updateAndroidNativeVideoRect(payload.rect);
					return;
				}
				const ok = openAndroidNativeVideo({
					src: payload.src,
					poster: payload.poster,
					rect: payload.rect
				});
				if (!ok) {
					uni.showToast({ title: '全屏失败', icon: 'none' });
					closeMoodVideo();
				}
				return;
			}

			// 列表态：点击时 MoodVideo 已创建播放器，这里只跟手，避免 close+重建导致黑屏
			if (isAndroidNativeVideoOpen()) {
				if (sameSrc || getAndroidNativeVideoSrc() === payload.src) {
					updateAndroidNativeVideoRect(payload.rect);
					return;
				}
			}

			const ok = openAndroidNativeVideo({
				src: payload.src,
				poster: payload.poster,
				rect: payload.rect
			});
			if (!ok) {
				uni.showToast({ title: '视频播放失败', icon: 'none' });
				closeMoodVideo();
			}
		}
	}
};
</script>

<script module="regionDomPlayer" lang="renderjs">
export default {
	data() {
		return {
			videoEl: null,
			detachControls: null,
			controlsLoading: null
		};
	},
	methods: {
		onCmdChange(cmd) {
			if (!cmd || !cmd.action) return;
			if (cmd.action === 'play') {
				this.play(cmd);
				return;
			}
			if (cmd.action === 'stop') {
				this.destroy();
			}
		},
		resolveHost(hostId) {
			if (typeof document === 'undefined') return null;
			if (hostId) {
				const byId = document.getElementById(hostId);
				if (byId) return byId;
			}
			// 兜底：按 class 找全屏层
			return document.querySelector('.mood-video-region');
		},
		ensureControls(cb) {
			if (typeof window !== 'undefined' && typeof window.__attachMoodVideoDomControls === 'function') {
				cb(window.__attachMoodVideoDomControls);
				return;
			}
			if (this.controlsLoading) {
				this.controlsLoading.then(() => {
					cb(window.__attachMoodVideoDomControls);
				});
				return;
			}
			this.controlsLoading = new Promise((resolve) => {
				const script = document.createElement('script');
				script.src = './static/mood-video-dom-controls.js';
				script.onload = () => resolve();
				script.onerror = () => resolve();
				document.head.appendChild(script);
			});
			this.controlsLoading.then(() => {
				cb(window.__attachMoodVideoDomControls);
			});
		},
		play(cmd) {
			const tryPlay = (attempt) => {
				const host = this.resolveHost(cmd.hostId);
				if (!host || !cmd.src) {
					if (attempt < 5) {
						setTimeout(() => tryPlay(attempt + 1), 40);
					}
					return;
				}

				let video = this.videoEl;
				if (!video || !host.contains(video)) {
					this.destroy();
					video = document.createElement('video');
					video.setAttribute('playsinline', 'true');
					video.setAttribute('webkit-playsinline', 'true');
					video.setAttribute('x5-playsinline', 'true');
					video.setAttribute('preload', 'auto');
					video.controls = false;
					video.autoplay = true;
					video.style.cssText = [
						'position:absolute',
						'left:0',
						'top:0',
						'width:100%',
						'height:100%',
						'object-fit:cover',
						'background:#000',
						'z-index:1',
						'border:0',
						'outline:none'
					].join(';');
					video.addEventListener('ended', () => {
						this.$ownerInstance.callMethod('onRegionDomEnded');
					});
					video.addEventListener('error', () => {
						this.$ownerInstance.callMethod('onRegionDomError');
					});
					host.appendChild(video);
					this.videoEl = video;
					this.ensureControls((attach) => {
						if (this.videoEl !== video || typeof attach !== 'function') return;
						this.detachControls = attach(video, host, {
							onFullscreen: () => {
								// 已在区域内全屏，再次点击可关闭
								this.$ownerInstance.callMethod('exitRegionFullscreen');
							},
							onClose: () => {
								this.$ownerInstance.callMethod('exitRegionFullscreen');
							}
						});
					});
				}

				if (cmd.poster) video.poster = cmd.poster;
				if (video.getAttribute('src') !== cmd.src) {
					video.src = cmd.src;
				}
				const playPromise = video.play();
				if (playPromise && typeof playPromise.catch === 'function') {
					playPromise.catch(() => {});
				}
			};
			tryPlay(0);
		},
		destroy() {
			if (typeof this.detachControls === 'function') {
				this.detachControls();
				this.detachControls = null;
			}
			const video = this.videoEl;
			this.videoEl = null;
			if (!video) return;
			try {
				video.pause();
				video.removeAttribute('src');
				video.load();
			} catch (e) {
				/* ignore */
			}
			if (video.parentNode) {
				video.parentNode.removeChild(video);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.mood-video-fullscreen-root {
	position: fixed;
	left: 0;
	top: 0;
	width: 0;
	height: 0;
	z-index: 10060;
	overflow: visible;
	pointer-events: none;
}

.mood-video-region {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 10060;
	width: 100%;
	height: 100%;
	background: #000000;
	pointer-events: auto;
}

.mood-video-region--chrome {
	background: transparent;
	pointer-events: none;
}

.mood-video-region__close {
	position: absolute;
	top: calc(env(safe-area-inset-top) + 16rpx);
	right: 24rpx;
	z-index: 2;
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.16);
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
}

.mood-video-region__close-icon {
	font-size: 32rpx;
	color: #ffffff;
	line-height: 1;
}
</style>
