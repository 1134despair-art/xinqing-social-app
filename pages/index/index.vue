<template>
	<view class="page-shell tab-page">
		<view class="auth-card">
			<view class="header">
				<view class="header-inner">
					<text class="page-title">橘子圆梦</text>
				</view>
			</view>

			<scroll-view class="content-flex" scroll-y :lower-threshold="120" @scroll="onListScroll" @scrolltolower="onReachBottom">
				<view class="tab-scroll-inner">
					<view v-if="loadError && moodList.length === 0" class="home-empty-tip error-tip" @click="reloadData">
						<text>😥 加载失败，点击重试</text>
					</view>

					<view v-else-if="!loading && loaded && moodList.length === 0" class="home-empty-tip">
						<text>还没有人发布心情，快来发第一条吧</text>
					</view>

					<view v-else class="mood-list">
						<view v-for="item in moodList" :key="item.moodId" class="mood-post-card">
							<view class="post-header">
								<UserAvatar class="post-avatar" :avatar="item.avatar" :size="72" @click.stop="openUserProfilePage(item)" />
								<view class="post-user-info">
									<view class="post-username">{{ item.nickname || '匿名用户' }}</view>
									<view class="post-time">{{ formatTime(item.createTime) }}</view>
								</view>
							</view>

							<view v-if="isTextMood(item)" class="post-content">
								<MoodTextExpand :text="getMoodText(item)" />
							</view>

							<view v-else-if="isVideoMood(item) && getMoodText(item)" class="post-content">
								<MoodTextExpand :text="getMoodText(item)" />
							</view>

							<VoicePlayer v-if="isVoiceMood(item) && item.voiceUrl" :src="item.voiceUrl"
								:duration="item.voiceDuration" class="post-voice" />

							<MoodVideo
								v-if="isVideoReady(item)"
								:src="item.videoUrl"
								:poster="item.videoCoverUrl"
								:mood-id="item.moodId"
								class="post-video-placeholder"
							/>

							<view v-if="isVideoMood(item) && !isVideoReady(item)" class="post-media-tip">
								<text>{{ getVideoStatusText(item) }}</text>
							</view>

							<view v-if="item.tags && item.tags.length > 0" class="post-tags">
								<view v-for="tag in item.tags" :key="tag.tagId" class="post-tag-chip"
									:style="{ background: getTagColor(tag.tagId) }">
									<text class="post-tag-text">{{ tag.tagName }}</text>
								</view>
							</view>

							<view class="post-match-entry">
								<view class="post-match-btn" @click.stop="toggleMatchPanel(item)">
									<IconFont name="account-heart" color="#594f70" :size="32" />
									<text class="post-match-btn-text">{{ isMatchExpanded(item.moodId) ? '收起同频' : '梦境匹配' }}</text>
								</view>
							</view>

							<view v-if="isMatchExpanded(item.moodId)" class="post-match-panel">
								<view v-if="getMatchState(item.moodId).loading" class="post-match-empty">
									<text>匹配中...</text>
								</view>
								<view v-else-if="getMatchState(item.moodId).error" class="post-match-empty post-match-error"
									@click.stop="loadMatchResults(item)">
									<text>{{ getMatchState(item.moodId).error }}，点击重试</text>
								</view>
								<view v-else-if="getPagedMatchedPosts(item.moodId).length === 0" class="post-match-empty">
									<text>{{ getMatchState(item.moodId).message || '暂未找到同频用户' }}</text>
								</view>
								<view v-for="matchItem in getPagedMatchedPosts(item.moodId)" :key="`${item.moodId}_${matchItem.moodId}`"
									class="post-match-item">
									<view class="post-match-item-avatar" @click.stop="openMatchDetail(matchItem)">
										<UserAvatar :avatar="matchItem.avatar" :size="64" @click.stop="openUserProfilePage(matchItem)" />
									</view>
									<view class="post-match-item-main">
										<view class="post-match-item-title">{{ matchItem.nickname || '匿名用户' }}</view>
										<view class="post-match-item-time">{{ formatTime(matchItem.createTime) }}</view>
										<view v-if="isTextMood(matchItem)" class="post-match-item-content">
											<MoodTextExpand :text="getMoodText(matchItem)" font-size="26rpx" />
										</view>
										<view v-else-if="isVideoMood(matchItem) && getMoodText(matchItem)" class="post-match-item-content">
											<MoodTextExpand :text="getMoodText(matchItem)" font-size="26rpx" />
										</view>
										<VoicePlayer v-if="isVoiceMood(matchItem) && matchItem.voiceUrl" :src="matchItem.voiceUrl"
											:duration="matchItem.voiceDuration" class="post-match-voice" />
										<MoodVideo
											v-if="isVideoReady(matchItem)"
											:src="matchItem.videoUrl"
											:poster="matchItem.videoCoverUrl"
											:mood-id="matchItem.moodId"
											height="280rpx"
											class="post-match-video-wrap"
										/>
										<view v-if="isVideoMood(matchItem) && !isVideoReady(matchItem)" class="post-match-item-tip">
											<text>{{ getVideoStatusText(matchItem) }}</text>
										</view>
									</view>
								</view>
								<view v-if="hasMoreMatchedPosts(item.moodId)" class="post-match-more-btn"
									@click.stop="loadMoreMatchedPosts(item.moodId)">
									<text>加载更多</text>
								</view>
							</view>

							<view class="post-actions">
								<view class="post-action" :class="{ 'is-liked': item.liked }" @click="handleLike(item)">
									<IconFont :name="item.liked ? 'heart' : 'heart-outline'" :color="item.liked ? '#ea6f88' : '#9f92a2'"
										:size="44" />
									<text class="post-action-num">{{ item.likeCount || 0 }}</text>
								</view>
								<view class="post-action" @click="openComment(item)">
									<IconFont name="comment-outline" color="#9f92a2" :size="44" />
									<text class="post-action-num">{{ item.commentCount || 0 }}</text>
								</view>
								<view class="post-action detail-link" @click="openDetail(item)">
									<IconFont name="chart-box-outline" color="#9f92a2" :size="44" />
									<text class="post-action-num">{{ item.viewCount || 0 }}</text>
								</view>
							</view>

						</view>

						<view v-if="loadingMore" class="load-more-tip">
							<text>加载中...</text>
						</view>
						<view v-if="noMore && moodList.length > 0" class="load-more-tip">
							<text>没有更多了</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<ReportPopup :visible="reportVisible" :contentId="reportContentId" :reportedUserId="reportedUserId"
			@close="reportVisible = false" />

		<!-- 自定义 tabBar（全端） -->
		<AppTabBar :current="0" />

		<!-- 全屏视频盖住页面与 tabBar -->
		<MoodVideoFullscreen />
	</view>
