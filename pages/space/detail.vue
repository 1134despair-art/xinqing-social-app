<template>
	<view class="app-container">
		<view class="header" :style="headerStyle">
			<view class="header-inner">
				<view class="header-back" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="page-title">动态详情</text>
			</view>
		</view>

		<scroll-view class="content-flex" scroll-y :scroll-into-view="scrollIntoView" :style="{ height: scrollHeight }" @scroll="onListScroll">
			<view v-if="loading" class="loading-wrap">
				<text>加载中...</text>
			</view>

			<template v-else-if="mood">
				<view class="detail-card">
					<view class="post-header">
						<UserAvatar class="post-avatar" :avatar="mood.avatar" :size="80" @click.stop="openUserProfilePage(mood)" />
						<view class="post-user-info">
							<view class="post-username">{{ mood.nickname || '匿名用户' }}</view>
							<view class="post-time">{{ formatTime(mood.createTime) }}</view>
						</view>
					</view>

					<view v-if="isTextMood(mood)" class="post-content">
						<text>{{ getMoodText(mood) }}</text>
					</view>

					<view v-else-if="isVideoMood(mood) && getMoodText(mood)" class="post-content">
						<text>{{ getMoodText(mood) }}</text>
					</view>

					<VoicePlayer v-if="isVoiceMood(mood) && mood.voiceUrl" :src="mood.voiceUrl" :duration="mood.voiceDuration" class="detail-voice" />

					<MoodVideo
						v-if="isVideoReady(mood)"
						:src="mood.videoUrl"
						:poster="mood.videoCoverUrl"
						:mood-id="mood.moodId"
						class="post-video"
					/>

					<view v-if="isVideoMood(mood) && !isVideoReady(mood)" class="post-media-tip">
						<text>{{ getVideoStatusText(mood) }}</text>
					</view>

					<view v-if="mood.tags && mood.tags.length" class="post-tags">
						<view v-for="tag in mood.tags" :key="tag.tagId" class="post-tag-chip">
							<text class="post-tag-text">{{ tag.tagName }}</text>
						</view>
					</view>

					<view class="post-actions">
						<view class="action-btn" :class="{ 'is-liked': mood.liked }" @click="handleLike">
							<IconFont :name="mood.liked ? 'heart' : 'heart-outline'" :color="mood.liked ? '#ea6f88' : '#9f92a2'"
								:size="44" />
							<text>{{ mood.likeCount || 0 }}</text>
						</view>
						<view class="action-btn" @click="focusComment">
							<IconFont name="comment-outline" color="#9f92a2" :size="44" />
							<text>{{ mood.commentCount || 0 }}</text>
						</view>
						<view class="action-btn favorite-btn" @click="toggleFavorite">
							<IconFont :name="mood.favorited ? 'bookmark' : 'bookmark-outline'" color="#8f6fb0" :size="44" />
							<text class="favorite-text">{{ mood.favorited ? '已收藏' : '收藏' }}</text>
						</view>
						<view v-if="canReportMood" class="action-btn report-btn" @click="openPostReport">
							<IconFont name="alert-circle-outline" color="#9f92a2" :size="44" />
							<text>举报</text>
						</view>
					</view>
				</view>

				<view class="comment-panel">
					<view class="comment-title">评论列表（{{ comments.length }}）</view>
					<view v-if="comments.length === 0" class="comment-empty">
						暂无评论，来发表第一条评论吧
					</view>
					<view v-for="item in comments" :id="'comment-' + item.commentId" :key="item.commentId" class="comment-item"
						:class="{ 'comment-item-highlight': highlightCommentId === item.commentId }"
						@click="replyToComment(item.nickname)">
						<view class="comment-avatar">
							<UserAvatar :avatar="item.avatar" :size="60" @click.stop="openUserProfilePage(item)" />
						</view>
						<view class="comment-info">
							<view class="comment-user">{{ item.nickname || '匿名用户' }}</view>
							<view class="comment-content">{{ item.content }}</view>
							<view class="comment-actions">
								<view class="comment-like-entry" :class="{ active: item.liked }" @click.stop="handleCommentLike(item)">
									<IconFont :name="item.liked ? 'heart' : 'heart-outline'" :color="item.liked ? '#ff6b81' : '#8a8fa3'"
										:size="36" />
									<text>{{ item.likeCount || 0 }}</text>
								</view>
								<text class="comment-reply-entry" @click.stop="replyToComment(item.nickname)">回复</text>
								<text v-if="canReportComment(item)" class="comment-report-entry" @click.stop="openCommentReport(item)">举报</text>
							</view>
						</view>
					</view>
				</view>
			</template>

			<view v-else class="empty-wrap">未找到该动态内容</view>
		</scroll-view>

		<view v-if="mood" class="comment-editor" :style="fixedBottomStyle">
			<input class="comment-input" v-model="commentText" maxlength="120" :placeholder="commentPlaceholder"
				:focus="commentInputFocus" :adjust-position="false"
				@keyboardheightchange="onKeyboardHeightChange"
				@blur="onCommentInputBlur" />
			<button v-if="replyTargetName" class="comment-cancel-reply" @click="clearReplyTarget">取消回复</button>
			<button class="comment-submit" @click="submitComment">发送</button>
		</view>

		<ReportPopup :visible="reportVisible" :contentId="reportContentId" :commentId="reportCommentId"
			:reportedUserId="reportedUserId" @close="onReportClose" />

		<MoodVideoFullscreen />
	</view>
