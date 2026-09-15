<template>
	<view class="custom-list" :class="listClass">
		<view 
			v-for="(item, index) in list" 
			:key="getItemKey(item, index)"
			class="list-item"
			:class="[
				getItemClass(item, index),
				{ 'clickable': item.clickable !== false && !item.disabled },
				{ 'disabled': item.disabled }
			]"
			@click="handleItemClick(item, index)"
		>
			<!-- 左侧图标/头像 -->
			<view v-if="showLeftIcon" class="item-left">
				<image 
					v-if="item.avatar"
					:src="item.avatar" 
					class="item-avatar"
					:class="{ 'rounded': avatarRounded }"
					mode="aspectFill"
				/>
				<view 
					v-else-if="item.icon"
					class="item-icon"
					:class="iconClass"
					:style="{ color: item.iconColor || iconColor }"
				>
					<text class="icon-text">{{ item.icon }}</text>
				</view>
				<view v-else-if="$slots.left" class="item-slot">
					<slot name="left" :item="item" :index="index"></slot>
				</view>
			</view>
			
			<!-- 主要内容 -->
			<view class="item-content">
				<!-- 标题行 -->
				<view class="content-header">
					<text 
						class="item-title" 
						:class="titleClass"
						:style="{ color: item.titleColor || titleColor }"
					>
						{{ item.title }}
					</text>
					
					<!-- 右侧文本 -->
					<text 
						v-if="item.rightText" 
						class="item-right-text"
						:class="rightTextClass"
						:style="{ color: item.rightTextColor || rightTextColor }"
					>
						{{ item.rightText }}
					</text>
				</view>
				
				<!-- 副标题/描述 -->
				<text 
					v-if="item.subtitle || item.description" 
					class="item-subtitle"
					:class="subtitleClass"
					:style="{ color: item.subtitleColor || subtitleColor }"
				>
					{{ item.subtitle || item.description }}
				</text>
				
				<!-- 自定义内容插槽 -->
				<view v-if="$slots.content" class="item-content-slot">
					<slot name="content" :item="item" :index="index"></slot>
				</view>
			</view>
			
			<!-- 右侧内容 -->
			<view v-if="showRightContent" class="item-right">
				<!-- 角标 -->
				<view v-if="item.badge" class="item-badge" :class="badgeClass">
					<text class="badge-text">{{ item.badge }}</text>
				</view>
				
				<!-- 开关 -->
				<switch 
					v-else-if="item.type === 'switch'"
					:checked="item.checked"
					:disabled="item.disabled"
					@change="handleSwitchChange(item, index, $event)"
				/>
				
				<!-- 箭头 -->
				<view 
					v-else-if="showArrow && item.showArrow !== false"
					class="item-arrow"
					:class="arrowClass"
				>
					<text class="arrow-icon">›</text>
				</view>
				
				<!-- 自定义右侧内容 -->
				<view v-else-if="$slots.right" class="item-right-slot">
					<slot name="right" :item="item" :index="index"></slot>
				</view>
			</view>
			
			<!-- 分割线 -->
			<view 
				v-if="showDivider && index < list.length - 1" 
				class="item-divider"
				:class="dividerClass"
			></view>
		</view>
		
		<!-- 空状态 -->
		<view v-if="list.length === 0 && showEmpty" class="list-empty">
			<view class="empty-icon">
				<text>📝</text>
			</view>
			<text class="empty-text">{{ emptyText }}</text>
		</view>
	</view>
</template>

<script>
import { computed } from 'vue';

