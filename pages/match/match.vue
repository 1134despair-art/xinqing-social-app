<template>
	<view class="page-shell tab-page">
		<view class="auth-card">
			<view class="header">
				<view class="header-inner">
					<text class="page-title">筑梦师</text>
				</view>
			</view>

			<scroll-view class="content-flex" scroll-y>
			<view class="tab-scroll-inner cs-page">
			<view v-if="hasActiveSession" class="session-banner" @click="openChat()">
				<view class="session-banner-main">
					<text class="session-banner-title">继续咨询</text>
					<text class="session-banner-desc">{{ statusText }}</text>
				</view>
				<text class="session-banner-arrow">›</text>
			</view>

			<view class="cs-tips-card">
				<text class="cs-tips-title">客服中心</text>
				<text class="cs-tips-desc">请选择一位客服，进入对应聊天框进行咨询。</text>
			</view>

			<view v-if="loadingAgents" class="cs-empty">
				<text class="cs-empty-text">客服列表加载中...</text>
			</view>
			<view v-else-if="!agents.length" class="cs-empty">
				<text class="cs-empty-text">暂无可用客服，请稍后再试</text>
			</view>

			<view v-else class="cs-list">
				<view
					v-for="agent in agents"
					:key="agent.id"
					class="cs-item"
					:class="{ offline: !isAgentOnline(agent) }"
					@click="openChat(agent)"
				>
					<UserAvatar class="cs-avatar" :avatar="agent.avatar" :size="76" />
					<view class="cs-main">
						<text class="cs-name">{{ agent.name }}</text>
						<text class="cs-summary">{{ agent.summary }}</text>
						<view class="cs-tags">
							<text v-for="tag in agent.expertise" :key="`${agent.id}_${tag}`" class="cs-tag">{{ tag }}</text>
						</view>
					</view>
					<text class="cs-arrow">›</text>
				</view>
			</view>
			</view>
			</scroll-view>
		</view>

		<AppTabBar :current="3" />
	</view>
</template>

<script>
import { getCurrentImSession, getImCustomers } from '@/api/im';
import { initCustomTabBar } from '@/utils/tabBar';
import AppTabBar from '@/components/AppTabBar.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { loadCustomerAgents } from '@/utils/customerAgents';

