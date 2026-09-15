/**
 * 用户相关 API（C端接口文档）
 */
import { get, put, upload } from '@/utils/request';
import { uploadAvatarFile } from '@/api/upload';
import {
	mapUpdateProfilePayload,
	normalizeDataResult,
	normalizeUser
} from '@/utils/apiAdapter';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * 获取当前用户资料
 * GET /api/user/profile
 */
export async function getUserProfile(options = {}) {
	const res = await get('/api/user/profile', {}, options);
	return normalizeDataResult(res, normalizeUser);
}

/**
 * 更新用户资料
 * PUT /api/user/profile
 */
export async function updateProfile(data, options = {}) {
	const res = await put('/api/user/profile', mapUpdateProfilePayload(data), options);
	return normalizeDataResult(res, normalizeUser);
}

/**
 * 校验头像文件大小（接口限制 5MB）
 */
export function validateAvatarFile(filePath) {
	return new Promise((resolve, reject) => {
		if (!filePath) {
			reject({ message: '文件路径无效' });
			return;
		}
		uni.getFileInfo({
			filePath,
			success: (info) => {
				if (info.size > AVATAR_MAX_BYTES) {
					reject({ message: '图片大小不能超过 5MB' });
					return;
				}
				resolve(info);
			},
			fail: () => resolve({})
		});
	});
}

/**
 * 解析上传头像响应（data.avatarUrl / data.url）
 */
export function parseUploadAvatarUrl(res) {
	const raw = res && res.data != null ? res.data : {};
	if (typeof raw === 'string') {
		return raw.trim();
	}
	if (raw && typeof raw === 'object') {
		return String(raw.avatarUrl || raw.url || raw.avatar || '').trim();
	}
	return '';
}

/**
 * 上传并绑定头像
 * POST /api/user/avatar（multipart/form-data，字段名 file）
 */
export async function uploadAvatar(filePath, options = {}) {
	const res = await upload('/api/user/avatar', filePath, {}, {
		name: 'file',
		...options
	});
	return {
		...res,
		data: parseUploadAvatarUrl(res)
	};
}

/**
 * 更换头像（完整流程）
 * 1. POST /api/user/avatar 上传并绑定
 * 2. 若响应未返回 URL，拉取最新资料
 * 3. 仍无 URL 时，走 POST /api/upload/avatar + PUT /api/user/profile 绑定
 */
export async function changeAvatar(filePath, options = {}) {
	await validateAvatarFile(filePath);

	const uploadRes = await uploadAvatar(filePath, options);
	let avatarUrl = uploadRes.data || '';

	if (!avatarUrl) {
		try {
			const profileRes = await getUserProfile({
				loading: false,
				silent: true,
				...options
			});
			avatarUrl = (profileRes.data && profileRes.data.avatar) || '';
		} catch (e) {
			/* 资料拉取失败时继续尝试备用流程 */
		}
	}

	if (!avatarUrl) {
		const fileRes = await uploadAvatarFile(filePath, {
			loading: false,
			silent: true,
			...options
		});
		if (fileRes.url) {
			const profileRes = await updateProfile(
				{ avatar: fileRes.url },
				{ loading: false, silent: true, ...options }
			);
			avatarUrl = (profileRes.data && profileRes.data.avatar) || fileRes.url;
		}
	}

	return avatarUrl;
}
