/*
 * @Author: zhanglimin
 * @Date: 2026-04-01 02:09:00
 * @LastEditors: zhanglimin
 * @LastEditTime: 2026-06-17 10:44:48
 * @Description: 
 * @FilePath: /uniapp-demo/api/auth.js
 */
/**
 * 认证相关 API（C端接口文档）
 */
import { post } from '@/utils/request';
import { normalizeDataResult, normalizeUser } from '@/utils/apiAdapter';

/**
 * 发送短信验证码
 * POST /api/sms/send
 */
export function sendSmsCode(phone) {
	return post('/api/sms/send', { phone });
}

/**
 * 手机号+验证码登录
 * POST /api/login/auth
 * @returns {Promise<{ data: string, token: string, userProfile: object }>}
 */
export async function login(phone, code, inviteCode) {
	const payload = { phone, code };
	if (inviteCode) payload.inviteCode = inviteCode;

	const res = await post('/api/login/auth', payload);
	const loginData = res.data || {};
	const token = loginData.token || '';

	return {
		...res,
		data: token,
		token,
		userProfile: normalizeUser(loginData.userProfile || {})
	};
}

/**
 * 换绑手机号
 * POST /api/auth/rebind-phone
 */
export function changePhone(phone, code, inviteCode) {
	const payload = { newPhone: phone, code };
	if (inviteCode) payload.inviteCode = inviteCode;
	return post('/api/auth/rebind-phone', payload);
}

/**
 * 退出登录
 * POST /api/auth/logout
 */
export function logout() {
	return post('/api/auth/logout');
}
