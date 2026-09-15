/**
 * 从 static/icons/svg 重新生成 iconfont 字体
 * 用法: npm run iconfont:build
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sources = path.join(root, 'static/icons/svg');
const output = path.join(root, 'static/iconfont');

execSync(
	`npx svgtofont@6.0.0 --sources "${sources}" --output "${output}" --font-name moodicon`,
	{ stdio: 'inherit', cwd: root }
);

console.log('\niconfont 已生成到 static/iconfont/');
console.log('请根据 moodicon.svg 中的 unicode 更新 utils/iconfont.js');
