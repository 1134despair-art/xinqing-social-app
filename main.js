import { createSSRApp } from 'vue';
import App from './App.vue';
import store from './store';

function installGlobalMethods(app) {
	app.config.globalProperties.$store = store;
	app.provide('store', store);

	app.config.globalProperties.$navigateTo = (url) => {
		if (!url) return;
		uni.navigateTo({ url });
	};

	app.config.globalProperties.$showToast = (title, icon = 'none') => {
		uni.showToast({ title, icon });
	};

	app.config.globalProperties.$showModal = (title, content) => {
		return new Promise((resolve, reject) => {
			uni.showModal({
				title,
				content,
				success: resolve,
				fail: reject
			});
		});
	};
}

export function createApp() {
	const app = createSSRApp(App);
	store.init();
	installGlobalMethods(app);
	return {
		app
	};
}
