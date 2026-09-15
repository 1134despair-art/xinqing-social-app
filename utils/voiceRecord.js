import { getCurrentPlatform } from '@/utils/adapt';

/** 是否 H5 环境（浏览器） */
export function isRecordH5() {
	return getCurrentPlatform() === 'h5';
}

/** 是否微信小程序 */
export function isRecordMpWeixin() {
	return getCurrentPlatform() === 'mp-weixin';
}

/** 是否 App 环境 */
export function isRecordApp() {
	return getCurrentPlatform() === 'app-plus';
}

/** iOS AVAudioSessionRecordPermission FourCharCode */
const IOS_RECORD_PERMISSION_GRANTED = 1735552628; // 'grnt'
const IOS_RECORD_PERMISSION_DENIED = 1684369017; // 'deny'

function ensureIosRecordPermission() {
	return new Promise((resolve, reject) => {
		try {
			if (typeof plus === 'undefined' || !plus.ios) {
				resolve();
				return;
			}
			const AVAudioSession = plus.ios.importClass('AVAudioSession');
			const session = AVAudioSession.sharedInstance();
			const permission = session.recordPermission();
			if (permission === IOS_RECORD_PERMISSION_GRANTED) {
				plus.ios.deleteObject(session);
				resolve();
				return;
			}
			if (permission === IOS_RECORD_PERMISSION_DENIED) {
				plus.ios.deleteObject(session);
				reject(new Error('denied'));
				return;
			}
			// undetermined：主动弹系统授权框，避免后续录音静默失败
			session.requestRecordPermission((granted) => {
				plus.ios.deleteObject(session);
				if (granted) {
					resolve();
					return;
				}
				reject(new Error('denied'));
			});
		} catch (e) {
			// 权限 API 异常时交给原生录音层再试，避免直接阻断
			console.warn('[voiceRecord] iOS permission check failed', e);
			resolve();
		}
	});
}

function ensureAndroidRecordPermission() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined' || !plus.android || typeof plus.android.requestPermissions !== 'function') {
			resolve();
			return;
		}
		plus.android.requestPermissions(
			['android.permission.RECORD_AUDIO'],
			(result) => {
				const granted = Array.isArray(result.granted) ? result.granted : [];
				if (granted.includes('android.permission.RECORD_AUDIO')) {
					resolve();
					return;
				}
				reject(new Error('denied'));
			},
			() => reject(new Error('denied'))
		);
	});
}

function ensureAppRecordPermission() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined') {
			reject(new Error('unsupported'));
			return;
		}
		if (plus.os && plus.os.name === 'iOS') {
			ensureIosRecordPermission().then(resolve).catch(reject);
			return;
		}
		ensureAndroidRecordPermission().then(resolve).catch(reject);
	});
}

export function openRecordPermissionSettings() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined') {
			reject(new Error('unsupported'));
			return;
		}
		try {
			if (plus.os && plus.os.name === 'Android') {
				const mainActivity = plus.android.runtimeMainActivity();
				const Intent = plus.android.importClass('android.content.Intent');
				const Settings = plus.android.importClass('android.provider.Settings');
				const Uri = plus.android.importClass('android.net.Uri');
				const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
				intent.setData(Uri.fromParts('package', mainActivity.getPackageName(), null));
				mainActivity.startActivity(intent);
				resolve();
				return;
			}
			if (plus.os && plus.os.name === 'iOS' && plus.runtime && typeof plus.runtime.openURL === 'function') {
				plus.runtime.openURL('app-settings:');
				resolve();
				return;
			}
			reject(new Error('unsupported'));
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * 非 H5：申请/检查录音权限
 * @returns {Promise<void>}
 */
export function ensureRecordPermission() {
	return new Promise((resolve, reject) => {
		if (isRecordH5()) {
			resolve();
			return;
		}
		if (isRecordApp()) {
			ensureAppRecordPermission().then(resolve).catch(reject);
			return;
		}
		if (typeof uni.getSetting !== 'function') {
			resolve();
			return;
		}
		uni.getSetting({
			success: (res) => {
				const auth = res.authSetting && res.authSetting['scope.record'];
				if (auth === true) {
					resolve();
					return;
				}
				if (auth === false) {
					reject(new Error('denied'));
					return;
				}
				if (typeof uni.authorize !== 'function') {
					resolve();
					return;
				}
				uni.authorize({
					scope: 'scope.record',
					success: () => resolve(),
					fail: () => reject(new Error('denied'))
				});
			},
			fail: () => resolve()
		});
	});
}

/** 小程序/App 推荐录音参数 */
export function getRecorderStartOptions() {
	if (isRecordMpWeixin()) {
		return {
			duration: 60000,
			sampleRate: 44100,
			numberOfChannels: 1,
			encodeBitRate: 128000,
			format: 'aac'
		};
	}
	if (isRecordApp()) {
		// iOS 对 aac + 16k 更稳；过高采样率偶发 start 无回调
		const isIOS = typeof plus !== 'undefined' && plus.os && plus.os.name === 'iOS';
		return {
			duration: 600000,
			sampleRate: isIOS ? 16000 : 44100,
			numberOfChannels: 1,
			encodeBitRate: isIOS ? 48000 : 96000,
			format: 'aac'
		};
	}
	return {
		format: 'mp3',
		duration: 60000
	};
}
