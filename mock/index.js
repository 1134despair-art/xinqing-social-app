const MOCK_LATENCY = 300;
const MOCK_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const MOCK_SCENARIO_KEY = '__mockScenario__';

const mockUsers = [
	{
		userId: 1,
		phone: '13800138000',
		nickname: '晴天也有小情绪',
		avatar: '',
		signature: '把今天的心情写成明天的勇气。',
		likeCount: 9,
		moodCount: 2
	},
	{
		userId: 2,
		phone: '13900139000',
		nickname: '晚风收藏家',
		avatar: '',
		signature: '情绪会过去，晚风会留下。',
		likeCount: 14,
		moodCount: 2
	},
	{
		userId: 3,
		phone: '13700137000',
		nickname: '凌晨三点的鲸',
		avatar: '',
		signature: '偶尔低落，但也在认真生活。',
		likeCount: 6,
		moodCount: 1
	}
];

const mockTags = [
	{ tagId: 1, tagName: '开心' },
	{ tagId: 2, tagName: '治愈' },
	{ tagId: 3, tagName: '疲惫' },
	{ tagId: 4, tagName: '成长' },
	{ tagId: 5, tagName: '思考' },
	{ tagId: 6, tagName: '深夜' }
];

const mockState = {
	nextMoodId: 1006,
	nextCommentId: 5005,
	favorites: [
		{ userId: 1, moodId: 1002 },
		{ userId: 1, moodId: 1005 }
	],
	moods: [
		{
			moodId: 1001,
			userId: 1,
			content: '今天终于把项目主流程跑通了，虽然还有很多细节要补，但已经看到成果了。',
			createTime: '2026-05-21 09:30:00',
			likeCount: 3,
			commentCount: 2,
			videoStatus: '2',
			videoUrl: MOCK_VIDEO_URL,
			tagIds: [1, 4],
			customTags: ['阶段性胜利'],
			likedUserIds: [2]
		},
		{
			moodId: 1002,
			userId: 2,
			content: '晚饭后一个人散步，风很轻，突然觉得最近的烦恼好像也没有那么重了。',
			createTime: '2026-05-21 18:20:00',
			likeCount: 5,
			commentCount: 1,
			videoStatus: '0',
			videoUrl: '',
			tagIds: [2, 5],
			customTags: [],
			likedUserIds: [1, 3]
		},
		{
			moodId: 1003,
			userId: 3,
			content: '最近总觉得有点累，想找个安静的地方把所有情绪都放一放。',
			createTime: '2026-05-20 23:10:00',
			likeCount: 2,
			commentCount: 0,
			videoStatus: '0',
			videoUrl: '',
			tagIds: [3, 6],
			customTags: [],
			likedUserIds: []
		},
		{
			moodId: 1004,
			userId: 1,
			content: '把今天的待办一项项划掉的时候，真的会有一种重新掌控生活的感觉。',
			createTime: '2026-05-19 14:00:00',
			likeCount: 4,
			commentCount: 1,
			videoStatus: '0',
			videoUrl: '',
			tagIds: [4],
			customTags: ['继续加油'],
			likedUserIds: [2, 3]
		},
		{
			moodId: 1005,
			userId: 2,
			content: '今天很开心，见到了很久没见的朋友，感觉整个人都被治愈了。',
			createTime: '2026-05-18 11:45:00',
			likeCount: 6,
			commentCount: 0,
			videoStatus: '0',
			videoUrl: '',
			tagIds: [1, 2],
			customTags: [],
			likedUserIds: [1]
		}
	],
	comments: [
		{
			commentId: 5001,
			moodId: 1001,
			userId: 2,
			content: '太棒了，看到这种进展真的会跟着开心起来。',
			createTime: '2026-05-21 10:00:00',
			likeCount: 1,
			likedUserIds: [1]
		},
		{
			commentId: 5002,
			moodId: 1001,
			userId: 1,
			content: '谢谢你，接下来把细节再磨一磨。',
			createTime: '2026-05-21 10:05:00',
			likeCount: 0,
			likedUserIds: []
		},
		{
			commentId: 5003,
			moodId: 1002,
			userId: 1,
			content: '这段文字读起来很舒服。',
			createTime: '2026-05-21 19:00:00',
			likeCount: 2,
			likedUserIds: [2, 3]
		},
		{
			commentId: 5004,
			moodId: 1004,
			userId: 3,
			content: '完成待办真的会让人安心很多。',
			createTime: '2026-05-19 14:20:00',
			likeCount: 0,
			likedUserIds: []
		}
	],
	reports: []
};

function clone(data) {
	return JSON.parse(JSON.stringify(data));
}

