<template>
	<view v-if="displayText" class="mood-text-expand">
		<view
			class="mood-text-expand__body"
			:class="{ 'is-collapsed': !expanded && canExpand }"
			:style="[textStyle, collapsedStyle]"
		>
			<text class="mood-text-expand__text">{{ displayText }}</text>
		</view>
		<view class="mood-text-expand__measure" :id="measureId" aria-hidden="true" :style="textStyle">
			<text class="mood-text-expand__text">{{ displayText }}</text>
		</view>
		<view class="mood-text-expand__line-probe" :id="lineId" aria-hidden="true" :style="textStyle">
			<text class="mood-text-expand__text">字</text>
		</view>
		<view v-if="canExpand" class="mood-text-expand__action" @click.stop="toggle">
			<text class="mood-text-expand__btn">{{ expanded ? '收起' : '展开' }}</text>
		</view>
	</view>
</template>

<script>
let moodTextExpandSeed = 0;

export default {
	name: 'MoodTextExpand',
	props: {
		text: {
			type: String,
			default: ''
		},
		maxLines: {
			type: Number,
			default: 2
		},
		color: {
			type: String,
			default: '#57465b'
		},
		fontSize: {
			type: String,
			default: '28rpx'
		},
		lineHeight: {
			type: [Number, String],
			default: 1.6
		},
		fontWeight: {
			type: [Number, String],
			default: 'normal'
		}
	},
	data() {
		const uid = ++moodTextExpandSeed;
		return {
			measureId: `mood-text-measure-${uid}`,
			lineId: `mood-text-line-${uid}`,
			expanded: false,
			canExpand: false,
			checkTimer: null
		};
	},
	computed: {
		displayText() {
			return String(this.text || '').trim();
		},
		textStyle() {
			return {
				color: this.color,
				fontSize: this.fontSize,
				lineHeight: String(this.lineHeight),
				fontWeight: String(this.fontWeight)
			};
		},
		collapsedStyle() {
			if (this.expanded || !this.canExpand) return {};
			return {
				display: '-webkit-box',
				'-webkit-box-orient': 'vertical',
				'-webkit-line-clamp': String(Math.max(1, Number(this.maxLines) || 2)),
				overflow: 'hidden',
				textOverflow: 'ellipsis'
			};
		}
	},
	watch: {
		displayText: {
			immediate: true,
			handler() {
				this.expanded = false;
				this.canExpand = false;
				this.scheduleCheck();
			}
		},
		maxLines() {
			this.scheduleCheck();
		}
	},
	mounted() {
		this.scheduleCheck();
	},
	beforeUnmount() {
		this.clearCheckTimer();
	},
	methods: {
		toggle() {
			this.expanded = !this.expanded;
		},
		clearCheckTimer() {
			if (this.checkTimer) {
				clearTimeout(this.checkTimer);
				this.checkTimer = null;
			}
		},
		scheduleCheck() {
			this.clearCheckTimer();
			if (!this.displayText) {
				this.canExpand = false;
				return;
			}
			this.checkTimer = setTimeout(() => {
				this.checkOverflow();
			}, 32);
		},
		checkOverflow() {
			if (!this.displayText) {
				this.canExpand = false;
				return;
			}
			this.$nextTick(() => {
				const query = uni.createSelectorQuery().in(this);
				query.select(`#${this.measureId}`).boundingClientRect();
				query.select(`#${this.lineId}`).boundingClientRect();
				query.exec((res) => {
					const full = res && res[0];
					const line = res && res[1];
					if (!full || !line || !line.height) {
						this.canExpand = false;
						return;
					}
					const maxHeight = line.height * Math.max(1, Number(this.maxLines) || 2);
					this.canExpand = full.height > maxHeight + 2;
				});
			});
		}
	}
};
</script>

<style scoped>
.mood-text-expand {
	position: relative;
	width: 100%;
}

.mood-text-expand__body {
	width: 100%;
	word-break: break-word;
}

.mood-text-expand__body.is-collapsed {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	text-overflow: ellipsis;
}

.mood-text-expand__text {
	word-break: break-word;
}

.mood-text-expand__measure,
.mood-text-expand__line-probe {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	opacity: 0;
	pointer-events: none;
	z-index: -1;
	visibility: hidden;
	word-break: break-word;
}

.mood-text-expand__line-probe {
	width: auto;
	white-space: nowrap;
}

.mood-text-expand__action {
	margin-top: 8rpx;
}

.mood-text-expand__btn {
	color: #8f6fb0;
	font-size: 26rpx;
	line-height: 1.4;
}
</style>
