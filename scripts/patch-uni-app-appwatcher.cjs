/**
 * App 端 watch：Vite 首次 BUNDLE_* 可能在 action.js 里 `watcher.on('event')` 注册之前触发，
 * AppWatcher 会调用尚未赋值的 _callback 导致崩溃。将事件入队，在 on() 时再依次派发。
 */
const fs = require('fs')
const path = require('path')

const buildJs = path.join(
  __dirname,
  '..',
  'node_modules',
  '@dcloudio',
  'vite-plugin-uni',
  'dist',
  'cli',
  'build.js'
)

if (!fs.existsSync(buildJs)) {
  process.exit(0)
}

let src = fs.readFileSync(buildJs, 'utf8')
if (src.includes('_emitOrQueue')) {
  process.exit(0)
}

const before = `    constructor() {
        this._firstStart = false;
        this._firstEnd = false;
        this._secondStart = false;
        this._secondEnd = false;
    }
    on(_event, callback) {
        this._callback = callback;
    }`

const after = `    constructor() {
        this._firstStart = false;
        this._firstEnd = false;
        this._secondStart = false;
        this._secondEnd = false;
        this._eventQueue = [];
    }
    on(_event, callback) {
        this._callback = callback;
        while (this._eventQueue.length) {
            const e = this._eventQueue.shift();
            this._callback(e);
        }
    }`

const before2 = `    _bundleStart(event) {
        if (this._firstStart && this._secondStart) {
            this._callback(event);
        }
    }
    _bundleEnd(event) {
        if (this._firstEnd && this._secondEnd) {
            this._callback(event);
        }
    }
}`

const after2 = `    _bundleStart(event) {
        if (this._firstStart && this._secondStart) {
            this._emitOrQueue(event);
        }
    }
    _bundleEnd(event) {
        if (this._firstEnd && this._secondEnd) {
            this._emitOrQueue(event);
        }
    }
    _emitOrQueue(event) {
        if (typeof this._callback === 'function') {
            this._callback(event);
        }
        else {
            this._eventQueue.push(event);
        }
    }
}`

if (!src.includes(before) || !src.includes(before2)) {
  console.warn('[patch-uni-app-appwatcher] pattern not found, skip (dcloudio version mismatch?)')
  process.exit(0)
}

src = src.replace(before, after).replace(before2, after2)
fs.writeFileSync(buildJs, src)
console.log('[patch-uni-app-appwatcher] patched:', buildJs)
