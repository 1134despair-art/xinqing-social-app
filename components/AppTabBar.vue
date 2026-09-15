<template>
	<view class="custom-tab-bar">
		<view
			v-for="(item, index) in list"
			:key="item.pagePath"
			class="tab-item"
			:class="{ 'tab-item-center': item.isCenter }"
			@click="onTabTap(index, item)"
		>
			<view
				v-if="item.isCenter"
				class="tab-link tab-link-center"
				:class="{ 'tab-link-active': activeIndex === index }"
			>
				<view class="tab-publish-btn" :class="{ 'tab-publish-btn-active': activeIndex === index }">
					<IconFont name="plus" color="#ffffff" :size="56" />
				</view>
			</view>
			<view v-else class="tab-link" :class="{ 'tab-link-active': activeIndex === index }">
				<view class="tab-icon-wrap">
					<IconFont :name="item.icon" :color="activeIndex === index ? selectedColor : color" :size="44" />
				</view>
				<text class="tab-text" :style="{ color: activeIndex === index ? selectedColor : color }">
					{{ item.text }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
import IconFont from '@/components/IconFont.vue';
import { TAB_ROUTES } from '@/utils/tabBar';

export default {
	name: 'AppTabBar',
	components: { IconFont },
	props: {
		/** H5 端传入当前 tab 索引 */
		current: {
			type: Number,
			default: -1
		}
	},
	data() {
		return {
			/** 无 current 传入时使用（如 custom-tab-bar 容器） */
			selected: 0,
			color: '#9f92a2',
			selectedColor: '#8f6fb0',
			list: [
				{ pagePath: '/pages/index/index', text: '梦', icon: 'weather-night' },
				{ pagePath: '/pages/space/space', text: '梦空间', icon: 'compass-outline' },
				{ pagePath: '/pages/publish/publish', text: '发布', icon: 'plus', isCenter: true },
				{ pagePath: '/pages/match/match', text: '筑梦师', icon: 'face-agent' },
				{ pagePath: '/pages/profile/profile', text: '我', icon: 'account-outline' }
			]
		};
	},
	computed: {
		/** 以页面 current 为准，避免 tab 缓存后 internal selected 错乱 */
		activeIndex() {
			if (this.current >= 0) return this.current;
			return this.selected;
		}
	},
	watch: {
		current(val) {
			if (val >= 0) this.selected = val;
		}
	},
	mounted() {
		if (this.current >= 0) {
			this.selected = this.current;
		}
	},
	methods: {
		setSelected(index) {
			if (index >= 0 && index < this.list.length) {
				this.selected = index;
			}
		},
		onTabTap(index, item) {
			if (this.current >= 0 && index === this.current) return;
			this.setSelected(index);
			uni.switchTab({ url: item.pagePath });
		},
		resolveIndexFromRoute() {
			const pages = getCurrentPages();
			if (!pages.length) return -1;
			return TAB_ROUTES.indexOf(pages[pages.length - 1].route || '');
		}
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

/* 对齐 H5 .nav-bar（--app-tabbar-height: 60px） */
.custom-tab-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: space-around;
	height: calc(#{$tabbar-height} + env(safe-area-inset-bottom));
	padding: 0 20rpx env(safe-area-inset-bottom);
	background: rgba(255, 254, 254, 0.96);
	box-shadow: 0 -16rpx 48rpx rgba(113, 91, 118, 0.06);
	border-top: 1rpx solid $border-color;
	box-sizing: border-box;
	overflow: visible;
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 128rpx;
	color: $text-tertiary;
	position: relative;
	overflow: visible;
	transition: all 0.25s ease;
}

.tab-link {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 116rpx;
	min-height: 96rpx;
	padding: 12rpx 0 10rpx;
	gap: 4rpx;
	border-radius: 36rpx;
	border: 1rpx solid transparent;
	background: transparent;
	transition: all 0.22s ease;
}

.tab-link-active {
	color: $primary-color;
	background: linear-gradient(180deg, rgba(255, 247, 251, 0.98) 0%, rgba(245, 236, 255, 0.98) 100%);
	border-color: rgba(232, 222, 255, 0.92);
	box-shadow: $shadow-soft;
}

.tab-icon-wrap {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: visible;
	flex-shrink: 0;
	transition: transform 0.22s ease, color 0.22s ease;
}

.tab-link-active .tab-icon-wrap {
	transform: translateY(-2rpx);
}

.tab-icon-wrap :deep(.iconfont) {
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
}

.tab-text {
	font-size: 22rpx;
	line-height: 1.2;
	flex-shrink: 0;
	font-weight: 500;
}

.tab-link-active .tab-text {
	font-weight: 600;
}

.tab-item-center {
	margin-top: -40rpx;
}

.tab-link-center {
	width: 128rpx;
	min-height: 116rpx;
	padding: 0;
	border-radius: 44rpx;
}

.tab-publish-btn {
	width: 104rpx;
	height: 104rpx;
	border-radius: 50%;
	background: $publish-gradient;
	border: 4rpx solid rgba(255, 255, 255, 0.92);
	box-shadow: 0 28rpx 56rpx rgba(255, 127, 102, 0.32);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tab-publish-btn-active {
	transform: scale(1.04);
	box-shadow: 0 32rpx 64rpx rgba(255, 127, 102, 0.38);
}
</style>
