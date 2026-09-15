/**
 * App 列表视频门户（不使用 uni <video>）
 * - iOS：MoodVideo 内 renderjs DOM video
 * - Android：plus.video.VideoPlayer（原生层，滑动时隐藏避免跟手错位）
 * - 区域内全屏：铺满 App 窗口，非系统全屏
 */
import {
	bindAndroidNativeVideoPortalClose,
	hideAndroidNativeVideo,
	isAndroidNativeVideoOpen,
	showAndroidNativeVideo,
	updateAndroidNativeVideoRect
} from '@/utils/androidNativeVideo';
import { TAB_ROUTES } from '@/utils/tabBar';

let currentVideo = null;
const listeners = new Set();
let rectSyncHandler = null;
/** 安卓刚打开后的保护期，避免首帧测量把播放立刻关掉 */
let androidProtectUntil = 0;
/** 列表滚动：停稳后再露出原生层 */
let scrollEndTimer = null;
let scrollHidden = false;
let lastScrollTop = null;

function notify() {
	listeners.forEach((listener) => {
		try {
			listener(currentVideo);
		} catch (e) {
			console.error('[moodVideoPortal] listener error', e);
		}
	});
}

function normalizeRect(rect) {
	if (!rect) return null;
	const top = Number(rect.top);
	const left = Number(rect.left);
	const width = Number(rect.width);
	const height = Number(rect.height);
	if (![top, left, width, height].every((n) => Number.isFinite(n))) return null;
	if (width < 2 || height < 2) return null;
	return {
		top,
		left,
		width,
		height,
		right: left + width,
		bottom: top + height
	};
}

