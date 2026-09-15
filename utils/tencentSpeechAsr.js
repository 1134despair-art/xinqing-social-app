import { getCurrentPlatform } from '@/utils/adapt';
import { getTencentRealtimeSpeechCredential as requestTencentRealtimeSpeechCredential } from '@/api/speech';
import { getTencentRealtimeSpeechLocalDevCredential } from '@/utils/tencentSpeechAsr.dev.local';
// #ifdef APP-PLUS
import * as appSpeechModule from '@/uni_modules/tencent-speech-asr';
// #endif

const DEV_CREDENTIAL_STORAGE_KEY = 'tencent_realtime_speech_dev_credential';
const isDev = typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production';

function isAppPlatform() {
	return getCurrentPlatform() === 'app-plus';
}

async function loadSpeechModule() {
	if (!isAppPlatform()) {
		return null;
	}
	// #ifdef APP-PLUS
	return appSpeechModule;
	// #endif
	return null;
}

export function canUseTencentRealtimeSpeech() {
	let supported = false;
	// iOS 不链接腾讯实时语音原生库（静态 xcframework 会导致打开即闪退）
	// #ifdef APP-ANDROID
	supported = isAppPlatform();
	// #endif
	return supported;
}

function normalizeCredential(raw = {}) {
	const data = raw.data || raw;
	const credential = data.credential || data;
	return {
		appId: Number(credential.appId || credential.appID || 0),
		secretId: credential.secretId || credential.tmpSecretId || '',
		secretKey: credential.secretKey || credential.tmpSecretKey || '',
		token: credential.token || credential.sessionToken || '',
		projectId: Number(credential.projectId || 0)
	};
}

function isValidCredential(credential = {}) {
	return Number(credential.appId) > 0 && Boolean(credential.secretId) && Boolean(credential.secretKey);
}

export function getTencentRealtimeSpeechDevCredential() {
	try {
		const storageCredential = normalizeCredential(uni.getStorageSync(DEV_CREDENTIAL_STORAGE_KEY) || {});
		if (isValidCredential(storageCredential)) {
			return storageCredential;
		}
		return normalizeCredential(getTencentRealtimeSpeechLocalDevCredential() || {});
	} catch (e) {
		return normalizeCredential(getTencentRealtimeSpeechLocalDevCredential() || {});
	}
}

export function setTencentRealtimeSpeechDevCredential(credential = {}) {
	const normalized = normalizeCredential(credential);
	if (!isValidCredential(normalized)) {
		throw new Error('腾讯实时语音开发凭证不完整');
	}
	uni.setStorageSync(DEV_CREDENTIAL_STORAGE_KEY, normalized);
	return normalized;
}

export function clearTencentRealtimeSpeechDevCredential() {
	try {
		uni.removeStorageSync(DEV_CREDENTIAL_STORAGE_KEY);
	} catch (e) {
		/* ignore */
	}
}

export async function fetchTencentRealtimeSpeechCredential(payload = {}, options = {}) {
	const {
		preferDevCredential = isDev,
		forceBackend = false,
		...requestOptions
	} = options || {};

	if (!forceBackend && preferDevCredential) {
		const devCredential = getTencentRealtimeSpeechDevCredential();
		if (isValidCredential(devCredential)) {
			return devCredential;
		}
	}

	const res = await requestTencentRealtimeSpeechCredential(payload, requestOptions);
	return normalizeCredential(res || {});
}

export async function startTencentRealtimeSpeech(options = {}) {
	const speechModule = await loadSpeechModule();
	if (!speechModule || typeof speechModule.startRealtimeRecognize !== 'function') {
		throw new Error('当前环境不支持腾讯实时语音识别');
	}
	if (
		typeof speechModule.isRealtimeRecognizeSupported === 'function' &&
		!speechModule.isRealtimeRecognizeSupported()
	) {
		throw new Error('当前环境不支持腾讯实时语音识别');
	}

	const {
		credential,
		credentialPayload = {},
		credentialOptions = {},
		preferDevCredential,
		forceBackend,
		...recognizeOptions
	} = options;

	const finalCredential = credential || await fetchTencentRealtimeSpeechCredential(credentialPayload, {
		preferDevCredential,
		forceBackend,
		...credentialOptions
	});
	speechModule.startRealtimeRecognize({
		credential: finalCredential,
		...recognizeOptions
	});
	return finalCredential;
}

export function stopTencentRealtimeSpeech() {
	if (!isAppPlatform()) return false;
	// #ifdef APP-PLUS
	if (typeof appSpeechModule.stopRealtimeRecognize === 'function') {
		appSpeechModule.stopRealtimeRecognize();
		return true;
	}
	// #endif
	return false;
}

export function cancelTencentRealtimeSpeech() {
	if (!isAppPlatform()) return false;
	// #ifdef APP-PLUS
	if (typeof appSpeechModule.cancelRealtimeRecognize === 'function') {
		appSpeechModule.cancelRealtimeRecognize();
		return true;
	}
	// #endif
	return false;
}

export function isTencentRealtimeSpeechRunning() {
	return false;
}
