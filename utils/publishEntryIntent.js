const PUBLISH_ENTRY_INTENT_KEY = 'publish_entry_intent_v1';

export function setPublishEntryIntent(payload = {}) {
	try {
		uni.setStorageSync(PUBLISH_ENTRY_INTENT_KEY, payload);
		return true;
	} catch (e) {
		console.error('保存发布页启动参数失败', e);
		return false;
	}
}

export function consumePublishEntryIntent() {
	try {
		const payload = uni.getStorageSync(PUBLISH_ENTRY_INTENT_KEY);
		if (!payload || typeof payload !== 'object') {
			return null;
		}
		uni.removeStorageSync(PUBLISH_ENTRY_INTENT_KEY);
		return payload;
	} catch (e) {
		console.error('读取发布页启动参数失败', e);
		return null;
	}
}
