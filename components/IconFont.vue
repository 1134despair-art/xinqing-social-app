<template>
	<text class="iconfont" :class="customClass" :style="iconStyle">{{ unicode }}</text>
</template>

<script>
import { getIconUnicode } from '@/utils/iconfont';

export default {
	name: 'IconFont',
	props: {
		/** 图标名，如 heart、comment-outline */
		name: {
			type: String,
			required: true
		},
		color: {
			type: String,
			default: '#9f92a2'
		},
		/** 字号 rpx */
		size: {
			type: [Number, String],
			default: 44
		},
		customClass: {
			type: String,
			default: ''
		}
	},
	computed: {
		unicode() {
			return getIconUnicode(this.name);
		},
		iconStyle() {
			return {
				fontSize: `${Number(this.size) || 44}rpx`,
				color: this.color,
				lineHeight: '1'
			};
		}
	}
};
</script>
