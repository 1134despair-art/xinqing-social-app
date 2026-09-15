/** 视频封面解析：CDN 截图 > 客户端截帧（跳过黑场）> 空 */

const memoryCache = new Map();
const pendingMap = new Map();

const BRIGHTNESS_THRESHOLD = 18;
const SEEK_CANDIDATES_SEC = [0, 0.1, 0.3, 0.6, 1, 1.5, 2, 3];

function trimUrl(url) {
	return String(url || '').trim();
}

function canUseDomVideoCapture() {
	return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function hashUrl(url) {
	let hash = 0;
	for (let i = 0; i < url.length; i += 1) {
		hash = ((hash << 5) - hash) + url.charCodeAt(i);
		hash |= 0;
	}
	return `vp_${Math.abs(hash)}`;
}

function buildCdnSnapshotCandidates(videoUrl) {
	const url = trimUrl(videoUrl);
	if (!url) return [];

	const lower = url.toLowerCase();
	const candidates = [];

	if (lower.includes('aliyuncs.com') || lower.includes('x-oss-process=')) {
		const joiner = url.includes('?') ? '&' : '?';
		candidates.push(`${url}${joiner}x-oss-process=video/snapshot,t_1000,f_jpg,w_720,m_fast`);
		candidates.push(`${url}${joiner}x-oss-process=video/snapshot,t_500,f_jpg,w_720,m_fast`);
	}

	if (lower.includes('myqcloud.com') || lower.includes('cos.')) {
		const joiner = url.includes('?') ? '&' : '?';
		candidates.push(`${url}${joiner}ci-process=snapshot&time=1&format=jpg&width=720`);
		candidates.push(`${url}${joiner}ci-process=snapshot&time=0.5&format=jpg&width=720`);
	}

	if (lower.includes('clouddn.com') || lower.includes('qiniucdn.com') || lower.includes('qnssl.com')) {
		candidates.push(`${url}?vframe/jpg/offset/1/w/720`);
		candidates.push(`${url}?vframe/jpg/offset/0/w/720`);
	}

	return candidates;
}

function probeImageUrl(imageUrl) {
	return new Promise((resolve) => {
		const src = trimUrl(imageUrl);
		if (!src || typeof Image === 'undefined') {
			resolve(false);
			return;
		}
		const img = new Image();
		img.crossOrigin = 'anonymous';
		const timer = setTimeout(() => {
			img.onload = null;
			img.onerror = null;
			resolve(false);
		}, 8000);
		img.onload = () => {
			clearTimeout(timer);
			resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
		};
		img.onerror = () => {
			clearTimeout(timer);
			resolve(false);
		};
		img.src = src;
	});
}

async function resolveCdnSnapshotPoster(videoUrl) {
	const candidates = buildCdnSnapshotCandidates(videoUrl);
	for (let i = 0; i < candidates.length; i += 1) {
		const candidate = candidates[i];
		// eslint-disable-next-line no-await-in-loop
		const ok = await probeImageUrl(candidate);
		if (ok) return candidate;
	}
	return '';
}

function loadVideoElement(video, videoUrl) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (fn, value) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			fn(value);
		};

		const timer = setTimeout(() => {
			finish(reject, new Error('video load timeout'));
		}, 15000);

		video.onloadedmetadata = () => finish(resolve);
		video.onerror = () => finish(reject, new Error('video load error'));
		video.src = videoUrl;
		video.load();
	});
}

function seekVideoElement(video, timeSec) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (fn, value) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			fn(value);
		};
		const timer = setTimeout(() => {
			finish(resolve);
		}, 5000);

		video.onseeked = () => finish(resolve);
		video.onerror = () => finish(reject, new Error('video seek error'));
		try {
			video.currentTime = Math.max(0, timeSec);
		} catch (e) {
			finish(reject, e);
		}
	});
}

function getFrameBrightness(video, canvas, ctx) {
	const width = video.videoWidth || 0;
	const height = video.videoHeight || 0;
	if (!width || !height) return 0;

	const targetWidth = Math.min(width, 320);
	const targetHeight = Math.round((height / width) * targetWidth) || 1;
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

	let imageData;
	try {
		imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
	} catch (e) {
		return 0;
	}

	const { data } = imageData;
	let sum = 0;
	let count = 0;
	const step = 16;
	for (let i = 0; i < data.length; i += step) {
		sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
		count += 1;
	}
	return count ? sum / count : 0;
}