</template>

<script>
import { getMoodList, matchMoods } from '@/api/mood';
import { toggleLike } from '@/api/like';
import { getUserProfile } from '@/api/user';
import { formatRelativeTime } from '@/utils/time';
import { initCustomTabBar } from '@/utils/tabBar';
import { getMoodText, getVideoStatusText, isTextMood, isVideoMood, isVideoReady, isVoiceMood } from '@/utils/moodContent';
import { reportMoodView } from '@/utils/moodView';
import ReportPopup from '@/components/ReportPopup.vue';
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
	'rgba(143,111,176,0.12)', 'rgba(201,182,247,0.15)', 'rgba(255,154,139,0.15)',
	'rgba(255,183,77,0.15)', 'rgba(93,155,125,0.15)', 'rgba(211,106,134,0.12)',
	'rgba(255,138,101,0.15)', 'rgba(167,139,250,0.12)', 'rgba(234,111,136,0.12)',
	'rgba(255,213,79,0.15)', 'rgba(239,194,214,0.18)', 'rgba(240,98,146,0.12)'
];
const MATCH_PAGE_SIZE = 3;

function createMatchState() {
	return {
		list: [],
		loading: false,
		loaded: false,
		error: '',
		message: '',
		displayPage: 1
	};
}

export default {
	name: 'MoodSquare',
	components: { ReportPopup, IconFont, AppTabBar, VoicePlayer, UserAvatar, MoodVideo, MoodVideoFullscreen, MoodTextExpand },
	mixins: [moodVideoBackMixin],
	data() {
		return {
			currentSort: 'latest',
			moodList: [],
			pageNum: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			loaded: false,
			loadingMore: false,
			loadError: false,
			noMore: false,
			currentUserId: 0,
			reportVisible: false,
			reportContentId: 0,
			reportedUserId: 0,
			matchExpandedIds: [],
			matchStateMap: {}
		};
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
		if (!this.loadingMore && !this.noMore && !this.loading) {
			this.loadMore();
		}
	},
	methods: {
		onListScroll(e) {
			requestMoodVideoRectSync(e && e.detail);
		},

		async loadCurrentUser() {
			try {
				const res = await getUserProfile();
				if (res.data) {
					this.currentUserId = res.data.userId;
				}
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
					onlyMine: true,
					sortMode: 'time',
					pageNum: this.pageNum,
					pageSize: this.pageSize
				});
				const rows = res.rows || [];
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

		switchSort(sort) {
			if (this.currentSort === sort) return;
			this.currentSort = sort;
			this.reloadData();
		},

		reloadData() {
			this.pageNum = 1;
			this.noMore = false;
			this.loadError = false;
			this.loadMoodList();
		},

		loadMore() {
			this.loadingMore = true;
			this.pageNum++;
			this.loadMoodList();
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

		openComment(item) {
			reportMoodView(item.moodId, item);
			uni.navigateTo({
				url: `/pages/space/detail?id=${item.moodId}`
			});
		},

		openDetail(item) {
			reportMoodView(item.moodId, item);
			uni.navigateTo({
				url: `/pages/space/detail?id=${item.moodId}`
			});
		},

		openReport(item) {
			this.reportContentId = item.moodId;
			this.reportedUserId = item.userId;
			this.reportVisible = true;
		},

		isMatchExpanded(moodId) {
			return this.matchExpandedIds.includes(moodId);
		},

		getMatchState(moodId) {
			return this.matchStateMap[moodId] || createMatchState();
		},

		toggleMatchPanel(item) {
			const moodId = item.moodId;
			if (this.isMatchExpanded(moodId)) {
				this.matchExpandedIds = this.matchExpandedIds.filter((id) => id !== moodId);
				return;
			}
			this.matchExpandedIds.push(moodId);
			const state = this.getMatchState(moodId);
			if (!state.loaded && !state.loading) {
				this.loadMatchResults(item);
			}
		},

		async loadMatchResults(item) {
			const moodId = item.moodId;
			const prev = this.getMatchState(moodId);
			this.matchStateMap = {
				...this.matchStateMap,
				[moodId]: {
					...prev,
					loading: true,
					error: ''
				}
			};
			try {
				const res = await matchMoods({ moodId, loading: false });
				const list = Array.isArray(res.data) ? res.data : [];
				this.matchStateMap = {
					...this.matchStateMap,
					[moodId]: {
						list,
						loading: false,
						loaded: true,
						error: '',
						message: res.message || '',
						displayPage: 1
					}
				};
			} catch (e) {
				console.error('心情匹配失败:', e);
				this.matchStateMap = {
					...this.matchStateMap,
					[moodId]: {
						...prev,
						loading: false,
						loaded: false,
						error: e.message || '匹配失败'
					}
				};
			}
		},

		getPagedMatchedPosts(moodId) {
			const state = this.getMatchState(moodId);
			return state.list.slice(0, state.displayPage * MATCH_PAGE_SIZE);
		},

		hasMoreMatchedPosts(moodId) {
			const state = this.getMatchState(moodId);
			return this.getPagedMatchedPosts(moodId).length < state.list.length;
		},

		loadMoreMatchedPosts(moodId) {
			const state = this.getMatchState(moodId);
			this.matchStateMap = {
				...this.matchStateMap,
				[moodId]: {
					...state,
					displayPage: state.displayPage + 1
				}
			};
		},

		openMatchDetail(item) {
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
	width: 100%;
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
	line-height: 1.2;
}

.mood-list {
	padding: 24rpx 32rpx 16rpx;
	box-sizing: border-box;
}

.home-empty-tip {
	margin: 24rpx 32rpx;
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

.mood-post-card {
	width: 100%;
	box-sizing: border-box;
	background: #fffefe;
	border: 1rpx solid #eee4ef;
	border-radius: 44rpx;
	padding: 28rpx;
	margin-bottom: 16rpx;
	box-shadow: 0 10rpx 24rpx rgba(120, 96, 130, 0.08);
	overflow: hidden;
}

.post-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	margin-bottom: 20rpx;
}

.post-avatar {
	margin-right: 20rpx;
}

.post-user-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	overflow: hidden;
}

.post-username {
	width: 100%;
	font-size: 28rpx;
	font-weight: 600;
	color: #57465b;
	line-height: 1.4;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	writing-mode: horizontal-tb;
}

.post-time {
	width: 100%;
	font-size: 22rpx;
	color: #9f92a2;
	line-height: 1.4;
	margin-top: 4rpx;
	white-space: nowrap;
	writing-mode: horizontal-tb;
}

.post-content {
	width: 100%;
	font-size: 28rpx;
	color: #57465b;
	line-height: 1.6;
	margin-bottom: 20rpx;
	word-break: break-word;
}

.post-voice {
	margin-bottom: 20rpx;
}

.post-video-placeholder {
	width: 100%;
	height: 400rpx;
	position: relative;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
}

.post-media {
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
	flex-direction: row;
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
	line-height: 1.3;
}

.post-match-entry {
	margin-bottom: 20rpx;
}

.post-match-btn {
	display: inline-flex;
	flex-direction: row;
	align-items: center;
	border: 1rpx solid #e8deff;
	background: linear-gradient(135deg, #fff7fb 0%, #f6eeff 100%);
	border-radius: 36rpx;
	padding: 12rpx 24rpx;
}

.post-match-btn :deep(.iconfont) {
	margin-right: 8rpx;
}

.post-match-btn-text {
	font-size: 26rpx;
	color: #594f70;
	line-height: 1.3;
}

.post-match-panel {
	border: 1rpx solid #ede3ff;
	background: #fdf9ff;
	border-radius: 40rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.post-match-empty {
	font-size: 24rpx;
	color: #9f92a2;
	line-height: 1.5;
}

.post-match-error {
	color: #8f6fb0;
}

.post-match-item {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f1ebf6;
}

.post-match-item:last-child {
	border-bottom: none;
}

.post-match-item-avatar {
	margin-right: 16rpx;
	flex-shrink: 0;
}

.post-match-item-main {
	flex: 1;
	min-width: 0;
}

.post-match-item-title {
	font-size: 26rpx;
	font-weight: 600;
	color: #57465b;
	line-height: 1.4;
}

.post-match-item-time {
	font-size: 22rpx;
	color: #9f92a2;
	line-height: 1.4;
	margin-top: 4rpx;
}

.post-match-item-content {
	margin-top: 8rpx;
	font-size: 26rpx;
	color: #57465b;
	line-height: 1.6;
	word-break: break-word;
}

.post-match-voice {
	margin-top: 8rpx;
}

.post-match-video-wrap {
	margin-top: 12rpx;
	width: 100%;
	height: 280rpx;
	position: relative;
	border-radius: 16rpx;
	overflow: hidden;
}

.post-match-inline-video {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: block;
	background: #000000;
}

.post-match-item-tip {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9f92a2;
}

.post-match-more-btn {
	margin-top: 12rpx;
	text-align: center;
}

.post-match-more-btn text {
	font-size: 24rpx;
	color: #8f6fb0;
}

.post-actions {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	gap: 40rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f1ebf6;
}

.post-action {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex-shrink: 0;
}

.post-action :deep(.iconfont) {
	margin-right: 8rpx;
}

.post-action {
	font-size: 26rpx;
}

.post-action.is-liked .post-action-num {
	color: #ea6f88;
}

.post-action-num {
	font-size: 26rpx;
	color: #9f92a2;
	line-height: 1;
}

.detail-link .post-action-num {
	color: #8f6fb0;
}

.load-more-tip {
	text-align: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #bbbbbb;
}
</style>
