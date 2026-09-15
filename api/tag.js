/**
 * 标签相关 API（C端接口文档）
 */
import { get } from '@/utils/request';

/**
 * 获取预设标签列表
 * GET /api/tags
 */
export async function getPresetTags(options = {}) {
	const res = await get('/api/tags', {}, options);
	const list = Array.isArray(res.data) ? res.data : [];
	return {
		...res,
		data: list.map((item) => ({
			tagId: item.id || item.tagId,
			tagName: item.tagName || '',
			refCount: item.refCount || 0
		}))
	};
}
