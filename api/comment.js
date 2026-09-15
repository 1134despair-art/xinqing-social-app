/**
 * 评论相关 API（C端接口文档）
 */
import { get, post, del } from '@/utils/request';
import {
	normalizeComment,
	normalizePageResult,
	normalizeDataResult
} from '@/utils/apiAdapter';

/**
 * 获取评论列表
 * GET /api/comments
 */
export async function getCommentList(moodId, params = {}, options = {}) {
	const res = await get('/api/comments', {
		moodId,
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 20
	}, options);
	return normalizePageResult(res, normalizeComment);
}

/**
 * 发表评论
 * POST /api/comments
 */
export async function addComment(data, options = {}) {
	const payload = {
		moodId: data.moodId,
		commentText: data.commentText || data.content || ''
	};
	if (data.parentId) payload.parentId = data.parentId;
	if (data.rootId) payload.rootId = data.rootId;
	if (data.replyUserId) payload.replyUserId = data.replyUserId;

	const res = await post('/api/comments', payload, options);
	return normalizeDataResult(res, normalizeComment);
}

/**
 * 删除评论
 * DELETE /api/comments/{id}
 */
export function deleteComment(id) {
	return del('/api/comments/' + id);
}
