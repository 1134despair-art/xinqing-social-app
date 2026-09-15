/**
 * Vite 5 在部分路径使用 `import crypto from 'node:crypto'` 后调用 `crypto.getRandomValues`。
 * 该别名自 Node 17.4 起才有；Node 16 需使用 `crypto.webcrypto.getRandomValues`。
 * 安装依赖后打补丁，便于在 Node 16 上构建（仍建议升级到 Node 18 LTS 及以上）。
 */
const fs = require('fs')
const path = require('path')

const chunksDir = path.join(__dirname, '..', 'node_modules', 'vite', 'dist', 'node', 'chunks')
if (!fs.existsSync(chunksDir)) {
  process.exit(0)
}

const needle = 'crypto$2.getRandomValues'
const replacement = 'crypto$2.webcrypto.getRandomValues'

for (const name of fs.readdirSync(chunksDir)) {
  if (!name.endsWith('.js')) continue
  const fp = path.join(chunksDir, name)
  const src = fs.readFileSync(fp, 'utf8')
  if (!src.includes(needle)) continue
  fs.writeFileSync(fp, src.split(needle).join(replacement))
  console.log('[patch-vite-node16-crypto] patched vite chunk:', name)
}
