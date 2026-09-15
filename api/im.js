import { get, post, upload } from '@/utils/request';
import { normalizeUploadResult } from '@/utils/apiAdapter';

const IM_PREFIX = '/api/im';

function dataOf(res, fallback = null) {
	return res && res.data != null ? res.data : fallback;
}

export async function getImUserSig(options = {}) {
	const res = await get(`${IM_PREFIX}/user-sig`, {}, options);
	return dataOf(res, {});
}

export async function getCurrentImSession(options = {}) {
	const res = await get(`${IM_PREFIX}/session/current`, {}, options);
	return dataOf(res, null);
}

export async function getCurrentImMessages(options = {}) {
	const res = await get(`${IM_PREFIX}/session/current/messages`, {}, options);
	return dataOf(res, []);
}

export async function getImCustomers(options = {}) {
	const res = await get(`${IM_PREFIX}/customers`, {}, options);
	return dataOf(res, []);
}

export async function getImSessionMessages(sessionId, options = {}) {
	const res = await get(`${IM_PREFIX}/sessions/${sessionId}/messages`, {}, options);
	return dataOf(res, []);
}

export async function prepareImMessage(content, msgType = 'TEXT', imMsgKey = '', options = {}) {
	const { customerSysUserId, staffId, ...requestOptions } = options || {};
	const payload = { content, msgType, imMsgKey };
	const targetCustomerSysUserId = customerSysUserId || staffId;
	if (targetCustomerSysUserId) {
		payload.customerSysUserId = targetCustomerSysUserId;
		payload.staffId = targetCustomerSysUserId;
	}
	const res = await post(`${IM_PREFIX}/messages/prepare`, payload, requestOptions);
	return dataOf(res, {});
}

export async function saveAppImMessage(data, options = {}) {
	const res = await post(`${IM_PREFIX}/messages/app`, data, options);
	return dataOf(res, {});
}

export async function uploadImFile(filePath, options = {}) {
	const res = await upload(`${IM_PREFIX}/upload`, filePath, {}, {
		name: 'file',
		...options
	});
	return normalizeUploadResult(res);
}

export async function closeCurrentImSession(options = {}) {
	const res = await post(`${IM_PREFIX}/session/current/close`, {}, options);
	return dataOf(res, null);
}

export async function getCustomers(options = {}) {
	const res = await get(`${IM_PREFIX}/customers`, {}, options);
	return dataOf(res, []);
}
