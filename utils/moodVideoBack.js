import {
	closeMoodVideo,
	getCurrentMoodVideo,
	setMoodVideoRegionFullscreen
} from './moodVideoPortal';

/**
 * App 视频返回键：
 * 1) 区域内全屏 → 退回列表区域播放
 * 2) 列表区域播放 → 关闭视频
 */
export const moodVideoBackMixin = {
	onBackPress() {
		const current = getCurrentMoodVideo();
		if (!current) return false;
		if (current.regionFullscreen) {
			setMoodVideoRegionFullscreen(false);
			return true;
		}
		closeMoodVideo();
		return true;
	}
};