</template>

<script>
import { getMoodDetail } from '@/api/mood';
import { getCommentList, addComment } from '@/api/comment';
import { toggleLike } from '@/api/like';
import { toggleFavorite as toggleFavoriteApi } from '@/api/favorite';
import { getUserProfile } from '@/api/user';
import { formatRelativeTime } from '@/utils/time';
import { getMoodText, getVideoStatusText, isTextMood, isVideoMood, isVideoReady, isVoiceMood } from '@/utils/moodContent';
import { reportMoodView } from '@/utils/moodView';
import IconFont from '@/components/IconFont.vue';
import ReportPopup from '@/components/ReportPopup.vue';
import VoicePlayer from '@/components/VoicePlayer.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import MoodVideo from '@/components/MoodVideo.vue';
import MoodVideoFullscreen from '@/components/MoodVideoFullscreen.vue';
import { closeMoodVideo, requestMoodVideoRectSync } from '@/utils/moodVideoPortal';
import { moodVideoBackMixin } from '@/utils/moodVideoBack';
import { keyboardMixin } from '@/utils/keyboard';
import { openUserProfile } from '@/utils/userProfileNav';

export default {
	name: 'MoodDetail',
	components: { IconFont, ReportPopup, VoicePlayer, UserAvatar, MoodVideo, MoodVideoFullscreen },
	mixins: [keyboardMixin, moodVideoBackMixin],
	data() {
		return {
			moodId: 0,
			mood: null,
			comments: [],
			loading: false,
			currentUserId: 0,
			commentText: '',
			replyTargetName: '',
			commentInputFocus: false,
			reportVisible: false,
			reportContentId: 0,
			reportCommentId: 0,
			reportedUserId: 0,
			highlightCommentId: 0,
			scrollIntoView: '',
			scrollHeight: '0px',
			statusBarHeight: 0,
			navBarHeight: 52
		};
	},
	computed: {
		commentPlaceholder() {
			return this.replyTargetName ? `回复 ${this.replyTargetName}...` : '输入评论内容...';
		},
		headerStyle() {
			return {
				paddingTop: `${this.statusBarHeight}px`
			};
		},
		headerTotalHeight() {
			return this.statusBarHeight + this.navBarHeight;
		},
		canReportMood() {
			return Boolean(this.mood && this.currentUserId && !this.isCurrentUser(this.mood.userId));
		}
	},
	watch: {
		keyboardHeight() {
			this.calcScrollHeight();
		}
	},
	onLoad(options) {
		this.initLayout();
		this.moodId = Number(options.id) || 0;
		this.highlightCommentId = Number(options.commentId) || 0;
		this.calcScrollHeight();
		if (this.moodId) {
			this.loadCurrentUser();
			this.loadDetail();
			this.loadComments();
		}
	},
	onReady() {
		this.calcScrollHeight();
	},
	onHide() {
		closeMoodVideo();
	},
	onUnload() {
		closeMoodVideo();
	},
	methods: {
		onListScroll(e) {
			requestMoodVideoRectSync(e && e.detail);
		},

		initLayout() {
			try {
				const sys = uni.getSystemInfoSync();
				this.statusBarHeight = sys.statusBarHeight || 0;
				// 与 H5 header 52px 对齐（104rpx @ 750 设计稿）
				this.navBarHeight = typeof uni.upx2px === 'function' ? uni.upx2px(104) : 52;
			} catch (e) {
				this.statusBarHeight = 0;
				this.navBarHeight = 52;
			}
		},

		calcScrollHeight() {
			try {
				const sys = uni.getSystemInfoSync();
				const safeBottom = sys.safeAreaInsets?.bottom || 0;
				const editorPx = 56 + safeBottom;
				const keyboardPx = this.keyboardHeight || 0;
				const h = sys.windowHeight - this.headerTotalHeight - editorPx - keyboardPx;
				this.scrollHeight = `${Math.max(h, 200)}px`;
			} catch (e) {
				this.scrollHeight = `calc(100vh - ${this.headerTotalHeight + 120}px)`;
			}
		},

		onCommentInputBlur() {
			this.commentInputFocus = false;
			this.onKeyboardBlur();
		},

		goBack() {
			uni.navigateBack();
		},

		formatTime(dateStr) {
			return formatRelativeTime(dateStr);
		},

		getMoodText,
		getVideoStatusText,
		isTextMood,
		isVoiceMood,
		isVideoMood,
		isVideoReady,

		isCurrentUser(userId) {
			return String(userId || '') === String(this.currentUserId || '');
		},

		openUserProfilePage(item) {
			openUserProfile(item, this.currentUserId);
		},

		canReportComment(item) {
			return Boolean(item && this.currentUserId && !this.isCurrentUser(item.userId));
		},

		async loadCurrentUser() {
			try {
				const res = await getUserProfile();
				if (res.data) this.currentUserId = res.data.userId;
			} catch (e) {
				console.error('获取用户信息失败:', e);
			}
		},

		async loadDetail() {
			this.loading = true;
			try {
				const res = await getMoodDetail(this.moodId, { loading: false });
				this.mood = res.data || res || null;
				if (!this.mood || !this.mood.moodId) {
					this.mood = null;
				}
			} catch (e) {
				this.mood = null;
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},

		async loadComments() {
			try {
				const res = await getCommentList(
					this.moodId,
					{ pageNum: 1, pageSize: 100 },
					{ loading: false }
				);
				this.comments = res.rows || [];
				if (this.mood) {
					this.mood.commentCount = res.total ?? this.comments.length;
				}
				this.$nextTick(() => {
					if (this.highlightCommentId) {
						this.scrollIntoView = `comment-${this.highlightCommentId}`;
					}
				});
			} catch (e) {
				console.error('加载评论失败:', e);
			}
		},

		async handleLike() {
			if (!this.mood) return;
			reportMoodView(this.moodId, this.mood);
			const prevLiked = this.mood.liked;
			const prevCount = this.mood.likeCount || 0;
			this.mood.liked = !prevLiked;
			this.mood.likeCount = prevLiked ? prevCount - 1 : prevCount + 1;
			try {
				const res = await toggleLike(this.moodId, '0');
				this.mood.liked = res.liked;
				this.mood.likeCount = res.likeCount;
			} catch (e) {
				this.mood.liked = prevLiked;
				this.mood.likeCount = prevCount;
				uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
			}
		},

		async handleCommentLike(item) {
			const prevLiked = item.liked;
			const prevCount = item.likeCount || 0;
			item.liked = !prevLiked;
			item.likeCount = prevLiked ? prevCount - 1 : prevCount + 1;
			try {
				const res = await toggleLike(item.commentId, '1');
				item.liked = res.liked;
				item.likeCount = res.likeCount;
			} catch (e) {
				item.liked = prevLiked;
				item.likeCount = prevCount;
				uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
			}
		},

		focusComment() {
			reportMoodView(this.moodId, this.mood);
			this.commentInputFocus = true;
		},

		replyToComment(name) {
			this.replyTargetName = name || '';
			this.focusComment();
		},

		clearReplyTarget() {
			this.replyTargetName = '';
		},

		async submitComment() {
			const text = this.commentText.trim();
			if (!text) {
				uni.showToast({ title: '请输入评论内容', icon: 'none' });
				return;
			}
			reportMoodView(this.moodId, this.mood);
			const content = this.replyTargetName
				? `回复 ${this.replyTargetName}：${text}`
				: text;
			try {
				await addComment({ moodId: this.moodId, content });
				this.commentText = '';
				this.clearReplyTarget();
				uni.showToast({ title: '评论成功', icon: 'success' });
				await this.loadComments();
			} catch (e) {
				console.error('评论失败:', e);
			}
		},

		async toggleFavorite() {
			if (!this.mood) return;
			const prevFavorited = this.mood.favorited;
			this.mood.favorited = !prevFavorited;
			try {
				const res = await toggleFavoriteApi(this.moodId);
				this.mood.favorited = res.favorited;
				uni.showToast({
					title: res.favorited ? '已收藏' : '已取消收藏',
					icon: 'none'
				});
			} catch (e) {
				this.mood.favorited = prevFavorited;
			}
		},

		openPostReport() {
			if (!this.mood) return;
			if (!this.canReportMood) {
				uni.showToast({ title: '不能举报自己发布的内容', icon: 'none' });
				return;
			}
			this.reportContentId = this.moodId;
			this.reportCommentId = 0;
			this.reportedUserId = this.mood.userId;
			this.reportVisible = true;
		},

		openCommentReport(item) {
			if (!this.canReportComment(item)) {
				uni.showToast({ title: '不能举报自己的评论', icon: 'none' });
				return;
			}
			this.reportContentId = 0;
			this.reportCommentId = item.commentId;
			this.reportedUserId = item.userId;
			this.reportVisible = true;
		},

		onReportClose() {
			this.reportVisible = false;
			this.reportCommentId = 0;
		}
	}
};
</script>

<style lang="scss" scoped>
.app-container {
	width: 100%;
	min-height: 100vh;
	height: 100vh;
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
	height: 104rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-back {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	padding: 0 24rpx;
	min-width: 88rpx;
}

.back-icon {
	font-size: 56rpx;
	color: #57465b;
	line-height: 1;
	font-weight: 300;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
	line-height: 1.2;
}

.content-flex {
	width: 100%;
	box-sizing: border-box;
}

.loading-wrap,
.empty-wrap {
	text-align: center;
	color: #9f92a2;
	font-size: 28rpx;
	padding: 80rpx 0;
}

.detail-card {
	margin: 24rpx;
	background: #fffefe;
	border-radius: 28rpx;
	padding: 28rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.post-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.post-avatar {
	margin-right: 20rpx;
	flex-shrink: 0;
}

.post-user-info {
	flex: 1;
	min-width: 0;
}

.post-username {
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
}

.post-time {
	font-size: 24rpx;
	color: #9f92a2;
	margin-top: 4rpx;
}

.post-content {
	font-size: 30rpx;
	line-height: 1.7;
	color: #57465b;
	word-break: break-all;
}

.detail-voice {
	margin-top: 24rpx;
}

.post-video {
	position: relative;
	width: 100%;
	height: 400rpx;
	margin-top: 24rpx;
	border-radius: 24rpx;
	overflow: hidden;
}

.post-media-tip {
	margin-top: 24rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: #fbf7fb;
	color: #9f92a2;
	font-size: 26rpx;
	text-align: center;
}

.media-player {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: block;
	background: #000000;
}

.post-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.post-tag-chip {
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
	background: rgba(143, 111, 176, 0.12);
}

.post-tag-text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.post-actions {
	margin-top: 28rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #f3f3f3;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 36rpx;
}

.action-btn {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8rpx;
	font-size: 26rpx;
	color: #9f92a2;
}

.action-btn.is-liked text {
	color: #ea6f88;
}

.favorite-btn {
	color: #8f6fb0;
}

.favorite-btn :deep(.iconfont) {
	margin-right: 4rpx;
}

.favorite-text {
	font-size: 26rpx;
	color: #8f6fb0;
}

.report-btn {
	margin-left: auto;
}

.comment-panel {
	margin: 0 24rpx 24rpx;
	background: #fffefe;
	border-radius: 28rpx;
	padding: 28rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.comment-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
	margin-bottom: 20rpx;
}

.comment-empty {
	font-size: 26rpx;
	color: #9f92a2;
	padding: 16rpx 0;
}

.comment-item {
	display: flex;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f1ebf6;
}

.comment-item:last-child {
	border-bottom: none;
}

.comment-item-highlight {
	background: #f4f6ff;
	border-radius: 20rpx;
	padding: 20rpx;
}

.comment-avatar {
	margin-right: 20rpx;
	flex-shrink: 0;
}

.comment-info {
	flex: 1;
	min-width: 0;
}

.comment-user {
	font-size: 24rpx;
	color: #7d6e81;
}

.comment-content {
	font-size: 28rpx;
	line-height: 1.6;
	color: #57465b;
	margin-top: 4rpx;
	word-break: break-all;
}

.comment-actions {
	margin-top: 8rpx;
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.comment-like-entry {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 24rpx;
	color: #8a8fa3;
}

.comment-like-entry.active {
	color: #ff6b81;
}

.comment-reply-entry {
	font-size: 24rpx;
	color: #8f6fb0;
}

.comment-report-entry {
	margin-left: auto;
	font-size: 24rpx;
	color: #8f96b8;
}

.comment-editor {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #fffefe;
	border-top: 1rpx solid #eee4ef;
	z-index: 10;
}

.comment-input {
	flex: 1;
	height: 72rpx;
	border: 1rpx solid #e3e3e3;
	border-radius: 40rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	background: #fffefe;
}

.comment-cancel-reply {
	flex-shrink: 0;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0 20rpx;
	margin: 0;
	font-size: 24rpx;
	color: #8f6fb0;
	background: #fffefe;
	border: 1rpx solid #d9defa;
	border-radius: 40rpx;

	&::after {
		border: none;
	}
}

.comment-submit {
	flex-shrink: 0;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0 28rpx;
	margin: 0;
	font-size: 26rpx;
	color: #ffffff;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	border: none;
	border-radius: 40rpx;

	&::after {
		border: none;
	}
}
</style>
