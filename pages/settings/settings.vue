<template>
	<view class="settings-page">
		<view class="header" :style="headerStyle">
			<view class="header-inner">
				<view class="header-back-btn" @click="goBack">
					<text class="header-back-icon">‹</text>
				</view>
				<text class="page-title">消息中心</text>
			</view>
		</view>

		<view class="notice-page">
			<view class="notice-intro">
				<text class="notice-intro-title">消息中心说明</text>
				<text class="notice-intro-line">· 收到他人对你的<text class="notice-intro-strong">点赞 / 评论 / 回复</text>会展示在这里。</text>
				<text class="notice-intro-line">· 系统下发的<text class="notice-intro-strong">审核结果、活动通知、平台公告</text>也会展示在这里。</text>
				<text class="notice-intro-line">· 你自己<text class="notice-intro-strong">点赞、评论、回复</text>过的内容也会在这里留痕，方便回溯。</text>
			</view>

			<view class="notice-tab-wrap">
				<view
					v-for="item in tabOptions"
					:key="item.value"
					class="notice-tab-btn"
					:class="{ active: activeTab === item.value }"
					@click="switchTab(item.value)"
				>
					{{ item.label }}
				</view>
			</view>

			<scroll-view class="notice-list-wrap" scroll-y>
				<view v-if="loading && notifications.length === 0" class="notice-empty">加载中...</view>
				<view v-else-if="notifications.length === 0" class="notice-empty">暂无消息</view>
				<view
					v-for="item in notifications"
					:key="item.id"
					class="notice-item"
					:class="noticeItemClass(item)"
					@click="openNotification(item)"
				>
					<view class="notice-item-head">
						<text class="notice-item-tag">{{ item.typeLabel }}</text>
						<text class="notice-item-time">{{ item.timeText }}</text>
					</view>
					<view class="notice-item-summary" v-if="item.summaryText">
						<text class="notice-item-summary-text">{{ item.summaryText }}</text>
					</view>
					<text v-if="item.commentText" class="notice-item-comment">{{ item.commentText }}</text>
				</view>
				<view v-if="notifications.length && hasMore" class="notice-load-more" @click="loadMore">
					{{ loading ? '加载中...' : '加载更多' }}
				</view>
				<view v-else-if="notifications.length" class="notice-load-more muted">没有更多了</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { reportMoodView } from '@/utils/moodView';
import { getStatusBarHeight } from '@/utils/adapt';
import { formatRelativeTime } from '@/utils/time';
import {
	getMessageList,
	getUnreadMessageCount,
	markMessageRead
} from '@/api/message';