function createSuccess(payload = {}) {
	return {
		code: 200,
		msg: '操作成功',
		...payload
	};
}

function createError(msg, code = 500) {
	return { code, msg };
}

function createTimeoutError() {
	return {
		message: '请求超时，请稍后重试',
		errMsg: 'request:fail timeout'
	};
}

function normalizePath(url = '') {
	if (!url) return url;
	const index = url.indexOf('/api/');
	return index > -1 ? url.slice(index) : url;
}

function getScenarioConfig() {
	try {
		return uni.getStorageSync(MOCK_SCENARIO_KEY) || {};
	} catch (e) {
		return {};
	}
}

function getScenarioMode(path, method) {
	const config = getScenarioConfig();
	const routeKey = method + ' ' + path;
	if (config.routes && config.routes[routeKey]) {
		return config.routes[routeKey];
	}
	return config.global || 'default';
}

function createScenarioResult(mode, path) {
	if (mode === '401') {
		return { error: createError('登录已过期，请重新登录', 401) };
	}
	if (mode === 'timeout') {
		return { error: createTimeoutError() };
	}
	if (mode === 'error') {
		return { error: createError('模拟接口异常: ' + path) };
	}
	return null;
}

function createEmptyResult(path) {
	if (path === '/api/app/moods') {
		return createSuccess({ rows: [], total: 0 });
	}
	if (path === '/api/app/moods/match') {
		return createSuccess({ data: { mood: [], message: '暂无匹配结果' }, msg: '暂无匹配结果' });
	}
	if (path === '/api/app/comments') {
		return createSuccess({ rows: [], total: 0 });
	}
	if (path === '/api/app/tags') {
		return createSuccess({ data: [] });
	}
	return null;
}

function getUserById(userId) {
	return mockUsers.find(item => item.userId === userId);
}

function getCurrentUserByToken(token = '') {
	if (!token || !token.includes('mock_token_user_')) {
		return null;
	}
	const userId = Number(token.replace('mock_token_user_', ''));
	return getUserById(userId) || null;
}

function enrichMood(mood, currentUserId) {
	const user = getUserById(mood.userId) || {};
	const tags = mockTags.filter(tag => (mood.tagIds || []).includes(tag.tagId));
	const customTags = (mood.customTags || []).map((tagName, index) => ({
		tagId: 10000 + index,
		tagName
	}));
	return {
		moodId: mood.moodId,
		userId: mood.userId,
		nickname: user.nickname || '匿名用户',
		avatar: user.avatar || '',
		content: mood.content,
		createTime: mood.createTime,
		likeCount: mood.likeCount || 0,
		commentCount: mood.commentCount || 0,
		liked: (mood.likedUserIds || []).includes(currentUserId),
		favorited: mockState.favorites.some(
			item => item.userId === currentUserId && item.moodId === mood.moodId
		),
		videoStatus: mood.videoStatus || '0',
		videoUrl: mood.videoUrl || '',
		tags: tags.concat(customTags)
	};
}

function enrichComment(comment, currentUserId) {
	const user = getUserById(comment.userId) || {};
	return {
		commentId: comment.commentId,
		moodId: comment.moodId,
		userId: comment.userId,
		nickname: user.nickname || '匿名用户',
		avatar: user.avatar || '',
		content: comment.content,
		createTime: comment.createTime,
		likeCount: comment.likeCount || 0,
		liked: (comment.likedUserIds || []).includes(currentUserId)
	};
}

function recalcMoodCounts(moodId) {
	const mood = mockState.moods.find(item => item.moodId === moodId);
	if (!mood) return;
	mood.commentCount = mockState.comments.filter(item => item.moodId === moodId).length;
}

function recalcUserStats(userId) {
	const user = getUserById(userId);
	if (!user) return;
	user.moodCount = mockState.moods.filter(item => item.userId === userId).length;
	user.likeCount = mockState.moods
		.filter(item => item.userId === userId)
		.reduce((total, item) => total + (item.likeCount || 0), 0);
}

function sortMoods(list, sortType) {
	const cloned = list.slice();
	if (sortType === 'hot' || sortType === 'allTimeHot') {
		return cloned.sort((a, b) => {
			const scoreA = (a.likeCount || 0) * 2 + (a.commentCount || 0);
			const scoreB = (b.likeCount || 0) * 2 + (b.commentCount || 0);
			if (scoreB !== scoreA) {
				return scoreB - scoreA;
			}
			return a.moodId < b.moodId ? 1 : -1;
		});
	}
	return cloned.sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
}

