/**
 * C 端接口文档与页面 UI 模型之间的适配层
 * 文档：C端接口 (App).md
 */

const SORT_MODE_MAP = {
	latest: 'time',
	time: 'time',
	hot: 'today_hot',
	today_hot: 'today_hot',
	todayHot: 'today_hot',
	allTimeHot: 'all_hot',
	all_hot: 'all_hot',
	historyHot: 'all_hot'
};

/** 页面 sortType/sortMode → 接口 sortMode */
export function mapSortMode(value) {
	if (!value) return 'time';
	return SORT_MODE_MAP[value] || value;
}

/** 页面列表参数 → 接口 GET /api/moods 参数 */
export function mapMoodListParams(params = {}) {
	const mapped = {
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 20,
		sortMode: mapSortMode(params.sortMode || params.sortType || 'time')
	};

	if (params.onlyMine === true || params.userId === 'self') {
		mapped.onlyMine = true;
	} else if (params.userId != null && params.userId !== '') {
		mapped.userId = params.userId;
	}
	if (params.keyword) mapped.keyword = params.keyword;
	if (params.contentType) mapped.contentType = params.contentType;
	if (params.tagName) mapped.tagName = params.tagName;

	return mapped;
}

function formatPublishTime(value) {
	if (value == null || value === '') return '';
	if (typeof value === 'number') {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return String(value);
		const pad = (n) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	}
	return String(value);
}

function normalizeTags(tags) {
	if (!Array.isArray(tags)) return [];
	return tags.map((tag, index) => {
		if (typeof tag === 'string') {
			return { tagId: index + 1, tagName: tag };
		}
		return {
			tagId: tag.tagId || tag.id || index + 1,
			tagName: tag.tagName || tag.name || ''
		};
	}).filter((item) => item.tagName);
}

function normalizeContentType(raw = {}) {
	const type = Number(raw.contentType);
	const videoStatus = Number(raw.videoGenStatus != null ? raw.videoGenStatus : raw.videoStatus);
	const hasVideoUrl = Boolean(String(raw.videoUrl || '').trim());
	// 生成中/成功/失败/审核中，或显式视频类型，都按视频帖展示状态提示
	if (
		type === 3 ||
		hasVideoUrl ||
		videoStatus === 1 ||
		videoStatus === 2 ||
		videoStatus === 3 ||
		videoStatus === 4
	) {
		return 3;
	}
	if (type === 2 || raw.voiceUrl) return 2;
	return 1;
}

/** AppMoodVo → 页面 mood 模型 */
export function normalizeMood(raw = {}) {
	if (!raw || typeof raw !== 'object') return raw;

	const moodId = raw.moodId != null ? raw.moodId : raw.id;
	const videoGenStatus = raw.videoGenStatus != null ? raw.videoGenStatus : raw.videoStatus;
	const contentType = normalizeContentType(raw);

	return {
		...raw,
		moodId,
		id: moodId,
		userId: raw.userId,
		nickname: raw.nickname || raw.nickName || '匿名用户',
		nickName: raw.nickName || raw.nickname || '',
		avatar: raw.avatar || '',
		content: raw.content || raw.textContent || raw.voiceTranscription || (raw.voiceUrl ? '语音内容' : ''),
		textContent: raw.textContent || raw.content || raw.voiceTranscription || '',
		contentType,
		voiceUrl: raw.voiceUrl || '',
		voiceDuration: raw.voiceDuration || 0,
		voiceTranscription: raw.voiceTranscription || '',
		videoUrl: raw.videoUrl || '',
		videoCoverUrl: raw.videoCoverUrl || '',
		videoDuration: raw.videoDuration || 0,
		videoStatus: videoGenStatus != null ? String(videoGenStatus) : '0',
		videoGenStatus: videoGenStatus != null ? Number(videoGenStatus) : 0,
		createTime: formatPublishTime(raw.createTime || raw.publishTime),
		publishTime: raw.publishTime || raw.createTime || '',
		likeCount: raw.likeCount || 0,
		commentCount: raw.commentCount || 0,
		viewCount: raw.viewCount != null ? Number(raw.viewCount) : 0,
		liked: Boolean(raw.liked),
		favorited: Boolean(raw.favorited),
		auditStatus: raw.auditStatus,
		auditReason: raw.auditReason || '',
		tags: normalizeTags(raw.tags)
	};
}

