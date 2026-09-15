<template>
	<view class="user-avatar" :style="containerStyle">
		<image
			v-if="isImage"
			class="user-avatar-image"
			:src="avatar"
			mode="aspectFill"
		/>
		<text v-else class="user-avatar-emoji" :style="emojiStyle">{{ displayText }}</text>
	</view>
</template>

<script>
import { getDisplayAvatar, isImageAvatar } from '@/utils/avatar';

export default {
	name: 'UserAvatar',
	props: {
		avatar: { type: String, default: '' },
		size: { type: [Number, String], default: 72 }
	},
	computed: {
		sizeValue() {
			const size = Number(this.size);
			return Number.isFinite(size) && size > 0 ? size : 72;
		},
		containerStyle() {
			const size = `${this.sizeValue}rpx`;
			return { width: size, height: size };
		},
		emojiStyle() {
			return { fontSize: `${Math.round(this.sizeValue * 0.5)}rpx` };
		},
		isImage() {
			return isImageAvatar(this.avatar);
		},
		displayText() {
			return getDisplayAvatar(this.avatar);
		}
	}
};
</script>

<style lang="scss" scoped>
.user-avatar {
	border-radius: 50%;
	background: #f0f0f0;
	overflow: hidden;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.user-avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	display: block;
}

.user-avatar-emoji {
	line-height: 1;
}
</style>