function paginate(list, pageNum = 1, pageSize = 20) {
	const start = (Math.max(pageNum, 1) - 1) * Math.max(pageSize, 1);
	return list.slice(start, start + Math.max(pageSize, 1));
}

function requireAuth(options) {
	const user = getCurrentUserByToken(options.token);
	if (!user) {
		return { error: createError('登录已过期，请重新登录', 401) };
	}
	return { user };
}

function handleAuthRequest(path, method, data) {
	if (path === '/api/app/sms/send' && method === 'POST') {
		if (!/^1[3-9]\d{9}$/.test(data.phone || '')) {
			return createError('手机号格式不正确');
		}
		return createSuccess({ data: true, msg: '验证码已发送' });
	}

	if (path === '/api/login/auth' && method === 'POST') {
		const user = mockUsers.find(item => item.phone === data.phone) || mockUsers[0];
		if (data.code !== '123456') {
			return createError('验证码错误');
		}
		return createSuccess({
			msg: '登录成功',
			data: 'mock_token_user_' + user.userId
		});
	}

	if (path === '/api/app/auth/logout' && method === 'POST') {
		return createSuccess({ data: true, msg: '退出成功' });
	}

	return null;
}

function handleUserRequest(path, method, data, currentUser) {
	if ((path === '/api/user/profile' || path === '/api/app/user/profile') && method === 'GET') {
		return createSuccess({ data: clone(currentUser) });
	}

	if ((path === '/api/user/profile' || path === '/api/app/user/profile') && method === 'PUT') {
		currentUser.nickname = data.nickName || data.nickname || currentUser.nickname;
		currentUser.nickName = currentUser.nickname;
		currentUser.signature = typeof data.bio === 'string' ? data.bio : (typeof data.signature === 'string' ? data.signature : currentUser.signature);
		currentUser.bio = currentUser.signature;
		if (typeof data.avatar === 'string' && data.avatar) {
			currentUser.avatar = data.avatar;
		}
		return createSuccess({ data: clone(currentUser), msg: '保存成功' });
	}

	if ((path === '/api/user/avatar' || path === '/api/app/user/avatar') && method === 'UPLOAD') {
		currentUser.avatar = data.filePath || '/static/default-avatar.png';
		return createSuccess({ data: { avatarUrl: currentUser.avatar }, msg: '头像更新成功' });
	}

	return null;
}

function handleUploadRequest(path, method, data, currentUser) {
	if ((path === '/api/upload/avatar' || path === '/api/app/upload/avatar') && method === 'UPLOAD') {
		const avatarUrl = data.filePath || '/static/default-avatar.png';
		return createSuccess({
			data: {
				ossId: Date.now(),
				url: avatarUrl
			},
			msg: '上传成功'
		});
	}

	if (
		(path === '/api/upload/voice' || path === '/api/app/upload/voice' || path === '/api/upload/common') &&
		method === 'UPLOAD'
	) {
		return createSuccess({
			data: {
				ossId: Date.now(),
				url: data.filePath || 'https://example.com/voice.mp3'
			},
			msg: '上传成功'
		});
	}

	return null;
}