export default {
	name: 'CustomerServicePage',
	components: { AppTabBar, UserAvatar },
	data() {
		return {
			session: null,
			agents: [],
			loadingAgents: false,
			refreshingAgents: false,
			pollTimer: null
		};
	},
	computed: {
		hasActiveSession() {
			return Boolean(this.session && this.session.sessionId);
		},
		statusText() {
			if (!this.hasActiveSession) return '';
			if (this.session.status === 0) return '已进入排队，客服上线后会自动接入';
			return this.session.customerNickName
				? `${this.session.customerNickName} 正在为你服务`
				: '客服正在为你服务';
		}
	},
	onShow() {
		initCustomTabBar();
		this.loadCurrentSession();
		this.loadAgents({ initial: this.agents.length === 0 });
		this.startPolling();
	},
	onHide() {
		this.stopPolling();
	},
	onUnload() {
		this.stopPolling();
	},
	onReady() {
		initCustomTabBar();
	},
	methods: {
		async loadCurrentSession() {
			try {
				this.session = await getCurrentImSession({ loading: false, silent: true });
			} catch (e) {
				this.session = null;
			}
		},

		async loadAgents({ initial = false } = {}) {
			if (this.refreshingAgents) return;
			this.refreshingAgents = true;
			if (initial) this.loadingAgents = true;
			try {
				const latestAgents = await loadCustomerAgents({ loading: false, silent: true });
				this.mergeAgents(latestAgents);
			} catch (e) {
				// 静默刷新失败时保留上一次数据，避免列表闪烁或暂时消失
			} finally {
				if (initial) this.loadingAgents = false;
				this.refreshingAgents = false;
			}
		},

		mergeAgents(latestAgents = []) {
			const latestList = Array.isArray(latestAgents) ? latestAgents : [];
			const latestMap = new Map(latestList.map(agent => [String(agent.id), agent]));
			const merged = [];

			// 保持当前列表顺序和对象引用，只原位更新在线状态等最新数据
			this.agents.forEach(agent => {
				const key = String(agent.id);
				const latest = latestMap.get(key);
				if (!latest) return;
				Object.assign(agent, latest);
				merged.push(agent);
				latestMap.delete(key);
			});

			// 新增客服追加到列表末尾；已不可用的客服不再保留
			latestList.forEach(agent => {
				const key = String(agent.id);
				if (!latestMap.has(key)) return;
				merged.push(agent);
				latestMap.delete(key);
			});
			this.agents = merged;
		},

		isAgentOnline(agent = {}) {
			return Number(agent.onlineStatus) === 1;
		},

		startPolling() {
			this.stopPolling();
			// 每10秒静默刷新客服状态，不切换页面加载态
			this.pollTimer = setInterval(() => {
				this.loadAgents();
			}, 10000);
		},

		stopPolling() {
			if (this.pollTimer) {
				clearInterval(this.pollTimer);
				this.pollTimer = null;
			}
		},

		openChat(agent) {
			if (!agent || !agent.id) {
				uni.navigateTo({ url: '/pages/match/chat' });
				return;
			}
			// 移除离线客服拦截，允许向离线客服留言
			const open = () => {
				const query = `?staffId=${encodeURIComponent(agent.id)}`;
				uni.navigateTo({ url: `/pages/match/chat${query}` });
			};
			if (this.session && this.session.sessionId && String(this.session.customerSysUserId || '') !== String(agent.id)) {
				const currentName = this.session.customerNickName || '当前客服';
				uni.showModal({
					title: '切换客服',
					content: `你正在和${currentName}咨询，切换后将结束当前会话并连接${agent.name}。是否继续？`,
					confirmText: '继续切换',
					success: (res) => {
						if (res.confirm) open();
					}
				});
				return;
			}
			open();
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
	line-height: 1.2;
}

.cs-page {
	padding: 32rpx;
	box-sizing: border-box;
}

.session-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
	padding: 24rpx 28rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	color: #ffffff;
	box-shadow: 0 10rpx 24rpx rgba(120, 96, 130, 0.08);
}

.session-banner-main {
	flex: 1;
	min-width: 0;
}

.session-banner-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	line-height: 1.3;
}

.session-banner-desc {
	display: block;
	margin-top: 6rpx;
	font-size: 24rpx;
	opacity: 0.9;
	line-height: 1.5;
}

.session-banner-arrow {
	margin-left: 16rpx;
	font-size: 40rpx;
	color: rgba(255, 255, 255, 0.85);
	line-height: 1;
}

.cs-tips-card {
	background: #fffefe;
	border-radius: 24rpx;
	padding: 24rpx 28rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.cs-tips-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #57465b;
}

.cs-tips-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9f92a2;
	line-height: 1.5;
}

.cs-list {
	margin-top: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.cs-item {
	display: flex;
	align-items: flex-start;
	padding: 20rpx;
	border: 1rpx solid #edf1ff;
	background: #fffefe;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	transition: opacity 0.25s ease;
}

.cs-item.offline {
	opacity: 0.58;
}

.cs-item.offline .cs-arrow {
	color: #d6cfd9;
}

.cs-avatar {
	flex-shrink: 0;
	overflow: hidden;
}

.cs-avatar-img {
	width: 100%;
	height: 100%;
	display: block;
}

.cs-empty {
	margin-top: 20rpx;
	padding: 48rpx 28rpx;
	border-radius: 24rpx;
	background: #fffefe;
	text-align: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.cs-empty-text {
	font-size: 26rpx;
	color: #9f92a2;
	line-height: 1.5;
}

.cs-main {
	flex: 1;
	min-width: 0;
	margin: 0 16rpx;
}

.cs-name {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #57465b;
	line-height: 1.3;
}

.cs-summary {
	display: block;
	margin-top: 4rpx;
	font-size: 24rpx;
	color: #7d6e81;
	line-height: 1.5;
}

.cs-tags {
	margin-top: 12rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.cs-tag {
	font-size: 22rpx;
	color: #5e6ac1;
	background: #edf1ff;
	border-radius: 24rpx;
	padding: 4rpx 16rpx;
	line-height: 1.4;
}

.cs-arrow {
	font-size: 40rpx;
	color: #c5cae3;
	line-height: 1;
	margin-top: 8rpx;
	flex-shrink: 0;
}
</style>
