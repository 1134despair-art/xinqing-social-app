<template>
	<!-- 仅作 renderjs 通信桥；真实 video 挂到父级 hostId 节点 -->
	<view
		class="mood-video-dom-bridge"
		:owner-cmd="cmd"
		:change:owner-cmd="domPlayer.onCmdChange"
	/>
</template>

<script>
/**
 * iOS / DOM 引擎专用。Android 不要挂载本组件（避免 :change 触发 setAttr 报错）。
 */
export default {
	name: 'MoodVideoDomHost',
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
	emits: ['ended', 'error', 'fullscreen', 'close'],
	methods: {
		onDomEnded() {
			this.$emit('ended');
		},
		onDomError() {
			this.$emit('error');
		},
		onControlsFullscreen() {
			this.$emit('fullscreen');
		},
		onControlsClose() {
			this.$emit('close');
		}
	}
};
</script>

<script module="domPlayer" lang="renderjs">
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
					'z-index:3',
					'border:0',
					'outline:none'
				].join(';');
				video.addEventListener('ended', () => {
					this.$ownerInstance.callMethod('onDomEnded');
				});
				video.addEventListener('error', () => {
					this.$ownerInstance.callMethod('onDomError');
				});
				host.appendChild(video);
				this.videoEl = video;
				this.ensureControls((attach) => {
					if (this.videoEl !== video || typeof attach !== 'function') return;
					this.detachControls = attach(video, host, {
						onFullscreen: () => {
							this.$ownerInstance.callMethod('onControlsFullscreen');
						},
						onClose: () => {
							this.$ownerInstance.callMethod('onControlsClose');
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
.mood-video-dom-bridge {
	position: absolute;
	width: 0;
	height: 0;
	overflow: hidden;
	pointer-events: none;
	opacity: 0;
}
</style>
