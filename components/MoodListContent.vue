<template>
	<view v-if="hasContent" class="mood-list-content">
		<!-- 文本单独做两行展开，视频不参与展开计算 -->
		<view v-if="showText" class="mood-list-content__text" :class="textClass">
			<MoodTextExpand
				:text="moodText"
				:max-lines="maxLines"
				:font-size="fontSize"
				:color="color"
				:line-height="lineHeight"
				:font-weight="fontWeight"
			/>
		</view>

		<VoicePlayer
			v-if="showVoice"
			:src="mood.voiceUrl"
			:duration="mood.voiceDuration"
			:class="voiceClass"
		/>

		<MoodVideo
			v-if="showReadyVideo"
			:src="mood.videoUrl"
			:poster="mood.videoCoverUrl"
			:mood-id="mood.moodId"
			:height="videoHeight"
			:class="videoClass"
		/>

		<view v-if="showVideoTip" class="mood-list-content__tip" :class="tipClass">
			<text>{{ videoStatusText }}</text>
		</view>
	</view>
</template>

<script>
import MoodTextExpand from '@/components/MoodTextExpand.vue';
import MoodVideo from '@/components/MoodVideo.vue';
import VoicePlayer from '@/components/VoicePlayer.vue';
import {
	getMoodText,
	getVideoStatusText,
	isTextMood,
	isVideoMood,
	isVideoReady,
	isVoiceMood
} from '@/utils/moodContent';

export default {
	name: 'MoodListContent',
	components: { MoodTextExpand, MoodVideo, VoicePlayer },
	props: {
		mood: {
			type: Object,
			default: () => ({})
		},
		maxLines: {
			type: Number,
			default: 2
		},
		fontSize: {
			type: String,
			default: '28rpx'
		},
		color: {
			type: String,
			default: '#57465b'
		},
		lineHeight: {
			type: [Number, String],
			default: 1.6
		},
		fontWeight: {
			type: [Number, String],
			default: 'normal'
		},
		videoHeight: {
			type: String,
			default: ''
		},
		textClass: {
			type: String,
			default: ''
		},
		voiceClass: {
			type: String,
			default: ''
		},
		videoClass: {
			type: String,
			default: ''
		},
		tipClass: {
			type: String,
			default: ''
		}
	},
	computed: {
		moodText() {
			return getMoodText(this.mood);
		},
		showText() {
			return (isTextMood(this.mood) || isVideoMood(this.mood)) && Boolean(this.moodText);
		},
		showVoice() {
			return isVoiceMood(this.mood) && Boolean(this.mood.voiceUrl);
		},
		showReadyVideo() {
			return isVideoReady(this.mood);
		},
		showVideoTip() {
			return isVideoMood(this.mood) && !isVideoReady(this.mood);
		},
		videoStatusText() {
			return getVideoStatusText(this.mood);
		},
		hasContent() {
			return this.showText || this.showVoice || this.showReadyVideo || this.showVideoTip;
		}
	}
};
</script>

<style scoped>
.mood-list-content {
	width: 100%;
}

.mood-list-content__text {
	margin-bottom: 20rpx;
}

.mood-list-content__tip {
	margin-bottom: 20rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: #fbf7fb;
	color: #9f92a2;
	font-size: 26rpx;
	text-align: center;
}
</style>
