import TIM from 'tim-js-sdk';
import { getImUserSig } from '@/api/im';

let tim = null;
let loginUserId = '';
let sdkAppId = '';
let receiveHandler = null;

function ensureTim() {
	if (!tim) {
		throw new Error('IM 未初始化');
	}
	return tim;
}

function normalizeReceivedMessage(message = {}) {
	const payload = message.payload || {};
	const type = message.type || '';
	let msgType = 'TEXT';
	let content = '';

	if (type === TIM.TYPES.MSG_TEXT) {
		content = payload.text || '';
	} else if (type === TIM.TYPES.MSG_IMAGE) {
		msgType = 'IMAGE';
		content = JSON.stringify(payload || {});
	} else if (type === TIM.TYPES.MSG_VIDEO) {
		msgType = 'VIDEO';
		content = JSON.stringify(payload || {});
	} else if (type === TIM.TYPES.MSG_AUDIO) {
		msgType = 'AUDIO';
		content = JSON.stringify(payload || {});
	} else if (type === TIM.TYPES.MSG_FILE) {
		msgType = 'FILE';
		content = JSON.stringify(payload || {});
	} else if (type === TIM.TYPES.MSG_CUSTOM) {
		msgType = payload.description || 'CUSTOM';
		content = payload.data || '';
	} else {
		msgType = type || 'CUSTOM';
		content = payload.text || payload.data || JSON.stringify(payload || {});
	}

	return {
		imMsgKey: message.ID || message.id || '',
		fromImUserId: message.from || '',
		msgType: String(msgType || 'TEXT').toUpperCase(),
		content,
		sendTime: message.time ? message.time * 1000 : Date.now(),
		raw: message
	};
}

function bindReceive(handler) {
	if (!tim || receiveHandler === handler) return;
	if (receiveHandler) {
		tim.off(TIM.EVENT.MESSAGE_RECEIVED, receiveHandler);
	}
	receiveHandler = (event) => {
		const list = event?.data || [];
		handler(list.map(normalizeReceivedMessage).filter((item) => item.content || item.msgType !== 'TEXT'));
	};
	tim.on(TIM.EVENT.MESSAGE_RECEIVED, receiveHandler);
}

export async function loginTencentIm(options = {}) {
	const sig = await getImUserSig({ loading: false, silent: true });
	if (!sig?.sdkAppId || !sig?.userSig || !sig?.userId) {
		throw new Error('IM 登录票据无效');
	}

	if (!tim || sdkAppId !== String(sig.sdkAppId)) {
		if (tim && receiveHandler) {
			tim.off(TIM.EVENT.MESSAGE_RECEIVED, receiveHandler);
			receiveHandler = null;
		}
		tim = TIM.create({ SDKAppID: sig.sdkAppId });
		sdkAppId = String(sig.sdkAppId);
	}

	if (options.onMessage) {
		bindReceive(options.onMessage);
	}

	if (loginUserId !== sig.userId) {
		await tim.login({ userID: sig.userId, userSig: sig.userSig });
		loginUserId = sig.userId;
	}

	return {
		...sig,
		ready: true
	};
}

export async function sendTencentTextMessage(toImUserId, text) {
	if (!toImUserId) {
		return null;
	}
	const client = ensureTim();
	const message = client.createTextMessage({
		to: toImUserId,
		conversationType: TIM.TYPES.CONV_C2C,
		payload: { text }
	});
	const res = await client.sendMessage(message);
	return res?.data?.message || message;
}

export async function sendTencentCustomMessage(toImUserId, msgType, content) {
	if (!toImUserId) {
		return null;
	}
	const client = ensureTim();
	const message = client.createCustomMessage({
		to: toImUserId,
		conversationType: TIM.TYPES.CONV_C2C,
		payload: {
			data: content,
			description: String(msgType || 'CUSTOM').toUpperCase(),
			extension: 'MOOD_IM_MESSAGE'
		}
	});
	const res = await client.sendMessage(message);
	return res?.data?.message || message;
}

export async function logoutTencentIm() {
	if (!tim) return;
	try {
		if (receiveHandler) {
			tim.off(TIM.EVENT.MESSAGE_RECEIVED, receiveHandler);
			receiveHandler = null;
		}
		await tim.logout();
	} finally {
		loginUserId = '';
	}
}

export function isTencentImReady() {
	return Boolean(tim && loginUserId);
}