export default {
	name: 'CustomList',
	props: {
		// 列表数据
		list: {
			type: Array,
			default: () => []
		},
		// 列表样式类
		listClass: {
			type: String,
			default: ''
		},
		// 是否显示左侧图标
		showLeftIcon: {
			type: Boolean,
			default: true
		},
		// 是否显示右侧内容
		showRightContent: {
			type: Boolean,
			default: true
		},
		// 是否显示箭头
		showArrow: {
			type: Boolean,
			default: true
		},
		// 是否显示分割线
		showDivider: {
			type: Boolean,
			default: true
		},
		// 头像是否圆角
		avatarRounded: {
			type: Boolean,
			default: true
		},
		// 图标样式类
		iconClass: {
			type: String,
			default: ''
		},
		// 图标颜色
		iconColor: {
			type: String,
			default: '#7d6e81'
		},
		// 标题样式类
		titleClass: {
			type: String,
			default: ''
		},
		// 标题颜色
		titleColor: {
			type: String,
			default: '#57465b'
		},
		// 副标题样式类
		subtitleClass: {
			type: String,
			default: ''
		},
		// 副标题颜色
		subtitleColor: {
			type: String,
			default: '#9f92a2'
		},
		// 右侧文本样式类
		rightTextClass: {
			type: String,
			default: ''
		},
		// 右侧文本颜色
		rightTextColor: {
			type: String,
			default: '#9f92a2'
		},
		// 角标样式类
		badgeClass: {
			type: String,
			default: ''
		},
		// 箭头样式类
		arrowClass: {
			type: String,
			default: ''
		},
		// 分割线样式类
		dividerClass: {
			type: String,
			default: ''
		},
		// 项目唯一键字段
		itemKey: {
			type: String,
			default: 'id'
		},
		// 是否显示空状态
		showEmpty: {
			type: Boolean,
			default: true
		},
		// 空状态文本
		emptyText: {
			type: String,
			default: '暂无数据'
		}
	},
	emits: ['click', 'switch-change'],
	setup(props, { emit }) {
		// 获取项目唯一键
		const getItemKey = (item, index) => {
			return item[props.itemKey] || index;
		};
		
		// 获取项目样式类
		const getItemClass = (item, index) => {
			const classes = [];
			
			if (item.class) {
				classes.push(item.class);
			}
			
			if (item.type) {
				classes.push(`item-type-${item.type}`);
			}
			
			if (index === 0) {
				classes.push('first-item');
			}
			
			if (index === props.list.length - 1) {
				classes.push('last-item');
			}
			
			return classes.join(' ');
		};
		
		// 处理项目点击
		const handleItemClick = (item, index) => {
			if (item.disabled || item.clickable === false) {
				return;
			}
			
			emit('click', { item, index });
			
			// 如果有跳转链接，执行跳转
			if (item.url) {
				if (item.url.startsWith('http')) {
					// 外部链接
					// #ifdef H5
					window.open(item.url);
					// #endif
					// #ifndef H5
					uni.showToast({
						title: '暂不支持外部链接',
						icon: 'none'
					});
					// #endif
				} else {
					// 内部页面跳转
					const navigateType = item.navigateType || 'navigateTo';
					uni[navigateType]({
						url: item.url,
						fail: (err) => {
							console.error('页面跳转失败:', err);
						}
					});
				}
			}
		};
		
		// 处理开关变化
		const handleSwitchChange = (item, index, event) => {
			const checked = event.detail.value;
			
			// 更新数据
			item.checked = checked;
			
			emit('switch-change', { item, index, checked });
		};
		
		return {
			getItemKey,
			getItemClass,
			handleItemClick,
			handleSwitchChange
		};
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.custom-list {
	background-color: $bg-primary;
}

.list-item {
	position: relative;
	display: flex;
	align-items: center;
	padding: $spacing-md;
	min-height: 60px;
	background-color: $bg-primary;
	transition: background-color 0.2s ease;
	
	&.clickable {
		cursor: pointer;
		
		&:active {
			background-color: $bg-secondary;
		}
	}
	
	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	&.first-item {
		border-top-left-radius: $border-radius-lg;
		border-top-right-radius: $border-radius-lg;
	}
	
	&.last-item {
		border-bottom-left-radius: $border-radius-lg;
		border-bottom-right-radius: $border-radius-lg;
	}
}

.item-left {
	margin-right: $spacing-md;
	flex-shrink: 0;
}

.item-avatar {
	width: 40px;
	height: 40px;
	
	&.rounded {
		border-radius: 50%;
	}
}

.item-icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: $bg-tertiary;
	border-radius: $border-radius-md;
}

.icon-text {
	font-size: $font-size-lg;
}

.item-content {
	flex: 1;
	min-width: 0; // 防止flex项目溢出
}

.content-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $spacing-xs;
}

.item-title {
	font-size: $font-size-lg;
	font-weight: 500;
	color: $text-primary;
	@include text-ellipsis(1);
	flex: 1;
	margin-right: $spacing-sm;
}

.item-right-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	flex-shrink: 0;
}

.item-subtitle {
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 1.4;
	@include text-ellipsis(2);
}

.item-content-slot {
	margin-top: $spacing-xs;
}

.item-right {
	margin-left: $spacing-md;
	flex-shrink: 0;
	display: flex;
	align-items: center;
}

.item-badge {
	padding: $spacing-xs $spacing-sm;
	background-color: $danger-color;
	border-radius: $border-radius-sm;
	min-width: 20px;
	text-align: center;
}

.badge-text {
	color: white;
	font-size: $font-size-xs;
	font-weight: 500;
}

.item-arrow {
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.arrow-icon {
	font-size: 18px;
	color: $text-placeholder;
	font-weight: bold;
}

.item-divider {
	position: absolute;
	bottom: 0;
	left: $spacing-md;
	right: 0;
	height: 1px;
	background-color: $border-light;
	transform: scaleY(0.5);
}

.list-empty {
	padding: $spacing-xl;
	text-align: center;
	color: $text-placeholder;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: $spacing-md;
}

.empty-text {
	font-size: $font-size-md;
}

// 特殊类型样式
.item-type-danger {
	.item-title {
		color: $danger-color;
	}
}

.item-type-warning {
	.item-title {
		color: $warning-color;
	}
}

.item-type-success {
	.item-title {
		color: $success-color;
	}
}

.item-type-primary {
	.item-title {
		color: $primary-color;
	}
}

// 响应式适配
@include respond-to(xs) {
	.list-item {
		padding: $spacing-sm $spacing-md;
		min-height: 56px;
	}
	
	.item-avatar {
		width: 36px;
		height: 36px;
	}
	
	.item-icon {
		width: 36px;
		height: 36px;
	}
	
	.icon-text {
		font-size: $font-size-md;
	}
	
	.item-title {
		font-size: $font-size-md;
	}
	
	.item-subtitle {
		font-size: $font-size-xs;
	}
}

@include respond-to(md) {
	.list-item {
		padding: $spacing-lg;
		min-height: 72px;
	}
	
	.item-avatar {
		width: 48px;
		height: 48px;
	}
	
	.item-icon {
		width: 48px;
		height: 48px;
	}
	
	.icon-text {
		font-size: $font-size-xl;
	}
	
	.item-title {
		font-size: $font-size-xl;
	}
	
	.item-subtitle {
		font-size: $font-size-md;
	}
}

// 深色主题适配
/* #ifdef H5 */
@media (prefers-color-scheme: dark) {
	.custom-list {
		background-color: #1a1a1a;
	}
	
	.list-item {
		background-color: #1a1a1a;
		
		&.clickable:active {
			background-color: #2a2a2a;
		}
	}
	
	.item-icon {
		background-color: #2a2a2a;
	}
	
	.item-divider {
		background-color: #57465b;
	}
}
/* #endif */
</style>