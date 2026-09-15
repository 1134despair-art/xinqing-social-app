<template>
	<view class="sub-page" :style="subPageStyle">
		<view class="page-content">
			<!-- 我的心情 / 收藏 -->
			<view v-if="tab === 'posts' || tab === 'favorites'" class="card-list">
				<view class="content-tabs">
					<view
						class="content-tab-btn"
						:class="{ active: postsInnerTab === 'published' }"
						@click="postsInnerTab = 'published'"
					>
						{{ publishedTabLabel }}（{{ myPosts.length }}）
					</view>
					<view
						v-if="canViewFavorites"
						class="content-tab-btn"
						:class="{ active: postsInnerTab === 'favorites' }"
						@click="postsInnerTab = 'favorites'"
					>
						我收藏的内容（{{ favoritePosts.length }}）
					</view>
				</view>

				<template v-if="postsInnerTab === 'published' || !canViewFavorites">
					<view v-if="myPosts.length === 0" class="panel-empty">{{ publishedEmptyText }}</view>
					<view v-for="post in pagedMyPosts" :key="post.moodId" class="panel-item">
						<MoodTextExpand
							v-if="isTextMood(post) || (isVideoMood(post) && getMoodText(post))"
							class="panel-item-title"
							:text="getMoodText(post)"
							font-size="26rpx"
							:line-height="1.5"
							font-weight="600"
						/>
						<text v-else class="panel-item-title panel-item-title--muted">{{ getPostBrief(post) }}</text>
						<VoicePlayer v-if="isVoiceMood(post) && post.voiceUrl" :src="post.voiceUrl" :duration="post.voiceDuration" class="panel-item-voice" />
						<MoodVideo
							v-if="isVideoReady(post)"
							:src="post.videoUrl"
							:poster="post.videoCoverUrl"
							:mood-id="post.moodId"
							height="320rpx"
							class="panel-item-video-wrap"
						/>
						<view v-if="isVideoMood(post) && !isVideoReady(post)" class="panel-item-media-tip">{{ getVideoStatusText(post) }}</view>
						<view class="panel-item-meta">
							<text>{{ formatTime(post.createTime) }}</text>
							<text>·</text>
							<view class="panel-meta-like" :class="{ 'is-liked': post.liked }">
								<IconFont :name="post.liked ? 'heart' : 'heart-outline'" :color="post.liked ? '#ea6f88' : '#9f92a2'" :size="28" />
								<text>{{ post.likeCount || 0 }}</text>
							</view>
							<text>·</text>
							<view class="panel-meta-comment">
								<IconFont name="comment-outline" color="#9f92a2" :size="28" />
								<text>{{ post.commentCount || 0 }}</text>
							</view>
						</view>
						<view class="post-actions">
							<button v-if="canManagePublishedPosts" class="post-action-btn" @click="editPost(post)">编辑</button>
							<button v-if="canManagePublishedPosts && !isVideoMood(post)" class="post-action-btn primary" @click="convertPostToVideo(post)">转为视频</button>
							<button class="post-action-btn" @click="openPost(post.moodId, post)">查看详情</button>
							<button v-if="canManagePublishedPosts" class="post-action-btn danger" @click="removeMyPost(post.moodId)">删除</button>
						</view>
					</view>
					<view v-if="myPosts.length > myPostsPageSize" class="paging-wrap">
						<button v-if="hasMoreMyPosts" class="mini-btn" @click="loadMoreMyPosts">加载更多</button>
						<text v-else class="panel-empty">已经到底了</text>
					</view>
				</template>

				<template v-else>
					<view v-if="favoritePosts.length === 0" class="panel-empty">你还没有收藏内容，去广场逛逛吧</view>
					<view v-for="post in favoritePosts" :key="post.moodId" class="panel-item panel-item-click" @click="openPost(post.moodId, post)">
						<text class="panel-item-title">{{ post.nickname || '匿名用户' }}</text>
						<MoodTextExpand
							v-if="isTextMood(post) || (isVideoMood(post) && getMoodText(post))"
							class="panel-item-desc"
							:text="getMoodText(post)"
							font-size="24rpx"
							:line-height="1.5"
							color="#7d6e81"
						/>
						<text v-else class="panel-item-desc panel-item-desc--muted">{{ getPostBrief(post) }}</text>
						<VoicePlayer v-if="isVoiceMood(post) && post.voiceUrl" :src="post.voiceUrl" :duration="post.voiceDuration" class="panel-item-voice" />
						<MoodVideo
							v-if="isVideoReady(post)"
							:src="post.videoUrl"
							:poster="post.videoCoverUrl"
							:mood-id="post.moodId"
							height="320rpx"
							class="panel-item-video-wrap"
						/>
						<view v-if="isVideoMood(post) && !isVideoReady(post)" class="panel-item-media-tip">{{ getVideoStatusText(post) }}</view>
					</view>
				</template>
			</view>

			<!-- 通用设置 -->
			<view v-else-if="tab === 'settings'" class="settings-page">
				<view class="settings-card">
					<text class="settings-card-title">协议与规则</text>
					<view
						v-for="entry in policyEntries"
						:key="entry.key"
						class="settings-link-row"
						@click="openPolicyEntry(entry.type)"
					>
						<view class="settings-link-main">
							<text class="settings-link-title">{{ entry.title }}</text>
							<text class="settings-link-desc">{{ entry.desc }}</text>
						</view>
						<text class="settings-link-arrow">›</text>
					</view>
				</view>

				<view class="settings-card">
					<text class="settings-card-title">信息收集清单</text>
					<view
						v-for="card in infoCollectionCards"
						:key="card.key"
						class="info-collect-card"
					>
						<text class="info-collect-title">{{ card.title }}</text>
						<text class="info-collect-line">收集内容：{{ card.summary }}</text>
						<text class="info-collect-line">使用目的：{{ card.purpose }}</text>
						<text class="info-collect-line">保存方式：{{ card.storage }}</text>
					</view>
				</view>
			</view>

			<!-- 手机号管理 -->
			<view v-else-if="tab === 'mobile'" class="form-card mobile-form">
				<text class="edit-section-title">当前账号信息</text>
				<text class="editor-label">当前手机号</text>
				<view class="editor-input disabled-input disabled-field">{{ currentMobile }}</view>
				<view class="mini-btn rebind-entry-btn" @click="toggleSwitchAccount">
					{{ showSwitchAccount ? '取消换绑' : '换绑账号' }}
				</view>
				<view v-if="showSwitchAccount" class="rebind-card">
					<text class="editor-label">新手机号</text>
					<input
						v-model="switchForm.mobile"
						class="editor-input"
						type="number"
						maxlength="11"
						placeholder="请输入要换绑的手机号"
						placeholder-class="input-placeholder"
						:adjust-position="false"
					/>
					<text class="editor-label">短信验证码</text>
					<view class="verify-row">
						<input
							v-model="switchForm.code"
							class="editor-input verify-input"
							type="number"
							maxlength="6"
							placeholder="请输入验证码"
							placeholder-class="input-placeholder"
							:adjust-position="false"
						/>
						<button
							class="verify-btn"
							:disabled="switchCodeCountdown > 0"
							hover-class="verify-btn-hover"
							@click="sendSwitchCode"
						>
							{{ switchCodeCountdown > 0 ? `${switchCodeCountdown}s` : '发送验证码' }}
						</button>
					</view>
					<button class="save-btn verify-submit-btn" hover-class="save-btn-hover" @click="onSwitchAccount">
						确认换绑
					</button>
				</view>
			</view>

			<!-- 帮助与反馈 -->
			<view v-else-if="tab === 'help'" class="form-card">
				<view class="service-tabs">
					<view class="service-tab" :class="{ active: serviceMode === 'feedback' }" @click="serviceMode = 'feedback'">帮助反馈</view>
					<view class="service-tab" :class="{ active: serviceMode === 'video_replace' }" @click="serviceMode = 'video_replace'">视频替换诉求</view>
				</view>
				<view v-if="serviceMode === 'feedback'">
					<textarea
						v-model="feedbackText"
						class="feedback-input"
						maxlength="240"
						placeholder="请输入你的问题或建议，我们会尽快处理"
						:adjust-position="false"
					/>
					<button class="save-btn" @click="onSubmitFeedback">提交反馈</button>
				</view>
				<view v-else>
					<picker :range="videoPostOptions" range-key="label" @change="onVideoPostPick">
						<view class="editor-input picker-input">
							{{ selectedVideoLabel || '请选择需要替换的视频内容' }}
						</view>
					</picker>
					<textarea
						v-model="replaceReasonText"
						class="feedback-input"
						maxlength="240"
						placeholder="请输入替换诉求原因（必填）"
						:adjust-position="false"
					/>
					<button class="save-btn" @click="onSubmitVideoReplace">提交替换诉求</button>
				</view>
				<view v-if="serviceRecords.length" class="feedback-list">
					<text class="feedback-title">客服工单流转</text>
					<view v-for="item in serviceRecords" :key="item.id" class="service-item">
						<text class="service-line">{{ getServiceTypeText(item.type) }} · {{ getServiceStatusText(item.status) }}</text>
						<text class="service-line">{{ item.text }}</text>
						<text class="service-line">{{ formatRecordTime(item.createdAt) }}</text>
					</view>
				</view>
			</view>

			<!-- 关于应用 -->
			<view v-else-if="tab === 'about'" class="form-card">
				<text class="about-title">关于应用</text>
				<text class="about-text">聚焦情绪记录、内容分享、广场浏览、匹配互动与个人资料管理。</text>
				<text class="about-text">版本：v1.0.0</text>
				<view class="about-tags">
					<text class="about-tag">内容发布</text>
					<text class="about-tag">互动评论</text>
					<text class="about-tag">情绪匹配</text>
					<text class="about-tag">个人主页</text>
				</view>
			</view>

			<!-- 编辑资料 -->
			<view v-else-if="tab === 'edit'" class="form-card edit-form">
				<text class="edit-section-title">账号基础信息</text>
				<text class="editor-label">用户ID</text>
				<view class="editor-input disabled-input disabled-field">{{ displayUserId }}</view>
				<view id="edit-username-field" class="edit-field-block">
					<text class="editor-label">账户用户名</text>
					<input
						class="editor-input"
						type="text"
						:value="profileForm.username"
						placeholder="请输入账户用户名"
						maxlength="16"
						placeholder-class="input-placeholder"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-username-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onUsernameInput"
					/>
				</view>
				<text class="edit-section-title">个人资料编辑</text>
				<text class="editor-label">头像</text>
				<view class="avatar-upload-row" @click="chooseAvatar">
					<view class="avatar-preview">
						<image
							v-if="isImageAvatar(profileForm.avatar)"
							class="avatar-preview-img"
							:src="profileForm.avatar"
							mode="aspectFill"
						/>
						<text v-else>{{ getDisplayAvatar(profileForm.avatar) }}</text>
					</view>
					<text class="avatar-upload-tip">点击更换头像</text>
				</view>
				<text class="editor-label">性别 <text class="required-mark">*</text></text>
				<view class="sex-selector">
					<view
						class="sex-option"
						:class="{ active: profileForm.sex === 1 }"
						@click="profileForm.sex = 1"
					>
						<text>男</text>
					</view>
					<view
						class="sex-option"
						:class="{ active: profileForm.sex === 2 }"
						@click="profileForm.sex = 2"
					>
						<text>女</text>
					</view>
				</view>
				<view id="edit-age-field" class="edit-field-block">
					<text class="editor-label">年龄 <text class="required-mark">*</text></text>
					<input
						class="editor-input"
						type="number"
						:value="profileForm.age"
						placeholder="请输入年龄（1-120）"
						min="1"
						max="120"
						placeholder-class="input-placeholder"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-age-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onAgeInput"
					/>
				</view>
				<view id="edit-signature-field" class="edit-field-block">
					<text class="editor-label">简介</text>
					<textarea
						class="feedback-input"
						:value="profileForm.signature"
						placeholder="请输入个人简介（最多100字）"
						maxlength="100"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-signature-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onSignatureInput"
					/>
				</view>
				<button class="save-btn" :disabled="saving" @click="onSaveProfile">{{ saving ? '保存中...' : '保存资料' }}</button>
			</view>
		</view>
		<MoodVideoFullscreen />
	</view>
