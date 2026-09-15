export const DEFAULT_AVATAR = '🌱';

export function isImageAvatar(value) {
	return /^data:image\/|^https?:\/\/|^blob:|^\//.test(String(value || ''));
}

export function getDisplayAvatar(value) {
	const avatar = String(value || '').trim();
	return avatar || DEFAULT_AVATAR;
}
