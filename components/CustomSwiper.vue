<template>
	<view class="custom-swiper" :style="{ height: swiperHeight + 'px' }">
		<swiper 
			class="swiper-container"
			:indicator-dots="showDots"
			:indicator-color="indicatorColor"
			:indicator-active-color="indicatorActiveColor"
			:autoplay="autoplay"
			:interval="interval"
			:duration="duration"
			:circular="circular"
			:vertical="vertical"
			:previous-margin="previousMargin"
			:next-margin="nextMargin"
			:display-multiple-items="displayMultipleItems"
			@change="handleChange"
			@transition="handleTransition"
			@animationfinish="handleAnimationFinish"
		>
			<swiper-item 
				v-for="(item, index) in list" 
				:key="index"
				class="swiper-item"
			>
				<view class="swiper-content" @click="handleItemClick(item, index)">
					<!-- 图片 -->
					<image 
						v-if="item.image"
						:src="item.image" 
						:mode="imageMode"
						class="swiper-image"
						:class="{ 'rounded': rounded }"
						@error="handleImageError"
						@load="handleImageLoad"
					/>
					
					<!-- 内容覆盖层 -->
					<view v-if="showOverlay" class="swiper-overlay" :class="overlayPosition">
						<!-- 标题 -->
						<text v-if="item.title" class="swiper-title" :class="titleClass">
							{{ item.title }}
						</text>
						
						<!-- 描述 -->
						<text v-if="item.description" class="swiper-description" :class="descriptionClass">
							{{ item.description }}
						</text>
						
						<!-- 自定义内容插槽 -->
						<slot name="overlay" :item="item" :index="index"></slot>
					</view>
					
					<!-- 角标 -->
					<view v-if="item.badge" class="swiper-badge" :class="badgePosition">
						<text class="badge-text">{{ item.badge }}</text>
					</view>
				</view>
			</swiper-item>
		</swiper>
		
		<!-- 自定义指示器 -->
		<view v-if="customDots" class="custom-dots" :class="dotsPosition">
			<view 
				v-for="(item, index) in list" 
				:key="index"
				class="custom-dot"
				:class="{ 'active': index === currentIndex }"
				@click="handleDotClick(index)"
			></view>
		</view>
		
		<!-- 左右箭头 -->
		<view v-if="showArrows" class="swiper-arrows">
			<view class="arrow arrow-left" @click="handlePrev">
				<text class="arrow-icon">‹</text>
			</view>
			<view class="arrow arrow-right" @click="handleNext">
				<text class="arrow-icon">›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getSystemInfo, getResponsiveValue, getScreenSize } from '@/utils/adapt.js';