</template>

<script>
import { getUserProfile, updateProfile, changeAvatar } from '@/api/user';
import { getMoodList, deleteMood } from '@/api/mood';
import { getMyFavorites } from '@/api/favorite';
import { sendSmsCode, changePhone } from '@/api/auth';
import { formatRelativeTime } from '@/utils/time';
import { getMoodBrief, getMoodText, getVideoStatusText, isTextMood, isVideoMood, isVideoReady, isVoiceMood } from '@/utils/moodContent';
import { setPublishEntryIntent } from '@/utils/publishEntryIntent';
import { reportMoodView } from '@/utils/moodView';
import IconFont from '@/components/IconFont.vue';
import VoicePlayer from '@/components/VoicePlayer.vue';
import MoodVideo from '@/components/MoodVideo.vue';
import MoodVideoFullscreen from '@/components/MoodVideoFullscreen.vue';
import MoodTextExpand from '@/components/MoodTextExpand.vue';
import { closeMoodVideo, requestMoodVideoRectSync } from '@/utils/moodVideoPortal';
import { moodVideoBackMixin } from '@/utils/moodVideoBack';
import { formKeyboardMixin } from '@/utils/keyboard';
import { getDisplayAvatar, isImageAvatar } from '@/utils/avatar';
import { chooseAvatarImage } from '@/utils/chooseImage';

