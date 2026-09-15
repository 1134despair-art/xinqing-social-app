<template>
	<view class="page-shell tab-page">
		<view class="auth-card">
			<view class="header">
				<view class="header-inner">
					<text class="page-title">盗梦空间</text>
				</view>
			</view>

			<scroll-view class="content-flex" scroll-y :lower-threshold="120" @scroll="onListScroll" @scrolltolower="onReachBottom">
			<view class="tab-scroll-inner">
			<view class="search-wrap">
				<input
					class="search-input"
					v-model="keyword"
					placeholder="搜索内容或用户（空格分条件）"
					confirm-type="search"
					:adjust-position="false"
					@confirm="onSearchConfirm"
				/>
			</view>

			<view class="sort-tabs">
				<view
					class="sort-tab"
					:class="{ active: sortMode === 'latest' }"
					@click="switchSort('latest')"
				>
					<text>最新</text>
				</view>
				<view
					class="sort-tab"
					:class="{ active: sortMode === 'todayHot' }"
					@click="switchSort('todayHot')"
				>
					<text>当天最热</text>
				</view>
				<view
					class="sort-tab"
					:class="{ active: sortMode === 'historyHot' }"
					@click="switchSort('historyHot')"
				>
					<text>历史最热</text>
				</view>
			</view>
			<view class="sort-hint">
				<text>{{ sortHintText }}</text>
			</view>

			<view v-if="loadError && displayList.length === 0" class="home-empty-tip error-tip" @click="reloadData">
				<text>😥 加载失败，点击重试</text>
			</view>

			<view
				v-else-if="!loading && loaded && displayList.length === 0"
				class="home-empty-tip"
				:class="{ 'home-empty-tip--link': !keyword }"
				@click="onEmptyTipClick"
			>
				<text>{{ keyword ? '没有匹配的动态' : '还没有人发布心情，快来发第一条吧' }}</text>
			</view>

			<view v-else class="post-list">
				<view
					v-for="item in displayList"
					:key="item.moodId"
					class="post-card"
				>
					<view class="post-header">
						<UserAvatar class="post-avatar" :avatar="item.avatar" :size="72" @click.stop="openUserProfilePage(item)" />
						<view class="post-info">
							<view class="post-name">{{ item.nickname || '匿名用户' }}</view>
							<view class="post-meta">
								<text v-if="item.age">{{ item.age }}岁</text>
								<text v-if="item.age && item.bio"> · </text>
								<text v-if="item.bio" class="post-bio-inline">{{ item.bio }}</text>
								<text v-if="item.age || item.bio"> · </text>
								{{ formatTime(item.createTime) }}
							</view>
						</view>
					</view>

					<view v-if="isTextMood(item)" class="post-text">
						<MoodTextExpand :text="getMoodText(item)" />
					</view>

					<view v-else-if="isVideoMood(item) && getMoodText(item)" class="post-text">
						<MoodTextExpand :text="getMoodText(item)" />
					</view>

					<VoicePlayer v-if="isVoiceMood(item) && item.voiceUrl" :src="item.voiceUrl" :duration="item.voiceDuration" class="post-voice" />

					<MoodVideo
						v-if="isVideoReady(item)"
						:src="item.videoUrl"
						:poster="item.videoCoverUrl"
						:mood-id="item.moodId"
						class="post-video"
					/>

					<view v-if="isVideoMood(item) && !isVideoReady(item)" class="post-media-tip">
						<text>{{ getVideoStatusText(item) }}</text>
					</view>

					<view v-if="item.tags && item.tags.length" class="post-tags">
						<view
							v-for="tag in item.tags"
							:key="tag.tagId"
							class="post-tag-chip"
							:style="{ background: getTagColor(tag.tagId) }"
						>
							<text class="post-tag-text">{{ tag.tagName }}</text>
						</view>
					</view>

					<view class="post-footer">
						<view
							class="post-action"
							:class="{ 'is-liked': item.liked }"
							@click="handleLike(item)"
						>
							<IconFont
								:name="item.liked ? 'heart' : 'heart-outline'"
								:color="item.liked ? '#ea6f88' : '#9f92a2'"
								:size="44"
							/>
							<text>{{ item.likeCount || 0 }}</text>
						</view>
						<view class="post-action" @click="goPostDetail(item)">
							<IconFont name="comment-outline" color="#9f92a2" :size="44" />
							<text>{{ item.commentCount || 0 }}</text>
						</view>
						<view class="post-action detail-action" @click="toggleFavorite(item)">
							<IconFont
								:name="item.favorited ? 'bookmark' : 'bookmark-outline'"
								color="#8f6fb0"
								:size="44"
							/>
							<text>{{ item.favorited ? '已收藏' : '收藏' }}</text>
						</view>
					</view>
				</view>

				<view v-if="loadingMore" class="load-end-tip">
					<text>加载中...</text>
				</view>
				<view v-if="noMore && displayList.length > 0 && !keyword" class="load-end-tip">
					<text>已到底，没有更多了</text>
				</view>
			</view>
			</view>
			</scroll-view>
		</view>

		<AppTabBar :current="1" />
		<!-- 全屏视频盖住页面与 tabBar -->
		<MoodVideoFullscreen />
	</view>
