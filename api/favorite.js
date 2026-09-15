/**
 * 收藏相关 API（C端接口文档）
 */
import { get, post } from '@/utils/request';
import { normalizeFavoriteResult, normalizeMood, normalizePageResult } from '@/utils/apiAdapter';

/**
 * 切换收藏状态
 * POST /api/favorites/toggle/{moodId}
 */
export async function toggleFavorite(moodId) {
	const res = await post('/api/favorites/toggle/' + moodId);
	return normalizeFavoriteResult(res);
}

/**
 * 我的收藏列表
 * GET /api/favorites/mine
 */
export async function getMyFavorites(params = {}, options = {}) {
	const res = await get('/api/favorites/mine', {
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 20
	}, options);
	return normalizePageResult(res, normalizeMood);
}