export default {
	name: 'CustomSwiper',
	props: {
		// 轮播数据
		list: {
			type: Array,
			default: () => []
		},
		// 轮播高度（响应式）
		height: {
			type: [Number, Object],
			default: () => ({
				xs: 200,
				sm: 220,
				md: 250,
				lg: 280,
				xl: 300
			})
		},
		// 是否显示指示点
		showDots: {
			type: Boolean,
			default: true
		},
		// 指示点颜色
		indicatorColor: {
			type: String,
			default: 'rgba(255, 255, 255, 0.3)'
		},
		// 指示点激活颜色
		indicatorActiveColor: {
			type: String,
			default: '#ffffff'
		},
		// 是否自动播放
		autoplay: {
			type: Boolean,
			default: true
		},
		// 自动播放间隔
		interval: {
			type: Number,
			default: 3000
		},
		// 滑动动画时长
		duration: {
			type: Number,
			default: 500
		},
		// 是否循环播放
		circular: {
			type: Boolean,
			default: true
		},
		// 是否垂直滑动
		vertical: {
			type: Boolean,
			default: false
		},
		// 前边距
		previousMargin: {
			type: String,
			default: '0px'
		},
		// 后边距
		nextMargin: {
			type: String,
			default: '0px'
		},
		// 同时显示的滑块数量
		displayMultipleItems: {
			type: Number,
			default: 1
		},
		// 图片裁剪模式
		imageMode: {
			type: String,
			default: 'aspectFill'
		},
		// 是否圆角
		rounded: {
			type: Boolean,
			default: true
		},
		// 是否显示覆盖层
		showOverlay: {
			type: Boolean,
			default: true
		},
		// 覆盖层位置
		overlayPosition: {
			type: String,
			default: 'bottom', // 'top' | 'bottom' | 'center'
			validator: (value) => ['top', 'bottom', 'center'].includes(value)
		},
		// 标题样式类
		titleClass: {
			type: String,
			default: ''
		},
		// 描述样式类
		descriptionClass: {
			type: String,
			default: ''
		},
		// 角标位置
		badgePosition: {
			type: String,
			default: 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
			validator: (value) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
		},
		// 是否使用自定义指示器
		customDots: {
			type: Boolean,
			default: false
		},
		// 指示器位置
		dotsPosition: {
			type: String,
			default: 'bottom-center', // 'bottom-center' | 'bottom-left' | 'bottom-right'
			validator: (value) => ['bottom-center', 'bottom-left', 'bottom-right'].includes(value)
		},
		// 是否显示箭头
		showArrows: {
			type: Boolean,
			default: false
		}
	},
	emits: ['change', 'click', 'transition', 'animationfinish'],
	setup(props, { emit }) {
		const currentIndex = ref(0);
		const screenInfo = ref(null);
		
		// 计算轮播高度
		const swiperHeight = computed(() => {
			if (typeof props.height === 'number') {
				return props.height;
			}
			return getResponsiveValue(props.height) || 200;
		});
		
		// 处理轮播切换
		const handleChange = (e) => {
			currentIndex.value = e.detail.current;
			emit('change', e.detail);
		};
		
		// 处理过渡动画
		const handleTransition = (e) => {
			emit('transition', e.detail);
		};
		
		// 处理动画结束
		const handleAnimationFinish = (e) => {
			emit('animationfinish', e.detail);
		};
		
		// 处理项目点击
		const handleItemClick = (item, index) => {
			emit('click', { item, index });
		};
		
		// 处理图片加载错误
		const handleImageError = (e) => {
			console.warn('轮播图片加载失败:', e);
		};
		
		// 处理图片加载完成
		const handleImageLoad = (e) => {
			// 图片加载完成的处理逻辑
		};
		
		// 处理自定义指示器点击
		const handleDotClick = (index) => {
			currentIndex.value = index;
			// 这里需要通过ref来控制swiper跳转，但uni-app的swiper组件不支持程序化控制
			// 可以考虑使用其他方式实现
		};
		
		// 上一张
		const handlePrev = () => {
			if (props.list.length === 0) return;
			const newIndex = currentIndex.value === 0 ? props.list.length - 1 : currentIndex.value - 1;
			currentIndex.value = newIndex;
		};
		
		// 下一张
		const handleNext = () => {
			if (props.list.length === 0) return;
			const newIndex = currentIndex.value === props.list.length - 1 ? 0 : currentIndex.value + 1;
			currentIndex.value = newIndex;
		};
		
		// 初始化
		onMounted(() => {
			screenInfo.value = getSystemInfo();
		});
		
		return {
			currentIndex,
			swiperHeight,
			handleChange,
			handleTransition,
			handleAnimationFinish,
			handleItemClick,
			handleImageError,
			handleImageLoad,
			handleDotClick,
			handlePrev,
			handleNext
		};
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.custom-swiper {
	position: relative;
	width: 100%;
	overflow: hidden;
}

.swiper-container {
	width: 100%;
	height: 100%;
}

.swiper-item {
	width: 100%;
	height: 100%;
}

.swiper-content {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.swiper-image {
	width: 100%;
	height: 100%;
	
	&.rounded {
		border-radius: $border-radius-lg;
	}
}

.swiper-overlay {
	position: absolute;
	left: 0;
	right: 0;
	padding: $spacing-md;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
	color: white;
	
	&.top {
		top: 0;
		background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
	}
	
	&.bottom {
		bottom: 0;
	}
	
	&.center {
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0, 0, 0, 0.4);
		border-radius: $border-radius-md;
		margin: 0 $spacing-md;
		text-align: center;
	}
}

.swiper-title {
	display: block;
	font-size: $font-size-lg;
	font-weight: 600;
	margin-bottom: $spacing-xs;
	@include text-ellipsis(2);
}

.swiper-description {
	display: block;
	font-size: $font-size-sm;
	opacity: 0.9;
	@include text-ellipsis(3);
}

.swiper-badge {
	position: absolute;
	padding: $spacing-xs $spacing-sm;
	background-color: $danger-color;
	border-radius: $border-radius-sm;
	
	&.top-left {
		top: $spacing-sm;
		left: $spacing-sm;
	}
	
	&.top-right {
		top: $spacing-sm;
		right: $spacing-sm;
	}
	
	&.bottom-left {
		bottom: $spacing-sm;
		left: $spacing-sm;
	}
	
	&.bottom-right {
		bottom: $spacing-sm;
		right: $spacing-sm;
	}
}

.badge-text {
	color: white;
	font-size: $font-size-xs;
	font-weight: 500;
}

.custom-dots {
	position: absolute;
	display: flex;
	gap: $spacing-xs;
	
	&.bottom-center {
		bottom: $spacing-md;
		left: 50%;
		transform: translateX(-50%);
	}
	
	&.bottom-left {
		bottom: $spacing-md;
		left: $spacing-md;
	}
	
	&.bottom-right {
		bottom: $spacing-md;
		right: $spacing-md;
	}
}

.custom-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.4);
	transition: all 0.3s ease;
	
	&.active {
		background-color: white;
		transform: scale(1.2);
	}
}

.swiper-arrows {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}

.arrow {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 40px;
	height: 40px;
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
	transition: all 0.3s ease;
	
	&:hover {
		background-color: rgba(0, 0, 0, 0.7);
	}
	
	&.arrow-left {
		left: $spacing-md;
	}
	
	&.arrow-right {
		right: $spacing-md;
	}
}

.arrow-icon {
	color: white;
	font-size: 24px;
	font-weight: bold;
}

// 响应式适配
@include respond-to(xs) {
	.swiper-overlay {
		padding: $spacing-sm;
	}
	
	.swiper-title {
		font-size: $font-size-md;
	}
	
	.swiper-description {
		font-size: $font-size-xs;
	}
	
	.arrow {
		width: 32px;
		height: 32px;
	}
	
	.arrow-icon {
		font-size: 20px;
	}
}

@include respond-to(md) {
	.swiper-overlay {
		padding: $spacing-lg;
	}
	
	.swiper-title {
		font-size: $font-size-xl;
	}
	
	.swiper-description {
		font-size: $font-size-md;
	}
}
</style>