const SERVICE_RECORDS_KEY = 'profile_service_records_v1';
const POLICY_ENTRIES = [
	{ key: 'user', title: '用户协议', desc: '查看账号使用规则、服务边界和用户责任', type: 'user' },
	{ key: 'privacy', title: '隐私政策', desc: '查看信息收集范围、用途和本地保存方式', type: 'privacy' },
	{ key: 'permission', title: '权限说明', desc: '查看相册、相机、录音和存储能力的使用说明', type: 'permission' }
];
const INFO_COLLECTION_CARDS = [
	{ key: 'account', title: '账号信息', summary: '手机号、用户名、用户 ID、登录态', purpose: '用于登录鉴权、账号识别和页面展示', storage: '当前设备本地缓存' },
	{ key: 'profile', title: '个人资料', summary: '头像、性别、年龄、简介', purpose: '用于个人主页、资料编辑和互动展示', storage: '当前设备本地缓存' },
	{ key: 'content', title: '内容数据', summary: '发布内容、评论、点赞、收藏、反馈、客服记录', purpose: '用于动态展示、互动统计和客服处理', storage: '当前设备本地缓存' },
	{ key: 'local', title: '本地缓存', summary: '草稿、浏览历史、隐私设置、AI 配额、授权记录', purpose: '用于提升使用连续性和状态恢复', storage: '仅保存在当前设备' }
];
const TAB_TITLES = {
	posts: '我的内容',
	favorites: '我的收藏',
	settings: '通用设置',
	mobile: '手机号管理',
	help: '帮助与反馈',
	about: '关于应用',
	edit: '编辑资料'
};

function safeDecodeParam(value) {
	if (!value) return '';
	try {
		return decodeURIComponent(value);
	} catch (e) {
		return value;
	}
}