function handleMoodRequest(path, method, data, currentUser) {
	if (path === '/api/app/moods' && method === 'GET') {
		const pageNum = Number(data.pageNum) || 1;
		const pageSize = Number(data.pageSize) || 20;
		const sortType = data.sortType || 'latest';
		const baseList = data.userId === 'self'
			? mockState.moods.filter(item => item.userId === currentUser.userId)
			: mockState.moods;
		const sorted = sortMoods(baseList, sortType);
		const rows = paginate(sorted, pageNum, pageSize).map(item => enrichMood(item, currentUser.userId));
		return createSuccess({ rows, total: sorted.length });
	}

	if (/^\/api\/app\/moods\/\d+$/.test(path) && method === 'GET') {
		const moodId = Number(path.split('/').pop());
		const mood = mockState.moods.find(item => item.moodId === moodId);
		if (!mood) {
			return createError('心情不存在');
		}
		return createSuccess({ data: enrichMood(mood, currentUser.userId) });
	}

	if (path === '/api/app/moods' && method === 'POST') {
		const moodId = data.moodId || mockState.nextMoodId++;
		const exists = mockState.moods.find(item => item.moodId === moodId);
		if (exists && data.moodId) {
			exists.content = data.content;
			exists.tagIds = clone(data.tagIds || []);
			exists.customTags = clone(data.customTags || []);
			return createSuccess({ data: enrichMood(exists, currentUser.userId), msg: '发布成功' });
		}
		const created = {
			moodId,
			userId: currentUser.userId,
			content: data.content || '',
			createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
			likeCount: 0,
			commentCount: 0,
			videoStatus: data.moodId ? '2' : '0',
			videoUrl: data.moodId ? MOCK_VIDEO_URL : '',
			tagIds: clone(data.tagIds || []),
			customTags: clone(data.customTags || []),
			likedUserIds: []
		};
		mockState.moods.unshift(created);
		recalcUserStats(currentUser.userId);
		return createSuccess({ data: enrichMood(created, currentUser.userId), msg: '发布成功' });
	}

	if (/^\/api\/app\/moods\/\d+$/.test(path) && method === 'DELETE') {
		const moodId = Number(path.split('/').pop());
		const index = mockState.moods.findIndex(item => item.moodId === moodId && item.userId === currentUser.userId);
		if (index === -1) {
			return createError('心情不存在或无权限删除');
		}
		mockState.moods.splice(index, 1);
		mockState.comments = mockState.comments.filter(item => item.moodId !== moodId);
		recalcUserStats(currentUser.userId);
		return createSuccess({ data: true, msg: '删除成功' });
	}

	if (path === '/api/app/moods/generate-video' && method === 'POST') {
		const moodId = mockState.nextMoodId++;
		const generatedMood = {
			moodId,
			userId: currentUser.userId,
			content: data.content || '',
			createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
			likeCount: 0,
			commentCount: 0,
			videoStatus: '2',
			videoUrl: MOCK_VIDEO_URL,
			tagIds: [],
			customTags: [],
			likedUserIds: []
		};
		mockState.moods.unshift(generatedMood);
		recalcUserStats(currentUser.userId);
		return createSuccess({
			data: {
				moodId,
				videoUrl: MOCK_VIDEO_URL
			},
			msg: '视频生成成功'
		});
	}

	if (path === '/api/app/moods/match' && method === 'GET') {
		const selfMoods = mockState.moods.filter(item => item.userId === currentUser.userId);
		if (!selfMoods.length) {
			return createError('请先发布心情，再来匹配相似心情');
		}
		const requestedMoodId = Number(data.moodId);
		const referenceMood = selfMoods.find(item => item.moodId === requestedMoodId) || selfMoods[0];
		const matches = mockState.moods
			.filter(item => item.userId !== currentUser.userId)
			.slice(0, 6)
			.map((item, index) => enrichMood(item, currentUser.userId));
		return createSuccess({
			data: {
				mood: matches,
				message: matches.length ? '匹配成功' : '暂未找到同频用户'
			},
			msg: matches.length ? '匹配成功' : '暂未找到同频用户'
		});
	}

	return null;
}

function handleCommentRequest(path, method, data, currentUser) {
	if (path === '/api/app/comments' && method === 'GET') {
		const moodId = Number(data.moodId);
		const pageNum = Number(data.pageNum) || 1;
		const pageSize = Number(data.pageSize) || 20;
		const list = mockState.comments.filter(item => item.moodId === moodId);
		const rows = paginate(list, pageNum, pageSize).map(item => enrichComment(item, currentUser.userId));
		return createSuccess({ rows, total: list.length });
	}

	if (path === '/api/app/comments' && method === 'POST') {
		const newComment = {
			commentId: mockState.nextCommentId++,
			moodId: Number(data.moodId),
			userId: currentUser.userId,
			content: data.content || '',
			createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
			likeCount: 0,
			likedUserIds: []
		};
		mockState.comments.push(newComment);
		recalcMoodCounts(newComment.moodId);
		return createSuccess({ data: enrichComment(newComment, currentUser.userId), msg: '评论成功' });
	}

	if (/^\/api\/app\/comments\/\d+$/.test(path) && method === 'DELETE') {
		const commentId = Number(path.split('/').pop());
		const comment = mockState.comments.find(item => item.commentId === commentId);
		if (!comment || comment.userId !== currentUser.userId) {
			return createError('评论不存在或无权限删除');
		}
		mockState.comments = mockState.comments.filter(item => item.commentId !== commentId);
		recalcMoodCounts(comment.moodId);
		return createSuccess({ data: true, msg: '删除成功' });
	}

	return null;
}

function handleLikeRequest(path, method, data, currentUser) {
	if (path !== '/api/app/likes/toggle' || method !== 'POST') {
		return null;
	}

	const targetId = Number(data.targetId);
	const targetType = String(data.targetType);
	const isComment = targetType === '2';
	const target = isComment
		? mockState.comments.find(item => item.commentId === targetId)
		: mockState.moods.find(item => item.moodId === targetId);

	if (!target) {
		return createError('点赞目标不存在');
	}

	target.likedUserIds = target.likedUserIds || [];
	const likedIndex = target.likedUserIds.indexOf(currentUser.userId);
	if (likedIndex > -1) {
		target.likedUserIds.splice(likedIndex, 1);
		target.likeCount = Math.max((target.likeCount || 1) - 1, 0);
	} else {
		target.likedUserIds.push(currentUser.userId);
		target.likeCount = (target.likeCount || 0) + 1;
	}

	if (!isComment) {
		recalcUserStats(target.userId);
	}

	return createSuccess({
		liked: target.likedUserIds.includes(currentUser.userId),
		likeCount: target.likeCount
	});
}

