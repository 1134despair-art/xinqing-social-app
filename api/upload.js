/**
 * 文件上传 API（C端接口文档）
 */
import { upload } from '@/utils/request';
import { normalizeUploadResult } from '@/utils/apiAdapter';

/**
 * 上传头像图片
 * POST /api/upload/avatar（multipart/form-data，字段名 file）
 * 返回 url 后需再调用更新资料或用户头像接口完成绑定
 */
export async function uploadAvatarFile(filePath, options = {}) {
	const res = await upload('/api/upload/avatar', filePath, {}, {
		name: 'file',
		...options
	});
	return normalizeUploadResult(res);
}

/**
 * 上传语音
 * POST /api/upload/voice
 */
export async function uploadVoiceFile(filePath, options = {}) {
	const res = await upload('/api/upload/voice', filePath, {}, {
		name: 'file',
		...options
	});
	return normalizeUploadResult(res);
}

/**
 * 上传通用文件
 * POST /api/upload/common
 */
export async function uploadCommonFile(filePath, options = {}) {
	const res = await upload('/api/upload/common', filePath, {}, {
		name: 'file',
		...options
	});
	return normalizeUploadResult(res);
}
