/**
 * DOM video 自定义进度条（renderjs 通过 script 动态加载，勿用 ES import）
 * 挂到 window.__attachMoodVideoDomControls
 */
(function (global) {
	'use strict';

	function pad2(n) {
		return n < 10 ? '0' + n : String(n);
	}

	function formatVideoTime(sec) {
		var s = Math.max(0, Math.floor(Number(sec) || 0));
		var m = Math.floor(s / 60);
		var r = s % 60;
		return pad2(m) + ':' + pad2(r);
	}

	function ensureStyle() {
		if (typeof document === 'undefined') return;
		var id = 'mood-video-dom-controls-style';
		if (document.getElementById(id)) return;
		var style = document.createElement('style');
		style.id = id;
		style.textContent =
			'.mood-vctrl{position:absolute;left:0;right:0;bottom:0;z-index:5;padding:28px 12px 10px;box-sizing:border-box;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,rgba(0,0,0,.2) 55%,rgba(0,0,0,0) 100%);pointer-events:none}' +
			'.mood-vctrl__row{display:flex;align-items:center;gap:8px;pointer-events:auto}' +
			'.mood-vctrl__time{flex:none;min-width:38px;color:#fff;font-size:11px;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px rgba(0,0,0,.45)}' +
			'.mood-vctrl__time--remain{text-align:right}' +
			'.mood-vctrl__track{position:relative;flex:1;height:18px;display:flex;align-items:center;touch-action:none}' +
			'.mood-vctrl__rail{position:absolute;left:0;right:0;height:3px;border-radius:2px;background:rgba(255,255,255,.35)}' +
			'.mood-vctrl__played{position:absolute;left:0;top:0;bottom:0;width:0%;border-radius:2px;background:#fff}' +
			'.mood-vctrl__thumb{position:absolute;top:50%;left:0%;width:10px;height:10px;margin-left:-5px;margin-top:-5px;border-radius:50%;background:#fff;box-shadow:0 0 2px rgba(0,0,0,.35);pointer-events:none}' +
			'.mood-vctrl__actions{display:flex;align-items:center;gap:6px;flex:none}' +
			'.mood-vctrl__action{min-width:36px;height:22px;padding:0 8px;border-radius:11px;background:rgba(255,255,255,.22);color:#fff;font-size:11px;line-height:22px;text-align:center}' +
			'.mood-vctrl__play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.42);border:1.5px solid rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .18s ease}' +
			'.mood-vctrl__play.is-visible{opacity:1}' +
			'.mood-vctrl__play-icon{color:#fff;font-size:20px;line-height:1;margin-left:3px}' +
			'.mood-vctrl__top{position:absolute;top:0;left:0;right:0;z-index:6;padding:10px 12px;display:flex;justify-content:flex-end;gap:8px;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.45),rgba(0,0,0,0))}' +
			'.mood-vctrl__top-btn{pointer-events:auto;min-width:52px;height:28px;padding:0 10px;border-radius:14px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:12px;line-height:28px;text-align:center}';
		document.head.appendChild(style);
	}

	/**
	 * @param {HTMLVideoElement} video
	 * @param {HTMLElement} host
	 * @param {{onFullscreen?: Function, onClose?: Function, showTopActions?: boolean}} [options]
	 */
	function attachMoodVideoDomControls(video, host, options) {
		if (!video || !host || typeof document === 'undefined') {
			return function () {};
		}

		options = options || { showTopActions: false };
		ensureStyle();
		video.controls = false;

		var topBar = null;
		// if (options.showTopActions !== false) {
		// 	topBar = document.createElement('div');
		// 	topBar.className = 'mood-vctrl__top';
		// 	topBar.innerHTML =
		// 		'<div class="mood-vctrl__top-btn mood-vctrl__top-fs">全屏</div>' +
		// 		'<div class="mood-vctrl__top-btn mood-vctrl__top-close">关闭</div>';
		// }

		var root = document.createElement('div');
		root.className = 'mood-vctrl';
		root.innerHTML =
			'<div class="mood-vctrl__row">' +
			'<span class="mood-vctrl__time mood-vctrl__time--current">00:00</span>' +
			'<div class="mood-vctrl__track">' +
			'<div class="mood-vctrl__rail"><div class="mood-vctrl__played"></div></div>' +
			'<div class="mood-vctrl__thumb"></div>' +
			'</div>' +
			'<span class="mood-vctrl__time mood-vctrl__time--remain">00:00</span>' +
			'<div class="mood-vctrl__actions">' +
			'<div class="mood-vctrl__action mood-vctrl__fs">全屏</div>' +
			'</div>' +
			'</div>';

		var playBtn = document.createElement('div');
		playBtn.className = 'mood-vctrl__play';
		playBtn.innerHTML = '<span class="mood-vctrl__play-icon">▶</span>';

		var currentEl = root.querySelector('.mood-vctrl__time--current');
		var remainEl = root.querySelector('.mood-vctrl__time--remain');
		var playedEl = root.querySelector('.mood-vctrl__played');
		var thumbEl = root.querySelector('.mood-vctrl__thumb');
		var trackEl = root.querySelector('.mood-vctrl__track');
		var fsBtn = root.querySelector('.mood-vctrl__fs');
		var topFsBtn = topBar ? topBar.querySelector('.mood-vctrl__top-fs') : null;
		var topCloseBtn = topBar ? topBar.querySelector('.mood-vctrl__top-close') : null;

		var seeking = false;

		function showPlayHint(visible) {
			if (visible) playBtn.classList.add('is-visible');
			else playBtn.classList.remove('is-visible');
		}

		function updateUI() {
			var duration = Number(video.duration);
			var hasDuration = isFinite(duration) && duration > 0;
			var current = seeking
				? Number(video.dataset.seekPreview || video.currentTime || 0)
				: Number(video.currentTime || 0);
			var ratio = hasDuration ? Math.min(1, Math.max(0, current / duration)) : 0;
			var pct = (ratio * 100).toFixed(2) + '%';
			if (playedEl) playedEl.style.width = pct;
			if (thumbEl) thumbEl.style.left = pct;
			if (currentEl) currentEl.textContent = formatVideoTime(current);
			if (remainEl) {
				remainEl.textContent = hasDuration
					? '-' + formatVideoTime(Math.max(0, duration - current))
					: '00:00';
			}
			showPlayHint(video.paused);
		}

		function seekFromEvent(e) {
			var duration = Number(video.duration);
			if (!isFinite(duration) || duration <= 0 || !trackEl) return;
			var point = e.touches && e.touches[0] ? e.touches[0] : e;
			var rect = trackEl.getBoundingClientRect();
			if (!rect.width) return;
			var ratio = Math.min(1, Math.max(0, (point.clientX - rect.left) / rect.width));
			var next = duration * ratio;
			video.dataset.seekPreview = String(next);
			video.currentTime = next;
			updateUI();
		}

		function onTimeUpdate() {
			if (!seeking) updateUI();
		}
		function onMeta() {
			updateUI();
		}
		function onPlay() {
			showPlayHint(false);
		}
		function onPause() {
			showPlayHint(true);
		}
		function onEnded() {
			showPlayHint(true);
			updateUI();
		}

		function onTrackStart(e) {
			seeking = true;
			e.preventDefault();
			e.stopPropagation();
			seekFromEvent(e);
		}
		function onTrackMove(e) {
			if (!seeking) return;
			e.preventDefault();
			e.stopPropagation();
			seekFromEvent(e);
		}
		function onTrackEnd(e) {
			if (!seeking) return;
			seeking = false;
			try {
				delete video.dataset.seekPreview;
			} catch (err) {
				/* ignore */
			}
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			updateUI();
		}

		function onFullscreenTap(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			if (typeof options.onFullscreen === 'function') {
				options.onFullscreen();
			}
		}

		function onCloseTap(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			if (typeof options.onClose === 'function') {
				options.onClose();
			}
		}

		function onHostClick(e) {
			if (root.contains(e.target)) return;
			if (topBar && topBar.contains(e.target)) return;
			if (video.paused) {
				var p = video.play();
				if (p && typeof p.catch === 'function') p.catch(function () {});
			} else {
				video.pause();
			}
		}

		video.addEventListener('timeupdate', onTimeUpdate);
		video.addEventListener('loadedmetadata', onMeta);
		video.addEventListener('durationchange', onMeta);
		video.addEventListener('play', onPlay);
		video.addEventListener('pause', onPause);
		video.addEventListener('ended', onEnded);

		trackEl.addEventListener('touchstart', onTrackStart, { passive: false });
		trackEl.addEventListener('touchmove', onTrackMove, { passive: false });
		trackEl.addEventListener('touchend', onTrackEnd, { passive: false });
		trackEl.addEventListener('touchcancel', onTrackEnd, { passive: false });
		trackEl.addEventListener('mousedown', onTrackStart);
		window.addEventListener('mousemove', onTrackMove);
		window.addEventListener('mouseup', onTrackEnd);

		if (fsBtn) {
			fsBtn.addEventListener('click', onFullscreenTap);
			fsBtn.addEventListener('touchend', onFullscreenTap);
		}
		if (topFsBtn) {
			topFsBtn.addEventListener('click', onFullscreenTap);
			topFsBtn.addEventListener('touchend', onFullscreenTap);
		}
		if (topCloseBtn) {
			topCloseBtn.addEventListener('click', onCloseTap);
			topCloseBtn.addEventListener('touchend', onCloseTap);
		}

		host.addEventListener('click', onHostClick);
		if (topBar) host.appendChild(topBar);
		host.appendChild(playBtn);
		host.appendChild(root);
		updateUI();

		return function () {
			video.removeEventListener('timeupdate', onTimeUpdate);
			video.removeEventListener('loadedmetadata', onMeta);
			video.removeEventListener('durationchange', onMeta);
			video.removeEventListener('play', onPlay);
			video.removeEventListener('pause', onPause);
			video.removeEventListener('ended', onEnded);
			trackEl.removeEventListener('touchstart', onTrackStart);
			trackEl.removeEventListener('touchmove', onTrackMove);
			trackEl.removeEventListener('touchend', onTrackEnd);
			trackEl.removeEventListener('touchcancel', onTrackEnd);
			trackEl.removeEventListener('mousedown', onTrackStart);
			window.removeEventListener('mousemove', onTrackMove);
			window.removeEventListener('mouseup', onTrackEnd);
			if (fsBtn) {
				fsBtn.removeEventListener('click', onFullscreenTap);
				fsBtn.removeEventListener('touchend', onFullscreenTap);
			}
			if (topFsBtn) {
				topFsBtn.removeEventListener('click', onFullscreenTap);
				topFsBtn.removeEventListener('touchend', onFullscreenTap);
			}
			if (topCloseBtn) {
				topCloseBtn.removeEventListener('click', onCloseTap);
				topCloseBtn.removeEventListener('touchend', onCloseTap);
			}
			host.removeEventListener('click', onHostClick);
			if (root.parentNode) root.parentNode.removeChild(root);
			if (playBtn.parentNode) playBtn.parentNode.removeChild(playBtn);
			if (topBar && topBar.parentNode) topBar.parentNode.removeChild(topBar);
		};
	}

	global.__attachMoodVideoDomControls = attachMoodVideoDomControls;
})(typeof window !== 'undefined' ? window : this);