export default {
	name: 'SettingsPage',
	data() {
		return {
			statusBarHeight: 0,
			activeTab: 'all',
			tabOptions: [
				{ label: '全部', value: 'all' },
				{ label: '系统消息', value: 'system' },
				{ label: '评论消息', value: 'comment' }
			],
			notifications: [],
			loading: false,
			pageNum: 1,
			pageSize: 20,
			total: 0,
			unreadCount: { total: 0, comment: 0, system: 0 }
		};
	},
	computed: {
		headerStyle() {
			return { paddingTop: `${this.statusBarHeight}px` };
		},
		hasMore() {
			return this.notifications.length < this.total;
		}
	},
	onLoad() {
		this.statusBarHeight = getStatusBarHeight();
	},
	onShow() {
		this.loadUnreadCount();
		this.reloadMessages();
	},
	methods: {
		noticeItemClass(item) {
			if (item.type === 'system') return 'notice-item-system';
			const isActorMine = item.isActorMine;
			const eventType = String(item.eventType || '').toUpperCase();
			if (isActorMine) {
				return 'notice-item-mine';
			}
			if (eventType === 'REPLY') return 'notice-item-reply';
			if (eventType === 'LIKE') return 'notice-item-post-like';
			return 'notice-item-comment';
		},

		buildSummary(item) {
			const eventType = String(item.eventType || '').toUpperCase();
			const actorName = item.actorNickName || '有人';
			const authorName = item.contentAuthorNickName || '';
			const preview = item.contentPreview || '';
			const isMine = item.isActorMine === true;
			const postTarget = authorName ? `${authorName}的动态` : '的动态';
			const postWord = preview ? `${postTarget}：${preview}` : postTarget;
			if (item.type === 'system') {
				return item.title ? `${item.title}` : (item.desc || '系统消息');
			}
			if (eventType === 'LIKE') {
				return isMine
					? `你赞了${postWord}`
					: `${actorName} 赞了${postWord}`;
			}
			if (eventType === 'COMMENT') {
				return isMine
					? `你评论了${postWord}`
					: `${actorName} 评论了${postWord}`;
			}
			if (eventType === 'REPLY') {
				return isMine
					? `你回复了${postWord}`
					: `${actorName} 回复了${postWord}`;
			}
			return `${actorName} 互动了你的${postWord}`;
		},

		stripLegacyPrefix(text, eventType, isMine) {
			if (!text) return '';
			let value = String(text).trim();
			const patterns = isMine
				? [/^我赞了[：:]\s*/, /^我评论了[：:]\s*/, /^我回复了[：:]\s*/, /^我发起了互动[：:]\s*/]
				: [/^赞了你的内容[：:]\s*/, /^评论了你[：:]\s*/, /^回复了你[：:]\s*/];
			let changed = true;
			while (changed) {
				changed = false;
				for (const p of patterns) {
					if (p.test(value)) {
						value = value.replace(p, '');
						changed = true;
					}
				}
			}
			return value.trim();
		},

		decorateNotification(item) {
			const eventType = String(item.eventType || '').toUpperCase();
			const isMine = item.isActorMine === true;
			const rawComment = eventType === 'LIKE' ? '' : (item.commentText || '');
			const commentText = this.stripLegacyPrefix(rawComment, eventType, isMine);
			return {
				...item,
				commentText,
				summaryText: this.buildSummary(item)
			};
		},

		async reloadMessages() {
			this.pageNum = 1;
			this.notifications = [];
			await this.loadMessages();
		},

		async loadMessages() {
			if (this.loading) return;
			this.loading = true;
			try {
				const res = await getMessageList({
					category: this.activeTab,
					pageNum: this.pageNum,
					pageSize: this.pageSize
				}, { loading: false, silent: true });
				const rows = (res.rows || []).map(item => ({
					...item,
					timeText: formatRelativeTime(item.createdAt)
				})).map(item => this.decorateNotification(item));
				this.total = Number(res.total || 0);
				this.notifications = this.pageNum === 1 ? rows : this.notifications.concat(rows);
			} catch (e) {
				console.error('加载消息失败:', e);
				uni.showToast({ title: e.message || '加载消息失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		loadMore() {
			if (!this.hasMore || this.loading) return;
			this.pageNum += 1;
			this.loadMessages();
		},

		switchTab(tab) {
			if (this.activeTab === tab) return;
			this.activeTab = tab;
			this.reloadMessages();
		},

		async loadUnreadCount() {
			try {
				this.unreadCount = await getUnreadMessageCount({ loading: false, silent: true });
			} catch (e) {
				console.error('加载未读消息数失败:', e);
			}
		},

		goBack() {
			const pages = getCurrentPages();
			if (pages.length > 1) {
				uni.navigateBack();
				return;
			}
			uni.switchTab({ url: '/pages/profile/profile' });
		},

		async openNotification(item) {
			if (!item.read) {
				try {
					await markMessageRead(item.id, { loading: false, silent: true });
					item.read = true;
					this.loadUnreadCount();
				} catch (e) {
					console.error('标记消息已读失败:', e);
				}
			}
			if (item.postId) {
				reportMoodView(item.postId);
				uni.navigateTo({ url: `/pages/space/detail?id=${item.postId}` });
				return;
			}
			uni.showToast({ title: item.title, icon: 'none' });
		}
	}
};
</script>

<style lang="scss" scoped>
.settings-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: linear-gradient(180deg, #fffcfd 0%, #f9f4fb 100%);
}

.header {
	flex-shrink: 0;
	background: rgba(255, 252, 253, 0.92);
	border-bottom: 1rpx solid #eee4ef;
}

.header-inner {
	position: relative;
	height: 112rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-back-btn {
	position: absolute;
	left: 20rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-back-icon {
	font-size: 52rpx;
	color: #7d6e81;
	line-height: 1;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
}

.notice-page {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	padding: 24rpx;
	gap: 20rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.notice-intro {
	background: linear-gradient(135deg, rgba(143, 111, 176, 0.08) 0%, rgba(201, 182, 247, 0.08) 100%);
	border: 1rpx solid #e8deff;
	border-radius: 20rpx;
	padding: 20rpx 24rpx;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	box-sizing: border-box;
}

.notice-intro-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #4a5598;
}

.notice-intro-line {
	font-size: 24rpx;
	color: #5a6194;
	line-height: 1.6;
}

.notice-intro-strong {
	color: #4a5598;
	font-weight: 600;
}

.notice-tab-wrap {
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
}

.notice-tab-btn {
	border: 1rpx solid #e8deff;
	background: #fffefe;
	color: #8f6fb0;
	border-radius: 32rpx;
	padding: 12rpx 24rpx;
	font-size: 24rpx;
}

.notice-tab-btn.active {
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	border-color: transparent;
	color: #ffffff;
}

.notice-list-wrap {
	flex: 1;
	height: 0;
	min-height: 0;
	background: #fffefe;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	padding: 16rpx;
	box-sizing: border-box;
}

.notice-empty {
	text-align: center;
	color: #9f92a2;
	font-size: 26rpx;
	padding: 40rpx 0;
}

.notice-item {
	padding: 20rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #f1ebf6;
	background: #fafbff;
	border-radius: 20rpx;
}

.notice-item:last-child {
	margin-bottom: 0;
}

.notice-item:active {
	opacity: 0.92;
}

.notice-item-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 22rpx;
	color: #9f92a2;
}

.notice-item-tag {
	border-radius: 20rpx;
	padding: 4rpx 16rpx;
	background: #e9edff;
	color: #6271c4;
}

.notice-item-system .notice-item-tag {
	background: #e9f5ff;
	color: #3182bd;
}

.notice-item-mine .notice-item-tag {
	background: #f0f5ff;
	color: #5a7bd4;
}

.notice-item-reply .notice-item-tag {
	background: #ffeef6;
	color: #c54778;
}

.notice-item-post-like .notice-item-tag {
	background: #fff1f0;
	color: #dd5a63;
}

.notice-item-comment-like .notice-item-tag {
	background: #fff7e8;
	color: #d48806;
}

.notice-item-time {
	font-size: 22rpx;
	color: #9f92a2;
}

.notice-item-summary {
	display: block;
	margin-top: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
	line-height: 1.5;
}

.notice-item-summary-text {
	font-weight: 700;
}

.notice-item-comment {
	display: block;
	margin-top: 12rpx;
	font-size: 26rpx;
	color: #4a4a4a;
	background: #f3f4f9;
	border-left: 6rpx solid #8f6fb0;
	padding: 14rpx 18rpx;
	border-radius: 12rpx;
	line-height: 1.55;
	word-break: break-all;
}

.notice-load-more {
	text-align: center;
	color: #8f6fb0;
	font-size: 26rpx;
	padding: 24rpx;
}

.notice-load-more.muted {
	color: #bbbbbb;
}
</style>