</template>

<script>
import { getMoodList } from '@/api/mood';
import { toggleLike } from '@/api/like';
import { toggleFavorite as toggleFavoriteApi } from '@/api/favorite';
import { getUserProfile } from '@/api/user';
import { formatRelativeTime } from '@/utils/time';
import { initCustomTabBar } from '@/utils/tabBar';
import { getMoodText, getVideoStatusText, isTextMood, isVideoMood, isVideoReady, isVoiceMood } from '@/utils/moodContent';
import { reportMoodView } from '@/utils/moodView';
import IconFont from '@/components/IconFont.vue';
import AppTabBar from '@/components/AppTabBar.vue';
import VoicePlayer from '@/components/VoicePlayer.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import MoodVideo from '@/components/MoodVideo.vue';
import MoodVideoFullscreen from '@/components/MoodVideoFullscreen.vue';
import MoodTextExpand from '@/components/MoodTextExpand.vue';
import { closeMoodVideo, requestMoodVideoRectSync } from '@/utils/moodVideoPortal';
import { moodVideoBackMixin } from '@/utils/moodVideoBack';
import { openUserProfile } from '@/utils/userProfileNav';

const TAG_COLORS = [
	'rgba(102,126,234,0.12)', 'rgba(118,75,162,0.12)', 'rgba(255,154,139,0.15)',
	'rgba(255,183,77,0.15)', 'rgba(129,199,132,0.15)', 'rgba(186,104,200,0.15)',
	'rgba(255,138,101,0.15)', 'rgba(77,182,172,0.15)', 'rgba(149,117,205,0.15)',
	'rgba(255,213,79,0.15)', 'rgba(100,181,246,0.15)', 'rgba(240,98,146,0.15)'
];

const SORT_API_MAP = {
	latest: 'latest',
	todayHot: 'hot',
	historyHot: 'allTimeHot'
};

