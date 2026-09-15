<template>
	<view class="page-shell tab-page">
		<view class="auth-card">
			<view class="header">
				<view class="header-inner">
					<text class="page-title">我</text>
				</view>
			</view>

			<scroll-view class="content-flex" scroll-y>
				<view class="tab-scroll-inner">
					<view class="profile-card" @click="goProfileEdit">
						<view class="profile-avatar">
							<image v-if="isImageAvatar(displayAvatar)" class="profile-avatar-image" :src="displayAvatar"
								mode="aspectFill" />
							<text v-else class="profile-avatar-emoji">{{ displayAvatar }}</text>
						</view>
						<view class="profile-info">
							<text class="profile-name">{{ displayName }}</text>
							<text class="profile-id">ID: {{ displayId }}</text>
							<view class="profile-meta-row" v-if="displaySex || displayAge">
								<text v-if="displaySex" class="profile-meta-tag">{{ displaySex }}</text>
								<text v-if="displayAge" class="profile-meta-tag">{{ displayAge }}岁</text>
							</view>
							<text class="profile-bio">{{ displayBio }}</text>
						</view>
					</view>

					<view class="stats-grid">
						<view class="stat-item is-clickable" @click="goProfileContent">
							<text class="stat-num">{{ stats.posts }}</text>
							<text class="stat-label">心情记录</text>
						</view>
						<view class="stat-item">
							<text class="stat-num">{{ stats.views }}</text>
							<text class="stat-label">浏览</text>
						</view>
						<view class="stat-item">
							<text class="stat-num">{{ stats.likes }}</text>
							<text class="stat-label">获赞</text>
						</view>
					</view>

					<view class="func-list">
						<view v-for="item in funcItems" :key="item.action" class="func-item" @click="handleFunc(item.action)">
							<view class="func-icon">
								<IconFont v-if="item.iconType === 'font'" :name="item.icon" :color="item.color" :size="40" />
								<text v-else class="func-emoji" :style="{ color: item.color }">{{ item.icon }}</text>
							</view>
							<text class="func-label">{{ item.label }}</text>
							<text class="func-arrow">›</text>
						</view>
					</view>

					<view class="logout-section">
						<button class="logout-btn" @click="handleLogout">退出登录</button>
					</view>

					<text class="version-info">橘子圆梦 v1.0.0</text>
				</view>
			</scroll-view>
		</view>

		<AppTabBar :current="4" />
	</view>
</template>

<script>
import { getUserProfile } from '@/api/user';
import { getMoodList } from '@/api/mood';
import { logout } from '@/api/auth';
import store from '@/store';
import IconFont from '@/components/IconFont.vue';
import AppTabBar from '@/components/AppTabBar.vue';
import { initCustomTabBar } from '@/utils/tabBar';
import { getDisplayAvatar, isImageAvatar } from '@/utils/avatar';

