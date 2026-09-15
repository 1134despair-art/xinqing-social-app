<template>
	<view v-if="visible" class="comment-mask" @click.self="close">
		<view class="comment-popup" :class="{ show: visible }" :style="keyboardLiftStyle">
			<!-- 头部 -->
			<view class="popup-header">
				<text class="header-title">评论 ({{ totalCount }})</text>
				<text class="header-close" @click="close">✕</text>
			</view>

			<!-- 评论列表 -->
			<scroll-view class="comment-list" scroll-y>
				<view v-if="comments.length === 0 && !loading" class="comment-empty">
					<text>暂无评论，快来发表第一条吧</text>
				</view>
				<view
					v-for="item in comments"
					:key="item.commentId"
					class="comment-item"
				>
					<UserAvatar class="comment-avatar" :avatar="item.avatar" :size="64" />
					<view class="comment-body">
						<view class="comment-meta">
							<text class="comment-name">{{ item.nickname || '匿名用户' }}</text>
							<text class="comment-time">{{ formatTime(item.createTime) }}</text>
						</view>
						<text class="comment-content">{{ item.content }}</text>
						<view class="comment-footer">
							<view class="comment-like" @click="handleCommentLike(item)">
								<text>{{ item.liked ? '❤️' : '🤍' }}</text>
								<text class="like-num" :class="{ liked: item.liked }">
									{{ item.likeCount || 0 }}
								</text>
							</view>
							<view
								v-if="item.userId === currentUserId"
								class="comment-delete"
								@click="confirmDelete(item)"
							>
								<text>删除</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 输入区域 -->
			<view class="input-area">
				<input
					class="comment-input"
					v-model="inputContent"
					placeholder="写评论..."
					maxlength="200"
					confirm-type="send"
					:adjust-position="false"
					@keyboardheightchange="onKeyboardHeightChange"
					@blur="onKeyboardBlur"
					@confirm="submitComment"
				/>
				<view class="send-btn" :class="{ disabled: !inputContent.trim() }" @click="submitComment">
					<text>发送</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getCommentList, addComment, deleteComment } from '@/api/comment';
import { toggleLike } from '@/api/like';
import { formatRelativeTime } from '@/utils/time';
import { keyboardMixin } from '@/utils/keyboard';
import UserAvatar from '@/components/UserAvatar.vue';

export default {
	name: 'CommentPopup',
	components: { UserAvatar },
	mixins: [keyboardMixin],
	props: {
		visible: { type: Boolean, default: false },
		moodId: { type: Number, default: 0 },
		currentUserId: { type: Number, default: 0 }
	},
	emits: ['close', 'commentCountChange'],
	data() {
		return {
			comments: [],
			totalCount: 0,
			inputContent: '',
			loading: false
		};
	},
	watch: {
		visible(val) {
			if (val && this.moodId) {
				this.loadComments();
			}
		}
	},
	methods: {
		/** 格式化时间 */
		formatTime(dateStr) {
			return formatRelativeTime(dateStr);
		},

		/** 加载评论列表 */
		async loadComments() {
			this.loading = true;
			try {
				const res = await getCommentList(this.moodId, { pageNum: 1, pageSize: 100 });
				this.comments = res.rows || [];
				this.totalCount = res.total || 0;
			} catch (e) {
				console.error('加载评论失败:', e);
			} finally {
				this.loading = false;
			}
		},

		/** 发送评论 */
		async submitComment() {
			const content = this.inputContent.trim();
			if (!content) {
				uni.showToast({ title: '请输入评论内容', icon: 'none' });
				return;
			}
			if (content.length > 200) {
				uni.showToast({ title: '评论内容不能超过200字', icon: 'none' });
				return;
			}
			try {
				await addComment({ moodId: this.moodId, content });
				this.inputContent = '';
				uni.showToast({ title: '评论成功', icon: 'success' });
				await this.loadComments();
				this.$emit('commentCountChange', this.totalCount);
			} catch (e) {
				console.error('评论失败:', e);
			}
		},

		/** 评论点赞 */
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

		/** 确认删除评论 */
		confirmDelete(item) {
			uni.showModal({
				title: '提示',
				content: '确定删除这条评论吗？',
				success: (res) => {
					if (res.confirm) {
						this.doDelete(item);
					}
				}
			});
		},

		/** 执行删除评论 */
		async doDelete(item) {
			try {
				await deleteComment(item.commentId);
				uni.showToast({ title: '删除成功', icon: 'success' });
				await this.loadComments();
				this.$emit('commentCountChange', this.totalCount);
			} catch (e) {
				uni.showToast({ title: '删除失败，请稍后重试', icon: 'none' });
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
.comment-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.5);
	z-index: 999;
	display: flex;
	align-items: flex-end;
}
.comment-popup {
	width: 100%;
	max-height: 70vh;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	display: flex;
	flex-direction: column;
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

/* 评论列表 */
.comment-list {
	flex: 1;
	max-height: 50vh;
	padding: 0 32rpx;
}
.comment-empty {
	text-align: center;
	padding: 80rpx 0;
	font-size: 28rpx;
	color: #9f92a2;
}
.comment-item {
	display: flex;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f7f1f8;
}
.comment-avatar {
	margin-right: 20rpx;
	flex-shrink: 0;
}
.comment-body { flex: 1; min-width: 0; }
.comment-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8rpx;
}
.comment-name { font-size: 26rpx; font-weight: 600; color: #57465b; }
.comment-time { font-size: 22rpx; color: #bbb; }
.comment-content { font-size: 28rpx; color: #57465b; line-height: 1.6; word-break: break-all; }
.comment-footer {
	display: flex;
	align-items: center;
	margin-top: 12rpx;
	gap: 32rpx;
}
.comment-like {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 24rpx;
}
.like-num { color: #9f92a2; }
.like-num.liked { color: #e74c3c; }
.comment-delete { font-size: 24rpx; color: #e74c3c; }

/* 输入区域 */
.input-area {
	display: flex;
	align-items: center;
	padding: 16rpx 32rpx;
	border-top: 1rpx solid #f0f2f5;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.comment-input {
	flex: 1;
	height: 72rpx;
	background: #f7f1f8;
	border-radius: 36rpx;
	padding: 0 28rpx;
	font-size: 28rpx;
}
.send-btn {
	margin-left: 16rpx;
	padding: 14rpx 32rpx;
	background: linear-gradient(135deg, #5B86E5 0%, #36D1DC 100%);
	border-radius: 36rpx;
	color: #fff;
	font-size: 28rpx;
	font-weight: 600;
	&.disabled { opacity: 0.5; }
}
</style>
