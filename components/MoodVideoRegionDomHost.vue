<template>
	<view
		:id="hostId"
		class="mood-video-region"
		:owner-cmd="bridgeCmd"
		:change:owner-cmd="regionDomPlayer.onCmdChange"
		@touchmove.stop.prevent
		@click.stop
	>
		<view class="mood-video-region__close" @click.stop="$emit('close')">
			<text class="mood-video-region__close-icon">✕</text>
		</view>
	</view>
</template>

<script>
/**
 * iOS 区域内全屏 DOM 播放。Android 不要挂载。
 */
export default {
	name: 'MoodVideoRegionDomHost',
	props: {
		cmd: {
			type: Object,
			default: () => ({
				token: 0,
				action: 'idle',
				src: '',
				poster: '',
				hostId: ''
			})
		}
	},
	emits: ['close', 'ended', 'error'],
	data() {
		return {
			hostId: `mood-video-region-dom-${Date.now()}`
		};
	},
	computed: {
		bridgeCmd() {
			return {
				...this.cmd,
				hostId: this.hostId
			};
		}
	},
	methods: {
		onRegionDomEnded() {
			this.$emit('ended');
		},
		onRegionDomError() {
			this.$emit('error');
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
			if (!hostId || typeof document === 'undefined') return null;
			return document.getElementById(hostId);
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
			const host = this.resolveHost(cmd.hostId);
			if (!host || !cmd.src) return;

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
					this.detachControls = attach(video, host);
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