function isCurrentTabPage() {
	try {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		const page = pages && pages.length ? pages[pages.length - 1] : null;
		const route = page && (page.route || (page.$page && page.$page.fullPath) || '');
		const normalized = String(route || '').replace(/^\//, '').split('?')[0];
		return TAB_ROUTES.indexOf(normalized) !== -1;
	} catch (e) {
		return false;
	}
}

/** 自定义 tabBar 占位（仅 tab 页；与 AppTabBar：120rpx + 安全区 对齐） */
export function getMoodVideoTabBarInset() {
	if (!isCurrentTabPage()) return 0;
	try {
		const sys = uni.getSystemInfoSync() || {};
		const safeBottom = Number(sys.safeAreaInsets && sys.safeAreaInsets.bottom) || 0;
		const bar = typeof uni.upx2px === 'function' ? uni.upx2px(120) : 60;
		return Math.round(bar + safeBottom);
	} catch (e) {
		return 60;
	}
}

/** 列表态可播放安全区（避开底部 tabBar） */
export function getMoodVideoSafeBounds() {
	const win = getMoodVideoWindowRect() || { top: 0, left: 0, width: 375, height: 667 };
	const tabInset = getMoodVideoTabBarInset();
	const bottom = Math.max(80, win.height - tabInset);
	return {
		top: 0,
		left: 0,
		right: win.width,
		bottom,
		width: win.width,
		height: bottom
	};
}

/**
 * 将测量 rect 裁到安全区内。过小返回 null。
 * @returns {{ rect: object|null, clipped: boolean, ratio: number }}
 */
export function clipMoodVideoRect(rect) {
	const box = normalizeRect(rect);
	if (!box) return { rect: null, clipped: false, ratio: 0 };
	const safe = getMoodVideoSafeBounds();
	const top = Math.max(box.top, safe.top);
	const bottom = Math.min(box.bottom, safe.bottom);
	const left = box.left;
	const width = box.width;
	const height = bottom - top;
	if (height < 48 || width < 2) {
		return { rect: null, clipped: true, ratio: 0 };
	}
	const clipped = top > box.top + 0.5 || bottom < box.bottom - 0.5;
	return {
		rect: {
			top,
			left,
			width,
			height,
			right: left + width,
			bottom: top + height
		},
		clipped,
		ratio: height / Math.max(1, box.height)
	};
}

/** 列表底部空间不足时，改为区域内全屏更合适 */
export function shouldAndroidUseRegionFullscreen(rect) {
	const { rect: clipped, ratio } = clipMoodVideoRect(rect);
	if (!clipped) return true;
	return ratio < 0.55 || clipped.height < 140;
}

/** 播放引擎：dom（iOS）| android-native（Android） */
export function getMoodVideoEngine() {
	try {
		if (typeof plus !== 'undefined' && plus.os && plus.os.name) {
			const osName = String(plus.os.name).toLowerCase();
			if (osName.indexOf('android') !== -1) return 'android-native';
			if (osName.indexOf('ios') !== -1) return 'dom';
		}
		const sys = uni.getSystemInfoSync() || {};
		const platform = String(sys.platform || sys.osName || '').toLowerCase();
		return platform === 'android' ? 'android-native' : 'dom';
	} catch (e) {
		return 'dom';
	}
}

/** App 窗口矩形 */
export function getMoodVideoWindowRect() {
	try {
		const sys = uni.getSystemInfoSync();
		const width = Number(sys.windowWidth) || Number(sys.screenWidth) || 375;
		const height = Number(sys.windowHeight) || Number(sys.screenHeight) || 667;
		return normalizeRect({ top: 0, left: 0, width, height });
	} catch (e) {
		return normalizeRect({ top: 0, left: 0, width: 375, height: 667 });
	}
}

/** 区域内全屏矩形：顶部留出关闭条，底部可盖住 tabBar */
export function getMoodVideoRegionFullscreenRect() {
	const win = getMoodVideoWindowRect() || { width: 375, height: 667, top: 0, left: 0 };
	let safeTop = 0;
	try {
		const sys = uni.getSystemInfoSync();
		safeTop = Number(sys.statusBarHeight) || (sys.safeAreaInsets && sys.safeAreaInsets.top) || 0;
	} catch (e) {
		/* ignore */
	}
	const topBar = safeTop + (typeof uni.upx2px === 'function' ? uni.upx2px(88) : 44);
	return normalizeRect({
		top: topBar,
		left: 0,
		width: win.width,
		height: Math.max(160, win.height - topBar)
	});
}

/** Android 列表态是否仍有足够可视区域（相对安全区） */
export function isMoodVideoRectPlayable(rect) {
	const { rect: clipped } = clipMoodVideoRect(rect);
	return Boolean(clipped && clipped.height >= 48);
}

export function openMoodVideo(payload = {}) {
	if (!payload.src) return false;
	const engine = payload.engine || getMoodVideoEngine();
	let rect = normalizeRect(payload.rect);
	let regionFullscreen = Boolean(payload.regionFullscreen);

	if (engine === 'android-native') {
		androidProtectUntil = Date.now() + 3000;
		scrollHidden = false;
		lastScrollTop = null;
		if (scrollEndTimer) {
			clearTimeout(scrollEndTimer);
			scrollEndTimer = null;
		}
		if (!regionFullscreen && rect) {
			if (shouldAndroidUseRegionFullscreen(rect)) {
				regionFullscreen = true;
				rect = getMoodVideoRegionFullscreenRect();
			} else {
				const clipped = clipMoodVideoRect(rect);
				rect = clipped.rect;
			}
		}
	}

	currentVideo = {
		src: payload.src,
		poster: payload.poster || '',
		moodId: payload.moodId || '',
		title: payload.title || '',
		anchorKey: payload.anchorKey || '',
		engine,
		rect: rect || null,
		regionFullscreen
	};
	notify();
	return true;
}

export function updateMoodVideoRect(rect) {
	if (!currentVideo || currentVideo.regionFullscreen) return;
	const raw = normalizeRect(rect);
	if (!raw) return;

	let next = raw;
	if (currentVideo.engine === 'android-native') {
		const clipped = clipMoodVideoRect(raw);
		if (!clipped.rect) {
			if (Date.now() < androidProtectUntil) return;
			closeMoodVideo();
			return;
		}
		next = clipped.rect;
		if (!isMoodVideoRectPlayable(raw)) {
			if (Date.now() < androidProtectUntil) return;
			closeMoodVideo();
			return;
		}
	}

	const prev = currentVideo.rect;
	if (
		prev &&
		Math.abs(prev.top - next.top) < 0.5 &&
		Math.abs(prev.left - next.left) < 0.5 &&
		Math.abs(prev.width - next.width) < 0.5 &&
		Math.abs(prev.height - next.height) < 0.5
	) {
		return;
	}
	currentVideo = { ...currentVideo, rect: next };
	// 滚动隐藏期间只更新逻辑 rect，不刷原生层（停稳后再 show）
	if (!(scrollHidden && currentVideo.engine === 'android-native')) {
		notify();
	}
}

/** 区域内全屏：铺满 App 窗口（非系统全屏） */
export function setMoodVideoRegionFullscreen(enabled) {
	if (!currentVideo) return;
	const next = Boolean(enabled);
	if (currentVideo.regionFullscreen === next) return;

	scrollHidden = false;
	if (scrollEndTimer) {
		clearTimeout(scrollEndTimer);
		scrollEndTimer = null;
	}

	if (next) {
		currentVideo = {
			...currentVideo,
			regionFullscreen: true,
			rect: getMoodVideoRegionFullscreenRect()
		};
	} else {
		currentVideo = {
			...currentVideo,
			regionFullscreen: false
		};
		androidProtectUntil = Date.now() + 1500;
	}
	notify();
	if (!next) {
		requestMoodVideoRectSync();
	}
}

export function toggleMoodVideoRegionFullscreen() {
	if (!currentVideo) return;
	setMoodVideoRegionFullscreen(!currentVideo.regionFullscreen);
}

export function closeMoodVideo() {
	if (!currentVideo) return;
	currentVideo = null;
	androidProtectUntil = 0;
	scrollHidden = false;
	lastScrollTop = null;
	if (scrollEndTimer) {
		clearTimeout(scrollEndTimer);
		scrollEndTimer = null;
	}
	notify();
}

// 原生播放器 ended/error → 关闭门户（模块加载时绑定一次）
bindAndroidNativeVideoPortalClose(() => {
	closeMoodVideo();
});

export function getCurrentMoodVideo() {
	return currentVideo;
}

export function setMoodVideoRectSyncHandler(handler) {
	rectSyncHandler = typeof handler === 'function' ? handler : null;
	return () => {
		if (rectSyncHandler === handler) rectSyncHandler = null;
	};
}

function resumeAfterScroll() {
	scrollEndTimer = null;
	if (!currentVideo || currentVideo.engine !== 'android-native' || currentVideo.regionFullscreen) {
		scrollHidden = false;
		return;
	}
	scrollHidden = false;
	// 先按当前逻辑 rect 露出，再异步精确测量校准
	if (currentVideo.rect && isAndroidNativeVideoOpen()) {
		showAndroidNativeVideo(currentVideo.rect);
	}
	if (typeof rectSyncHandler === 'function') {
		try {
			rectSyncHandler();
		} catch (e) {
			console.error('[moodVideoPortal] rect sync error', e);
		}
	}
}

/**
 * 列表滚动同步入口。
 * Android：滑动中隐藏原生层（封面跟手），停稳后再对齐并显示，避免位移感；并裁切避开 tabBar。
 * @param {object} [detail] scroll-view 的 e.detail（含 scrollTop）
 */
export function requestMoodVideoRectSync(detail) {
	const isAndroidList =
		currentVideo &&
		currentVideo.engine === 'android-native' &&
		!currentVideo.regionFullscreen &&
		isAndroidNativeVideoOpen();

	if (isAndroidList && detail && typeof detail.scrollTop === 'number') {
		const scrollTop = Number(detail.scrollTop) || 0;
		if (lastScrollTop == null) {
			lastScrollTop = scrollTop;
		}
		const delta = scrollTop - lastScrollTop;
		lastScrollTop = scrollTop;

		if (Math.abs(delta) > 0.5) {
			if (!scrollHidden) {
				scrollHidden = true;
				hideAndroidNativeVideo();
			}
			// 同步逻辑坐标，停稳后一次测量校准
			if (currentVideo.rect) {
				const moved = normalizeRect({
					...currentVideo.rect,
					top: currentVideo.rect.top - delta,
					bottom: currentVideo.rect.bottom - delta
				});
				if (moved) {
					const clipped = clipMoodVideoRect(moved);
					if (!clipped.rect) {
						if (Date.now() >= androidProtectUntil) {
							closeMoodVideo();
							return;
						}
					} else {
						currentVideo = { ...currentVideo, rect: clipped.rect };
					}
				}
			}
		}

		if (scrollEndTimer) clearTimeout(scrollEndTimer);
		scrollEndTimer = setTimeout(resumeAfterScroll, 140);
		return;
	}

	if (typeof rectSyncHandler === 'function') {
		try {
			rectSyncHandler();
		} catch (e) {
			console.error('[moodVideoPortal] rect sync error', e);
		}
	}
}

export function subscribeMoodVideo(listener) {
	if (typeof listener === 'function') {
		listeners.add(listener);
		listener(currentVideo);
		return () => listeners.delete(listener);
	}
	return () => {};
}