export default {
	name: 'SquarePage',
	components: { IconFont, AppTabBar, VoicePlayer, UserAvatar, MoodVideo, MoodVideoFullscreen, MoodTextExpand },
	mixins: [moodVideoBackMixin],
	data() {
		return {
			keyword: '',
			sortMode: 'latest',
			moodList: [],
			pageNum: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			loaded: false,
			loadingMore: false,
			loadError: false,
			noMore: false,
			currentUserId: 0
		};
	},
	computed: {
		sortHintText() {
			if (this.sortMode === 'latest') {
				return '前3条按热度（点赞+评论）置顶，其余按发布时间降序展示';
			}
			if (this.sortMode === 'todayHot') {
				return '按今日热度（点赞+评论权重）排序';
			}
			return '按历史累计热度（点赞+评论权重）排序';
		},
		/** 搜索由接口 keyword 参数处理 */
		displayList() {
			return this.moodList.slice();
		}
	},
	onLoad() {
		this.loadCurrentUser();
	},
	onShow() {
		initCustomTabBar();
		this.reloadData();
	},
	onHide() {
		closeMoodVideo();
	},
	onReady() {
		initCustomTabBar();
	},
	onPullDownRefresh() {
		this.reloadData();
	},
	onReachBottom() {
		if (!this.keyword) {
			this.loadMore();
		}
	},
	methods: {
		onListScroll(e) {
			requestMoodVideoRectSync(e && e.detail);
		},

		getTodayKey() {
			const d = new Date();
			return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
		},

		getDateKey(dateStr) {
			if (!dateStr) return '';
			const d = new Date(dateStr.replace(/-/g, '/'));
			if (Number.isNaN(d.getTime())) return '';
			return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
		},

		getSearchTokens(value) {
			return value.toLowerCase().replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
		},

		getHotScore(item) {
			return (item.likeCount || 0) * 2 + (item.commentCount || 0);
		},

		/** H5 latest：前3条热度置顶，其余按时间 */
		applyLatestSort(list) {
			const source = list.slice();
			const byHot = source.slice().sort((a, b) => {
				const diff = this.getHotScore(b) - this.getHotScore(a);
				if (diff !== 0) return diff;
				return (b.createTime || '').localeCompare(a.createTime || '');
			});
			const hotTopIds = new Set(byHot.slice(0, 3).map(i => i.moodId));
			const hotTop = byHot.slice(0, 3);
			const rest = source
				.filter(i => !hotTopIds.has(i.moodId))
				.sort((a, b) => (b.createTime || '').localeCompare(a.createTime || ''));
			return hotTop.concat(rest);
		},

		processRows(rows) {
			let list = rows;
			if (this.sortMode === 'latest' && this.pageNum === 1) {
				list = this.applyLatestSort(list);
			}
			return list;
		},

		async loadCurrentUser() {
			try {
				const res = await getUserProfile();
				if (res.data) this.currentUserId = res.data.userId;
			} catch (e) {
				console.error('获取用户信息失败:', e);
			}
		},

		async loadMoodList() {
			if (this.loading) return;
			this.loading = true;
			this.loadError = false;
			try {
				const res = await getMoodList({
					sortMode: SORT_API_MAP[this.sortMode] || 'time',
					pageNum: this.pageNum,
					pageSize: this.pageSize,
					keyword: this.keyword.trim() || undefined
				});
				const rows = this.processRows(res.rows || []);
				this.total = res.total || 0;
				if (this.pageNum === 1) {
					await this.$nextTick();
					this.moodList = rows;
				} else {
					this.moodList = this.moodList.concat(rows);
				}
				this.noMore = this.moodList.length >= this.total;
				this.loaded = true;
			} catch (e) {
				console.error('加载心情列表失败:', e);
				this.loadError = true;
			} finally {
				this.loading = false;
				this.loadingMore = false;
				uni.stopPullDownRefresh();
			}
		},

		switchSort(mode) {
			if (this.sortMode === mode) return;
			this.sortMode = mode;
			this.reloadData();
		},

		reloadData() {
			this.pageNum = 1;
			this.noMore = false;
			this.loadError = false;
			this.loadMoodList();
		},

		loadMore() {
			if (this.noMore || this.loadingMore || this.loading) return;
			this.loadingMore = true;
			this.pageNum++;
			this.loadMoodList();
		},

		onSearchConfirm() {
			this.reloadData();
		},

		onEmptyTipClick() {
			if (this.keyword) return;
			uni.switchTab({ url: '/pages/publish/publish' });
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

		getTagColor(tagId) {
			return TAG_COLORS[(tagId - 1) % TAG_COLORS.length];
		},

		openUserProfilePage(item) {
			openUserProfile(item, this.currentUserId);
		},

		async handleLike(item) {
			reportMoodView(item.moodId, item);
			const prevLiked = item.liked;
			const prevCount = item.likeCount || 0;
			item.liked = !prevLiked;
			item.likeCount = prevLiked ? prevCount - 1 : prevCount + 1;
			try {
				const res = await toggleLike(item.moodId, '0');
				item.liked = res.liked;
				item.likeCount = res.likeCount;
			} catch (e) {
				item.liked = prevLiked;
				item.likeCount = prevCount;
				uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
			}
		},

		async toggleFavorite(item) {
			const prevFavorited = item.favorited;
			item.favorited = !prevFavorited;
			try {
				const res = await toggleFavoriteApi(item.moodId);
				item.favorited = res.favorited;
				uni.showToast({
					title: res.favorited ? '已收藏' : '已取消收藏',
					icon: 'none'
				});
			} catch (e) {
				item.favorited = prevFavorited;
			}
		},

		goPostDetail(item) {
			reportMoodView(item.moodId, item);
			uni.navigateTo({
				url: `/pages/space/detail?id=${item.moodId}`
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.header-inner {
	height: 104rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
}

.search-wrap {
	padding: 24rpx 32rpx 0;
}

.search-input {
	width: 100%;
	height: 72rpx;
	box-sizing: border-box;
	border: 1rpx solid #e5d7ea;
	background: #fffefe;
	border-radius: 24rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #57465b;
}

.sort-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	padding: 20rpx 32rpx 0;
}

.sort-tab {
	padding: 10rpx 24rpx;
	border-radius: 32rpx;
	border: 1rpx solid #e8deff;
	background: #fffefe;
}

.sort-tab text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.sort-tab.active {
	background: #8f6fb0;
	border-color: #8f6fb0;
}

.sort-tab.active text {
	color: #ffffff;
}

.sort-hint {
	padding: 12rpx 32rpx 0;
}

.sort-hint text {
	font-size: 24rpx;
	color: #7d85b3;
	line-height: 1.5;
}

.home-empty-tip {
	margin: 24rpx;
	background: #fbf7fb;
	border: 1rpx solid #eee4ef;
	border-radius: 24rpx;
	padding: 36rpx 24rpx;
	color: #9f92a2;
	text-align: center;
	font-size: 28rpx;
	box-shadow: 0 6rpx 16rpx rgba(120, 96, 130, 0.06);
}

.error-tip {
	color: #8f6fb0;
}

.home-empty-tip--link:active {
	opacity: 0.85;
}

.post-list {
	padding: 0 32rpx 32rpx;
}

.post-card {
	background: #fffefe;
	border: 1rpx solid #eee4ef;
	border-radius: 44rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 10rpx 24rpx rgba(120, 96, 130, 0.08);
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

.post-info {
	flex: 1;
	min-width: 0;
}

.post-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
}

.post-meta {
	font-size: 22rpx;
	color: #9f92a2;
	margin-top: 4rpx;
}

.post-text {
	font-size: 28rpx;
	color: #57465b;
	line-height: 1.6;
	margin-bottom: 20rpx;
	word-break: break-all;
}

.post-voice {
	margin-bottom: 20rpx;
}

.post-video {
	position: relative;
	width: 100%;
	height: 400rpx;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
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

.post-media-tip {
	margin-bottom: 20rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	background: #fbf7fb;
	color: #9f92a2;
	font-size: 26rpx;
	text-align: center;
}

.post-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.post-tag-chip {
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
}

.post-tag-text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.post-footer {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: flex-start;
	gap: 40rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f1ebf6;
}

.post-action {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8rpx;
	font-size: 26rpx;
	color: #9f92a2;
	flex-shrink: 0;
}

.post-action.is-liked text {
	color: #ea6f88;
}

.detail-action text {
	color: #8f6fb0;
}

.load-end-tip {
	text-align: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #bbbbbb;
}
</style>