/** AppCommentVo → 页面 comment 模型 */
export function normalizeComment(raw = {}) {
	if (!raw || typeof raw !== 'object') return raw;

	const commentId = raw.commentId != null ? raw.commentId : raw.id;

	return {
		...raw,
		commentId,
		id: commentId,
		moodId: raw.moodId,
		userId: raw.userId,
		nickname: raw.nickname || raw.nickName || '匿名用户',
		nickName: raw.nickName || raw.nickname || '',
		avatar: raw.avatar || '',
		content: raw.content || raw.commentText || '',
		commentText: raw.commentText || raw.content || '',
		createTime: formatPublishTime(raw.createTime),
		likeCount: raw.likeCount != null ? raw.likeCount : 0,
		liked: Boolean(raw.liked),
		parentId: raw.parentId,
		rootId: raw.rootId,
		replyUserId: raw.replyUserId,
		replyNickName: raw.replyNickName || '',
		replyCount: raw.replyCount || 0
	};
}

/** AppUserProfileVo → 页面 user 模型 */
export function normalizeUser(raw = {}) {
	if (!raw || typeof raw !== 'object') return raw;

	const userId = raw.userId != null ? raw.userId : (raw.id != null ? raw.id : (raw.uid != null ? raw.uid : raw.memberId));

	return {
		...raw,
		userId,
		nickname: raw.nickname || raw.nickName || '',
		nickName: raw.nickName || raw.nickname || '',
		avatar: raw.avatar || '',
		signature: raw.signature || raw.bio || '',
		bio: raw.bio || raw.signature || '',
		phone: raw.phone || raw.phoneNumber || '',
		phoneNumber: raw.phoneNumber || raw.phone || '',
		sex: raw.sex,
		inviteCode: raw.inviteCode || '',
		status: raw.status
	};
}

/** 分页响应 → { rows, total } */
export function normalizePageResult(res, itemNormalizer) {
	const page = res && res.data && typeof res.data === 'object' ? res.data : {};
	const records = page.records || res.rows || [];
	const rows = itemNormalizer ? records.map(itemNormalizer) : records;

	return {
		...res,
		rows,
		total: page.total != null ? page.total : (res.total || rows.length)
	};
}

/** 单对象 data 响应 */
export function normalizeDataResult(res, itemNormalizer) {
	const data = res && res.data != null ? res.data : res;
	return {
		...res,
		data: itemNormalizer ? itemNormalizer(data) : data
	};
}