export default {
	name: 'ProfileSubPage',
	components: { IconFont, VoicePlayer, MoodVideo, MoodVideoFullscreen, MoodTextExpand },
	mixins: [moodVideoBackMixin, formKeyboardMixin],
	data() {
		return {
			tab: 'posts',
			targetUserId: '',
			targetNickname: '',
			targetAvatar: '',
			userInfo: {},
			myPosts: [],
			favoritePosts: [],
			postsInnerTab: 'published',
			myPostsPage: 1,
			myPostsPageSize: 6,
			showSwitchAccount: false,
			switchCodeCountdown: 0,
			switchForm: {
				mobile: '',
				code: ''
			},
			switchCodeTimer: null,
			serviceMode: 'feedback',
			feedbackText: '',
			replacePostId: '',
			replaceReasonText: '',
			serviceRecords: [],
			profileForm: {
				username: '',
				avatar: '',
				signature: '',
				sex: 0,
				age: ''
			},
			saving: false,
			policyEntries: POLICY_ENTRIES,
			infoCollectionCards: INFO_COLLECTION_CARDS
		};
	},
	computed: {
		pageTitle() {
			if (this.tab === 'posts' || this.tab === 'favorites') {
				return this.canViewFavorites ? (TAB_TITLES[this.tab] || '我的内容') : `${this.targetDisplayName}的内容`;
			}
			return TAB_TITLES[this.tab] || '我的页面';
		},
		currentUserId() {
			return this.userInfo.userId != null
				? this.userInfo.userId
				: (this.userInfo.id != null ? this.userInfo.id : '');
		},
		canViewFavorites() {
			if (!this.targetUserId) return true;
			if (this.currentUserId === '' || this.currentUserId == null) return false;
			return String(this.targetUserId) === String(this.currentUserId);
		},
		canManagePublishedPosts() {
			return this.canViewFavorites;
		},
		targetDisplayName() {
			if (this.canViewFavorites) return '我';
			return this.targetNickname || 'TA';
		},
		publishedTabLabel() {
			return this.canViewFavorites ? '我发布的内容' : '发布的内容';
		},
		publishedEmptyText() {
			return this.canViewFavorites ? '还没有发布内容，去发布你的第一条动态吧' : '暂未发布内容';
		},
		currentMobile() {
			return this.userInfo.phone || this.userInfo.mobile || '未绑定';
		},
		pagedMyPosts() {
			return this.myPosts.slice(0, this.myPostsPage * this.myPostsPageSize);
		},
		hasMoreMyPosts() {
			return this.pagedMyPosts.length < this.myPosts.length;
		},
		myVideoPosts() {
			return this.myPosts.filter(item => item.videoUrl);
		},
		videoPostOptions() {
			return this.myVideoPosts.map(item => ({
				value: item.moodId,
				label: this.getPostBrief(item).slice(0, 20)
			}));
		},
		selectedVideoLabel() {
			const found = this.videoPostOptions.find(item => String(item.value) === String(this.replacePostId));
			return found ? found.label : '';
		},
		displayUserId() {
			const userId = this.userInfo.userId != null
				? this.userInfo.userId
				: (this.userInfo.id != null ? this.userInfo.id : '');
			return userId !== '' && userId != null ? String(userId) : '未获取到用户ID';
		},
		subPageStyle() {
			return this.tab === 'edit' ? this.formKeyboardPadStyle : {};
		}
	},
	onLoad(options) {
		this.tab = options.tab || 'posts';
		this.targetUserId = options.userId != null ? String(options.userId) : '';
		this.targetNickname = safeDecodeParam(options.nickname);
		this.targetAvatar = safeDecodeParam(options.avatar);
		if (this.targetUserId && this.tab !== 'posts' && this.tab !== 'favorites') {
			this.tab = 'posts';
		}
		if (this.tab === 'favorites') {
			this.postsInnerTab = 'favorites';
		}
		uni.setNavigationBarTitle({ title: this.pageTitle });
		this.loadServiceRecords();
		this.loadPageData();
	},
	onShow() {
		if ((this.tab === 'posts' || this.tab === 'favorites') && this.canViewFavorites) {
			this.loadFavoritePosts();
		}
	},
	onUnload() {
		closeMoodVideo();
		if (this.switchCodeTimer) {
			clearInterval(this.switchCodeTimer);
			this.switchCodeTimer = null;
		}
	},
	onPageScroll(e) {
		requestMoodVideoRectSync(e);
	},
	methods: {
		isImageAvatar,
		getDisplayAvatar,

		openPolicyEntry(type) {
			if (type === 'permission') {
				uni.showModal({
					title: '权限说明',
					content: '我们仅在你主动触发功能时申请对应权限，不会在后台自动访问设备能力。\n\n相册/相机用于头像更新，录音用于语音发布，存储用于草稿与浏览历史等本地数据保存。\n\n你可以在系统设置中随时管理授权，拒绝后对应能力将不可使用。',
					showCancel: false,
					confirmText: '我知道了'
				});
				return;
			}
			const typeMap = {
				user: 'agreement',
				privacy: 'privacy'
			};
			const queryType = typeMap[type] || type;
			uni.navigateTo({ url: `/pages/settings/about?type=${queryType}` });
		},

		async loadPageData() {
			await this.loadUserInfo();
			this.normalizeProfileAccess();
			uni.setNavigationBarTitle({ title: this.pageTitle });
			await this.loadMyPosts();
			if (this.canViewFavorites) {
				this.loadFavoritePosts();
			} else {
				this.favoritePosts = [];
			}
			if (this.tab === 'edit') {
				this.syncProfileFormFromUser();
			}
		},

		normalizeProfileAccess() {
			if (this.canViewFavorites) return;
			if (this.tab !== 'posts') {
				this.tab = 'posts';
			}
			if (this.tab === 'favorites') {
				this.tab = 'posts';
			}
			if (this.postsInnerTab === 'favorites') {
				this.postsInnerTab = 'published';
			}
		},

		syncProfileFormFromUser() {
			this.profileForm = {
				username: this.userInfo.username || this.userInfo.nickname || this.userInfo.nickName || '',
				avatar: this.userInfo.avatar || '',
				signature: this.userInfo.signature || this.userInfo.bio || '',
				sex: this.userInfo.sex || 0,
				age: this.userInfo.age || ''
			};
		},

		onUsernameInput(e) {
			this.profileForm.username = (e.detail && e.detail.value) || '';
		},

		onSignatureInput(e) {
			this.profileForm.signature = (e.detail && e.detail.value) || '';
		},

		onAgeInput(e) {
			const val = e.detail && e.detail.value;
			this.profileForm.age = val === '' ? '' : Number(val);
		},

		async loadUserInfo() {
			try {
				const res = await getUserProfile();
				this.userInfo = res.data || {};
			} catch (e) {
				console.error('获取用户信息失败:', e);
			}
		},

		async loadMyPosts() {
			try {
				const params = {
					pageNum: 1,
					pageSize: 200,
					sortMode: 'time'
				};
				if (this.canViewFavorites) {
					params.onlyMine = true;
				} else {
					params.userId = this.targetUserId;
				}
				const res = await getMoodList(params);
				this.myPosts = res.rows || [];
			} catch (e) {
				this.myPosts = [];
			}
		},

		async loadFavoritePosts() {
			if (!this.canViewFavorites) {
				this.favoritePosts = [];
				return;
			}
			try {
				const res = await getMyFavorites({ pageNum: 1, pageSize: 200 }, { loading: false });
				this.favoritePosts = res.rows || [];
			} catch (e) {
				this.favoritePosts = [];
			}
		},

		loadServiceRecords() {
			try {
				this.serviceRecords = uni.getStorageSync(SERVICE_RECORDS_KEY) || [];
			} catch (e) {
				this.serviceRecords = [];
			}
		},

		saveServiceRecords() {
			try {
				uni.setStorageSync(SERVICE_RECORDS_KEY, this.serviceRecords);
			} catch (e) {
				console.error('保存工单失败:', e);
			}
		},

		getPostBrief(post) {
			return getMoodBrief(post);
		},

		getMoodText,
		getVideoStatusText,
		isTextMood,
		isVoiceMood,
		isVideoMood,
		isVideoReady,

		formatTime(dateStr) {
			return formatRelativeTime(dateStr);
		},

		formatRecordTime(iso) {
			if (!iso) return '';
			const date = new Date(iso);
			if (Number.isNaN(date.getTime())) return iso;
			return date.toLocaleString();
		},

		loadMoreMyPosts() {
			if (!this.hasMoreMyPosts) return;
			this.myPostsPage += 1;
		},

		openPost(id, post) {
			reportMoodView(id, post);
			uni.navigateTo({ url: `/pages/space/detail?id=${id}` });
		},

		openPublishWithIntent(post, scene) {
			const saved = setPublishEntryIntent({
				scene,
				mood: {
					moodId: post.moodId,
					contentType: post.contentType,
					textContent: post.textContent || post.content || '',
					voiceUrl: post.voiceUrl || '',
					voiceDuration: post.voiceDuration || 0,
					videoUrl: post.videoUrl || '',
					voiceTranscription: post.voiceTranscription || post.textContent || post.content || '',
					tags: Array.isArray(post.tags) ? post.tags : []
				}
			});
			if (!saved) {
				uni.showToast({ title: '跳转失败，请稍后重试', icon: 'none' });
				return;
			}
			uni.switchTab({ url: '/pages/publish/publish' });
		},

		editPost(post) {
			if (!this.canManagePublishedPosts) return;
			reportMoodView(post.moodId, post);
			this.openPublishWithIntent(post, 'edit');
		},

		convertPostToVideo(post) {
			if (!this.canManagePublishedPosts) return;
			this.openPublishWithIntent(post, 'convertVideo');
		},

		removeMyPost(id) {
			if (!this.canManagePublishedPosts) return;
			uni.showModal({
				title: '提示',
				content: '确认删除这条动态吗？',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await deleteMood(id);
						this.myPosts = this.myPosts.filter(item => item.moodId !== id);
						uni.showToast({ title: '已删除', icon: 'success' });
					} catch (e) {
						uni.showToast({ title: '删除失败', icon: 'none' });
					}
				}
			});
		},

		toggleSwitchAccount() {
			this.showSwitchAccount = !this.showSwitchAccount;
			if (!this.showSwitchAccount) {
				this.switchForm.mobile = '';
				this.switchForm.code = '';
			}
		},

		startSwitchCodeCountdown() {
			this.switchCodeCountdown = 60;
			if (this.switchCodeTimer) clearInterval(this.switchCodeTimer);
			this.switchCodeTimer = setInterval(() => {
				this.switchCodeCountdown -= 1;
				if (this.switchCodeCountdown <= 0 && this.switchCodeTimer) {
					clearInterval(this.switchCodeTimer);
					this.switchCodeTimer = null;
				}
			}, 1000);
		},

		async sendSwitchCode() {
			if (!/^1\d{10}$/.test(this.switchForm.mobile)) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
				return;
			}
			try {
				await sendSmsCode(this.switchForm.mobile);
				this.startSwitchCodeCountdown();
				uni.showToast({ title: '验证码已发送', icon: 'none' });
			} catch (e) {
				this.startSwitchCodeCountdown();
				uni.showToast({ title: '验证码已发送（演示）', icon: 'none' });
			}
		},

		async onSwitchAccount() {
			if (!/^1\d{10}$/.test(this.switchForm.mobile)) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
				return;
			}
			const boundMobile = this.userInfo.phone || this.userInfo.mobile || '';
			if (boundMobile && this.switchForm.mobile === boundMobile) {
				uni.showToast({ title: '新手机号不能与当前手机号相同', icon: 'none' });
				return;
			}
			if (!this.switchForm.code || this.switchForm.code.length !== 6) {
				uni.showToast({ title: '请输入6位验证码', icon: 'none' });
				return;
			}
			try {
				await changePhone(this.switchForm.mobile, this.switchForm.code);
				this.showSwitchAccount = false;
				this.switchForm.mobile = '';
				this.switchForm.code = '';
				await this.loadUserInfo();
				uni.showToast({ title: '换绑成功', icon: 'success' });
			} catch (e) {
				uni.showToast({ title: e.message || '换绑失败，请检查验证码', icon: 'none' });
			}
		},

		onVideoPostPick(e) {
			const index = Number(e.detail.value);
			const item = this.videoPostOptions[index];
			this.replacePostId = item ? item.value : '';
		},

		onSubmitFeedback() {
			if (!this.feedbackText.trim()) {
				uni.showToast({ title: '请输入反馈内容', icon: 'none' });
				return;
			}
			this.serviceRecords.unshift({
				id: `fb_${Date.now()}`,
				type: 'feedback',
				text: this.feedbackText.trim(),
				status: 'pending',
				createdAt: new Date().toISOString()
			});
			this.saveServiceRecords();
			this.feedbackText = '';
			uni.showToast({ title: '反馈已进入客服处理', icon: 'success' });
		},

		onSubmitVideoReplace() {
			if (!this.replacePostId) {
				uni.showToast({ title: '请选择需要替换的视频内容', icon: 'none' });
				return;
			}
			if (!this.replaceReasonText.trim()) {
				uni.showToast({ title: '请输入替换诉求原因', icon: 'none' });
				return;
			}
			this.serviceRecords.unshift({
				id: `vr_${Date.now()}`,
				type: 'video_replace',
				postId: this.replacePostId,
				text: this.replaceReasonText.trim(),
				status: 'pending',
				createdAt: new Date().toISOString()
			});
			this.saveServiceRecords();
			this.replacePostId = '';
			this.replaceReasonText = '';
			uni.showToast({ title: '视频替换诉求已提交', icon: 'success' });
		},

		getServiceTypeText(type) {
			return type === 'feedback' ? '帮助反馈' : '视频替换';
		},

		getServiceStatusText(status) {
			if (status === 'pending') return '待处理';
			if (status === 'processed') return '已处理';
			return '处理失败';
		},

		async chooseAvatar() {
			try {
				const filePath = await chooseAvatarImage();
				await this.doUploadAvatar(filePath);
			} catch (e) {
				if (e && e.cancelled) return;
			}
		},

		async doUploadAvatar(filePath) {
			try {
				const avatarUrl = await changeAvatar(filePath);
				this.profileForm.avatar = avatarUrl || filePath;
				if (avatarUrl) {
					this.userInfo = { ...this.userInfo, avatar: avatarUrl };
				}
				uni.showToast({ title: '头像已更新', icon: 'success' });
			} catch (e) {
				uni.showToast({ title: e.message || '上传失败，请稍后重试', icon: 'none' });
			}
		},

		async onSaveProfile() {
			const username = (this.profileForm.username || '').trim();
			if (!username) {
				uni.showToast({ title: '用户名不能为空', icon: 'none' });
				return;
			}
			if (username.length < 2 || username.length > 16) {
				uni.showToast({ title: '账户用户名长度需为2-16个字符', icon: 'none' });
				return;
			}
			if (!this.profileForm.sex) {
				uni.showToast({ title: '请选择性别', icon: 'none' });
				return;
			}
			const age = this.profileForm.age;
			if (!age || age < 1 || age > 120) {
				uni.showToast({ title: '请输入正确的年龄（1-120）', icon: 'none' });
				return;
			}
			this.saving = true;
			try {
				const res = await updateProfile({
					nickName: username,
					bio: (this.profileForm.signature || '').trim(),
					sex: this.profileForm.sex,
					age: Number(age)
				});
				if (res.data) {
					this.userInfo = res.data;
					this.syncProfileFormFromUser();
				}
				uni.showToast({ title: '资料已保存', icon: 'success' });
				setTimeout(() => {
					uni.navigateBack();
				}, 500);
			} catch (e) {
				console.error('保存资料失败:', e);
			} finally {
				this.saving = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.sub-page {
	min-height: 100vh;
	background: #f7f1f8;
}

.page-content {
	padding: 24rpx;
}

.card-list,
.form-card {
	background: #ffffff;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	padding: 24rpx;
}

.form-card {
	min-height: 440rpx;
}

.content-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
	flex-wrap: wrap;
}

.content-tab-btn {
	border: 1rpx solid #d9e0ff;
	background: #ffffff;
	color: #8f6fb0;
	border-radius: 32rpx;
	padding: 12rpx 24rpx;
	font-size: 24rpx;
}

.content-tab-btn.active {
	background: #8f6fb0;
	border-color: #8f6fb0;
	color: #ffffff;
}

.panel-empty {
	text-align: center;
	color: #9f92a2;
	font-size: 26rpx;
	padding: 28rpx 0;
	display: block;
}

.panel-item {
	border: 1rpx solid #edf0f7;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}

.panel-item-click:active {
	opacity: 0.85;
}

.panel-item-title {
	display: block;
	font-size: 26rpx;
	color: #57465b;
	font-weight: 600;
	line-height: 1.5;
}

.panel-item-title--muted {
	color: #66708f;
}

.panel-item-desc {
	display: block;
	margin-top: 8rpx;
	color: #7d6e81;
	font-size: 24rpx;
	line-height: 1.5;
}

.panel-item-desc--muted {
	color: #66708f;
}

.panel-item-voice {
	margin-top: 12rpx;
}

.panel-item-video-wrap {
	position: relative;
	width: 100%;
	height: 320rpx;
	margin-top: 12rpx;
	border-radius: 16rpx;
	overflow: hidden;
	background: #000000;
}

.panel-item-video {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: block;
	background: #000000;
}

.panel-item-media-tip {
	margin-top: 12rpx;
	padding: 20rpx;
	border-radius: 16rpx;
	background: #fbf7fb;
	color: #9f92a2;
	font-size: 24rpx;
	text-align: center;
}

.panel-item-meta {
	margin-top: 8rpx;
	color: #888888;
	font-size: 24rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-wrap: wrap;
}

.panel-meta-like,
.panel-meta-comment {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
}

.panel-meta-like.is-liked {
	color: #ea6f88;
}

.post-actions {
	margin-top: 16rpx;
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
}

.post-action-btn {
	border: 1rpx solid #dfe3f2;
	background: #ffffff;
	color: #4f5fb1;
	border-radius: 28rpx;
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	line-height: 1.2;
}

.post-action-btn.primary {
	border-color: rgba(143, 111, 176, 0.3);
	background: rgba(143, 111, 176, 0.12);
	color: #4f63d6;
}

.post-action-btn.danger {
	border-color: #ffd1d6;
	color: #ea6f88;
}

.post-action-btn::after {
	border: none;
}

.paging-wrap {
	display: flex;
	justify-content: center;
	margin-top: 20rpx;
}

.mini-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid #e8ecff;
	background: #ffffff;
	color: #8f6fb0;
	border-radius: 28rpx;
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	line-height: 1.4;
	width: auto;
	box-sizing: border-box;
}

.mobile-form .edit-section-title,
.edit-form .edit-section-title {
	font-size: 28rpx;
	margin: 8rpx 0 16rpx;
}

.mobile-form .editor-label,
.edit-form .editor-label {
	font-size: 26rpx;
	margin-bottom: 12rpx;
}

.mobile-form .editor-input,
.edit-form .editor-input {
	height: 80rpx;
	line-height: 80rpx;
	padding: 0 20rpx;
	border-radius: 20rpx;
	font-size: 28rpx;
	margin-bottom: 16rpx;
}

.mobile-form .disabled-field,
.edit-form .disabled-field {
	display: flex;
	align-items: center;
	color: #8c93b3;
	background: #f6f7fc;
}

.input-placeholder {
	color: #b8bdd4;
	font-size: 28rpx;
}

.rebind-entry-btn {
	margin-bottom: 16rpx;
}

.rebind-card {
	border: 1rpx solid #e6eafc;
	background: #fbfcff;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}

.verify-row {
	display: flex;
	gap: 16rpx;
	align-items: center;
	margin-bottom: 16rpx;
}

.verify-input {
	flex: 1;
	width: 0;
	min-width: 0;
	margin-bottom: 0;
}

.verify-btn {
	width: 196rpx;
	height: 80rpx;
	border-radius: 20rpx;
	border: 1rpx solid #d4dcff;
	background: #ffffff;
	color: #5f6fc6;
	font-size: 24rpx;
	line-height: 80rpx;
	padding: 0;
	margin: 0;
	flex-shrink: 0;
	box-sizing: border-box;
}

.verify-btn-hover {
	opacity: 0.85;
}

.verify-btn::after {
	border: none;
}

.verify-btn[disabled] {
	opacity: 0.6;
	color: #5f6fc6;
	background: #ffffff;
}

.verify-submit-btn {
	margin-top: 0;
}

.save-btn-hover {
	opacity: 0.92;
}

.edit-section-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #57465b;
	margin: 8rpx 0 16rpx;
}

.editor-label {
	display: block;
	font-size: 26rpx;
	color: #7d6e81;
	margin-bottom: 12rpx;
}

.editor-input {
	width: 100%;
	border: 1rpx solid #e5e7f3;
	border-radius: 20rpx;
	padding: 20rpx;
	font-size: 28rpx;
	margin-bottom: 16rpx;
	box-sizing: border-box;
	background: #ffffff;
}

.disabled-input {
	background: #f6f7fc;
	color: #8c93b3;
}

.picker-input {
	color: #57465b;
}

.save-btn {
	width: 100%;
	margin-top: 24rpx;
	border: none;
	border-radius: 20rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	color: #ffffff;
	font-size: 28rpx;
	padding: 20rpx 0;
	line-height: 1.2;
}

.save-btn::after {
	border: none;
}

.feedback-input {
	width: 100%;
	min-height: 180rpx;
	border: 1rpx solid #e6e6e6;
	border-radius: 20rpx;
	font-size: 28rpx;
	padding: 20rpx;
	box-sizing: border-box;
}

.service-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
	flex-wrap: wrap;
}

