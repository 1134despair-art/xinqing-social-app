/** tabBar 页面路径顺序，与 pages.json tabBar.list 一致 */
export const TAB_ROUTES = [
	'pages/index/index',
	'pages/space/space',
	'pages/publish/publish',
	'pages/match/match',
	'pages/profile/profile'
];

/** 隐藏原生 tabBar，改用 AppTabBar 组件（全端通用） */
export function hideNativeTabBar() {
	try {
		uni.hideTabBar({
			animation: false,
			fail: () => {}
		});
	} catch (e) {
		/* ignore */
	}
}

/** tab 页 onShow / onReady 时调用 */
export function initCustomTabBar() {
	hideNativeTabBar();
}

/** @deprecated 保留兼容，请用 initCustomTabBar */
export function syncTabBarSelected(pageInstance) {
	initCustomTabBar();
	if (typeof pageInstance?.getTabBar !== 'function') return;
	const tabBar = pageInstance.getTabBar();
	if (tabBar && typeof tabBar.setSelected === 'function') {
		const pages = getCurrentPages();
		if (!pages.length) return;
		const route = pages[pages.length - 1].route || '';
		const index = TAB_ROUTES.indexOf(route);
		if (index >= 0) tabBar.setSelected(index);
	}
}