function normalizeUploadUrl(url) {
	const value = String(url || '').trim();
	if (!value) return '';
	return value
		.replace(/^https?:\/\/(https?:\/\/)+/i, (match) => {
			const protocol = match.toLowerCase().startsWith('https://') ? 'https://' : 'http://';
			return protocol;
		})
		.replace(/^http:\/\/https:\/\//i, 'https://')
		.replace(/^https:\/\/http:\/\//i, 'http://');
}

/** 上传响应 AppUploadVo → { url, ossId } */
export function normalizeUploadResult(res) {
	const raw = res && res.data && typeof res.data === 'object' ? res.data : res;
	const payload = raw && typeof raw === 'object' ? raw : {};
	return {
		url: normalizeUploadUrl(payload.url || payload.avatarUrl || ''),
		ossId: payload.ossId != null ? payload.ossId : null
	};
}

/** 点赞 toggle 响应 */
export function normalizeLikeResult(res) {
	const payload = res && res.data && typeof res.data === 'object' ? res.data : res;
	return {
		liked: Boolean(payload.liked),
		likeCount: payload.likeCount != null ? payload.likeCount : 0
	};
}

/** 收藏 toggle 响应 */
export function normalizeFavoriteResult(res) {
	const payload = res && res.data && typeof res.data === 'object' ? res.data : res;
	return {
		favorited: Boolean(payload.favorited)
	};
}

/** 页面 targetType → 接口 targetType（'0'/0/1=心情，'1'/2=评论） */
export function mapLikeTargetType(targetType) {
	if (targetType === '0' || targetType === 0 || targetType === 1) {
		return 1;
	}
	if (targetType === '1' || targetType === 2 || targetType === '2') {
		return 2;
	}
	return 1;
}

/** 页面发布参数 → AppPublishMoodReq */
export function mapPublishMoodPayload(data = {}) {
	const payload = {
		contentType: data.contentType || 1,
		tags: []
	};

	if (Array.isArray(data.tags) && data.tags.length) {
		payload.tags = data.tags.map((tag) => (typeof tag === 'string' ? tag : tag.tagName)).filter(Boolean);
	} else if (Array.isArray(data.customTags)) {
		payload.tags = data.customTags.filter(Boolean);
	}

	if (payload.contentType === 2) {
		payload.voiceUrl = data.voiceUrl || '';
		payload.voiceDuration = data.voiceDuration || 0;
		if (data.textContent) payload.textContent = data.textContent;
		payload.voiceText = data.voiceText || data.voiceTranscription || data.textContent || '';
	} else if (payload.contentType === 3) {
		payload.textContent = data.textContent || data.content || '';
		if (data.voiceUrl) payload.voiceUrl = data.voiceUrl;
		if (data.voiceDuration != null) payload.voiceDuration = data.voiceDuration;
		if (data.voiceTranscription) payload.voiceTranscription = data.voiceTranscription;
		if (data.videoUrl) payload.videoUrl = data.videoUrl;
	} else {
		payload.textContent = data.textContent || data.content || '';
	}

	if (data.generateVideo != null) {
		payload.generateVideo = Boolean(data.generateVideo);
	}

	return payload;
}

/** 页面编辑参数 → AppEditMoodReq */
export function mapEditMoodPayload(data = {}) {
	const payload = {};
	if (data.textContent != null) {
		payload.textContent = String(data.textContent || '').trim().slice(0, 500);
	}
	if (Array.isArray(data.tags)) {
		payload.tags = data.tags
			.map((tag) => (typeof tag === 'string' ? tag : tag && tag.tagName))
			.filter(Boolean)
			.slice(0, 5);
	}
	return payload;
}

/** 页面举报参数 → AppSubmitReportReq */
export function mapReportPayload(data = {}) {
	const presetReasons = ['包含不雅内容', '垃圾广告', '虚假信息', '违法违规', '其他'];
	const rawReason = (data.reason || '').trim();
	let reason = rawReason;
	let extra = data.extra || '';

	if (!presetReasons.includes(rawReason)) {
		reason = '其他';
		extra = extra || rawReason;
	}

	if (data.commentId) {
		return {
			targetType: 2,
			targetId: data.commentId,
			reason,
			extra
		};
	}

	return {
		targetType: data.targetType || 1,
		targetId: data.targetId || data.contentId,
		reason,
		extra
	};
}

/** 页面资料更新 → AppUpdateProfileReq */
export function mapUpdateProfilePayload(data = {}) {
	const payload = {};
	if (data.nickName != null || data.nickname != null) {
		payload.nickName = data.nickName != null ? data.nickName : data.nickname;
	}
	if (data.bio != null || data.signature != null) {
		payload.bio = data.bio != null ? data.bio : data.signature;
	}
	if (data.sex != null) payload.sex = data.sex;
	if (data.age != null) payload.age = data.age;
	if (data.avatar != null) payload.avatar = data.avatar;
	return payload;
}