.service-tab {
	border: 1rpx solid #d9e0ff;
	background: #ffffff;
	color: #8f6fb0;
	border-radius: 32rpx;
	padding: 12rpx 24rpx;
	font-size: 24rpx;
}

.service-tab.active {
	background: #8f6fb0;
	border-color: #8f6fb0;
	color: #ffffff;
}

.feedback-list {
	margin-top: 24rpx;
}

.feedback-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #7d6e81;
	margin-bottom: 16rpx;
}

.service-item {
	background: #fbf7fb;
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	margin-bottom: 16rpx;
}

.service-line {
	display: block;
	font-size: 24rpx;
	color: #555555;
	line-height: 1.5;
}

.about-title {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	color: #57465b;
	margin-bottom: 16rpx;
}

.about-text {
	display: block;
	color: #7d6e81;
	font-size: 26rpx;
	line-height: 1.6;
	margin-bottom: 12rpx;
}

.about-tags {
	margin-top: 16rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.about-tag {
	font-size: 24rpx;
	color: #8f6fb0;
	background: rgba(143, 111, 176, 0.12);
	border-radius: 28rpx;
	padding: 8rpx 16rpx;
}

.avatar-upload-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 16rpx;
}

.avatar-preview {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: #f0f3ff;
	color: #5463b8;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	overflow: hidden;
	flex-shrink: 0;
}