export default {
	name: 'ProfilePage',
	components: { IconFont, AppTabBar },
	data() {
		return {
			userInfo: {},
			stats: {
				posts: 0,
				views: 0,
				likes: 0
			},
			funcItems: [
				{ icon: 'bookmark-outline', iconType: 'font', label: '我的收藏', color: '#8f6fb0', action: 'favorites' },
				{ icon: 'message-outline', iconType: 'font', label: '消息通知', color: '#26a69a', action: 'notification' },
				{ icon: '📤', iconType: 'emoji', label: '分享邀请', color: '#3f51b5', action: 'share_invite' },
				{ icon: '📱', iconType: 'emoji', label: '切换手机号', color: '#5c6bc0', action: 'mobile' },
				{ icon: 'help-circle', iconType: 'font', label: '帮助与反馈', color: '#ff9800', action: 'help' },
				{ icon: 'cog-outline', iconType: 'font', label: '通用设置', color: '#7e57c2', action: 'settings' },
				{ icon: 'alert-circle-outline', iconType: 'font', label: '关于我们', color: '#607d8b', action: 'about' }
			]
		};
	},
	computed: {
		displayName() {
			return this.userInfo.nickname || '未登录用户';
		},
		displayId() {
			return this.userInfo.userId || '-';
		},
		displayBio() {
			return this.userInfo.signature || '记录每一天的心情，遇见同频的灵魂 ✨';
		},
		displaySex() {
			if (this.userInfo.sex === 1) return '男';
			if (this.userInfo.sex === 2) return '女';
			return '';
		},
		displayAge() {
			return this.userInfo.age || '';
		},
		displayAvatar() {
			return getDisplayAvatar(this.userInfo.avatar);
		}
	},
	onShow() {
		initCustomTabBar();
		this.loadPageData();
	},
	onReady() {
		initCustomTabBar();
	},
	methods: {
		isImageAvatar,

		async loadPageData() {
			await Promise.all([this.loadUserInfo(), this.loadStats()]);
		},

		async loadUserInfo() {
			try {
				const res = await getUserProfile();
				this.userInfo = res.data || {};
			} catch (e) {
				console.error('获取用户信息失败:', e);
			}
		},

		async loadStats() {
			try {
				const res = await getMoodList({
					onlyMine: true,
					pageNum: 1,
					pageSize: 200,
					sortMode: 'time'
				});
				const rows = res.rows || [];
				this.stats = {
					posts: rows.length || this.userInfo.moodCount || 0,
					views: rows.reduce((total, item) => total + Number(item.viewCount || 0), 0) || this.userInfo.viewCount || 0,
					likes: rows.reduce((total, item) => total + Number(item.likeCount || 0), 0) || this.userInfo.likeCount || 0
				};
			} catch (e) {
				this.stats = {
					posts: this.userInfo.moodCount || 0,
					views: this.userInfo.viewCount || 0,
					likes: this.userInfo.likeCount || 0
				};
			}
		},

		goProfileEdit() {
			uni.navigateTo({ url: '/pages/profile/sub?tab=edit' });
		},

		goProfileFavorites() {
			uni.navigateTo({ url: '/pages/profile/sub?tab=favorites' });
		},

		goProfileContent() {
			uni.navigateTo({ url: '/pages/profile/sub?tab=posts' });
		},

		buildInviteLink() {
			const userId = this.userInfo.userId || '';
			// #ifdef H5
			const inviteUrl = `${window.location.origin}${window.location.pathname}#/pages/login/login?inviter=${userId}`;
			return inviteUrl;
			// #endif
			// #ifndef H5
			return `/pages/login/login?inviter=${userId}`;
			// #endif
		},

		async handleFunc(action) {
			if (action === 'share_invite') {
				const url = this.buildInviteLink();
				const text = `我在使用心情星球，点击链接注册即可体验：${url}`;
				// #ifdef H5
				if (navigator.share) {
					try {
						await navigator.share({ title: '邀请注册', text, url });
						return;
					} catch (e) {
						/* 用户取消分享 */
					}
				}
				// #endif
				uni.setClipboardData({
					data: url,
					success: () => {
						uni.showToast({ title: '邀请链接已复制，快去分享给好友', icon: 'none' });
					},
					fail: () => {
						uni.showModal({
							title: '复制失败',
							content: `请手动复制链接：${url}`,
							showCancel: false
						});
					}
				});
				return;
			}

			if (action === 'notification') {
				uni.navigateTo({ url: '/pages/settings/settings' });
				return;
			}

			uni.navigateTo({ url: `/pages/profile/sub?tab=${action}` });
		},

		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						this.doLogout();
					}
				}
			});
		},

		async doLogout() {
			try {
				await logout();
			} catch (e) {
				console.warn('登出接口调用失败:', e);
			} finally {
				store.actions.logout();
				uni.reLaunch({ url: '/pages/login/login' });
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.header-inner {
	position: relative;
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

.profile-card {
	margin: 32rpx;
	padding: 40rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	color: #ffffff;
	display: flex;
	align-items: center;
	box-shadow: 0 10rpx 24rpx rgba(120, 96, 130, 0.08);
}

.profile-avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 32rpx;
	flex-shrink: 0;
	overflow: hidden;
}

.profile-avatar-image {
	width: 100%;
	height: 100%;
}

.profile-avatar-emoji {
	font-size: 64rpx;
	line-height: 1;
}

.profile-info {
	flex: 1;
	min-width: 0;
}

.profile-name {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	line-height: 1.3;
}

.profile-id {
	display: block;
	font-size: 24rpx;
	opacity: 0.8;
	margin: 4rpx 0 12rpx;
}

.profile-bio {
	display: block;
	font-size: 26rpx;
	opacity: 0.9;
	line-height: 1.5;
}

.profile-meta-row {
	display: flex;
	gap: 12rpx;
	margin: 8rpx 0;
}

.profile-meta-tag {
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.4);
	background: rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 22rpx;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
	margin: 0 24rpx 24rpx;
	background: #fffefe;
	border-radius: 24rpx;
	padding: 32rpx 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.stat-item {
	text-align: center;
}

.stat-item.is-clickable:active {
	opacity: 0.72;
}

.stat-num {
	display: block;
	font-size: 40rpx;
	font-weight: 700;
	color: #57465b;
	line-height: 1.2;
}

.stat-label {
	display: block;
	font-size: 22rpx;
	color: #9f92a2;
	margin-top: 4rpx;
}

.func-list {
	margin: 0 24rpx;
	background: #fffefe;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.func-item {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f1ebf6;
}

.func-item:last-child {
	border-bottom: none;
}

.func-icon {
	width: 40rpx;
	margin-right: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.func-emoji {
	font-size: 36rpx;
	line-height: 1;
}

.func-label {
	flex: 1;
	font-size: 28rpx;
	color: #57465b;
}

.func-arrow {
	font-size: 36rpx;
	color: #cccccc;
}

.logout-section {
	padding: 32rpx 24rpx 0;
}

.logout-btn {
	width: 100%;
	padding: 24rpx 0;
	border: 1rpx solid #ea6f88;
	border-radius: 24rpx;
	background: #fffefe;
	color: #ea6f88;
	font-size: 30rpx;
	line-height: 1.2;
}

.logout-btn::after {
	border: none;
}

.version-info {
	display: block;
	text-align: center;
	font-size: 24rpx;
	color: #cccccc;
	padding: 32rpx 0 16rpx;
}
</style>
