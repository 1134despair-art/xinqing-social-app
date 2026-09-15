/**
 * 心情星球 iconfont 字符映射（与 static/iconfont/moodicon.* 一致）
 * 新增图标：在 static/icons/svg 添加 svg 后执行 npm run iconfont:build
 */
export const ICON_UNICODE = {
	'account-heart': '\uea01',
	'account-outline': '\uea02',
	'alert-circle-outline': '\uea03',
	'bookmark-outline': '\uea04',
	bookmark: '\uea05',
	'chart-box-outline': '\uea06',
	'cog-outline': '\uea07',
	'comment-outline': '\uea08',
	'compass-outline': '\uea09',
	earth: '\uea0a',
	'face-agent': '\uea0b',
	headset: '\uea0c',
	'heart-outline': '\uea0d',
	heart: '\uea0e',
	'help-circle': '\uea0f',
	home: '\uea10',
	'message-outline': '\uea11',
	microphone: '\uea12',
	pause: '\uea13',
	play: '\uea14',
	plus: '\uea15',
	'weather-night': '\uea16'
};

/** 兼容旧 MdiIcon 的 mdi 名称 */
export const MDI_ALIAS = {
	heart: 'heart',
	'heart-outline': 'heart-outline',
	'comment-outline': 'comment-outline',
	'chart-box-outline': 'chart-box-outline',
	'account-heart': 'account-heart',
	'account-outline': 'account-outline',
	play: 'play',
	pause: 'pause',
	microphone: 'microphone',
	'alert-circle-outline': 'alert-circle-outline',
	bookmark: 'bookmark',
	'bookmark-outline': 'bookmark-outline',
	home: 'home',
	earth: 'earth',
	plus: 'plus',
	headset: 'headset',
	'message-outline': 'message-outline',
	'weather-night': 'weather-night',
	'compass-outline': 'compass-outline',
	'face-agent': 'face-agent',
	'help-circle': 'help-circle',
	'cog-outline': 'cog-outline'
};

export function getIconUnicode(name) {
	const key = MDI_ALIAS[name] || name;
	return ICON_UNICODE[key] || '';
}
