/** 禁止键盘顶起页面时的通用 mixin（适用于底部固定输入栏） */
export const keyboardMixin = {
	data() {
		return {
			keyboardHeight: 0
		};
	},
	computed: {
		fixedBottomStyle() {
			return this.keyboardHeight ? { bottom: `${this.keyboardHeight}px` } : {};
		},
		keyboardLiftStyle() {
			return this.keyboardHeight ? { marginBottom: `${this.keyboardHeight}px` } : {};
		}
	},
	onShow() {
		this.bindKeyboardListener();
	},
	onHide() {
		this.unbindKeyboardListener();
	},
	onUnload() {
		this.unbindKeyboardListener();
	},
	methods: {
		onKeyboardHeightChange(e) {
			const height = Number(e?.detail?.height) || 0;
			this.keyboardHeight = height;
			if (height > 0 && typeof this.onKeyboardOpened === 'function') {
				this.onKeyboardOpened(height);
			}
		},
		onKeyboardBlur() {
			this.keyboardHeight = 0;
		},
		bindKeyboardListener() {
			if (this._keyboardBound) return;
			this._keyboardBound = true;
			this._uniKeyboardHandler = (res) => {
				const height = Number(res && res.height) || 0;
				this.onKeyboardHeightChange({ detail: { height } });
			};
			if (typeof uni.onKeyboardHeightChange === 'function') {
				uni.onKeyboardHeightChange(this._uniKeyboardHandler);
			}
		},
		unbindKeyboardListener() {
			this.keyboardHeight = 0;
			if (!this._keyboardBound) return;
			this._keyboardBound = false;
			if (this._uniKeyboardHandler && typeof uni.offKeyboardHeightChange === 'function') {
				uni.offKeyboardHeightChange(this._uniKeyboardHandler);
			}
			this._uniKeyboardHandler = null;
		}
	}
};

/** 表单页：键盘弹起后增加底部留白，并把当前输入框完整滚到键盘上方 */
export const formKeyboardMixin = {
	mixins: [keyboardMixin],
	data() {
		return {
			focusedFieldId: ''
		};
	},
	computed: {
		formKeyboardPadStyle() {
			const kb = this.keyboardHeight || 0;
			return kb ? { paddingBottom: `${kb + 24}px` } : {};
		}
	},
	onShow() {
		this.bindFormKeyboardListener();
	},
	onHide() {
		this.unbindFormKeyboardListener();
	},
	onUnload() {
		this.unbindFormKeyboardListener();
	},
	methods: {
		onFormFieldFocus(id) {
			this.focusedFieldId = id || '';
			this.$nextTick(() => this.ensureFocusedFieldVisible());
		},
		onKeyboardOpened() {
			this.ensureFocusedFieldVisible();
		},
		ensureFocusedFieldVisible() {
			const id = this.focusedFieldId;
			const kb = this.keyboardHeight || 0;
			if (!id || kb <= 0) return;
			if (this._kbScrollTimer) {
				clearTimeout(this._kbScrollTimer);
			}
			this._kbScrollTimer = setTimeout(() => {
				this.scrollFieldAboveKeyboard(id, kb);
			}, 80);
		},
		scrollFieldAboveKeyboard(id, kb) {
			const query = uni.createSelectorQuery().in(this);
			query.select(`#${id}`).boundingClientRect();
			query.selectViewport().scrollOffset();
			query.exec((res) => {
				const rect = res && res[0];
				const scroll = res && res[1];
				if (!rect) return;
				let windowHeight = 0;
				try {
					windowHeight = uni.getSystemInfoSync().windowHeight || 0;
				} catch (e) {
					return;
				}
				const gap = 16;
				const visibleBottom = windowHeight - kb - gap;
				if (rect.bottom <= visibleBottom && rect.top >= gap) return;
				const delta = rect.bottom > visibleBottom
					? rect.bottom - visibleBottom
					: rect.top - gap;
				uni.pageScrollTo({
					scrollTop: Math.max(0, ((scroll && scroll.scrollTop) || 0) + delta),
					duration: 180
				});
			});
		},
		bindFormKeyboardListener() {
			this.bindKeyboardListener();
		},
		unbindFormKeyboardListener() {
			if (this._kbScrollTimer) {
				clearTimeout(this._kbScrollTimer);
				this._kbScrollTimer = null;
			}
			this.focusedFieldId = '';
			this.unbindKeyboardListener();
		}
	}
};
