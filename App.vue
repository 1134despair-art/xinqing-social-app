<script>
import store from './store';

function getCurrentPageRoute() {
	try {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		return page ? page.route : '';
	} catch (e) {
		return '';
	}
}

export default {
	onLaunch() {
		this.syncLoginStateFromStorage();
	},
	onShow() {
		this.scheduleAuthRedirect();
	},
	onHide() {
		// 切后台 / 退出应用不清理登录信息，下次启动用本地 token 自动恢复
		console.log('App onHide');
	},
	methods: {
		syncLoginStateFromStorage() {
			const token = uni.getStorageSync('token') || '';
			if (!token) {
				if (store.getters.getToken()) {
					store.actions.logout();
				}
				return;
			}
			if (!store.getters.getLoginStatus()) {
				store.actions.setLoginStatus(true);
			}
			if (store.getters.getToken() !== token) {
				store.actions.setToken(token);
			}
		},
		scheduleAuthRedirect() {
			const run = () => {
				this.syncLoginStateFromStorage();
				const token = uni.getStorageSync('token') || '';
				const route = getCurrentPageRoute();
				// iOS 启动时页面栈可能还是空的，此时 reLaunch/switchTab 会闪退
				if (!route) return;
				if (!token) {
					if (route !== 'pages/login/login') {
						uni.reLaunch({ url: '/pages/login/login' });
					}
					return;
				}
				if (route === 'pages/login/login') {
					uni.switchTab({ url: '/pages/index/index' });
				}
			};
			if (typeof plus !== 'undefined' && typeof plus.ready === 'function') {
				plus.ready(run);
			} else {
				setTimeout(run, 0);
			}
		}
	}
};
</script>

<style lang="scss">
/* #ifndef APP-PLUS-NVUE */
@import './styles/variables.scss';
@import './styles/responsive.scss';
@import './styles/common.scss';
@import './styles/iconfont.scss';
/* #endif */
</style>

<style>
/* 全局样式 */
page {
	background-color: #fffcfd;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
		'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
		sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #57465b;
	height: 100%;
	min-height: 100%;
}

/* #ifdef H5 */
html,
body,
#app,
uni-app {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
}

uni-page-wrapper,
uni-page-body {
	width: 100% !important;
	max-width: none !important;
	min-height: 100% !important;
	height: 100% !important;
}

.uni-app--maxwidth uni-page-wrapper {
	max-width: none !important;
}
/* #endif */
</style>
