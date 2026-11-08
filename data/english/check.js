// 영어 콘텐츠 파일 검사: node check.js <파일...>   (기준: GUIDE.md)
const fs = require('fs');
let bad = 0;
for (const f of process.argv.slice(2)) {
  const units = [], vocab = [];
  global.ENG = { add: (g, u, d) => units.push({ g, u, d }), vocab: (g, u, d) => vocab.push({ g, u, d }) };
  try { new Function('ENG', fs.readFileSync(f, 'utf8'))(global.ENG); } catch (e) { console.log(f, '문법 오류:', e.message); bad++; continue; }
  const err = m => { console.log(f, m); bad++; };
  // 단어 단원
  const seen = {};
  for (const { g, u, d } of vocab) {
    const w = `[${g} ${u}]`, ems = {};
    if (!d.sub || !Array.isArray(d.kw) || !Array.isArray(d.words)) { err(w + ' sub/kw/words 누락'); continue; }
    if (d.words.length !== 24) err(w + ` 단어 ${d.words.length}개 (24개)`);
    d.words.forEach((x, i) => {
      const t = `${w} ${i + 1}.${x.w}`;
      if (!x.w || !x.pos || !x.ko || !x.def || !Array.isArray(x.ex) || x.ex.length !== 2) return err(t + ': w/pos/ko/def/ex 누락');
      const key = g + '|' + x.w.toLowerCase(); if (seen[key]) err(t + `: 같은 학년에 중복 (${seen[key]})`); seen[key] = u;
      const re = new RegExp('(^|[^a-z])' + x.w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z])', 'gi');
      const n = (x.ex[0].match(re) || []).length; if (n !== 1) err(t + `: 예문에 단어 원형이 ${n}번 (정확히 1번)`);
      if (new RegExp('(^|[^a-z])' + x.w.toLowerCase() + '(?![a-z])', 'i').test(x.def)) err(t + ': 영영 풀이에 단어 자체가 들어감');
      if (x.em) { if (ems[x.em]) err(t + `: 그림 ${x.em} 중복 (${ems[x.em]})`); ems[x.em] = x.w; }
    });
  }
  if (vocab.length) {
    const all = vocab.flatMap(v => v.d.words || []), withEm = all.filter(x => x.em).length;
    console.log(f, `단어 단원 ${vocab.length}개, 단어 ${all.length}개, 그림 ${withEm}개(${Math.round((100 * withEm) / (all.length || 1))}%)`);
  }
  const pos = [0, 0, 0, 0];
  for (const { g, u, d } of units) {
    const w = `[${g} ${u}]`;
    if (!d.sub || !Array.isArray(d.kw) || !Array.isArray(d.sections)) { err(w + ' sub/kw/sections 누락'); continue; }
    if (d.sections.length < 3 || d.sections.length > 4) err(w + ` 개념 ${d.sections.length}개 (3~4개)`);
    d.sections.forEach((s, i) => {
      if (!s.h || !s.p) err(w + ` 개념 ${i + 1}: h/p 누락`);
      if (s.table && (!Array.isArray(s.table.head) || s.table.rows.some(r => r.length !== s.table.head.length))) err(w + ` 개념 ${i + 1}: 표 칸 수가 head와 다름`);
      if (s.ex && (!Array.isArray(s.ex) || s.ex.some(e => !Array.isArray(e) || e.length !== 2))) err(w + ` 개념 ${i + 1}: ex는 [영어, 뜻] 쌍의 배열`);
    });
    if (!d.sections.some(s => s.table)) err(w + ' 표가 하나도 없음 (단원마다 1개 이상)');
    if (!Array.isArray(d.bank) || d.bank.length !== 15) err(w + ` 문제 ${d.bank ? d.bank.length : 0}개 (15개)`);
    const lv = [0, 0, 0, 0, 0, 0];
    (d.bank || []).forEach((q, i) => {
      lv[q.lv]++;
      if (!(q.lv >= 1 && q.lv <= 5)) err(w + ` 문제 ${i + 1}: lv`);
      if (!q.q || !Array.isArray(q.o) || q.o.length !== 4) err(w + ` 문제 ${i + 1}: 보기 4개 아님`);
      else if (new Set(q.o).size !== 4) err(w + ` 문제 ${i + 1}: 보기 중복`);
      if (!(q.a >= 0 && q.a <= 3)) err(w + ` 문제 ${i + 1}: 정답 범위`); else pos[q.a]++;
      if (!q.why) err(w + ` 문제 ${i + 1}: 해설 없음`);
      if (/<div class="passage">/.test(q.q) && !/<\/div>/.test(q.q)) err(w + ` 문제 ${i + 1}: passage div가 닫히지 않음`);
    });
    if (lv.slice(1).some(n => n !== 3)) err(w + ` 난이도 분포 ${lv.slice(1).join('/')} (각 3개)`);
  }
  const tot = pos.reduce((a, b) => a + b, 0);
  if (tot && Math.max(...pos) > tot * 0.4) err(`정답 위치가 한쪽에 몰림 ${pos.join('/')}`);
  console.log(f, `단원 ${units.length}개`, units.map(x => x.u).join(', '));
}
console.log(bad ? `오류 ${bad}건` : 'OK');
process.exit(bad ? 1 : 0);
