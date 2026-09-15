/**
 * Android App 原生视频播放（plus.video.VideoPlayer）
 * 列表跟手：absolute + setStyles；滑动中 hide，停稳再 show
 *
 * 注意：uni-app 的 .vue 页不能用 plus.webview.currentWebview()，
 * 必须 append 到当前页 $getAppWebview()，否则安卓上常出现「点了没画面」。
 */

let player = null;
let playerId = '';
let closing = false;
let currentSrc = '';
let openSeq = 0;
let lastRect = null;
let visuallyHidden = false;
/** 由 moodVideoPortal 注入，避免循环依赖 */
let portalCloseHandler = null;

export function bindAndroidNativeVideoPortalClose(handler) {
	portalCloseHandler = typeof handler === 'function' ? handler : null;
}

function requestPortalClose() {
	if (typeof portalCloseHandler === 'function') {
		try {
			portalCloseHandler();
		} catch (e) {
			console.error('[androidNativeVideo] portalClose failed', e);
		}
	}
}

function hasPlusVideo() {
	return typeof plus !== 'undefined' && plus.video && typeof plus.video.createVideoPlayer === 'function';
}

function toPx(n) {
	return `${Math.max(0, Math.round(Number(n) || 0))}px`;
}

function rectStyles(rect = {}) {
	return {
		top: toPx(rect.top),
		left: toPx(rect.left),
		width: toPx(rect.width),
		height: toPx(rect.height),
		position: 'absolute'
	};
}

/** uni-app Vue 页当前 Webview（勿用 plus.webview.currentWebview） */
function getPageWebview() {
	try {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		const page = pages && pages.length ? pages[pages.length - 1] : null;
		if (page) {
			if (typeof page.$getAppWebview === 'function') {
				return page.$getAppWebview();
			}
			if (page.$vm && typeof page.$vm.$getAppWebview === 'function') {
				return page.$vm.$getAppWebview();
			}
			if (page.$scope && typeof page.$scope.$getAppWebview === 'function') {
				return page.$scope.$getAppWebview();
			}
		}
	} catch (e) {
		console.error('[androidNativeVideo] getPageWebview failed', e);
	}
	try {
		if (typeof plus !== 'undefined' && plus.webview && typeof plus.webview.currentWebview === 'function') {
			return plus.webview.currentWebview();
		}
	} catch (e2) {
		/* ignore */
	}
	return null;
}

function appendPlayer(video) {
	const webview = getPageWebview();
	if (!webview || typeof webview.append !== 'function') {
		console.error('[androidNativeVideo] page webview unavailable');
		return false;
	}
	try {
		webview.append(video);
		return true;
	} catch (e) {
		console.error('[androidNativeVideo] append failed', e);
		return false;
	}
}

function runWhenPlusReady(fn) {
	if (typeof plus !== 'undefined') {
		fn();
		return;
	}
	if (typeof document !== 'undefined' && document.addEventListener) {
		document.addEventListener('plusready', fn, false);
		return;
	}
	setTimeout(fn, 50);
}

export function isAndroidNativeVideoOpen() {
	return Boolean(player);
}

export function isAndroidNativeVideoHidden() {
	return Boolean(player && visuallyHidden);
}

/** 滑动时隐藏原生层，让列表封面跟手，避免错位感 */
export function hideAndroidNativeVideo() {
	if (!player || visuallyHidden) return;
	visuallyHidden = true;
	try {
		if (typeof player.hide === 'function') {
			player.hide();
		} else {
			player.setStyles({
				top: '-9999px',
				left: '-9999px',
				width: '1px',
				height: '1px'
			});
		}
	} catch (e) {
		console.error('[androidNativeVideo] hide failed', e);
	}
}

/** 停稳后按 lastRect / 传入 rect 恢复显示 */
export function showAndroidNativeVideo(rect) {
	if (!player) return;
	const next = rect || lastRect;
	if (next) {
		try {
			player.setStyles(rectStyles(next));
			lastRect = {
				top: Number(next.top),
				left: Number(next.left),
				width: Number(next.width),
				height: Number(next.height)
			};
		} catch (e) {
			console.error('[androidNativeVideo] show setStyles failed', e);
		}
	}
	visuallyHidden = false;
	try {
		if (typeof player.show === 'function') {
			player.show();
		}
	} catch (e) {
		console.error('[androidNativeVideo] show failed', e);
	}
}

