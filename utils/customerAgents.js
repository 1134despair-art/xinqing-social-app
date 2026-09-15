/**
 * 客服列表数据源，通过接口获取并缓存，供客服列表与聊天页展示
 */
import { getCustomers } from '@/api/im';

let customerAgentCache = [];

export function normalizeCustomerAgent(raw = {}) {
	const sysUserId = raw.sysUserId != null ? String(raw.sysUserId) : '';
	const online = Number(raw.onlineStatus) === 1;
	const sessionCount = Number(raw.activeSessionCount) || 0;
	const expertise = [online ? '在线' : '离线'];

	if (sessionCount > 0) {
		expertise.push(`服务中 ${sessionCount}`);
	}

	return {
		id: sysUserId,
		sysUserId: raw.sysUserId,
		imUserId: raw.imUserId || '',
		name: raw.nickName || '在线客服',
		avatar: raw.avatar || '👩‍💼',
		summary: online
			? '当前在线，可即时为你解答问题'
			: '当前离线，留言后客服上线会尽快回复',
		welcomeMessage: raw.welcomeMessage || '',
		expertise,
		onlineStatus: raw.onlineStatus,
		activeSessionCount: sessionCount
	};
}

export function setCustomerAgents(list = []) {
	customerAgentCache = (Array.isArray(list) ? list : []).map(normalizeCustomerAgent);
	return customerAgentCache;
}

export function getCustomerAgents() {
	return customerAgentCache;
}

export async function loadCustomerAgents(options = {}) {
	const list = await getCustomers(options);
	return setCustomerAgents(list);
}

export function getAgentById(id) {
	const key = String(id || '');
	return customerAgentCache.find((item) => item.id === key) || null;
}
