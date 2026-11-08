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
  // 문제 글에서 도형·식·자료를 읽어 그림을 붙인다(js/figs.js). 그림이 이미 있으면 그대로
  const withFig = id => q => { if (typeof q.q !== 'string' || /<svg|<img|<canvas/.test(q.q)) return q; const f = LPfig.math(id, q.q); return f ? { ...q, q: `<div class="qfig">${f}</div>` + q.q } : q; };
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
          const bank = (t.quiz || []).map(q => ({ lv: 3, ...q })).concat(mathRaw.bank[t.id] || []).map(withFig(t.id));
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
  // 개념 설명 그림: 단원 자료의 figId(fig2Id) → 그림. 없으면 설명 글에 맞는 그림(rules), 그래도 없으면 첫 칸에 단원 그림
  function sciSectionFigs(sections, SF, unitId) {
    const used = new Set(), raw = (k, cap) => ({ type: 'raw', html: SF.draw[k](), cap: cap || '' });
    sections.forEach((sec, i) => {
      if (sec.figId && SF.draw[sec.figId]) { sections[i] = { ...sec, fig: raw(sec.figId, sec.figCap) }; used.add(sec.figId); }
      if (sec.fig2Id && SF.draw[sec.fig2Id]) { sections[i] = { ...sections[i], fig2: raw(sec.fig2Id, sec.fig2Cap) }; used.add(sec.fig2Id); }
    });
    sections.forEach((sec, i) => {
      if (sec.fig) return;
      const t = LPfig.plain((sec.h || '') + ' ' + [].concat(sec.p || []).join(' ')), hit = (SF.rules || []).find(([re, k]) => re.test(t) && !used.has(k) && SF.draw[k]);
      const k = hit ? hit[1] : i === 0 && unitId && !used.has(unitId) && SF.draw[unitId] ? unitId : null;
      if (k) { sections[i] = { ...sec, fig: raw(k) }; used.add(k); }
    });
  }
  LP.subject({
    id: 'science', name: '과학', emoji: '🔬', color: '#0b9e6f', mascot: '⚛', desc: '초등~고3 · 개념 설명과 실험·그림 문제',
    files: ['questions', 'images', 'figs', 'content-e1', 'content-e2', 'content-m12', 'content-m3', 'content-h1', 'content-h2', 'content-h3'].map(f => `data/science/${f}.js`),
    before() { window.SCI = { add: (g, u, d) => { sciContent[g + '|' + u] = d; } }; },
    build() {
      const Q = typeof QUESTIONS !== 'undefined' ? QUESTIONS : [], GEN = typeof GENERATORS !== 'undefined' ? GENERATORS : {}, IMG = typeof IMAGES !== 'undefined' ? IMAGES : {};
      const fig = k => (IMG[k] ? `<div class="qfig">${IMG[k]()}</div>` : '');
      // 그림이 없는 문제에는 단원 그림(또는 낱말에 맞는 그림)을 붙인다(data/science/figs.js)
      const SF = window.SCI_FIGS || { units: {}, rules: [], draw: {} };
      const sciFig = (gid, u) => q => {
        if (/<svg|<img/.test(q.q)) return q;
        const t = LPfig.plain(q.q), hit = (SF.rules || []).find(([re]) => re.test(t)), k = (hit && hit[1]) || SF.units[gid + '|' + u], d = k && SF.draw[k];
        return d ? { ...q, q: `<div class="qfig">${d()}</div>` + q.q } : q;
      };
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
          bank.forEach((q, j) => (bank[j] = sciFig(id, u)(q)));
          const sections = (c.sections || []).slice();
          const pics = [...new Set(old.filter(q => q.img && IMG[q.img]).map(q => q.img))];
          if (pics.length && sections.length && !sections[sections.length - 1].figId) sections[sections.length - 1] = { ...sections[sections.length - 1], fig: { type: 'raw', html: IMG[pics[0]](), cap: '그림으로 확인해 보세요' } };
          sciSectionFigs(sections, SF, SF.units[id + '|' + u]);
          if (!sections.length) sections.push({ h: '핵심 정리', p: '<ul class="facts">' + old.map(q => `<li>${esc(q.ex)}</li>`).join('') + '</ul>' });
          LP.addTopic('science', id, { key: `science/${id}-${i + 1}`, title: u, sub: c.sub || `${short} 과학`, kw: c.kw || [u], sections, bank });
        });
      }
    },
    defaultLevel: (band, n) => (band === '초' ? 'e' : band === '중' ? 'm' + n : band === '고' ? 'h' + n : 'h1'),
  });

  /* ═════════ 🏯 역사 ═════════ */
  const HIS_KW = { jumeok: '주먹도끼', bitsal: '빗살무늬', goindol: '고인돌', bipa: '비파형 ?동검', bandal: '반달 ?돌칼', garak: '가락바퀴', bangudae: '반구대', sehyeong: '세형 ?동검', mumun: '민무늬 ?토기', myeongdo: '명도전',
    cheomseong: '첨성대', geumgwan: '신라 ?금관|금관총', gwanggaeto: '광개토 ?대왕릉?비|광개토대왕비', hyangno: '금동 ?대향로', bangasayu: '반가사유상', muryeong: '무령왕릉', jeongnimsa: '정림사', mireuksa: '미륵사', suryeop: '수렵도|무용총', cheonmado: '천마도|천마총',
    hou: '호우명|호우총', bunhwang: '분황사', sunsubi: '순수비', gaya: '판갑옷|철제 갑옷', gangseo: '사신도|강서대묘', seokgatap: '석가탑|불국사 3층 석탑', sinjong: '성덕 ?대왕 ?신종|에밀레종', cheongja: '상감 ?청자|상감법', daejanggyeong: '팔만대장경|재조대장경', janggyeong: '장경판전',
    dabotap: '다보탑', seokguram: '석굴암', gameunsa: '감은사', balhae: '발해 ?석등', cheolgam: '철감선사', dharani: '무구정광', hyangno2: '청자 ?투각|칠보무늬', jikji: '직지', muryangsu: '무량수전|부석사', woljeongsa: '월정사',
    gyeongcheonsa: '경천사', eunjin: '은진미륵|관촉사', suwol: '수월관음도', cheugugi: '측우기', angbu: '앙부일구', hunmin: '훈민정음', geobukseon: '거북선', jagyeongnu: '자격루', honcheonui: '혼천의', geunjeongjeon: '근정전',
    jongmyo: '종묘', mongyu: '몽유도원도', buncheong: '분청사기', honil: '혼일강리', cheonsang: '천상열차분야지도', sillok: '조선왕조실록|실록', sungnyemun: '숭례문', dosan: '도산 ?서원', geojunggi: '거중기', dalhangari: '달항아리',
    sangpyeong: '상평통보', hwaseong: '수원 ?화성|화성을? (?:쌓|축조|건설)', seodang: '김홍도', ssireum: '씨름', dano: '단오풍정|신윤복', inwang: '인왕제색도|진경 ?산수화', sehando: '세한도|김정희', daedong: '대동여지도|김정호', cheonghwa: '청화 ?백자', donguibogam: '동의보감|허준',
    banchado: '반차도', dongnipmun: '독립문', train: '경인선', jeoncha: '전차 개통|전차가 개통', heungseon: '흥선 ?대원군', cheokhwabi: '척화비', ujeong: '우정총국|갑신정변', seokjojeon: '석조전', hwanggungu: '환구단|원구단', dongnipsinmun: '독립신문',
    anjunggeun: '안중근', myeongdong: '명동 ?성당', daehanmaeil: '대한매일신보', seoneonseo: '독립 ?선언서|기미 ?독립', tupyo: '5[·.] ?10 ?총선거', yugwansun: '유관순', imsijeongbu: '임시 ?정부', yunbonggil: '윤봉길', gwangbokgun: '광복군', seodaemun: '서대문 ?형무소',
    jeongbusurip: '대한민국 정부 수립|정부 수립', incheon: '인천 ?상륙', panmunjom: '정전 ?협정|휴전 ?협정', heungnam: '흥남 ?철수', olympic: '서울 ?올림픽', gyeongbu: '경부 ?고속', gimgu: '김구', taegeukgi: '태극기', poster: '물산 ?장려', export: '수출 ?(?:100억|주도|드라이브)' };
  const HIS_COLORS = { elem: '#c2410c', mid: '#2f6f4f', high: '#1e40af', gong: '#6b21a8' };
  const HIS_NAMES = { elem: ['초등', '초등 한국사'], mid: ['중등', '중학교 역사'], high: ['고등', '고등학교 한국사'], gong: ['공무원', '공무원·한국사능력검정'] };
  LP.subject({
    id: 'history', name: '역사', emoji: '🏯', color: '#7b3fb8', mascot: '史', desc: '선사~현대 · 시대별 개념과 사료 문제',
    files: ['data-elem', 'data-mid', 'data-high', 'data-gong', 'images', 'photos', 'notes'].map(f => `data/history/${f}.js`),
    build() {
      const DATA = window.HISTORY_DATA || {}, IM = window.HISTORY_IMAGES || {}, PH = window.HISTORY_PHOTOS || {};
      const pic = id => {
        if (PH[id]) { const p = PH[id]; return { html: `<img src="data/history/${p.src}" alt="${esc(p.alt)}" loading="lazy">`, credit: `사진: ${esc(p.author)} · ${esc(p.license)} (위키미디어 공용)` }; }
        if (IM[id]) { const v = IM[id]; return { html: typeof v === 'string' ? v : v.svg || '', credit: '' }; }
        return null;
      };
      const ORD = ['㉠', '㉡', '㉢', '㉣'];
      // 사진이 없는 문제: 문제 글·해설·정답에 나오는 유물·인물·사건 이름으로 사진(그림)을 찾아 붙인다.
      // 오답 보기에만 나오는 이름은 보지 않는다(엉뚱한 보기의 사진이 나오지 않게)
      const KW = Object.entries(HIS_KW).filter(([id]) => PH[id] || IM[id]).map(([id, re]) => [id, new RegExp(re)]);
      const autoPic = (q, right) => {
        for (const t of [q.q, q.source || '', right, q.explain || '']) {
          let best = null;
          for (const [id, re] of KW) { const m = re.exec(t); if (m && (!best || m.index < best[1])) best = [id, m.index]; }
          if (best) return best[0];
        }
        return null;
      };
      for (const lv of ['elem', 'mid', 'high', 'gong']) {
        const C = DATA[lv]; if (!C) continue;
        LP.addGrade('history', { id: lv, short: HIS_NAMES[lv][0], name: HIS_NAMES[lv][1], color: HIS_COLORS[lv], desc: C.sub || C.label });
        for (const ch of C.chapters) {
          const key = `history/${lv}/${ch.id}`;
          const bank = ch.questions.map((q, i) => {
            const right = q.type === 'ox' || q.type === 'order' ? '' : (q.options || [])[q.answer] || '';
            const p = pic(q.img || autoPic(q, String(right))), head = (p ? `<div class="qfig">${p.html}</div>` : '') + (q.source ? `<blockquote class="src">${q.source}</blockquote>` : '');
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
          // 연표·정리표(data/history/notes.js)와, 이 단원 문제에 나오는 유물·인물 사진 모음
          const note = (window.HISTORY_NOTES || {})[`${lv}/${ch.id}`];
          if (note && note.timeline && note.timeline.length) sections.splice(1, 0, { h: '연표로 보기', html: LPfig.timeline(note.timeline) });
          if (note) (note.tables || []).forEach(tb => sections.push({ h: tb.h, table: { head: tb.head.map(esc), rows: tb.rows.map(r => r.map(esc)), cap: tb.cap ? esc(tb.cap) : '' } }));
          const more = uniq(ch.questions.map(q => (q.img && PH[q.img] ? q.img : autoPic(q, ''))).filter(id => id && PH[id] && !photos.includes(id))).slice(0, 6);
          if (more.length) sections.push({ h: '사진으로 보는 문화유산과 인물', html: `<div class="pics">${more.map(id => `<figure><img src="data/history/${PH[id].src}" alt="${esc(PH[id].alt)}" loading="lazy"><figcaption>${esc(PH[id].topic || '')}<br><small>${esc(PH[id].author)} · ${esc(PH[id].license)}</small></figcaption></figure>`).join('')}</div>` });
          LP.addTopic('history', lv, { key, title: ch.title, sub: `${ch.period || ''} · ${HIS_NAMES[lv][0]}`, kw: [ch.title], sections, bank });
        }
      }
    },
    defaultLevel: band => ({ 초: 'elem', 중: 'mid', 고: 'high' }[band] || 'gong'),
  });

  /* ═════════ 📘 영어(입시) ═════════ */
  // 회화와 별개로 내신·모의고사·수능 대비: 문법(어법)·어휘·독해 유형. 단원 자료는 data/english/content-*.js (작성 기준 GUIDE.md)
  const ENG_GRADES = [['m1', '중1', '중학교 1학년 영어', '#1c9bd6', '기초 문법과 짧은 글 읽기'], ['m2', '중2', '중학교 2학년 영어', '#8e5bd8', '준동사·완료·비교와 내용 일치'],
    ['m3', '중3', '중학교 3학년 영어', '#e07a12', '관계사·분사·가정법과 요지·빈칸'], ['h1', '고1', '고등학교 1학년 영어', '#d9480f', '모의고사 대비: 어법·어휘·유형 독해'],
    ['h2', '고2', '고등학교 2학년 영어', '#2b6cb0', '특수 구문과 추론형 독해'], ['h3', '고3', '고3 · 수능 영어', '#7048c8', '수능 유형별 실전']];
  // 영어 자료 파일은 ENG.add(문법·독해 단원), ENG.vocab(단어 단원)을 부른다. 두 과목이 동시에 불러와도 섞이지 않게 한 번만 정한다
  const engContent = [], engVocab = [];
  window.ENG = { add: (g, u, d) => engContent.push([g, u, d]), vocab: (g, u, d) => engVocab.push([g, u, d]) };
  LP.subject({
    id: 'english', name: '영어', emoji: '📘', color: '#1d4ed8', mascot: 'A+', desc: '중1~고3 · 문법·어휘·독해 유형(내신·수능)',
    files: ['content-m12', 'content-m3h1', 'content-h2', 'content-h3'].map(f => `data/english/${f}.js`),
    build() {
      for (const [id, short, name, color, desc] of ENG_GRADES) {
        LP.addGrade('english', { id, short, name, color, desc });
        engContent.filter(c => c[0] === id).forEach(([, u, d], i) => {
          // 예문(ex)은 🔊 듣기 버튼이 붙은 목록으로
          const sections = d.sections.map(sec => (sec.ex ? { ...sec, html: (sec.html || '') + `<div class="phr">${sec.ex.map(([en, ko]) => `<div class="pr">${say(en, 'en')}<div><b>${esc(en)}</b><span>${esc(ko)}</span></div></div>`).join('')}</div>` } : sec));
          LP.addTopic('english', id, { key: `english/${id}-${i + 1}`, title: u, sub: d.sub, kw: d.kw, sections, bank: d.bank.map(q => ({ ...q })) });
        });
      }
    },
    // 다음 학년의 같은 순서 단원을 선행 학습으로 추천
    adv: key => { const [g, n] = key.slice(8).split('-'), i = ENG_GRADES.findIndex(x => x[0] === g); const nx = ENG_GRADES[i + 1]; return nx ? `english/${nx[0]}-${n}` : null; },
    defaultLevel: (band, n) => (band === '초' ? 'm1' : band === '중' ? 'm' + Math.min(n, 3) : band === '고' ? 'h' + Math.min(n, 3) : 'h3'),
  });

  /* ═════════ 🖼️ 영어 단어 ═════════ */
  // 학년별 주제 단어를 그림 카드로 익힌다(data/english/vocab-*.js). 문제는 단어 자료로 자동 생성
  const WORD_GRADES = [['m1', '중1', '중1 영단어', '#1c9bd6', '학교·가족·음식·집·동물·동작'], ['m2', '중2', '중2 영단어', '#8e5bd8', '날씨·몸·감정·여행·취미·쇼핑'],
    ['m3', '중3', '중3 영단어', '#e07a12', '직업·환경·과학·사회·관계·시간'], ['h1', '고1', '고1 필수 영단어', '#d9480f', '모의고사 필수: 태도·사회·자연·경제·교육·판단'],
    ['h2', '고2', '고2 필수 영단어', '#2b6cb0', '심리·예술·법·생명·미디어·추상 명사'], ['h3', '고3', '수능 영단어', '#7048c8', '수능 핵심 동사·명사·형용사·다의어·혼동어·숙어']];
  LP.subject({
    id: 'words', name: '영어 단어', emoji: '🖼️', color: '#0f9d8a', mascot: 'ABC', desc: '중1~고3 · 그림으로 익히는 학년별 영단어',
    files: ['vocab-m12', 'vocab-m3h1', 'vocab-h23'].map(f => `data/english/${f}.js`),
    build() {
      for (const [id, short, name, color, desc] of WORD_GRADES) {
        LP.addGrade('words', { id, short, name, color, desc });
        engVocab.filter(c => c[0] === id).forEach(([, u, d], i) => {
          const key = `words/${id}-${i + 1}`, title = u.replace(/^단어:\s*/, '');
          LP.addTopic('words', id, { key, title, sub: `${d.sub} · ${d.words.length}단어`, kw: d.kw, sections: vocabSections(title, d.words), bank: vocabBank(key, d.words) });
        });
      }
    },
    adv: key => { const [g, n] = key.slice(6).split('-'), i = WORD_GRADES.findIndex(x => x[0] === g); const nx = WORD_GRADES[i + 1]; return nx ? `words/${nx[0]}-${n}` : null; },
    defaultLevel: (band, n) => (band === '초' ? 'm1' : band === '중' ? 'm' + Math.min(n, 3) : band === '고' ? 'h' + Math.min(n, 3) : 'h3'),
  });

  const POS = { n: '명사', v: '동사', adj: '형용사', adv: '부사', prep: '전치사', conj: '접속사', phr: '숙어' };
  const vcard = x => `<div class="vcard"><div class="vem">${x.em || '🔤'}</div><div class="vw">${say(x.w, 'en')}<b>${esc(x.w)}</b><small>${POS[x.pos] || esc(x.pos)}</small></div><div class="vko">${esc(x.ko)}</div>`
    + `<div class="vex">${esc(x.ex[0])}<small>${esc(x.ex[1])}</small></div>${x.syn || x.ant ? `<div class="vsa">${x.syn ? `<span>≈ ${esc(x.syn)}</span>` : ''}${x.ant ? `<span>↔ ${esc(x.ant)}</span>` : ''}</div>` : ''}</div>`;
  function vocabSections(u, words) {
    const name = u, per = Math.ceil(words.length / 3), out = [];
    for (let k = 0; k * per < words.length; k++) {
      const part = words.slice(k * per, (k + 1) * per);
      out.push({ h: `${name} ${'①②③④'[k]} (${k * per + 1}~${k * per + part.length})`, p: k === 0 ? '그림을 먼저 보고 뜻을 떠올린 뒤, 🔊를 눌러 발음을 듣고 예문을 소리 내어 읽어 보세요.' : '그림 → 단어 → 뜻 → 예문 순서로 익혀요.',
        html: `<div class="vbar"><button class="btn small vhide-toggle" type="button"></button><span class="hint">가리기를 켜면 그림만 보여요. 카드를 눌러 정답을 확인해요.</span></div><div class="vcards">${part.map(vcard).join('')}</div>` });
    }
    out.push({ h: '한눈에 정리', p: '모르는 단어는 위로 돌아가 카드를 한 번 더 보고 문제로 넘어가요.', table: { head: ['그림', '단어', '뜻'], rows: words.map(x => [`<span class="vtem">${x.em || ''}</span>`, `<b>${esc(x.w)}</b> <small>${POS[x.pos] || ''}</small>`, esc(x.ko)]) } });
    return out;
  }
  // 단어마다 5가지 문제: 그림→단어(그림 없으면 단어→뜻) · 뜻→단어 · 예문 빈칸 · 듣고 뜻 · 영영 풀이
  function vocabBank(key, words) {
    const bank = [];
    const others = (x, f, seed, pool = words) => { const r = seeded(seed), cand = pool.filter(y => y !== x && f(y) && f(y) !== f(x)); const out = []; while (out.length < 3 && cand.length) { const v = f(cand.splice(Math.floor(r() * cand.length), 1)[0]); if (!out.includes(v)) out.push(v); } return out; };
    const ask = (lv, q, right, wrong, why, seed) => { if (wrong.length < 3) return; const m = mix([right, ...wrong], 0, seed); bank.push({ lv, q, o: m.o.map(esc), a: m.a, why }); };
    words.forEach((x, i) => {
      const seed = key + i, why = `<b>${esc(x.w)}</b> (${POS[x.pos] || x.pos}) ${esc(x.ko)}<br>${esc(x.ex[0])} — ${esc(x.ex[1])}`;
      if (x.em) ask(1, `그림이 나타내는 단어는?<div class="vpic">${x.em}</div>`, x.w, others(x, y => y.w, seed + 'a', words.filter(y => y.em)), why, seed + 'a1');
      else ask(1, `다음 단어의 뜻은?<div class="big">${say(x.w, 'en')} ${esc(x.w)}</div>`, x.ko, others(x, y => y.ko, seed + 'a'), why, seed + 'a1');
      ask(2, `‘${esc(x.ko)}’에 알맞은 영어 단어는?`, x.w, others(x, y => y.w, seed + 'b'), why, seed + 'b1');
      const re = new RegExp('(^|[^A-Za-z])(' + x.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Za-z])', 'i');
      if (re.test(x.ex[0])) ask(3, `빈칸에 알맞은 단어는?<div class="big">${esc(x.ex[0].replace(re, '$1＿＿＿'))}</div><small>(${esc(x.ex[1])})</small>`, x.w, others(x, y => y.w, seed + 'c', words.filter(y => y.pos === x.pos).length > 4 ? words.filter(y => y.pos === x.pos) : words), why, seed + 'c1');
      ask(4, `🔊를 눌러 잘 듣고, 들은 단어의 뜻을 고르세요.<div class="big">${say(x.w, 'en')} <span class="muted">듣기</span></div>`, x.ko, others(x, y => y.ko, seed + 'd'), why, seed + 'd1');
      ask(5, `다음 영영 풀이에 알맞은 단어는?<div class="passage">${esc(x.def)}</div>`, x.w, others(x, y => y.w, seed + 'e'), why, seed + 'e1');
    });
    return bank;
  }

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
      { h: '이런 상황이에요', html: LPfig.talkScene(s, lc), p: `${esc(s.situation)}<br><br><b>장소</b> ${esc(s.place)}<br><b>상대(AI)</b> ${esc(lc.ai)}<br><b>나</b> ${esc(s.user)}`,
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
    const scene = LPfig.talkScene(s, lc); // 어떤 상황의 대화인지 그림 카드로
    return bank.map(q => ({ ...q, q: scene + q.q }));
  }
  window.LPutil = { esc, shuffle };
})();
