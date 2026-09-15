/**
 * 时间格式化工具
 */

/**
 * 格式化相对时间
 * @param {String} dateStr 日期字符串
 * @returns {String} 相对时间描述
 */
export function formatRelativeTime(dateStr) {
	if (dateStr == null || dateStr === '') return '';
	const now = new Date();
	const date = typeof dateStr === 'number'
		? new Date(dateStr)
		: new Date(dateStr);
	if (Number.isNaN(date.getTime())) return String(dateStr);
	const diff = (now - date) / 1000;
	if (diff < 60) return '刚刚';
	if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
	if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
	if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
	if (typeof dateStr === 'string') return dateStr.substring(0, 10);
	const pad = (n) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
