/**
 * 点赞相关 API（C端接口文档）
 */
import { post } from '@/utils/request';
import { mapLikeTargetType, normalizeLikeResult } from '@/utils/apiAdapter';

/**
 * 切换点赞状态
 * POST /api/likes/toggle
 * @param targetType 页面传 '0' 表示心情、'1' 表示评论；也兼容 1/2
 */
export async function toggleLike(targetId, targetType) {
	const res = await post('/api/likes/toggle', {
		targetId,
		targetType: mapLikeTargetType(targetType)
	});
	return normalizeLikeResult(res);
}
