export const MOOD_CONTENT_TYPE = {
	TEXT: 1,
	VOICE: 2,
	VIDEO: 3
};

/** videoGenStatus / videoStatus：0未生成 1生成中 2成功 3失败；部分链路还有 4审核中 */
function getVideoGenStatus(mood = {}) {
	const value = mood.videoStatus != null ? mood.videoStatus : mood.videoGenStatus;
	if (value == null || value === '') return NaN;
	return Number(value);
}

function getMoodVideoUrl(mood = {}) {
	return String(mood.videoUrl || '').trim();
}

function hasVideoPipeline(mood = {}) {
	const type = Number(mood.contentType);
	const status = getVideoGenStatus(mood);
	return (
		Boolean(getMoodVideoUrl(mood)) ||
		type === MOOD_CONTENT_TYPE.VIDEO ||
		status === 1 ||
		status === 2 ||
		status === 3 ||
		status === 4
	);
}

export function getMoodContentType(mood = {}) {
	if (hasVideoPipeline(mood)) {
		return MOOD_CONTENT_TYPE.VIDEO;
	}
	const type = Number(mood.contentType);
	if (type === MOOD_CONTENT_TYPE.VOICE || mood.voiceUrl) {
		return MOOD_CONTENT_TYPE.VOICE;
	}
	return MOOD_CONTENT_TYPE.TEXT;
}

export function isTextMood(mood = {}) {
	return getMoodContentType(mood) === MOOD_CONTENT_TYPE.TEXT;
}

export function isVoiceMood(mood = {}) {
	return getMoodContentType(mood) === MOOD_CONTENT_TYPE.VOICE;
}

export function isVideoMood(mood = {}) {
	return getMoodContentType(mood) === MOOD_CONTENT_TYPE.VIDEO;
}

export function isVideoReady(mood = {}) {
	return isVideoMood(mood) && Boolean(getMoodVideoUrl(mood));
}

export function getMoodText(mood = {}) {
	return String(mood.content || mood.textContent || mood.voiceTranscription || '').trim();
}

export function getVideoStatusText(mood = {}) {
	if (!isVideoMood(mood)) return '';
	const status = getVideoGenStatus(mood);
	if (getMoodVideoUrl(mood)) return '视频内容';
	if (Number(mood.auditStatus) === 2) {
		return mood.auditReason ? `该视频审核不通过：${mood.auditReason}` : '该视频审核不通过';
	}
	if (status === 3) return mood.auditReason || '视频生成失败';
	if (status === 4 || Number(mood.auditStatus) === 0) return '视频审核中';
	return '视频生成中';
}

export function getMoodBrief(mood = {}) {
	if (isVoiceMood(mood)) return '语音内容';
	if (isVideoMood(mood)) return getMoodText(mood) || (isVideoReady(mood) ? '视频内容' : getVideoStatusText(mood));
	return getMoodText(mood) || '动态内容';
}