function captureFrameDataUrl(video, canvas, ctx) {
	const width = video.videoWidth || 0;
	const height = video.videoHeight || 0;
	if (!width || !height) return '';

	const maxWidth = 720;
	const targetWidth = Math.min(width, maxWidth);
	const targetHeight = Math.round((height / width) * targetWidth) || 1;
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

	try {
		return canvas.toDataURL('image/jpeg', 0.82);
	} catch (e) {
		return '';
	}
}

function cleanupVideoElement(video) {
	try {
		video.pause();
		video.removeAttribute('src');
		video.load();
	} catch (e) {
		/* ignore */
	}
}

async function captureFirstMeaningfulFrame(videoUrl) {
	if (!canUseDomVideoCapture()) return '';

	const video = document.createElement('video');
	video.crossOrigin = 'anonymous';
	video.muted = true;
	video.playsInline = true;
	video.preload = 'auto';
	video.setAttribute('playsinline', 'true');
	video.setAttribute('webkit-playsinline', 'true');

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';

	try {
		await loadVideoElement(video, videoUrl);
		const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
		const seekPoints = SEEK_CANDIDATES_SEC
			.filter((sec) => (duration ? sec < duration : sec <= 3))
			.slice(0, 8);

		let bestDataUrl = '';
		let bestBrightness = 0;

		for (let i = 0; i < seekPoints.length; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await seekVideoElement(video, seekPoints[i]);
			const brightness = getFrameBrightness(video, canvas, ctx);
			if (brightness >= BRIGHTNESS_THRESHOLD) {
				const dataUrl = captureFrameDataUrl(video, canvas, ctx);
				if (dataUrl) return dataUrl;
			}
			if (brightness > bestBrightness) {
				const dataUrl = captureFrameDataUrl(video, canvas, ctx);
				if (dataUrl) {
					bestBrightness = brightness;
					bestDataUrl = dataUrl;
				}
			}
		}

		return bestDataUrl;
	} catch (e) {
		console.warn('[videoPoster] capture failed', videoUrl, e);
		return '';
	} finally {
		cleanupVideoElement(video);
	}
}

async function resolvePosterInternal(videoUrl) {
	const cdnPoster = await resolveCdnSnapshotPoster(videoUrl);
	if (cdnPoster) return cdnPoster;

	const captured = await captureFirstMeaningfulFrame(videoUrl);
	return captured || '';
}

/**
 * 解析视频封面：优先已有 poster，其次 CDN 截图，再尝试客户端截帧
 * @param {string} videoUrl
 * @param {{ poster?: string }} [options]
 * @returns {Promise<string>}
 */
export function resolveVideoPoster(videoUrl, options = {}) {
	const url = trimUrl(videoUrl);
	const explicitPoster = trimUrl(options.poster);
	if (!url) return Promise.resolve('');
	if (explicitPoster) return Promise.resolve(explicitPoster);

	if (memoryCache.has(url)) {
		return Promise.resolve(memoryCache.get(url));
	}

	if (pendingMap.has(url)) {
		return pendingMap.get(url);
	}

	const task = resolvePosterInternal(url)
		.then((poster) => {
			const resolved = trimUrl(poster);
			if (resolved) {
				memoryCache.set(url, resolved);
			}
			return resolved;
		})
		.catch((e) => {
			console.warn('[videoPoster] resolve failed', url, e);
			return '';
		})
		.finally(() => {
			pendingMap.delete(url);
		});

	pendingMap.set(url, task);
	return task;
}

export function getCachedVideoPoster(videoUrl) {
	const url = trimUrl(videoUrl);
	return url ? (memoryCache.get(url) || '') : '';
}

export function clearVideoPosterCache(videoUrl) {
	const url = trimUrl(videoUrl);
	if (!url) {
		memoryCache.clear();
		return;
	}
	memoryCache.delete(url);
}

export { hashUrl as getVideoPosterCacheKey };
