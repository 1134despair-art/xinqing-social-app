import { reportMoodView as reportMoodViewApi } from '@/api/mood';

/**
 * 上报心情浏览并乐观更新本地浏览数
 * @param {number|string} moodId
 * @param {object} [target] 含 viewCount 的心情对象，可选
 */
export function reportMoodView(moodId, target) {
	const id = Number(moodId);
	if (!id) return;
	if (target) {
		target.viewCount = Number(target.viewCount || 0) + 1;
	}
	reportMoodViewApi(id).catch(() => {});
}