function handleFavoriteRequest(path, method, data, currentUser) {
	const toggleMatch = path.match(/^\/api\/(?:app\/)?favorites\/toggle\/(\d+)$/);
	if (toggleMatch && method === 'POST') {
		const moodId = Number(toggleMatch[1]);
		const mood = mockState.moods.find(item => item.moodId === moodId);
		if (!mood) {
			return createError('心情不存在');
		}
		const index = mockState.favorites.findIndex(
			item => item.userId === currentUser.userId && item.moodId === moodId
		);
		if (index > -1) {
			mockState.favorites.splice(index, 1);
		} else {
			mockState.favorites.push({ userId: currentUser.userId, moodId });
		}
		const favorited = mockState.favorites.some(
			item => item.userId === currentUser.userId && item.moodId === moodId
		);
		return createSuccess({ data: { favorited } });
	}

	if ((path === '/api/favorites/mine' || path === '/api/app/favorites/mine') && method === 'GET') {
		const pageNum = Number(data.pageNum) || 1;
		const pageSize = Number(data.pageSize) || 20;
		const favoriteMoodIds = mockState.favorites
			.filter(item => item.userId === currentUser.userId)
			.map(item => item.moodId);
		const list = mockState.moods.filter(item => favoriteMoodIds.includes(item.moodId));
		const rows = paginate(list, pageNum, pageSize).map(item => enrichMood(item, currentUser.userId));
		return createSuccess({
			data: {
				total: list.length,
				size: pageSize,
				current: pageNum,
				records: rows
			}
		});
	}

	return null;
}

function handleReportRequest(path, method, data) {
	if (path !== '/api/app/reports' || method !== 'POST') {
		return null;
	}

	mockState.reports.push({
		reportId: mockState.reports.length + 1,
		contentId: Number(data.contentId),
		reportedUserId: Number(data.reportedUserId),
		reason: data.reason,
		createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
	});

	return createSuccess({ data: true, msg: '举报已提交，我们会尽快处理' });
}

function handleTagRequest(path, method) {
	if (path === '/api/app/tags' && method === 'GET') {
		return createSuccess({ data: clone(mockTags) });
	}
	return null;
}

export function mockRequest(options) {
	const method = (options.method || 'GET').toUpperCase();
	const path = normalizePath(options.url);
	const data = clone(options.data || {});
	const scenarioMode = getScenarioMode(path, method);
	const authResult = requireAuth(options);

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const scenarioResult = createScenarioResult(scenarioMode, path);
			if (scenarioResult) {
				reject(clone(scenarioResult.error));
				return;
			}

			const openApiResponse = handleAuthRequest(path, method, data);
			if (openApiResponse) {
				(openApiResponse.code === 200 ? resolve : reject)(clone(openApiResponse));
				return;
			}

			if (authResult.error) {
				reject(clone(authResult.error));
				return;
			}

			const currentUser = authResult.user;
			if (scenarioMode === 'empty') {
				const emptyResult = createEmptyResult(path);
				if (emptyResult) {
					resolve(clone(emptyResult));
					return;
				}
			}

			const response = handleUserRequest(path, method, data, currentUser)
				|| handleUploadRequest(path, method, data, currentUser)
				|| handleMoodRequest(path, method, data, currentUser)
				|| handleCommentRequest(path, method, data, currentUser)
				|| handleLikeRequest(path, method, data, currentUser)
				|| handleFavoriteRequest(path, method, data, currentUser)
				|| handleReportRequest(path, method, data)
				|| handleTagRequest(path, method)
				|| createError('未配置 mock 接口: ' + path, 404);

			(response.code === 200 ? resolve : reject)(clone(response));
		}, MOCK_LATENCY);
	});
}

export function mockUpload(options) {
	return mockRequest({
		url: options.url,
		method: 'UPLOAD',
		data: {
			filePath: options.filePath,
			formData: options.formData || {}
		},
		token: options.token
	});
}

export function setMockScenario(config = {}) {
	uni.setStorageSync(MOCK_SCENARIO_KEY, config);
}

export function clearMockScenario() {
	uni.removeStorageSync(MOCK_SCENARIO_KEY);
}
