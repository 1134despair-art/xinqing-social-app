<template>
	<view v-if="src" class="voice-player" :class="{ 'voice-player--playing': isPlaying }" @click.stop="togglePlay">
		<view class="voice-player__button">
			<text class="voice-player__icon">{{ isPlaying ? '||' : '▶' }}</text>
		</view>
		<view class="voice-player__meta">
			<text class="voice-player__title">{{ isPlaying ? '暂停语音' : '播放语音' }}</text>
			<text class="voice-player__desc">{{ durationText }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'VoicePlayer',
	props: {
		src: {
			type: String,
			default: ''
		},
		duration: {
			type: [Number, String],
			default: 0
		}
	},
	data() {
		return {
			innerAudioContext: null,
			isPlaying: false
		};
	},
	computed: {
		durationText() {
			const totalSeconds = Math.max(0, Number(this.duration) || 0);
			if (!totalSeconds) return '点击收听';
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
		}
	},
	watch: {
		src() {
			this.stopAudio();
		}
	},
	created() {
		this.innerAudioContext = uni.createInnerAudioContext();
		this.innerAudioContext.onEnded(() => {
			this.isPlaying = false;
		});
		this.innerAudioContext.onStop(() => {
			this.isPlaying = false;
		});
		this.innerAudioContext.onError(() => {
			this.isPlaying = false;
			uni.showToast({ title: '语音播放失败', icon: 'none' });
		});
	},
	beforeUnmount() {
		this.destroyAudio();
	},
	onUnload() {
		this.destroyAudio();
	},
	methods: {
		togglePlay() {
			if (!this.src) return;
			if (!this.innerAudioContext) return;
			if (this.isPlaying) {
				this.stopAudio();
				return;
			}
			this.innerAudioContext.src = this.src;
			this.innerAudioContext.play();
			this.isPlaying = true;
		},
		stopAudio() {
			if (this.innerAudioContext) {
				this.innerAudioContext.stop();
			}
			this.isPlaying = false;
		},
		destroyAudio() {
			if (!this.innerAudioContext) return;
			this.innerAudioContext.destroy();
			this.innerAudioContext = null;
			this.isPlaying = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.voice-player {
	display: flex;
	align-items: center;
	padding: 12rpx 24rpx;
	border-radius: 36rpx;
	background: #f9f5ff;
	border: 1rpx solid #e8deff;
}

.voice-player--playing {
	background: linear-gradient(135deg, rgba(143, 111, 176, 0.12), rgba(201, 182, 247, 0.08));
}

.voice-player__button {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #8f6fb0;
	flex-shrink: 0;
	margin-right: 20rpx;
}

.voice-player__icon {
	font-size: 24rpx;
	line-height: 1;
	color: #ffffff;
	font-weight: 700;
}

.voice-player__meta {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.voice-player__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #2f3b77;
}

.voice-player__desc {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: #6d7799;
}
</style>
