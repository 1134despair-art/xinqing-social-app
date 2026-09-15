<template>
	<IconFont :name="name" :color="color" :size="iconSizeRpx" :custom-class="customClass" />
</template>

<script>
import IconFont from '@/components/IconFont.vue';

export default {
	name: 'MdiIcon',
	components: { IconFont },
	props: {
		name: { type: String, required: true },
		color: { type: String, default: '#9f92a2' },
		/** 传入 px 时自动换算为 rpx（×2） */
		size: { type: [Number, String], default: 22 },
		customClass: { type: String, default: '' }
	},
	computed: {
		iconSizeRpx() {
			const px = Number(this.size) || 22;
			return px * 2;
		}
	}
};
</script>
