/**
 * 草稿相关 API（C端接口文档）
 */
import { get, post, del } from '@/utils/request';
import { mapPublishMoodPayload, normalizeDataResult } from '@/utils/apiAdapter';

function mapDraftPayload(data = {}) {
	const payload = mapPublishMoodPayload(data);
	if (data.videoUrl) payload.videoUrl = data.videoUrl;
	if (data.videoCoverUrl) payload.videoCoverUrl = data.videoCoverUrl;
	return payload;
}

function normalizeDraft(raw) {
	if (!raw || typeof raw !== 'object') return null;
	return {
		id: raw.id,
		contentType: raw.contentType,
		textContent: raw.textContent || '',
		voiceUrl: raw.voiceUrl || '',
		voiceDuration: raw.voiceDuration || 0,
		videoUrl: raw.videoUrl || '',
		videoCoverUrl: raw.videoCoverUrl || '',
		tags: Array.isArray(raw.tags) ? raw.tags : [],
		updateTime: raw.updateTime || 0
	};
}

/**
 * 获取草稿
 * GET /api/drafts?contentType=
 */
export async function getDraft(contentType, options = {}) {
	const res = await get('/api/drafts', { contentType }, options);
	return normalizeDataResult(res, normalizeDraft);
}

/**
 * 保存草稿
 * POST /api/drafts
 */
export async function saveDraft(data, options = {}) {
	const res = await post('/api/drafts', mapDraftPayload(data), options);
	return normalizeDataResult(res, normalizeDraft);
}

/**
 * 删除草稿
 * DELETE /api/drafts?contentType=
 */
export function deleteDraft(contentType, options = {}) {
	return del('/api/drafts', { contentType }, options);
}
