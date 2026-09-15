<template>
	<view v-if="visible" class="report-mask" @click.self="close">
		<view class="report-popup" :style="keyboardLiftStyle">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="header-title">举报内容</text>
				<text class="header-close" @click="close">✕</text>
			</view>

			<!-- 举报表单 -->
			<view class="report-form">
				<text class="form-label">举报说明</text>
				<textarea
					class="report-textarea"
					v-model="reason"
					placeholder="请描述举报原因..."
					maxlength="500"
					:auto-height="false"
					:adjust-position="false"
					@keyboardheightchange="onKeyboardHeightChange"
					@blur="onKeyboardBlur"
				/>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-btn" :class="{ disabled: submitting }" @click="submitReport">
				<text>提交举报</text>
			</view>
		</view>
	</view>
</template>

<script>
import { submitReport } from '@/api/report';
import { keyboardMixin } from '@/utils/keyboard';

export default {
	name: 'ReportPopup',
	mixins: [keyboardMixin],
	props: {
		visible: { type: Boolean, default: false },
		contentId: { type: Number, default: 0 },
		commentId: { type: Number, default: 0 },
		reportedUserId: { type: Number, default: 0 }
	},
	emits: ['close'],
	data() {
		return {
			reason: '',
			submitting: false
		};
	},
	watch: {
		visible(val) {
			if (val) {
				this.reason = '';
			}
		}
	},
	methods: {
		/** 提交举报 */
		async submitReport() {
			if (!this.reason.trim()) {
				uni.showToast({ title: '请填写举报说明', icon: 'none' });
				return;
			}
			if (this.submitting) return;
			this.submitting = true;
			try {
				await submitReport({
					contentId: this.contentId,
					commentId: this.commentId,
					reportedUserId: this.reportedUserId,
					reason: this.reason.trim()
				});
				uni.showToast({ title: '举报已提交，我们会尽快处理', icon: 'none', duration: 2000 });
				this.close();
			} catch (e) {
				console.error('举报失败:', e);
			} finally {
				this.submitting = false;
			}
		},

		/** 关闭弹窗 */
		close() {
			this.$emit('close');
		}
	}
};
</script>

<style lang="scss" scoped>
.report-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.5);
	z-index: 999;
	display: flex;
	align-items: flex-end;
}
.report-popup {
	width: 100%;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
	animation: slideUp 0.3s ease;
}
@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

/* 头部 */
.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f0f2f5;
}
.header-title { font-size: 30rpx; font-weight: 600; color: #57465b; }
.header-close { font-size: 32rpx; color: #9f92a2; padding: 8rpx; }

/* 表单 */
.report-form { padding: 28rpx 32rpx; }
.form-label { font-size: 28rpx; color: #57465b; font-weight: 600; margin-bottom: 16rpx; display: block; }
.report-textarea {
	width: 100%;
	height: 240rpx;
	background: #f7f1f8;
	border-radius: 16rpx;
	padding: 20rpx;
	font-size: 28rpx;
	color: #57465b;
	box-sizing: border-box;
}

/* 提交按钮 */
.submit-btn {
	margin: 0 32rpx;
	height: 88rpx;
	line-height: 88rpx;
	text-align: center;
	background: linear-gradient(135deg, #5B86E5 0%, #36D1DC 100%);
	border-radius: 44rpx;
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
	&.disabled { opacity: 0.5; }
}
</style>
