/**
 * 心情相关 API（C端接口文档）
 */
import { get, post, del, put } from '@/utils/request';
import {
	mapMoodListParams,
	mapEditMoodPayload,
	mapPublishMoodPayload,
	normalizeMood,
	normalizePageResult,
	normalizeDataResult
} from '@/utils/apiAdapter';

/**
 * 获取心情列表
 * GET /api/moods
 */
export async function getMoodList(params, options = {}) {
	const res = await get('/api/moods', mapMoodListParams(params), options);
	return normalizePageResult(res, normalizeMood);
}

/**
 * 获取心情详情
 * GET /api/moods/{id}
 */
export async function getMoodDetail(id, options = {}) {
	const res = await get('/api/moods/' + id, {}, options);
	return normalizeDataResult(res, normalizeMood);
}

/**
 * 发布心情
 * POST /api/moods
 */
export async function publishMood(data, options = {}) {
	const res = await post('/api/moods', mapPublishMoodPayload(data), options);
	return normalizeDataResult(res, normalizeMood);
}

/**
 * 暂存心情
 * POST /api/moods/stash
 */
export async function stashMood(data, options = {}) {
	const res = await post('/api/moods/stash', mapPublishMoodPayload(data), options);
	return normalizeDataResult(res, normalizeMood);
}

/**
 * 删除心情
 * DELETE /api/moods/{id}
 */
export function deleteMood(id) {
	return del('/api/moods/' + id);
}

/**
 * 上报心情浏览
 * POST /api/moods/{id}/view
 */
export function reportMoodView(id, options = {}) {
	return post('/api/moods/' + id + '/view', {}, { loading: false, silent: true, ...options });
}

/**
 * 编辑心情
 * PUT /api/moods/{id}
 */
export async function editMood(id, data, options = {}) {
	const res = await put('/api/moods/' + id, mapEditMoodPayload(data), options);
	return normalizeDataResult(res, normalizeMood);
}

/**
 * 为已发布心情提交 AI 视频生成
 * POST /api/moods/generate-video
 */
export async function generateVideo(data, options = {}) {
	const res = await post('/api/moods/generate-video', { moodId: data.moodId }, options);
	return normalizeDataResult(res, (raw) => ({
		moodId: raw.moodId,
		videoGenStatus: raw.videoGenStatus,
		videoTaskId: raw.videoTaskId || '',
		message: raw.message || '',
		videoUrl: raw.videoUrl || ''
	}));
}

/**
 * 获取匹配心情
 * GET /api/moods/match
 * @param {object} options
 * @param {number|string} [options.moodId] 指定作为匹配基准的心情 ID
 */
export async function matchMoods(options = {}) {
	const { moodId, ...requestOptions } = options;
	const params = {};
	if (moodId != null && moodId !== '') {
		params.moodId = moodId;
	}
	const res = await get('/api/moods/match', params, requestOptions);
	const payload = res.data || {};
	let moods = [];
	if (Array.isArray(payload.moods)) {
		moods = payload.moods.map((item) => normalizeMood(item));
	} else if (Array.isArray(payload.mood)) {
		moods = payload.mood.map((item) => normalizeMood(item));
	} else if (payload.mood) {
		moods = [normalizeMood(payload.mood)];
	} else if (Array.isArray(payload)) {
		moods = payload.map((item) => normalizeMood(item));
	}
	return {
		...res,
		data: moods,
		message: payload.message || res.message || ''
	};
}

/**
 * 轮询心情视频生成状态
 */
export async function pollMoodVideo(moodId, options = {}) {
	const { maxAttempts = 20, interval = 2000 } = options;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const res = await getMoodDetail(moodId, { loading: false, silent: true });
		const mood = res.data || {};
		const status = Number(mood.videoGenStatus != null ? mood.videoGenStatus : mood.videoStatus);

		if (status === 2 && mood.videoUrl) {
			return mood;
		}
		if (status === 3) {
			throw { message: mood.auditReason || '视频生成失败' };
		}
		if (attempt < maxAttempts - 1) {
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	}

	throw { message: '视频生成超时，请稍后在详情页查看' };
}
