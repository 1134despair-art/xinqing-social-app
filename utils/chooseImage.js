/**
 * 选择图片（相册 / 拍照），统一处理 App 端模块缺失与权限拒绝提示。
 */

function isUserCancel(err) {
	const msg = String((err && (err.errMsg || err.message)) || '').toLowerCase();
	return msg.includes('cancel') || msg.includes('取消');
}

function resolveChooseImageError(err) {
	const msg = String((err && (err.errMsg || err.message)) || '');
	const lower = msg.toLowerCase();
	if (isUserCancel(err)) return '';
	if (lower.includes('camera') && (lower.includes('module') || msg.includes('未添加'))) {
		return '当前安装包未包含相机能力，请重新打包安装后再试';
	}
	if (lower.includes('gallery') && (lower.includes('module') || msg.includes('未添加'))) {
		return '当前安装包未包含相册能力，请重新打包安装后再试';
	}
	if (lower.includes('authorize') || lower.includes('permission') || msg.includes('权限')) {
		return '请在系统设置中开启相机/相册权限后重试';
	}
	return msg || '选择图片失败，请稍后重试';
}

function openSystemSettings() {
	// #ifdef APP-PLUS
	try {
		if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
			if (uni.getSystemInfoSync().platform === 'ios') {
				plus.runtime.openURL('app-settings:');
			} else {
				const main = plus.android.runtimeMainActivity();
				const Intent = plus.android.importClass('android.content.Intent');
				const Settings = plus.android.importClass('android.provider.Settings');
				const Uri = plus.android.importClass('android.net.Uri');
				const intent = new Intent();
				intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
				intent.setData(Uri.fromParts('package', main.getPackageName(), null));
				main.startActivity(intent);
			}
			return;
		}
	} catch (e) {
		/* ignore */
	}
	// #endif
	uni.showToast({ title: '请前往系统设置开启权限', icon: 'none' });
}

function chooseWithSource(sourceType) {
	return new Promise((resolve, reject) => {
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType,
			success: (res) => {
				const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || '';
				if (!filePath) {
					reject({ message: '未获取到图片' });
					return;
				}
				resolve(filePath);
			},
			fail: (err) => {
				const tip = resolveChooseImageError(err);
				if (!tip) {
					reject({ cancelled: true, message: '' });
					return;
				}
				reject({ message: tip, raw: err });
			}
		});
	});
}

/**
 * 弹出「相册 / 拍照」后返回本地临时路径
 * @returns {Promise<string>}
 */
export function chooseAvatarImage() {
	return new Promise((resolve, reject) => {
		uni.showActionSheet({
			itemList: ['从相册选择', '拍照'],
			success: async ({ tapIndex }) => {
				const sourceType = tapIndex === 1 ? ['camera'] : ['album'];
				try {
					const filePath = await chooseWithSource(sourceType);
					resolve(filePath);
				} catch (err) {
					if (err && err.cancelled) {
						reject(err);
						return;
					}
					const tip = (err && err.message) || '选择图片失败';
					if (tip.includes('权限')) {
						uni.showModal({
							title: '无法访问相机/相册',
							content: tip,
							confirmText: '去设置',
							success: (res) => {
								if (res.confirm) openSystemSettings();
							}
						});
					} else {
						uni.showToast({ title: tip, icon: 'none' });
					}
					reject(err);
				}
			},
			fail: () => {
				reject({ cancelled: true, message: '' });
			}
		});
	});
}
