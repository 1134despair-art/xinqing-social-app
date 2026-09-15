const QUOTA_KEY = 'ai_video_quota';

const DEFAULT_QUOTA = {
	generateRemaining: 3,
	replaceRemaining: 1,
	inviteRewardCount: 0,
	interactionRewardAvailable: 0,
	interactionRewardExpiresAt: 0
};

export function getQuotaInfo() {
	try {
		const raw = uni.getStorageSync(QUOTA_KEY);
		if (raw && typeof raw === 'object') {
			return { ...DEFAULT_QUOTA, ...raw };
		}
	} catch (e) {
		/* ignore */
	}
	return { ...DEFAULT_QUOTA };
}

export function saveQuotaInfo(info) {
	try {
		uni.setStorageSync(QUOTA_KEY, info);
	} catch (e) {
		console.error('保存额度失败', e);
	}
}

export function consumeGenerateQuota() {
	const info = getQuotaInfo();
	if (info.generateRemaining <= 0 && info.interactionRewardAvailable <= 0) {
		return false;
	}
	if (info.generateRemaining > 0) {
		info.generateRemaining -= 1;
	} else {
		info.interactionRewardAvailable = 0;
		info.interactionRewardExpiresAt = 0;
	}
	saveQuotaInfo(info);
	return true;
}

export function consumeReplaceQuota() {
	const info = getQuotaInfo();
	if (info.replaceRemaining <= 0) return false;
	info.replaceRemaining -= 1;
	saveQuotaInfo(info);
	return true;
}