export function openAndroidNativeVideo(payload = {}) {
	if (!payload.src || !payload.rect) {
		console.error('[androidNativeVideo] missing src/rect', payload);
		return false;
	}

	const doOpen = () => {
		if (!hasPlusVideo()) {
			console.error('[androidNativeVideo] plus.video unavailable');
			return false;
		}

		closeAndroidNativeVideo();

		const seq = ++openSeq;
		try {
			playerId = `mood-android-native-video-${Date.now()}-${seq}`;
			lastRect = {
				top: Number(payload.rect.top),
				left: Number(payload.rect.left),
				width: Number(payload.rect.width),
				height: Number(payload.rect.height)
			};
			visuallyHidden = false;
			const styles = Object.assign(
				{
					src: String(payload.src),
					autoplay: true,
					controls: true,
					objectFit: 'cover'
				},
				rectStyles(payload.rect)
			);
			if (payload.poster) {
				styles.poster = String(payload.poster);
			}

			player = plus.video.createVideoPlayer(playerId, styles);
			if (!player) {
				console.error('[androidNativeVideo] createVideoPlayer returned empty');
				playerId = '';
				currentSrc = '';
				lastRect = null;
				return false;
			}
			currentSrc = String(payload.src);

			player.addEventListener('ended', () => {
				if (seq !== openSeq) return;
				requestPortalClose();
			});
			player.addEventListener('error', (err) => {
				console.error('[androidNativeVideo] play error', err);
				if (seq !== openSeq) return;
				uni.showToast({ title: '视频播放失败', icon: 'none' });
				requestPortalClose();
			});

			if (!appendPlayer(player)) {
				try {
					if (typeof player.close === 'function') player.close();
				} catch (e) {
					/* ignore */
				}
				player = null;
				playerId = '';
				currentSrc = '';
				lastRect = null;
				return false;
			}

			if (typeof player.show === 'function') {
				try {
					player.show();
				} catch (e) {
					/* ignore */
				}
			}
			if (typeof player.play === 'function') {
				try {
					player.play();
				} catch (e) {
					/* ignore */
				}
			}
			return true;
		} catch (e) {
			console.error('[androidNativeVideo] open failed', e);
			player = null;
			playerId = '';
			currentSrc = '';
			lastRect = null;
			return false;
		}
	};

	if (typeof plus === 'undefined') {
		// 未就绪时不要假装成功；由调用方决定是否重试
		runWhenPlusReady(() => {
			const ok = doOpen();
			if (!ok) {
				uni.showToast({ title: '视频播放失败', icon: 'none' });
				requestPortalClose();
			}
		});
		return false;
	}

	return doOpen();
}

export function updateAndroidNativeVideoRect(rect) {
	if (!player || !rect) return;
	lastRect = {
		top: Number(rect.top),
		left: Number(rect.left),
		width: Number(rect.width),
		height: Number(rect.height)
	};
	// 滑动隐藏中只记位置，避免把藏到屏外的层又拉回来造成闪烁
	if (visuallyHidden) return;
	try {
		player.setStyles(rectStyles(rect));
	} catch (e) {
		console.error('[androidNativeVideo] setStyles failed', e);
	}
}

/** 系统全屏（plus.video 控件全屏） */
export function requestAndroidNativeVideoFullScreen(direction) {
	if (!player || typeof player.requestFullScreen !== 'function') {
		return false;
	}
	try {
		if (typeof direction === 'number') {
			player.requestFullScreen(direction);
		} else {
			player.requestFullScreen();
		}
		return true;
	} catch (e) {
		console.error('[androidNativeVideo] requestFullScreen failed', e);
		return false;
	}
}

/** 退出系统全屏（若运行时支持） */
export function exitAndroidNativeVideoFullScreen() {
	if (!player) return false;
	try {
		if (typeof player.exitFullScreen === 'function') {
			player.exitFullScreen();
			return true;
		}
	} catch (e) {
		console.error('[androidNativeVideo] exitFullScreen failed', e);
	}
	return false;
}

export function closeAndroidNativeVideo() {
	if (closing) return;
	if (!player) {
		playerId = '';
		currentSrc = '';
		lastRect = null;
		visuallyHidden = false;
		return;
	}
	closing = true;
	const current = player;
	player = null;
	playerId = '';
	currentSrc = '';
	lastRect = null;
	visuallyHidden = false;
	try {
		if (typeof current.close === 'function') {
			current.close();
		}
	} catch (e) {
		console.error('[androidNativeVideo] close failed', e);
	} finally {
		closing = false;
	}
}

export function getAndroidNativeVideoSrc() {
	return currentSrc;
}
