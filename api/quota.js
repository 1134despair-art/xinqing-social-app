import { get } from '@/utils/request';

const DEFAULT_VIDEO_QUOTA = {
	dailyRemain: 0,
	bonusQuota: 0,
	hasDailyQuota: false,
	totalBonusEarned: 0,
	totalBonusConsumed: 0
};

export function getDefaultVideoQuota() {
	return { ...DEFAULT_VIDEO_QUOTA };
}

export async function getVideoQuota(options = {}) {
	const res = await get('/api/quota/video', {}, options);
	const data = res && res.data && typeof res.data === 'object' ? res.data : {};
	return {
		...res,
		data: {
			...DEFAULT_VIDEO_QUOTA,
			...data
		}
	};
}
