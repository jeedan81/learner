// 오프라인용 파일 목록(precache.js)을 만든다. 파일을 고친 뒤 꼭 실행: node tools/build-sw.js
// 모든 파일 내용의 해시로 버전을 정하므로, 바뀐 게 있으면 설치된 기기에서 새 버전을 통째로 다시 받는다.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['tools', '.claude', '.git', 'precache.js', 'sw.js', 'README.md', 'CLAUDE.md']);
const files = [];
(function walk(dir, rel) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (!rel && SKIP.has(name)) continue;
    if (name.startsWith('.') || name.endsWith('.md') || name === 'check.js') continue;
    const p = path.join(dir, name), r = rel ? rel + '/' + name : name;
    if (fs.statSync(p).isDirectory()) walk(p, r); else files.push(r);
  }
})(ROOT, '');
const hash = crypto.createHash('sha1');
let bytes = 0;
for (const f of files) { const b = fs.readFileSync(path.join(ROOT, f)); hash.update(f).update(b); bytes += b.length; }
const version = hash.digest('hex').slice(0, 10);
const list = ['./', ...files].map(f => f.split('/').map(encodeURIComponent).join('/'));
fs.writeFileSync(path.join(ROOT, 'precache.js'),
  `// 자동 생성 파일 — 직접 고치지 말고 node tools/build-sw.js 로 다시 만든다\n` +
  `self.PRECACHE = ${JSON.stringify({ version, bytes, files: list })};\n`);
console.log(`precache.js: ${list.length}개 파일, ${(bytes / 1048576).toFixed(1)}MB, 버전 ${version}`);