.avatar-preview-img {
	width: 100%;
	height: 100%;
}

.avatar-upload-tip {
	font-size: 26rpx;
	color: #8f6fb0;
}

.sex-selector {
	display: flex;
	gap: 24rpx;
	margin-bottom: 16rpx;
}

.sex-option {
	flex: 1;
	height: 80rpx;
	border: 1rpx solid #e5e7f3;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #7d6e81;
	background: #ffffff;
}

.sex-option.active {
	border-color: #8f6fb0;
	background: rgba(143, 111, 176, 0.08);
	color: #8f6fb0;
}

.required-mark {
	color: #ea6f88;
}

.settings-page {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.settings-card {
	background: #fffefe;
	border-radius: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(141, 123, 160, 0.08);
	padding: 28rpx;
	border: 1rpx solid #f1ebf6;
}

.settings-card-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #2d2640;
	margin-bottom: 20rpx;
}

.settings-link-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border: 1rpx solid #e8deff;
	border-radius: 28rpx;
	background: #fffdfd;
	padding: 20rpx 24rpx;
	margin-bottom: 16rpx;
}

.settings-link-row:last-child {
	margin-bottom: 0;
}

.settings-link-row:active {
	opacity: 0.92;
}

.settings-link-main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	padding-right: 16rpx;
}

.settings-link-title {
	font-size: 26rpx;
	color: #2d2640;
	font-weight: 600;
}

.settings-link-desc {
	font-size: 24rpx;
	color: #594f70;
	line-height: 1.5;
}

.settings-link-arrow {
	font-size: 36rpx;
	color: #8b80a0;
	flex-shrink: 0;
	line-height: 1;
}

.info-collect-card {
	border: 1rpx solid #e8deff;
	border-radius: 28rpx;
	background: #fffdfd;
	padding: 20rpx 24rpx;
	margin-bottom: 16rpx;
}

.info-collect-card:last-child {
	margin-bottom: 0;
}

.info-collect-title {
	display: block;
	font-size: 26rpx;
	color: #2d2640;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.info-collect-line {
	display: block;
	font-size: 24rpx;
	color: #594f70;
	line-height: 1.55;
}
</style>
