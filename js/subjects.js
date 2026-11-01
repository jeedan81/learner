/* 통합 학습기 — 네 과목을 수학 앱과 같은 형식(학년 → 단원 → 수업: 도입·개념·확인 문제·정리)으로 바꾼다.
   과목 데이터 파일은 처음 그 과목을 열 때 불러온다(LP.load). */
(function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 정답 위치를 고정해서 섞는다(같은 문제가 매번 같은 순서로 나오도록 문자열 해시로 시드)
  function seeded(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }
  function mix(o, a, seed) { const r = seeded(seed), idx = o.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return { o: idx.map(i => o[i]), a: idx.indexOf(a) }; }

  /* ═════════ ➗ 수학 ═════════ */
  const MATH_ADV = { 'e5-divisor': 'm1-prime', 'e5-fracadd': 'e6-fracdiv', 'e5-fracmul': 'e6-fracdiv', 'e5-decmul': 'e6-decdiv', 'e5-area': 'e6-circle', 'e5-symmetry': 'm1-basic-geo', 'e5-cuboid': 'e6-volume', 'e5-average': 'm1-stat', 'e5-pattern': 'm1-prop',
    'e6-fracdiv': 'm1-integer', 'e6-decdiv': 'm2-rational', 'e6-ratio': 'm1-prop', 'e6-proportion': 'm1-lineq', 'e6-circle': 'm1-polygon', 'e6-prism': 'm1-solid', 'e6-volume': 'm1-solid', 'e6-cylinder': 'm1-solid', 'e6-graph': 'm1-stat',
    'm1-prime': 'm2-rational', 'm1-integer': 'm2-exponent', 'm1-expr': 'm2-exponent', 'm1-lineq': 'm2-simul', 'm1-coord': 'm2-linfunc', 'm1-prop': 'm2-linfunc', 'm1-basic-geo': 'm2-triangle', 'm1-polygon': 'm2-quad', 'm1-solid': 'm2-similar', 'm1-stat': 'm3-stat',
    'm2-rational': 'm3-sqrt', 'm2-exponent': 'm3-factor', 'm2-ineq': 'h1-eqs', 'm2-simul': 'm3-quadeq', 'm2-linfunc': 'm3-quadfunc', 'm2-linfunc2': 'h1-line', 'm2-triangle': 'm3-trig', 'm2-quad': 'm2-similar', 'm2-similar': 'm3-trig', 'm2-pythag': 'm3-trig', 'm2-prob': 'h1-counting',
    'm3-sqrt': 'h1-complex', 'm3-factor': 'h1-poly', 'm3-quadeq': 'h1-quad', 'm3-quadfunc': 'h1-quad', 'm3-trig': 'h2-trig', 'm3-circle': 'h1-circle', 'm3-stat': 'h3-dist',
    'h1-poly': 'h2-seq', 'h1-complex': 'h1-quad', 'h1-quad': 'h2-diffapp', 'h1-eqs': 'h2-limit', 'h1-counting': 'h3-perm', 'h1-matrix': 'h3-vector', 'h1-line': 'h3-vector', 'h1-circle': 'h3-conic', 'h1-set': 'h3-prob', 'h1-func': 'h2-expfunc',
    'h2-exp': 'h2-expfunc', 'h2-expfunc': 'h3-diff2', 'h2-trig': 'h3-diff2', 'h2-seq': 'h3-series', 'h2-limit': 'h2-diff', 'h2-diff': 'h3-diff2', 'h2-diffapp': 'h3-diff2', 'h2-int': 'h3-int2' };
  const mathRaw = { grades: [], bank: {} };
  LP.subject({
    id: 'math', name: '수학', emoji: '➗', color: '#2a56d4', mascot: 'π', desc: '초5~고3 · 그림과 그래프로 이해하는 수학',
    files: ['elem', 'mid', 'high', 'bank-e5', 'bank-e6', 'bank-m1', 'bank-m2', 'bank-m3', 'bank-h1', 'bank-h2', 'bank-h3'].map(f => `data/math/${f}.js`),
    before() {
      window.fmtA = a => (a === 1 ? '' : a === -1 ? '−' : String(a).replace('-', '−'));
      window.fmtN = v => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));
      window.MD = { add: (g, ts) => mathRaw.grades.push([g, ts]), addBank: (id, qs) => (mathRaw.bank[id] = mathRaw.bank[id] || []).push(...qs) };
    },
    build() {
      for (const [g, ts] of mathRaw.grades) {
        LP.addGrade('math', { id: g.id, short: g.short, name: g.name, color: g.color, desc: g.desc });
        for (const t of ts) {
          const bank = (t.quiz || []).map(q => ({ lv: 3, ...q })).concat(mathRaw.bank[t.id] || []);
          LP.addTopic('math', g.id, { key: 'math/' + t.id, id: t.id, title: t.title, sub: t.sub, kw: t.kw, sections: t.sections, bank });
        }
      }
    },
    adv: key => { const to = MATH_ADV[key.slice(5)]; return to ? 'math/' + to : null; },
    defaultLevel: (band, n) => (band === '초' ? (n >= 6 ? 'e6' : 'e5') : band === '중' ? 'm' + n : band === '고' ? 'h' + n : 'h1'),
  });

  /* ═════════ 🔬 과학 ═════════ */
  const SCI_GRADES = [['e', '초등', '초등학교 과학', '#58a700', '자석·식물·날씨·태양계 등 초등 3~6학년 과학'], ['m1', '중1', '중학교 1학년', '#1c9bd6', '지권, 힘, 빛과 파동, 기체, 생물의 다양성'],
    ['m2', '중2', '중학교 2학년', '#8e5bd8', '물질의 구성, 전기와 자기, 광합성, 소화·호흡, 태양계'], ['m3', '중3', '중학교 3학년', '#e07a12', '화학 반응, 날씨, 자극과 반응, 유전, 운동과 에너지, 우주'],
    ['h1', '고1', '고등학교 1학년', '#d9480f', '통합과학: 물질의 규칙성, 역학, 생명·지구 시스템, 환경'], ['h2', '고2', '고등학교 2학년', '#2b6cb0', '물리학·화학: 역학, 전자기, 파동, 원자, 화학 결합'],
    ['h3', '고3', '고등학교 3학년', '#7048c8', '생명과학·지구과학: 항상성, 유전, 지구 변화, 별과 우주']];
  const sciContent = {};
  LP.subject({
    id: 'science', name: '과학', emoji: '🔬', color: '#0b9e6f', mascot: '⚛', desc: '초등~고3 · 개념 설명과 실험·그림 문제',
    files: ['questions', 'images', 'content-e1', 'content-e2', 'content-m12', 'content-m3', 'content-h1', 'content-h2', 'content-h3'].map(f => `data/science/${f}.js`),
    before() { window.SCI = { add: (g, u, d) => { sciContent[g + '|' + u] = d; } }; },
    build() {
      const Q = typeof QUESTIONS !== 'undefined' ? QUESTIONS : [], GEN = typeof GENERATORS !== 'undefined' ? GENERATORS : {}, IMG = typeof IMAGES !== 'undefined' ? IMAGES : {};
      const fig = k => (IMG[k] ? `<div class="qfig">${IMG[k]()}</div>` : '');
      for (const [id, short, name, color, desc] of SCI_GRADES) {
        LP.addGrade('science', { id, short, name, color, desc });
        const units = [...new Set(Q.filter(q => q.g === id).map(q => q.u))];
        units.forEach((u, i) => {
          const c = sciContent[id + '|' + u] || {};
          const old = Q.filter(q => q.g === id && q.u === u);
          const bank = (c.bank || []).map(q => ({ ...q }))
            .concat(old.map(q => ({ lv: q.d, q: fig(q.img) + esc(q.q), o: q.o, a: q.a, why: q.ex })));
          // 계산 문제 생성기는 난이도마다 하나씩 미리 만들어 둔다
          for (const g of GEN[id] || []) for (let lv = 1; lv <= 5; lv++) { const x = g(lv); if (x.u === u) bank.push({ lv, q: esc(x.q), o: x.o, a: x.a, why: x.ex }); }
          const sections = (c.sections || []).slice();
          const pics = [...new Set(old.filter(q => q.img && IMG[q.img]).map(q => q.img))];
          if (pics.length && sections.length) sections[sections.length - 1] = { ...sections[sections.length - 1], fig: { type: 'raw', html: IMG[pics[0]](), cap: '그림으로 확인해 보세요' } };
          if (!sections.length) sections.push({ h: '핵심 정리', p: '<ul class="facts">' + old.map(q => `<li>${esc(q.ex)}</li>`).join('') + '</ul>' });
          LP.addTopic('science', id, { key: `science/${id}-${i + 1}`, title: u, sub: c.sub || `${short} 과학`, kw: c.kw || [u], sections, bank });
        });
      }
    },
    defaultLevel: (band, n) => (band === '초' ? 'e' : band === '중' ? 'm' + n : band === '고' ? 'h' + n : 'h1'),
  });

  /* ═════════ 🏯 역사 ═════════ */
  const HIS_COLORS = { elem: '#c2410c', mid: '#2f6f4f', high: '#1e40af', gong: '#6b21a8' };
  const HIS_NAMES = { elem: ['초등', '초등 한국사'], mid: ['중등', '중학교 역사'], high: ['고등', '고등학교 한국사'], gong: ['공무원', '공무원·한국사능력검정'] };
  LP.subject({
    id: 'history', name: '역사', emoji: '🏯', color: '#7b3fb8', mascot: '史', desc: '선사~현대 · 시대별 개념과 사료 문제',
    files: ['data-elem', 'data-mid', 'data-high', 'data-gong', 'images', 'photos'].map(f => `data/history/${f}.js`),
    build() {
      const DATA = window.HISTORY_DATA || {}, IM = window.HISTORY_IMAGES || {}, PH = window.HISTORY_PHOTOS || {};
      const pic = id => {
        if (PH[id]) { const p = PH[id]; return { html: `<img src="data/history/${p.src}" alt="${esc(p.alt)}" loading="lazy">`, credit: `사진: ${esc(p.author)} · ${esc(p.license)} (위키미디어 공용)` }; }
        if (IM[id]) { const v = IM[id]; return { html: typeof v === 'string' ? v : v.svg || '', credit: '' }; }
        return null;
      };
      const ORD = ['㉠', '㉡', '㉢', '㉣'];
      for (const lv of ['elem', 'mid', 'high', 'gong']) {
        const C = DATA[lv]; if (!C) continue;
        LP.addGrade('history', { id: lv, short: HIS_NAMES[lv][0], name: HIS_NAMES[lv][1], color: HIS_COLORS[lv], desc: C.sub || C.label });
        for (const ch of C.chapters) {
          const key = `history/${lv}/${ch.id}`;
          const bank = ch.questions.map((q, i) => {
            const p = q.img && pic(q.img), head = (p ? `<div class="qfig">${p.html}</div>` : '') + (q.source ? `<blockquote class="src">${q.source}</blockquote>` : '');
            const why = (q.explain || '') + (p && p.credit ? `<br><small class="credit">${p.credit}</small>` : '');
            if (q.type === 'ox') return { lv: q.diff, q: head + q.q, o: ['O (맞다)', 'X (틀리다)'], a: q.answer ? 0 : 1, why };
            if (q.type === 'order') {
              // 순서 문제 → ㉠~㉣을 섞어 보여 주고, 올바른 순서를 고르는 4지선다로
              const lab = mix(q.items, 0, key + i).o; // 보여 줄 순서
              const right = q.items.map(it => ORD[lab.indexOf(it)]).join(' → ');
              const wrongs = new Set(); const r = seeded(key + 'w' + i);
              while (wrongs.size < 3) { const perm = q.items.map((_, k) => k).sort(() => r() - 0.5).map(k => ORD[lab.indexOf(q.items[k])]).join(' → '); if (perm !== right) wrongs.add(perm); }
              const m = mix([right, ...wrongs], 0, key + 'o' + i);
              return { lv: q.diff, q: head + q.q + `<ul class="ord">${lab.map((it, k) => `<li><b>${ORD[k]}</b> ${esc(it)}</li>`).join('')}</ul>`, o: m.o, a: m.a, why };
            }
            return { lv: q.diff, q: head + q.q, o: q.options, a: q.answer, why };
          });
          // 개념: 시대 소개 + 난이도별 해설에서 뽑은 핵심 정리 + 대표 사진
          const ex = d => ch.questions.filter(q => d.includes(q.diff) && q.explain).map(q => q.explain);
          const uniq = a => [...new Set(a)];
          const sections = [{ h: `${ch.title} 한눈에`, p: `<b>${esc(ch.period || '')}</b><br>${esc(ch.intro || '')}` }];
          const photos = uniq(ch.questions.filter(q => q.img && PH[q.img]).map(q => q.img)).slice(0, 2);
          if (photos.length) sections[0].fig = { type: 'raw', html: `<div class="pics">${photos.map(id => `<figure><img src="data/history/${PH[id].src}" alt="${esc(PH[id].alt)}" loading="lazy"><figcaption>${esc(PH[id].topic || '')}<br><small>${esc(PH[id].author)} · ${esc(PH[id].license)}</small></figcaption></figure>`).join('')}</div>` };
          [['꼭 알아야 할 인물·사건', [1, 2], 7], ['제도와 정책, 문화', [3], 7], ['깊이 보기: 원인과 결과·사료', [4, 5], 6]].forEach(([h, d, n]) => {
            const list = uniq(ex(d)).slice(0, n);
            if (list.length) sections.push({ h, p: `<ul class="facts">${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` });
          });
          LP.addTopic('history', lv, { key, title: ch.title, sub: `${ch.period || ''} · ${HIS_NAMES[lv][0]}`, kw: [ch.title], sections, bank });
        }
      }
    },
    defaultLevel: band => ({ 초: 'elem', 중: 'mid', 고: 'high' }[band] || 'gong'),
  });

  /* ═════════ 🗣️ 회화 ═════════ */
  const TALK_COLORS = { elem: '#e8590c', middle: '#d6336c', high: '#1971c2', adult: '#495057' };
  LP.subject({
    id: 'talk', name: '회화', emoji: '🗣️', color: '#e8590c', mascot: 'Hi', desc: '영어·일본어 · 핵심 표현, 듣기, AI와 말하기',
    files: ['scenarios', 'scenarios_ja', 'scenarios_middle', 'scenarios_high', 'scenarios_adult', 'scenarios_plus_elem', 'scenarios_plus_middle', 'scenarios_plus_high', 'scenarios_plus_adult',
      'scenarios_plus2_middle', 'scenarios_plus2_high', 'scenarios_plus2_adult', 'api'].map(f => `data/talk/${f}.js`),
    before() {
      // 회화 AI 모듈(api.js)이 쓰는 설정 창구
      window.Store = { getSettings: () => ({ apiKey: LP.device.apiKey, model: LP.device.model || 'gpt-4o-mini', name: (LP.user() && LP.user().profile.name) || '' }) };
    },
    build() {
      /* global STAGES, SCENARIOS, CATEGORIES, localize */
      for (const st of Object.values(STAGES)) {
        LP.addGrade('talk', { id: st.code, short: st.name, name: `${st.name} 회화`, color: TALK_COLORS[st.code], desc: st.desc,
          cats: CATEGORIES.filter(c => c.stage === st.code).map(c => ({ id: c.id, name: c.name, emoji: c.emoji })) });
      }
      const byStage = {};
      for (const s of SCENARIOS) (byStage[s.stage] = byStage[s.stage] || []).push(s);
      for (const s of SCENARIOS) {
        const t = LP.addTopic('talk', s.stage, { key: 'talk/' + s.id, title: s.title, sub: s.en, kw: [s.en, s.place], cat: s.cat, sc: s, talk: true });
        t.lang = () => (LP.user() && LP.user().profile.talkLang) || 'en';
        t.lc = () => localize(s, t.lang());
        t.sectionsFor = () => talkSections(s, t.lc());
        const cache = {};
        t.makeBank = () => cache[t.lang()] || (cache[t.lang()] = talkBank(s, t.lang(), byStage[s.stage]));
      }
    },
    defaultLevel: band => ({ 초: 'elem', 중: 'middle', 고: 'high' }[band] || 'adult'),
  });
  const say = (text, lang) => `<button class="say" data-say="${esc(text)}" data-lang="${lang}" aria-label="듣기">🔊</button>`;
  function talkSections(s, lc) {
    return [
      { h: '이런 상황이에요', p: `${esc(s.situation)}<br><br><b>장소</b> ${esc(s.place)}<br><b>상대(AI)</b> ${esc(lc.ai)}<br><b>나</b> ${esc(s.user)}`,
        table: { head: ['이 대화의 미션'], rows: s.missions.map((m, i) => [`${i + 1}. ${esc(m)}`]) } },
      { h: '핵심 표현', p: '🔊를 눌러 듣고 소리 내어 따라 해 보세요.',
        html: `<div class="phr">${lc.phrases.map(([f, ko]) => `<div class="pr">${say(f, lc.lang)}<div><b>${esc(f)}</b><span>${esc(ko)}</span></div></div>`).join('')}</div>` },
      { h: '대화는 이렇게 시작해요', p: `상대가 먼저 이렇게 말을 걸어요.`,
        html: `<div class="phr"><div class="pr">${say(lc.opener, lc.lang)}<div><b>${esc(lc.opener)}</b></div></div></div>`,
        tip: '대답할 말이 떠오르지 않으면 위의 핵심 표현을 그대로 써도 좋아요.' },
    ];
  }
  // 회화 문제 은행: 표현마다 다섯 가지 유형(뜻 고르기, 표현 고르기, 빈칸, 어순, 듣기)
  function talkBank(s, lang, peers) {
    const lc = localize(s, lang), others = peers.filter(x => x !== s).map(x => localize(x, lang).phrases).flat();
    const pool = others.length ? others : lc.phrases;
    const pick = (n, ex, f) => { const out = []; const r = seeded(s.id + lang + ex); let guard = 0; while (out.length < n && guard++ < 200) { const p = pool[Math.floor(r() * pool.length)]; const v = f(p); if (v && v !== ex && !out.includes(v)) out.push(v); } return out; };
    const words = t => (lang === 'ja' ? t.split(/\s+/).filter(Boolean) : t.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean));
    const bank = [];
    lc.phrases.forEach(([f, ko], i) => {
      const seed = s.id + lang + i;
      let m = mix([ko, ...pick(3, ko, p => p[1])], 0, seed + 'a');
      bank.push({ lv: 1, q: `다음 표현의 뜻은?<div class="big">${say(f, lang)} ${esc(f)}</div>`, o: m.o.map(esc), a: m.a, why: `「${esc(f)}」는 ‘${esc(ko)}’라는 뜻이에요.` });
      m = mix([f, ...pick(3, f, p => p[0])], 0, seed + 'b');
      bank.push({ lv: 2, q: `‘${esc(ko)}’를 ${lang === 'ja' ? '일본어' : '영어'}로 알맞게 말한 것은?`, o: m.o.map(esc), a: m.a, why: `‘${esc(ko)}’ → ${esc(f)}` });
      const w = words(f);
      if (w.length >= 3) {
        const k = w.reduce((b, x, j) => (x.length > w[b].length ? j : b), 0), ans = w[k].replace(/[.,!?。、？！]/g, '');
        const blanked = f.replace(w[k], '＿＿＿');
        const cands = [...new Set(pool.map(p => words(p[0])).flat().map(x => x.replace(/[.,!?。、？！]/g, '')).filter(x => x && x !== ans && x.length >= 2))];
        const r = seeded(seed + 'c'); const ds = []; while (ds.length < 3 && cands.length) { const x = cands.splice(Math.floor(r() * cands.length), 1)[0]; ds.push(x); }
        if (ds.length === 3) { m = mix([ans, ...ds], 0, seed + 'c2'); bank.push({ lv: 3, q: `빈칸에 알맞은 말은?<div class="big">${esc(blanked)}</div><small>(${esc(ko)})</small>`, o: m.o.map(esc), a: m.a, why: `${esc(f)} — ${esc(ko)}` }); }
        if (w.length >= 4) {
          const r2 = seeded(seed + 'd'), wrongs = new Set(), right = w.join(' ');
          let guard = 0; while (wrongs.size < 3 && guard++ < 50) { const x = w.slice(); const a = Math.floor(r2() * x.length), b = Math.floor(r2() * x.length); [x[a], x[b]] = [x[b], x[a]]; const t = x.join(' '); if (t !== right) wrongs.add(t); }
          if (wrongs.size === 3) { m = mix([right, ...wrongs], 0, seed + 'd2'); bank.push({ lv: 4, q: `‘${esc(ko)}’의 순서가 바른 문장은?`, o: m.o.map(esc), a: m.a, why: `바른 순서: ${esc(f)}` }); }
        }
      }
      m = mix([f, ...pick(3, f, p => p[0])], 0, seed + 'e');
      bank.push({ lv: 5, q: `🔊를 눌러 잘 듣고, 들은 문장을 고르세요.<div class="big">${say(f, lang)} <span class="muted">듣기</span></div>`, o: m.o.map(esc), a: m.a, why: `들려준 문장: ${esc(f)} (${esc(ko)})` });
    });
    return bank;
  }
  window.LPutil = { esc, shuffle };
})();
