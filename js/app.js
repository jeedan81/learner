/* 통합 학습기 — 화면
   수학 앱의 수업 엔진(도입 → 개념 → 확인 문제 → 정리)을 네 과목 공통으로 쓴다. 회화는 문제 뒤에 'AI와 말하기' 단계가 붙는다.
   학습 기록은 사용자마다 하나(LP.events)이고, 기록·보고서·추천·보관함은 모두 '기록' 탭에서 본다. */
(function () {
  'use strict';
  const { esc, shuffle } = window.LPutil;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const D = LP.D, dkey = LP.dkey;
  const DOW = '일월화수목금토';
  const dayLabel = k => { const [y, m, d] = k.split('-').map(Number); return `${m}월 ${d}일(${DOW[new Date(y, m - 1, d).getDay()]})`; };
  const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
  const LV = ['', '기초', '기본', '표준', '응용', '심화'];
  const lvTag = l => `<span class="lvtag l${l}">${l} ${LV[l]}</span>`;
  const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', '성인'];
  const SUBJ = () => LP.order.map(id => LP.subjects[id]);
  const ICONS = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7M8 11h7"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  };

  /* ───────── 라우터 ───────── */
  let state = { view: 'home' }, hist = [];
  function go(view, args = {}, push = true) { if (push) hist.push(state); state = { view, ...args }; render(); window.scrollTo({ top: 0 }); }
  function back() { const s = hist.pop(); if (s) { state = s; render(); window.scrollTo({ top: 0 }); } else go('home', {}, false); }
  function render() {
    document.body.classList.toggle('wide-ok', !['topic'].includes(state.view));
    if (!LP.user()) return renderLogin();
    ({ home: renderHome, learn: renderLearn, subj: renderSubj, grade: renderGrade, topic: renderTopic, records: renderRecords, settings: renderSettings }[state.view] || renderHome)();
  }

  function appbar(title, sub, opts = {}) {
    $('#appbar').innerHTML = (opts.back ? `<button class="icon-btn" id="backBtn" aria-label="뒤로">${ICONS.back}</button>` : '<span style="width:8px"></span>')
      + `<div class="ttl">${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>${netChip()}${LPmusic.button()}`;
    if (opts.back) $('#backBtn').onclick = back;
  }
  function netChip() {
    const s = LP.syncState.st, on = navigator.onLine;
    const label = !on ? '📴 오프라인' : s === 'busy' ? '⏳ 동기화' : s === 'ok' ? '☁️ 동기화됨' : s === 'error' ? '⚠️ 동기화' : s === 'off' ? '📱 이 기기' : '🟢 온라인';
    return `<button class="net ${!on || s === 'error' ? 'off' : ''}" id="netChip" title="${esc(LP.syncState.msg || '')}">${label}</button>`;
  }
  function tabbar(active) {
    const tabs = [['home', '홈', ICONS.home], ['learn', '학습', ICONS.book], ['records', '기록', ICONS.chart], ['settings', '설정', ICONS.gear]];
    const bar = $('#tabbar'); bar.className = 'tabbar';
    bar.innerHTML = tabs.map(([k, l, i]) => `<button class="tab ${active === k ? 'on' : ''}" data-tab="${k}">${i}<span>${l}</span></button>`).join('');
    $$('[data-tab]', bar).forEach(b => b.onclick = () => { hist = []; go(b.dataset.tab, {}, false); });
  }
  let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
  function modal(html, buttons) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal">${html}<div class="mbtns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mb="${i}">${b.label}</button>`).join('')}</div></div>`;
    m.hidden = false;
    m.onclick = e => {
      if (e.target === m) { m.hidden = true; return; }
      const b = e.target.closest('[data-mb]'); if (!b) return;
      const def = buttons[+b.dataset.mb]; if (!def.keep) m.hidden = true; if (def.fn) def.fn();
    };
  }
  const loading = msg => { $('#view').innerHTML = `<div class="empty">${msg || '불러오는 중…'}</div>`; };
  // 과목 데이터가 필요한 화면: 불러온 뒤 다시 그린다
  function need(subj) { const s = LP.subjects[subj]; if (s.loaded) return true; loading(`${s.emoji} ${s.name} 불러오는 중…`); LP.load(subj).then(() => { if (state.subj === subj || state.view === 'topic') render(); }); return false; }

  /* ───────── 단계(학년) ───────── */
  const prof = () => LP.user().profile;
  function myLevel(s) {
    const set = prof().levels[s.id]; if (set) return set;
    const g = prof().grade || '초5', band = g[0], n = +g.slice(1) || 1;
    return s.defaultLevel(band, n);
  }
  const gradeShort = (subj, gid) => { const g = LP.subjects[subj].loaded && LP.gradeOf(subj, gid); return g ? g.short : gid; };
  const sectionsOf = t => (t.sectionsFor ? t.sectionsFor() : t.sections);
  function gradeProg(g) { const d = g.topics.filter(k => D.prog[k]).length; return { done: d, total: g.topics.length, pct: pct(d, g.topics.length) }; }
  function ring(p) { const r = 14, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 34 34"><circle class="bg" cx="17" cy="17" r="${r}"/><circle class="fg" cx="17" cy="17" r="${r}" stroke-dasharray="${(c * p / 100).toFixed(1)} ${c.toFixed(1)}"/><text x="17" y="17">${p}</text></svg>`; }
  const starsHtml = (n, big) => `<span class="${big ? 'bigstars' : 'stars'}">${[0, 1, 2].map(i => `<span class="${i < n ? '' : 'off'}">★</span>`).join('')}</span>`;
  function topicItem(t, i) {
    const p = D.prog[t.key], g = LP.gradeOf(t.subj, t.grade);
    return `<button class="card titem ${p ? 'done' : ''}" data-t="${t.key}"><span class="num">${p ? ICONS.check : i !== undefined ? String(i + 1).padStart(2, '0') : esc(g.short)}</span><span><h3>${esc(t.title)}</h3><span class="s">${p && p.stars ? starsHtml(p.stars) : ''}${esc(t.sub || '')}</span></span><span class="chev">${ICONS.chev}</span></button>`;
  }
  function bindList(root = $('#view')) {
    $$('[data-t]', root).forEach(b => b.onclick = () => openTopic(b.dataset.t));
    $$('[data-g]', root).forEach(b => b.onclick = () => go('grade', { subj: b.dataset.subj, gid: b.dataset.g }));
    $$('[data-subj-open]', root).forEach(b => b.onclick = () => go('subj', { subj: b.dataset.subjOpen }));
  }
  function openTopic(key) { go('topic', { key, subj: key.split('/')[0] }); }

  /* ───────── 로그인 ───────── */
  function renderLogin() {
    $('#appbar').innerHTML = `<span style="width:8px"></span><div class="ttl">통합 학습기<span class="sub">수학 · 과학 · 역사 · 영어 · 회화</span></div>${netChip()}${LPmusic.button()}`;
    $('#tabbar').className = 'tabbar hidden'; $('#tabbar').innerHTML = '';
    const users = LP.users(), sync = LP.GH.on();
    $('#view').innerHTML = `<div class="stack narrow">
      <section class="card hero"><div class="eyebrow">로그인</div><h1>누가 공부할까요?</h1>
        <p>아이디로 로그인하면 ${sync ? '<b>어느 기기에서든</b> 같은 학습 기록을 볼 수 있어요.' : '이 기기에 학습 기록이 저장돼요. 설정에서 GitHub 동기화를 켜면 다른 기기와 기록을 함께 봐요.'}</p>
        ${users.length ? `<div class="chips" style="margin-top:14px">${users.map(u => `<button class="chip" data-u="${esc(u)}">👤 ${esc(u)}</button>`).join('')}</div>` : ''}</section>
      <section class="card sec"><label class="fld">아이디<input id="lgId" autocomplete="username" autocapitalize="off" placeholder="영문·숫자 (예: jian)"></label>
        <label class="fld">비밀번호<input id="lgPw" type="password" autocomplete="current-password" placeholder="4자 이상"></label>
        <div id="lgNew" hidden><p class="hint">처음 쓰는 아이디예요. 이름과 학년을 정하면 새로 만들어요.</p>
          <label class="fld">이름<input id="lgName" maxlength="12" placeholder="예: 지안"></label>
          <div class="fld">학년</div><div class="chips" id="lgGrade">${GRADES.map(g => `<button class="chip" data-gr="${g}">${g}</button>`).join('')}</div></div>
        <p class="err" id="lgErr"></p>
        <button class="btn primary" id="lgGo">로그인</button></section>
      <section class="card sec"><h3>☁️ 기록 동기화 (GitHub)</h3>${syncFormHTML()}</section></div>`;
    let newMode = false, grade = '';
    $$('[data-u]').forEach(b => b.onclick = () => { $('#lgId').value = b.dataset.u; $('#lgPw').focus(); });
    $('#lgGrade').onclick = e => { const b = e.target.closest('[data-gr]'); if (!b) return; grade = b.dataset.gr; $$('#lgGrade .chip').forEach(x => x.classList.toggle('on', x === b)); };
    $('#lgGo').onclick = async () => {
      const id = $('#lgId').value, pw = $('#lgPw').value, err = $('#lgErr'); err.textContent = '';
      $('#lgGo').disabled = true;
      try {
        let create = null;
        if (newMode) { if (!grade) throw new Error('학년을 골라 주세요'); create = { name: $('#lgName').value.trim() || id, grade, parent: '' }; }
        const r = await LP.login(id, pw, create);
        if (r === 'new') { newMode = true; $('#lgNew').hidden = false; $('#lgGo').textContent = '새로 만들고 시작하기'; err.textContent = LP.GH.on() && !navigator.onLine ? '오프라인이라 서버 기록을 확인하지 못했어요. 다른 기기에서 만든 아이디라면 인터넷 연결 후 로그인하세요.' : ''; }
        else { toast(r === 'created' ? '환영해요! 새 학습 기록을 만들었어요' : `${prof().name || id}님, 반가워요!`); hist = []; go('home', {}, false); preload(); }
      } catch (e) { err.textContent = e.message; }
      $('#lgGo').disabled = false;
    };
    bindSyncForm();
  }
  function syncFormHTML() {
    const d = LP.device;
    return `<p class="hint">비공개 GitHub 저장소 하나에 사용자별 기록 파일이 저장돼요. 각 기기에서 한 번만 입력하면 됩니다. (만드는 방법은 README 참고)</p>
      <label class="fld">저장소 (소유자/이름)<input id="syRepo" placeholder="예: jeedan81/learner-data" value="${esc(d.repo)}" autocapitalize="off"></label>
      <label class="fld">토큰 (Fine-grained, 그 저장소 Contents 읽기·쓰기)<input id="syToken" type="password" placeholder="github_pat_…" value="${esc(d.token)}" autocomplete="off"></label>
      <div class="navrow"><button class="btn" id="sySave">저장하고 연결 확인</button>${d.repo ? '<button class="btn" id="syOff">동기화 끄기</button>' : ''}</div><p class="hint" id="syMsg">${syncStatusText()}</p>`;
  }
  function syncStatusText() {
    const s = LP.syncState;
    if (!LP.GH.on()) return '지금은 이 기기에만 저장해요.';
    return { busy: '⏳ 동기화 중…', ok: `☁️ ${new Date(s.at).toLocaleTimeString()}에 동기화했어요`, offline: '📴 오프라인 — 인터넷이 연결되면 자동으로 올려요', error: `⚠️ ${s.msg}`, idle: '연결됨', off: '' }[s.st] || '';
  }
  function bindSyncForm() {
    $('#sySave').onclick = async () => {
      LP.device.repo = $('#syRepo').value.trim().replace(/^https:\/\/github.com\//, '').replace(/\/$/, ''); LP.device.token = $('#syToken').value.trim(); LP.saveDevice();
      const m = $('#syMsg'); m.textContent = '확인 중…';
      try { const priv = await LP.GH.test(); m.textContent = priv ? '✅ 연결됐어요 (비공개 저장소)' : '⚠️ 연결됐지만 공개 저장소예요. 기록이 공개되니 비공개로 바꿔 주세요'; LP.sync(); }
      catch (e) { m.textContent = '❌ ' + e.message; }
    };
    const off = $('#syOff'); if (off) off.onclick = () => { LP.device.repo = ''; LP.device.token = ''; LP.saveDevice(); LP.sync(); render(); toast('동기화를 껐어요. 기록은 이 기기에 남아 있어요'); };
  }

  /* ───────── 홈 ───────── */
  function renderHome() {
    const p = prof(); appbar('통합 학습기', `${p.name || LP.user().id} · ${p.grade}`); tabbar('home');
    const evs = LP.events(), today = dkey(), te = evs.filter(e => e.d === today);
    const tq = te.reduce((a, e) => { const s = LP.score(e); return [a[0] + s.ok, a[1] + s.n]; }, [0, 0]);
    const now = new Date(), dow = (now.getDay() + 6) % 7, mon = new Date(now); mon.setDate(now.getDate() - dow);
    const week = ['월', '화', '수', '목', '금', '토', '일'].map((l, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = dkey(d); return `<div class="wd ${D.days.has(k) ? 'on' : ''} ${k === today ? 'now' : ''}"><i>${d.getDate()}</i>${l}</div>`; }).join('');
    const sk = LP.streak(), done = Object.keys(D.prog).length, stars = Object.values(D.prog).reduce((a, x) => a + x.stars, 0);
    const plan = todayPlan(), recos = recommend().slice(0, 3);
    $('#view').innerHTML = `<div class="cols"><div class="stack">
      <section class="card hero today"><div class="eyebrow">${now.getMonth() + 1}월 ${now.getDate()}일 · 오늘의 학습</div>
        <h1>${sk >= 2 ? `${sk}일 연속 학습 중!` : D.days.has(today) ? '오늘도 공부했어요!' : '오늘 공부를 시작해 볼까요?'}</h1>
        <p>${te.length ? `오늘 ${te.length}번 수업 · 문제 ${tq[1]}개 중 ${tq[0]}개 정답` : '도입 → 개념 → 확인 문제 → 정리, 한 걸음씩 따라가며 별을 모아요.'}</p>
        <div class="week">${week}</div>
        <div class="stat-row"><div class="stat"><b>${D.pts}</b><span>포인트</span></div><div class="stat"><b>${done}</b><span>완료 단원</span></div><div class="stat"><b>${stars}</b><span>받은 별</span></div></div>
        ${te.length ? '<button class="btn kakao" id="shareToday" style="margin-top:14px;width:100%">💬 오늘 공부한 내용 카톡으로 보내기</button>' : ''}</section>
      <div class="section-h"><h2>오늘의 계획</h2></div>
      ${plan.length ? `<div class="tlist">${plan.map(planItem).join('')}</div>` : '<section class="card sec"><p class="hint">과목 데이터를 불러오는 중이에요…</p></section>'}
      </div><div class="stack">
      <div class="section-h"><h2>과목</h2><button data-tab2="learn">전체 보기</button></div>
      <div class="grade-grid">${SUBJ().map(subjCard).join('')}</div>
      ${recos.length ? `<div class="section-h"><h2>맞춤 추천</h2><button data-tab2="records" data-sub="reco">더 보기</button></div>${recos.map(recoCard).join('')}` : ''}
      </div></div>`;
    bindList(); bindReco();
    $$('[data-tab2]').forEach(b => b.onclick = () => { hist = []; go(b.dataset.tab2, { sub: b.dataset.sub }, false); });
    const st = $('#shareToday'); if (st) st.onclick = () => shareDialog(today, today);
  }
  function subjCard(s) {
    const total = LP.totals[s.id] || 0, done = Object.keys(D.prog).filter(k => k.startsWith(s.id + '/')).length;
    return `<button class="card gcard" data-subj-open="${s.id}" style="--gc:${s.color}">${ring(pct(done, total))}<span class="badge" style="background:${s.color}">${s.emoji}</span><h3>${s.name}</h3><span class="d">${esc(s.desc)}</span><span class="d"><b style="color:${s.color}">${esc(gradeShort(s.id, myLevel(s)))}</b> · ${done}${total ? '/' + total : ''} 단원</span></button>`;
  }
  // 오늘의 계획: 하던 수업 이어서 → 과목마다 내 단계의 다음 단원 → 오답 복습
  function todayPlan() {
    const out = [], L = LP.lessons();
    Object.keys(L).filter(k => LP.topics[k] && L[k].step > 0 && !L[k].res).slice(0, 2).forEach(k => out.push({ t: LP.topics[k], tag: '이어서' }));
    for (const s of SUBJ()) {
      if (!s.loaded) continue;
      const g = LP.gradeOf(s.id, myLevel(s)) || s.grades[0]; if (!g) continue;
      const nx = g.topics.find(k => !D.prog[k] && !out.some(p => p.t.key === k));
      if (nx) out.push({ t: LP.topics[nx], tag: s.name });
    }
    const rv = Object.keys(D.wrong).find(k => LP.topics[k] && !out.some(p => p.t.key === k));
    if (rv) out.push({ t: LP.topics[rv], tag: '복습', review: true });
    return out;
  }
  function planItem({ t, tag, review }) {
    const s = LP.subjects[t.subj], g = LP.gradeOf(t.subj, t.grade), L = LP.lesson(t.key);
    return `<button class="card titem ${review ? 'review' : ''}" data-t="${t.key}" style="--gc:${s.color}"><span class="num period" style="background:${s.color}">${esc(tag)}</span><span><h3>${s.emoji} ${esc(t.title)}</h3><span class="s">${esc(g.name)} · ${review ? `틀린 문제 ${D.wrong[t.key].length}개 다시 풀기` : L && L.step ? `${L.step + 1}단계부터 이어서` : esc(t.sub || '')}</span></span><span class="chev">${ICONS.chev}</span></button>`;
  }

  /* ───────── 학습 탭: 과목 → 학년 → 단원 ───────── */
  function renderLearn() {
    appbar('학습', '과목을 고르세요'); tabbar('learn');
    $('#view').innerHTML = `<div class="stack"><div class="grade-grid">${SUBJ().map(subjCard).join('')}</div></div>`;
    bindList();
  }
  function renderSubj() {
    const s = LP.subjects[state.subj]; appbar(`${s.emoji} ${s.name}`, s.desc, { back: true }); tabbar('learn');
    if (!need(s.id)) return;
    const my = myLevel(s);
    $('#view').innerHTML = `<div class="stack">
      <div class="card search">${ICONS.search}<input id="q" type="search" placeholder="${s.name} 단원·핵심어 검색" autocomplete="off"></div>
      <div id="results" class="tlist" hidden></div>
      <div id="glist" class="stack">${s.grades.map(g => { const p = gradeProg(g); return `<button class="card prow" data-subj="${s.id}" data-g="${g.id}"><span class="badge" style="background:${g.color}">${esc(g.short)}</span><span style="text-align:left"><h3 style="font-size:16px">${esc(g.name)}${g.id === my ? ' <span class="mine">내 단계</span>' : ''}</h3><span class="s" style="font-size:12.5px;color:var(--muted)">${esc(g.desc || '')}</span><span class="bar"><i style="width:${p.pct}%"></i></span></span><span class="n">${p.done}/${p.total}</span></button>`; }).join('')}</div></div>`;
    bindList();
    const inp = $('#q'), res = $('#results');
    inp.oninput = () => {
      const q = inp.value.trim().toLowerCase(); res.hidden = !q; $('#glist').hidden = !!q; if (!q) return;
      const hits = s.grades.flatMap(g => g.topics.map(k => LP.topics[k])).filter(t => [t.title, t.sub, ...(t.kw || [])].join(' ').toLowerCase().includes(q)).slice(0, 40);
      res.innerHTML = hits.length ? hits.map(t => topicItem(t)).join('') : `<div class="empty">"${esc(inp.value)}"에 맞는 단원이 없어요.</div>`; bindList(res);
    };
  }
  function renderGrade() {
    const s = LP.subjects[state.subj]; if (!need(s.id)) return;
    const g = LP.gradeOf(s.id, state.gid), p = gradeProg(g), my = myLevel(s) === g.id;
    appbar(g.name, `${s.name} · ${g.topics.length}개 단원`, { back: true }); tabbar('learn');
    let list;
    if (g.cats) { // 회화: 주제별로 나눠 보여 준다
      const cat = state.cat || g.cats[0].id;
      list = `<div class="chips catchips">${g.cats.map(c => `<button class="chip ${c.id === cat ? 'on' : ''}" data-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join('')}</div>
        <div class="tlist">${g.topics.map(k => LP.topics[k]).filter(t => t.cat === cat).map((t, i) => topicItem(t, i)).join('')}</div>`;
    } else list = `<div class="tlist">${g.topics.map((k, i) => topicItem(LP.topics[k], i)).join('')}</div>`;
    $('#view').innerHTML = `<div class="stack" style="--gc:${g.color}">
      <section class="card ghead"><div class="eyebrow">${s.emoji} ${s.name} · ${esc(g.short)}</div><h2>${esc(g.name)}</h2><p>${esc(g.desc || '')}</p><div class="bar"><i style="width:${p.pct}%"></i></div>
        <p style="font-size:12.5px;margin-top:6px">${p.done} / ${p.total} 단원 완료</p>
        ${my ? '' : `<button class="btn" id="setMy" style="margin-top:10px">이 단계를 내 ${s.name} 단계로 정하기</button>`}</section>
      ${s.id === 'talk' ? langSwitch() : ''}${list}</div>`;
    bindList(); bindLang();
    $$('[data-cat]').forEach(b => b.onclick = () => { state.cat = b.dataset.cat; renderGrade(); });
    const sm = $('#setMy'); if (sm) sm.onclick = () => { LP.setLevel(s.id, g.id); toast(`${s.name}: ${g.short} 단계로 정했어요`); renderGrade(); };
  }
  function langSwitch() { const l = prof().talkLang || 'en'; return `<div class="seg lang"><button data-lang="en" class="${l === 'en' ? 'on' : ''}">🇺🇸 영어</button><button data-lang="ja" class="${l === 'ja' ? 'on' : ''}">🇯🇵 일본어</button></div>`; }
  function bindLang() { $$('[data-lang]').forEach(b => b.onclick = () => { if (prof().talkLang === b.dataset.lang) return; LP.setProfile({ talkLang: b.dataset.lang }); toast(b.dataset.lang === 'ja' ? '일본어로 공부해요' : '영어로 공부해요'); if (state.view === 'topic') LP.setLesson(state.key, null); render(); }); }

  /* ───────── 수업 ───────── */
  const PER_LESSON = 5;
  function recLevel(key) { const s = D.skill[key] || {}; let best = 0; for (let l = 1; l <= 5; l++) { const r = s[l]; if (r && r[1] >= 3 && r[0] / r[1] >= 0.8) best = l; } return best ? String(Math.min(5, best + 1)) : 'mix'; }
  function lvCounts(t) { const c = [0, 0, 0, 0, 0, 0]; LP.bank(t).forEach(q => c[q.lv]++); return c; }
  function pickSet(t, mode) {
    const qs = LP.bank(t), seen = (D.prog[t.key] && D.prog[t.key].seen) || [];
    const pool = lv => qs.map((q, i) => ({ q, i })).filter(x => lv == null || x.q.lv === lv);
    const take = (arr, k, ex = []) => { arr = arr.filter(x => !ex.includes(x.i)); const fresh = arr.filter(x => !seen.includes(x.i)); return shuffle(fresh.length >= k ? fresh : arr).slice(0, k); };
    let out = [];
    if (mode === 'mix') { for (let l = 1; l <= 5; l++) out.push(...take(pool(l), 1)); if (out.length < PER_LESSON) out.push(...take(pool(), PER_LESSON - out.length, out.map(x => x.i))); }
    else { out = take(pool(+mode), PER_LESSON); for (let d = 1; d <= 4 && out.length < PER_LESSON; d++) [+mode - d, +mode + d].forEach(l => { if (l >= 1 && l <= 5 && out.length < PER_LESSON) out.push(...take(pool(l), PER_LESSON - out.length, out.map(x => x.i))); }); }
    if (out.length < Math.min(PER_LESSON, qs.length)) out.push(...take(pool(), Math.min(PER_LESSON, qs.length) - out.length, out.map(x => x.i)));
    return out.sort((a, b) => a.q.lv - b.q.lv || a.i - b.i).map(x => x.i);
  }
  function newLesson(t, mode, step = 0) { mode = mode || recLevel(t.key); return { step, ans: {}, mode, set: pickSet(t, mode), lang: t.talk ? t.lang() : undefined }; }
  function lessonSteps(t, L) {
    const st = [{ k: 'intro' }]; sectionsOf(t).forEach((s, i) => st.push({ k: 'sec', s, i }));
    const qs = LP.bank(t); (L.set || []).forEach((qi, i) => { if (qs[qi]) st.push({ k: 'q', q: qs[qi], i, qi }); });
    if (t.talk && !L.review) st.push({ k: 'ai' });
    st.push({ k: 'done' }); return st;
  }
  const PHASES = [['intro', '도입'], ['sec', '개념'], ['q', '문제'], ['ai', 'AI 대화'], ['done', '정리']];
  const CHEER = ['차근차근 읽어 봐요. 그림이 있으면 더 쉬워요!', '여기가 핵심이에요. 소리 내어 읽어 볼까요?', '잘 따라오고 있어요. 조금만 더!', '표와 그림을 비교하면서 보면 기억에 오래 남아요.', '모르는 말은 한 번 더 읽고 넘어가요.'];
  const mascot = s => `<svg class="mascot" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="28" r="20" fill="var(--gc,var(--accent))"/><circle cx="26" cy="28" r="15" fill="var(--card)"/><circle cx="20" cy="27" r="2.2" fill="var(--ink)"/><circle cx="32" cy="27" r="2.2" fill="var(--ink)"/><path d="M20 33q6 5 12 0" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/><path d="M14 12l4 6M38 12l-4 6" stroke="var(--gc,var(--accent))" stroke-width="3" stroke-linecap="round"/><text x="26" y="12" text-anchor="middle" font-size="10" fill="var(--hi)" font-weight="700">${esc(s.mascot)}</text></svg>`;
  const tutor = (s, msg, cls = '') => `<div class="tutor ${cls}" id="tutor">${mascot(s)}<div class="bubble">${msg}</div></div>`;

  function renderTopic() {
    if (!need(state.subj)) return;
    const key = state.key, t = LP.topics[key]; if (!t) { go('home', {}, false); return; }
    const s = LP.subjects[t.subj], g = LP.gradeOf(t.subj, t.grade);
    let L = LP.lesson(key);
    if (!L || !L.set || (t.talk && L.lang !== t.lang())) L = newLesson(t, L && L.mode, 0);
    const steps = lessonSteps(t, L);
    L.step = Math.max(0, Math.min(L.step, steps.length - 1)); LP.setLesson(key, L);
    const n = L.step, st = steps[n], ph = PHASES.findIndex(p => p[0] === st.k), secs = sectionsOf(t);
    appbar(t.title, `${s.name} · ${g.name} · ${n + 1}/${steps.length}단계`, { back: true });
    const nQ = L.set.length, qs = LP.bank(t), cnt = lvCounts(t), rec = recLevel(key);
    let body = '', msg = '', mcls = '';
    if (st.k === 'intro') {
      msg = `안녕! 오늘은 <b>${esc(t.title)}</b>을(를) 배워요. ${secs.length}가지를 차례로 알아본 뒤 문제를 풀어요.`;
      const modeLabel = L.mode === 'mix' ? '섞어서' : `${L.mode} ${LV[+L.mode]}`;
      body = `<section class="card lesson-h"><div class="eyebrow">${s.emoji} ${esc(g.short)} · ${String(g.topics.indexOf(key) + 1).padStart(2, '0')} / ${g.topics.length}</div><h2>${esc(t.title)}</h2><p>${esc(t.sub || '')}</p>${t.kw ? `<div class="kw">${t.kw.filter(Boolean).slice(0, 6).map(k => `<span>${esc(k)}</span>`).join('')}</div>` : ''}</section>
        ${t.talk ? langSwitch() : ''}
        <section class="card sec"><h3>이 시간에 배울 것</h3><ol class="goals">${secs.map(x => `<li>${esc(x.h || '개념 익히기')}</li>`).join('')}${t.talk ? '<li>AI와 직접 말해 보기 (인터넷 필요)</li>' : ''}</ol></section>
        <section class="card sec"><h3>확인 문제 난이도</h3><p style="color:var(--muted);font-size:14px">개념을 본 뒤 <b>${nQ}문제</b>를 풀어요. 문제 은행 ${qs.length}개 중에서 고릅니다.</p>
          <div class="lvs"><button class="lv ${L.mode === 'mix' ? 'on' : ''}" data-lv="mix">섞어서<small>1~5 골고루</small></button>${[1, 2, 3, 4, 5].map(l => `<button class="lv ${L.mode === String(l) ? 'on' : ''}" data-lv="${l}" ${cnt[l] ? '' : 'disabled'}>${l} ${LV[l]}<small>${cnt[l]}문제</small></button>`).join('')}</div>
          <p style="font-size:13px;color:var(--muted)">지금 선택: <b>${modeLabel}</b>${rec !== L.mode ? ` · 추천: ${rec === 'mix' ? '섞어서' : rec + ' ' + LV[+rec]}${D.skill[key] ? ' (지난 결과 기준)' : ' (처음이라 골고루)'}` : ' · 추천 난이도예요'}</p></section>`;
    } else if (st.k === 'sec') {
      msg = CHEER[st.i % CHEER.length];
      body = `<div class="steptag">개념 ${st.i + 1} / ${secs.length}</div>${renderSection(st.s)}`;
    } else if (st.k === 'q') {
      const a = L.ans[st.i];
      msg = a == null ? `확인 문제 ${st.i + 1}번, ${LV[st.q.lv]} 난이도예요. 배운 내용을 떠올리며 답을 골라 보세요.` : a === st.q.a ? '정답이에요! 해설도 한 번 읽어 보고 넘어가요.' : '아쉬워요. 초록색이 정답이에요. 해설을 읽고 다시 떠올려 봐요.';
      mcls = a == null ? '' : a === st.q.a ? 'good' : 'bad';
      body = `<div class="steptag">확인 문제 ${st.i + 1} / ${nQ} ${lvTag(st.q.lv)}</div>${renderQuiz(st.q, st.i, a)}`;
    } else if (st.k === 'ai') {
      msg = '이제 배운 표현으로 직접 대화해 봐요! 미션을 하나씩 해내면 체크가 돼요. 건너뛰어도 괜찮아요.';
      body = renderChat(t, L);
    } else {
      const r = finishLesson(t, L);
      const adv = recommend().find(x => x.from === key);
      msg = r.stars === 3 ? '완벽해요! 모든 문제를 맞혔어요. 👏' : r.stars === 2 ? '잘했어요! 틀린 문제는 오답 노트에 담아 두었어요.' : '끝까지 해냈어요! 오답 노트로 한 번 더 복습해 봐요.';
      mcls = 'good';
      body = `<section class="card result"><div class="stamp">학습<br>완료</div>${starsHtml(r.stars, true)}<div class="pts">+${r.gain} P</div><p style="color:var(--muted);font-size:14px">${nQ ? `확인 문제 ${r.score} / ${nQ} 정답 · ` : ''}${L.ai && L.ai.said ? `AI 미션 ${L.ai.missionsDone.length}/${t.sc.missions.length} · ` : ''}누적 ${D.pts} P · ${LP.streak()}일 연속</p></section>
        ${nQ ? `<section class="card sec"><h3>문제별 결과</h3><div class="qrows">${steps.filter(x => x.k === 'q').map(x => `<div class="qrow">${lvTag(x.q.lv)}<span class="t">${stripTags(x.q.q)}</span><span class="${L.ans[x.i] === x.q.a ? 'ok' : 'no'}">${L.ans[x.i] === x.q.a ? '○' : '✗'}</span></div>`).join('')}</div>
          <div class="navrow"><button class="btn" id="moreQ">같은 난이도 5문제 더</button>${L.mode !== '5' && r.score === nQ ? '<button class="btn" id="upQ">한 단계 어렵게 →</button>' : ''}</div></section>` : ''}
        ${adv ? `<section class="card adv"><div class="eyebrow">선행 학습 추천</div><h3>${esc(LP.topics[adv.to].title)}</h3><p>${esc(adv.why)}</p><button class="btn primary" data-t="${adv.to}" style="width:100%">${esc(gradeShort(adv.subj, LP.topics[adv.to].grade))} · 미리 배우러 가기 →</button></section>` : ''}
        <section class="card sec"><h3>오늘 배운 것</h3><ul class="sumlist">${secs.map(x => `<li>${ICONS.check}<span>${esc(x.h || '개념 익히기')}</span></li>`).join('')}</ul>
          <button class="btn kakao" id="shareDay">💬 오늘 공부한 내용 카톡으로 보내기</button></section>`;
    }
    $('#view').innerHTML = `<div class="stack lesson" style="--gc:${g.color}">
      <div class="card lprog"><div class="phases">${PHASES.filter(p => p[0] !== 'ai' || t.talk).map(p => { const i = PHASES.indexOf(p); return `<button data-ph="${p[0]}" class="${i < ph ? 'past' : i === ph ? 'on' : ''}">${p[1]}</button>`; }).join('')}</div><div class="segs">${steps.map((x, i) => `<i data-step="${i}" class="${i < n ? 'past' : i === n ? 'on' : ''}" title="${i + 1}단계"></i>`).join('')}</div></div>
      ${tutor(s, msg, mcls)}${body}</div>`;
    stepNav(t, steps, L);
    // 도입·개념·문제·정리(와 아래 칸)를 눌러 그 단계로 바로 간다. 정리는 문제를 다 푼 뒤에만
    const jump = to => {
      if (steps[to].k === 'done') { const open = steps.findIndex(x => x.k === 'q' && L.ans[x.i] == null); if (open >= 0) { to = open; toast('문제를 다 풀면 정리로 갈 수 있어요'); } }
      if (to === L.step) return;
      L.step = to; LP.setLesson(key, L); renderTopic(); window.scrollTo({ top: 0 });
    };
    $$('.phases [data-ph]').forEach(b => b.onclick = () => { const k = b.dataset.ph, i = steps.findIndex(x => x.k === k); if (i >= 0) jump(k === 'q' ? Math.max(i, steps.findIndex(x => x.k === 'q' && L.ans[x.i] == null)) : i); });
    $$('.segs [data-step]').forEach(b => b.onclick = () => jump(+b.dataset.step));
    bindList(); bindLang();
    $$('.fig[data-fig]').forEach(mountFig);
    if (st.k === 'q') bindQuiz(t, L, st);
    if (st.k === 'ai') bindChat(t, L);
    $$('.lv[data-lv]').forEach(b => b.onclick = () => { LP.setLesson(key, newLesson(t, b.dataset.lv, 0)); renderTopic(); });
    const firstQ = () => lessonSteps(t, LP.lesson(key)).findIndex(x => x.k === 'q');
    const mq = $('#moreQ'); if (mq) mq.onclick = () => { const nl = newLesson(t, L.mode); nl.review = true; LP.setLesson(key, nl); nl.step = firstQ(); LP.setLesson(key, nl); renderTopic(); window.scrollTo({ top: 0 }); };
    const uq = $('#upQ'); if (uq) uq.onclick = () => { const m = L.mode === 'mix' ? '3' : String(+L.mode + 1); const nl = newLesson(t, m); nl.review = true; LP.setLesson(key, nl); nl.step = firstQ(); LP.setLesson(key, nl); toast(`${m} ${LV[+m]} 난이도로 올렸어요`); renderTopic(); window.scrollTo({ top: 0 }); };
    const sd = $('#shareDay'); if (sd) sd.onclick = () => shareDialog(dkey(), dkey());
  }
  const stripTags = h => esc(String(h).replace(/<div class="qfig">[\s\S]*?<\/div>/g, '[그림] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 90);
  function stepNav(t, steps, L) {
    const n = L.step, st = steps[n], bar = $('#tabbar'); bar.className = 'tabbar stepnav';
    const s = LP.subjects[t.subj], g = LP.gradeOf(t.subj, t.grade), idx = g.topics.indexOf(t.key);
    const next = g.topics[idx + 1] || (s.grades[s.grades.indexOf(g) + 1] || { topics: [] }).topics[0];
    if (st.k === 'done') {
      bar.innerHTML = `<button class="btn" id="redo">다시 공부</button>${next ? `<button class="btn primary" data-t="${next}">다음 단원 →</button>` : '<button class="btn primary" id="homeBtn">홈으로</button>'}`;
      $('#redo').onclick = () => { LP.setLesson(t.key, newLesson(t, L.mode)); renderTopic(); };
      const hb = $('#homeBtn'); if (hb) hb.onclick = () => { hist = []; go('home', {}, false); };
      $$('[data-t]', bar).forEach(b => b.onclick = () => { LP.setLesson(b.dataset.t, null); state = { view: 'topic', key: b.dataset.t, subj: t.subj }; render(); window.scrollTo({ top: 0 }); });
      return;
    }
    const locked = st.k === 'q' && L.ans[st.i] == null;
    const nk = steps[n + 1].k;
    bar.innerHTML = `<button class="btn" id="prevS" ${n === 0 ? 'disabled' : ''}>← 이전</button><button class="btn primary" id="nextS" ${locked ? 'disabled' : ''}>${st.k === 'intro' ? '학습 시작' : nk === 'done' ? '정리하기' : nk === 'q' && st.k !== 'q' ? '문제 풀기' : nk === 'ai' ? 'AI와 말하기' : st.k === 'ai' ? '정리하기' : '다음'} →</button>`;
    $('#prevS').onclick = () => { L.step--; LP.setLesson(t.key, L); renderTopic(); window.scrollTo({ top: 0 }); };
    $('#nextS').onclick = () => { L.step++; LP.setLesson(t.key, L); renderTopic(); window.scrollTo({ top: 0 }); };
  }
  // 정리 단계: 학습 기록에 한 번만 남긴다
  function finishLesson(t, L) {
    if (L.res) return L.res;
    const all = LP.bank(t), qs = L.set.map(i => all[i]).filter(Boolean), score = qs.filter((q, i) => L.ans[i] === q.a).length;
    const first = !D.prog[t.key];
    const gain = (first ? 20 : 0) + qs.reduce((a, q, i) => a + (L.ans[i] === q.a ? q.lv * 2 : 0), 0);
    const ev = { s: t.subj, t: t.key, g: t.grade, ti: t.title, m: L.mode, q: L.set.map((qi, i) => [qi, all[qi].lv, L.ans[i] === all[qi].a ? 1 : 0]) };
    if (L.ai && L.ai.said) ev.ai = { m: L.ai.missionsDone.length, n: t.sc.missions.length, said: L.ai.said, lang: L.lang };
    if (t.talk) ev.lang = L.lang;
    LP.addEvent(ev);
    L.res = { score, stars: LP.score(ev).stars, gain }; LP.setLesson(t.key, L);
    return L.res;
  }

  /* 개념 화면 */
  let figStore = [];
  function renderSection(s) {
    let h = `<section class="card sec">${s.h ? `<h3>${esc(s.h)}</h3>` : ''}`;
    if (s.p) h += (Array.isArray(s.p) ? s.p : [s.p]).map(x => `<p>${x}</p>`).join('');
    if (s.html) h += s.html;
    if (s.formula) h += `<div class="formula">${s.formula.map(f => `<div>${f}</div>`).join('')}</div>`;
    if (s.fig) h += figHtml(s.fig);
    if (s.table) h += tableHtml(s.table);
    if (s.p2) h += (Array.isArray(s.p2) ? s.p2 : [s.p2]).map(x => `<p>${x}</p>`).join('');
    if (s.fig2) h += figHtml(s.fig2);
    if (s.tip) h += `<div class="tip"><b>TIP</b><span>${s.tip}</span></div>`;
    if (s.warn) h += `<div class="warn"><b>주의</b><span>${s.warn}</span></div>`;
    return h + '</section>';
  }
  function tableHtml(t) {
    return `<div class="tbl"><table>${t.head ? `<thead><tr>${t.head.map(x => `<th>${x}</th>`).join('')}</tr></thead>` : ''}<tbody>${t.rows.map(r => `<tr>${r.map(c => { const cls = typeof c === 'string' && c.startsWith('✓') ? ' class="ok"' : typeof c === 'string' && c.startsWith('✗') ? ' class="no"' : ''; return `<td${cls}>${c}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>${t.cap ? `<div class="tcap">${t.cap}</div>` : ''}`;
  }
  function figHtml(f) { const k = figStore.push(f) - 1; return `<div class="fig" data-fig="${k}">${f.type === 'svg' ? `<svg viewBox="${f.vb}" role="img" aria-label="${esc(f.cap || '그림')}">${f.body}</svg>` : f.type === 'raw' ? f.html : ''}${f.cap ? `<div class="cap">${f.cap}</div>` : ''}</div>`; }
  function mountFig(el) {
    const f = figStore[+el.dataset.fig]; if (!f || f.type === 'svg' || f.type === 'raw') return;
    const slot = document.createElement('div'); el.insertBefore(slot, el.firstChild);
    if (f.type === 'plot') mountPlot(slot, f);
    else slot.innerHTML = ({ numberline: numberLine, fracbar: fracBar, grid: gridFig, bars: barsFig, pie: pieFig, dots: dotsFig }[f.type] || (() => ''))(f);
  }
  /* 수학 그림 엔진(수학 앱에서 그대로 가져옴) */
  function mountPlot(slot, f) {
    const params = {}; (f.params || []).forEach(p => params[p.k] = p.val);
    slot.innerHTML = `<canvas height="${f.h || 260}"></canvas>` + ((f.params || []).length ? `<div class="sliders">${f.params.map(p => `<div class="sl"><label>${p.label || p.k}</label><input type="range" data-k="${p.k}" min="${p.min}" max="${p.max}" step="${p.step || 1}" value="${p.val}"><output>${fmt(p.val)}</output></div>`).join('')}</div>` : '');
    const cv = slot.querySelector('canvas');
    slot.querySelectorAll('input[type=range]').forEach(inp => { inp.oninput = () => { params[inp.dataset.k] = +inp.value; inp.nextElementSibling.textContent = fmt(+inp.value); draw(); }; });
    function draw() {
      const W = cv.clientWidth || 320, H = f.h || 260, dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const [x0, x1] = f.xr || [-5, 5], [y0, y1] = f.yr || [-5, 5];
      const pad = { l: 34, r: 12, t: 12, b: 26 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
      const X = x => pad.l + (x - x0) / (x1 - x0) * pw, Y = y => pad.t + (y1 - y) / (y1 - y0) * ph;
      const col = { ink: css('--ink'), muted: css('--muted'), grid: css('--line'), accent: css('--accent'), hi: css('--hi'), good: css('--good'), bad: css('--bad'), soft: css('--soft') };
      c.fillStyle = css('--card'); c.fillRect(0, 0, W, H);
      const sx = niceStep(x1 - x0), sy = niceStep(y1 - y0);
      c.strokeStyle = col.grid; c.lineWidth = 1; c.font = '11px ' + css('--f-mono'); c.fillStyle = col.muted;
      for (let x = Math.ceil(x0 / sx) * sx; x <= x1 + 1e-9; x += sx) { const px = X(x); c.beginPath(); c.moveTo(px, pad.t); c.lineTo(px, pad.t + ph); c.stroke(); c.textAlign = 'center'; c.fillText(fmt(x), px, H - 8); }
      for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) { const py = Y(y); c.beginPath(); c.moveTo(pad.l, py); c.lineTo(pad.l + pw, py); c.stroke(); c.textAlign = 'right'; c.fillText(fmt(y), pad.l - 5, py + 4); }
      c.strokeStyle = col.muted; c.lineWidth = 1.3;
      if (x0 <= 0 && x1 >= 0) { c.beginPath(); c.moveTo(X(0), pad.t); c.lineTo(X(0), pad.t + ph); c.stroke(); }
      if (y0 <= 0 && y1 >= 0) { c.beginPath(); c.moveTo(pad.l, Y(0)); c.lineTo(pad.l + pw, Y(0)); c.stroke(); }
      c.save(); c.beginPath(); c.rect(pad.l, pad.t, pw, ph); c.clip();
      if (f.shade) { const s = f.shade(params); if (s) { c.fillStyle = col[s.color || 'accent']; c.globalAlpha = 0.18; c.beginPath(); const a = s.from, b = s.to; c.moveTo(X(a), Y(s.base !== undefined ? s.base : 0)); for (let i = 0; i <= 120; i++) { const x = a + (b - a) * i / 120; c.lineTo(X(x), Y(s.f(x, params))); } c.lineTo(X(b), Y(s.base !== undefined ? s.base : 0)); c.closePath(); c.fill(); c.globalAlpha = 1; } }
      (f.fns || []).forEach(fn => {
        if (fn.when && !fn.when(params)) return;
        c.strokeStyle = col[fn.color || 'accent']; c.lineWidth = fn.w || 2.2; c.setLineDash(fn.dash ? [6, 5] : []);
        c.beginPath(); let pen = false, prevY = null;
        for (let i = 0; i <= 400; i++) { const x = x0 + (x1 - x0) * i / 400; let y; try { y = fn.f(x, params); } catch (e) { y = NaN; }
          if (!isFinite(y) || (prevY !== null && Math.abs(y - prevY) > (y1 - y0) * 4)) { pen = false; prevY = isFinite(y) ? y : null; continue; }
          const px = X(x), py = Y(y); if (!pen) { c.moveTo(px, py); pen = true; } else c.lineTo(px, py); prevY = y; }
        c.stroke(); c.setLineDash([]);
      });
      let LS = typeof f.lines === 'function' ? f.lines(params) : (f.lines || []); LS = Array.isArray(LS) ? LS : [LS];
      LS.forEach(l => { const s = typeof l === 'function' ? l(params) : l; if (!s) return; c.strokeStyle = col[s.color || 'muted']; c.lineWidth = 1.3; c.setLineDash(s.dash === false ? [] : [4, 4]); c.beginPath(); c.moveTo(X(s.x1), Y(s.y1)); c.lineTo(X(s.x2), Y(s.y2)); c.stroke(); c.setLineDash([]); });
      (f.points ? f.points(params) : []).forEach(p => { if (!isFinite(p.y)) return; c.fillStyle = col[p.color || 'hi']; c.beginPath(); c.arc(X(p.x), Y(p.y), 4.5, 0, 7); c.fill(); if (p.label) { c.fillStyle = col.ink; c.font = '12px ' + css('--f-mono'); c.textAlign = 'left'; c.fillText(p.label, X(p.x) + 7, Y(p.y) - 7); } });
      c.restore();
      (f.fns || []).filter(fn => fn.label && !(fn.when && !fn.when(params))).forEach((fn, i) => { c.fillStyle = col[fn.color || 'accent']; c.font = '12px ' + css('--f-mono'); c.textAlign = 'left'; c.fillText(typeof fn.label === 'function' ? fn.label(params) : fn.label, pad.l + 8, pad.t + 16 + i * 16); });
      if (f.note) { c.fillStyle = col.muted; c.font = '12px ' + css('--f-body'); c.textAlign = 'right'; c.fillText(f.note(params), W - pad.r - 4, pad.t + 16); }
    }
    draw(); if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(cv);
  }
  function niceStep(range) { const raw = range / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; }
  function fmt(v) { return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : String(+v.toFixed(2)); }
  function numberLine(f) {
    const W = 340, H = f.h || 70, y = 36, pad = 22, [a, b] = f.range, X = v => pad + (v - a) / (b - a) * (W - 2 * pad), step = f.step || 1;
    let s = `<svg viewBox="0 0 ${W} ${H}"><line x1="${pad - 10}" y1="${y}" x2="${W - pad + 10}" y2="${y}" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#ar)"/><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--muted)"/></marker></defs>`;
    for (let v = a; v <= b + 1e-9; v += step) s += `<line x1="${X(v)}" y1="${y - 5}" x2="${X(v)}" y2="${y + 5}" stroke="var(--muted)"/><text x="${X(v)}" y="${y + 20}" text-anchor="middle" fill="var(--muted)" font-size="11">${fmt(v)}</text>`;
    (f.marks || []).forEach(m => { s += `<circle cx="${X(m.v)}" cy="${y}" r="5.5" fill="var(--${m.color || 'hi'})"/>${m.label ? `<text x="${X(m.v)}" y="${y - 12}" text-anchor="middle" fill="var(--ink)" font-size="12">${m.label}</text>` : ''}`; });
    (f.arcs || []).forEach(r => { const x1 = X(r.from), x2 = X(r.to), d = x2 - x1; s += `<path d="M${x1} ${y - 6} Q${(x1 + x2) / 2} ${y - 6 - Math.min(40, Math.abs(d) * 0.6)} ${x2} ${y - 6}" fill="none" stroke="var(--${r.color || 'accent'})" stroke-width="1.8" marker-end="url(#ar)"/>${r.label ? `<text x="${(x1 + x2) / 2}" y="${y - 14 - Math.min(40, Math.abs(d) * 0.6) / 2}" text-anchor="middle" fill="var(--${r.color || 'accent'})" font-size="12">${r.label}</text>` : ''}`; });
    return s + '</svg>';
  }
  function fracBar(f) {
    const W = 340, bh = 30, gap = 22, H = f.rows.length * (bh + gap); let s = `<svg viewBox="0 0 ${W} ${H}">`;
    f.rows.forEach((r, i) => { const y = i * (bh + gap) + 16, w = (W - 110) / r.d; for (let k = 0; k < r.d; k++) s += `<rect x="${90 + k * w}" y="${y}" width="${w}" height="${bh}" fill="${k < r.n ? `var(--${r.color || 'accent'})` : 'var(--card)'}" fill-opacity="${k < r.n ? 0.85 : 1}" stroke="var(--muted)" stroke-width="1"/>`; s += `<text x="82" y="${y + bh / 2 + 4}" text-anchor="end" fill="var(--ink)" font-size="13">${r.label || r.n + '/' + r.d}</text>`; });
    return s + '</svg>';
  }
  function gridFig(f) {
    const cs = f.size || 28, W = f.cols * cs + 40, H = f.rows * cs + 40; let s = `<svg viewBox="0 0 ${W} ${H}">`;
    for (let r = 0; r < f.rows; r++) for (let c = 0; c < f.cols; c++) { const col = f.cell ? f.cell(r, c) : null; s += `<rect x="${20 + c * cs}" y="${20 + r * cs}" width="${cs}" height="${cs}" fill="${col ? `var(--${col})` : 'var(--card)'}" fill-opacity="${col ? 0.8 : 1}" stroke="var(--muted)" stroke-width="1"/>`; }
    (f.labels || []).forEach(l => s += `<text x="${l.x}" y="${l.y}" text-anchor="middle" fill="var(--ink)" font-size="12">${l.t}</text>`);
    return s + '</svg>';
  }
  function barsFig(f) {
    const W = 340, H = f.h || 200, pad = { l: 36, r: 10, t: 16, b: 30 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b, max = f.max || Math.max(...f.vals) * 1.15, bw = pw / f.vals.length;
    let s = `<svg viewBox="0 0 ${W} ${H}">`; const st = niceStep(max);
    for (let v = 0; v <= max; v += st) { const y = pad.t + ph - v / max * ph; s += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--line)"/><text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${fmt(v)}</text>`; }
    f.vals.forEach((v, i) => { const h = v / max * ph, x = pad.l + i * bw + bw * 0.2; s += `<rect x="${x}" y="${pad.t + ph - h}" width="${bw * 0.6}" height="${h}" rx="3" fill="var(--${(f.colors && f.colors[i]) || 'accent'})" fill-opacity=".85"/><text x="${x + bw * 0.3}" y="${pad.t + ph - h - 5}" text-anchor="middle" fill="var(--ink)" font-size="11">${fmt(v)}</text><text x="${x + bw * 0.3}" y="${H - 10}" text-anchor="middle" fill="var(--muted)" font-size="11">${f.cats[i]}</text>`; });
    if (f.hline !== undefined) { const y = pad.t + ph - f.hline / max * ph; s += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--hi)" stroke-width="2" stroke-dasharray="5 4"/><text x="${W - pad.r}" y="${y - 5}" text-anchor="end" fill="var(--hi)" font-size="11">${f.hlabel || ''}</text>`; }
    return s + '</svg>';
  }
  function pieFig(f) {
    const total = f.vals.reduce((a, b) => a + b, 0), cx = 90, cy = 90, r = 70, cols = ['accent', 'hi', 'good', 'muted', 'bad']; let a0 = -Math.PI / 2, s = '<svg viewBox="0 0 340 180">';
    f.vals.forEach((v, i) => { const a1 = a0 + v / total * 2 * Math.PI, x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1), lg = a1 - a0 > Math.PI ? 1 : 0;
      s += `<path d="M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${lg} 1 ${x1} ${y1}Z" fill="var(--${cols[i % cols.length]})" fill-opacity="${0.9 - i * 0.12}" stroke="var(--card)" stroke-width="2"/>`;
      const am = (a0 + a1) / 2; s += `<text x="${cx + r * 0.62 * Math.cos(am)}" y="${cy + r * 0.62 * Math.sin(am) + 4}" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">${Math.round(100 * v / total)}%</text>`;
      s += `<rect x="190" y="${30 + i * 26}" width="12" height="12" rx="2" fill="var(--${cols[i % cols.length]})" fill-opacity="${0.9 - i * 0.12}"/><text x="208" y="${40 + i * 26}" fill="var(--ink)" font-size="12">${f.labels[i]} (${v})</text>`; a0 = a1; });
    return s + '</svg>';
  }
  function dotsFig(f) {
    const cs = 30, W = f.cols * cs + 40, H = f.rows * cs + 40; let s = `<svg viewBox="0 0 ${W} ${H}">`;
    for (let r = 0; r < f.rows; r++) for (let c = 0; c < f.cols; c++) { const col = f.cell ? f.cell(r, c) : 'accent'; if (!col) continue; s += `<circle cx="${20 + c * cs + cs / 2}" cy="${20 + r * cs + cs / 2}" r="10" fill="var(--${col})" fill-opacity=".85"/>`; }
    (f.labels || []).forEach(l => s += `<text x="${l.x}" y="${l.y}" text-anchor="middle" fill="var(--ink)" font-size="12">${l.t}</text>`);
    return s + '</svg>';
  }

  /* 확인 문제 */
  function renderQuiz(q, i, a) {
    const done = a != null;
    return `<section class="card quiz" id="quiz"><div class="q ${done ? 'answered' : ''}"><div class="qt"><b>Q${i + 1}</b>${q.q}</div><div class="opts">${q.o.map((o, j) => `<button class="opt ${done && j === q.a ? 'ok' : done && j === a ? 'no' : ''}" data-j="${j}" ${done ? 'disabled' : ''}><i>${'①②③④⑤'[j]}</i><span>${o}</span></button>`).join('')}</div><div class="why">${q.why || ''}</div></div></section>`;
  }
  function bindQuiz(t, L, st) {
    const qel = $('#quiz .q'); if (!qel || qel.classList.contains('answered')) return;
    $$('.opt', qel).forEach(b => b.onclick = () => {
      const j = +b.dataset.j, ok = j === st.q.a;
      L.ans[st.i] = j; LP.setLesson(t.key, L);
      qel.classList.add('answered');
      $$('.opt', qel).forEach((x, k) => { x.disabled = true; if (k === st.q.a) x.classList.add('ok'); else if (k === j) x.classList.add('no'); });
      const tu = $('#tutor'); tu.className = 'tutor ' + (ok ? 'good' : 'bad');
      tu.querySelector('.bubble').innerHTML = ok ? '정답이에요! 해설도 한 번 읽어 보고 넘어가요.' : '아쉬워요. 초록색이 정답이에요. 해설을 읽고 다시 떠올려 봐요.';
      if (!ok) { qel.classList.add('shake'); setTimeout(() => qel.classList.remove('shake'), 400); }
      const nb = $('#nextS'); nb.disabled = false; nb.focus();
    });
  }

  /* 회화: AI와 말하기 (인터넷 + OpenAI 키가 있으면 진짜 AI, 없으면 연습용 데모 대화) */
  function aiSession(t, L) {
    if (!L.ai) { const lc = t.lc(); L.ai = { lang: L.lang, stage: t.sc.stage, messages: [{ role: 'ai', text: lc.opener, at: Date.now() }], missionsDone: [], said: 0 }; LP.setLesson(t.key, L); }
    return L.ai;
  }
  function renderChat(t, L) {
    const ses = aiSession(t, L), live = navigator.onLine && window.API && API.hasKey();
    return `<section class="card sec chat"><h3>AI와 말하기</h3>
      <p class="hint">${live ? '🌐 AI 선생님과 실제로 대화해요.' : !navigator.onLine ? '📴 오프라인이라 연습용 대화로 진행해요. 인터넷에 연결하면 진짜 AI와 대화할 수 있어요.' : '🔑 설정에서 OpenAI API 키를 넣으면 진짜 AI와 대화해요. 지금은 연습용 대화예요.'}</p>
      <div class="missions">${t.sc.missions.map((m, i) => `<span class="${ses.missionsDone.includes(i + 1) ? 'on' : ''}">${ses.missionsDone.includes(i + 1) ? '✅' : '⬜'} ${esc(m)}</span>`).join('')}</div>
      <div class="msgs" id="msgs">${ses.messages.map(m => `<div class="msg ${m.role}">${m.role === 'ai' ? `<button class="say" data-say="${esc(m.text)}" data-lang="${ses.lang}">🔊</button>` : ''}<span>${esc(m.text)}</span>${m.tip ? `<small class="tipline">💡 ${esc(m.tip)}</small>` : ''}</div>`).join('')}</div>
      <form class="send" id="sendF"><input id="say" autocomplete="off" placeholder="${ses.lang === 'ja' ? '일본어로 말해 보세요' : '영어로 말해 보세요'}"><button class="btn primary" id="sendB">보내기</button></form></section>`;
  }
  function bindChat(t, L) {
    const box = $('#msgs'); box.scrollTop = box.scrollHeight;
    $('#sendF').onsubmit = async e => {
      e.preventDefault(); const inp = $('#say'), text = inp.value.trim(); if (!text) return;
      const ses = aiSession(t, L); ses.messages.push({ role: 'user', text, at: Date.now() }); ses.said++; inp.value = ''; LP.setLesson(t.key, L);
      renderTopic(); $('#sendB').disabled = true; $('#sendB').textContent = '…';
      try {
        const r = await API.reply(t.sc, ses);
        ses.messages.push({ role: 'ai', text: r.text, tip: r.tip, at: Date.now() });
        (r.missions || []).forEach(m => { if (!ses.missionsDone.includes(m)) ses.missionsDone.push(m); });
        if (r.text) speak(r.text, ses.lang);
      } catch (err) { ses.messages.push({ role: 'sys', text: err.message === 'NO_KEY' ? 'API 키가 없어요.' : err.message, at: Date.now() }); }
      LP.setLesson(t.key, L); if (state.view === 'topic' && state.key === t.key) { renderTopic(); const i = $('#say'); if (i) i.focus(); }
    };
  }
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return toast('이 기기는 읽어 주기를 지원하지 않아요');
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'ja' ? 'ja-JP' : 'en-US'; u.rate = 0.9; speechSynthesis.speak(u);
  }
  // 영어 듣기 문제: [[화자, 대사], …]를 차례로 읽는다. 남(M)·여(W)는 목소리(없으면 음높이)를 달리한다
  function speakDialog(lines) {
    if (!('speechSynthesis' in window)) return toast('이 기기는 읽어 주기를 지원하지 않아요');
    speechSynthesis.cancel();
    const en = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    const pickV = re => en.find(v => re.test(v.name));
    const male = pickV(/male(?!.*female)|david|mark|guy|daniel|alex|fred|george|james/i) || en[0];
    const female = pickV(/female|zira|aria|jenny|samantha|karen|susan|hazel|libby|google us english/i) || en.find(v => v !== male) || en[0];
    for (const [who, text] of lines) {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.88;
      const w = String(who).toUpperCase().startsWith('W');
      const v = w ? female : male; if (v) u.voice = v;
      if (male === female || !v) u.pitch = w ? 1.3 : 0.75;
      speechSynthesis.speak(u);
    }
  }
  document.addEventListener('click', e => { const b = e.target.closest('.say'); if (!b) return; e.preventDefault(); if (b.dataset.dlg) { try { speakDialog(JSON.parse(b.dataset.dlg)); } catch (err) {} } else speak(b.dataset.say, b.dataset.lang); });
  // 영어 단어 카드: '가리기'를 켜면 그림만 보이고, 카드를 눌러 단어·뜻을 확인한다(설정은 기기에 기억)
  const vhide = { get: () => localStorage.getItem('lp.vhide') === '1', set: v => { try { localStorage.setItem('lp.vhide', v ? '1' : '0'); } catch (e) {} } };
  function vhideSync() { document.body.classList.toggle('vhide', vhide.get()); $$('.vhide-toggle').forEach(b => (b.textContent = vhide.get() ? '👀 단어 모두 보기' : '🙈 단어 가리고 그림만 보기')); }
  document.addEventListener('click', e => {
    if (e.target.closest('.vhide-toggle')) { vhide.set(!vhide.get()); $$('.vcard.open').forEach(c => c.classList.remove('open')); vhideSync(); return; }
    const c = e.target.closest('.vcard'); if (c && !e.target.closest('.say') && document.body.classList.contains('vhide')) c.classList.toggle('open');
  });
  new MutationObserver(() => { if (document.querySelector('.vhide-toggle:empty')) vhideSync(); }).observe(document.getElementById('view'), { childList: true, subtree: true });

  /* ───────── 수행능력 분석 · 추천 ─────────
     과목마다 지금 단계에서 최근 30일 정답률이 충분히(20문제 이상) 85% 이상이면 다음 단계 선행 학습,
     60% 미만이면 복습(50% 미만이면 한 단계 아래), 그 밖에는 다지기. 단원 단위로는 어려운 문제(4·5)를 80% 이상
     맞힌 단원에서 이어지는 다음 단원(수학은 윗학년 연계 단원)을 추천한다. */
  function analyze() {
    const since = addDays(dkey(), -29), evs = LP.events();
    return SUBJ().map(s => {
      const E = evs.filter(e => e.s === s.id), recent = E.filter(e => e.d >= since), pool = recent.length ? recent : E;
      const byLevel = {}; for (const e of pool) { const c = LP.score(e), b = byLevel[e.g] || (byLevel[e.g] = { n: 0, ok: 0 }); b.n += c.n; b.ok += c.ok; }
      const cur = myLevel(s), at = byLevel[cur] || { n: 0, ok: 0 }, last = E.length ? E[E.length - 1].d : '';
      return { s, E, cur, at, acc: pct(at.ok, at.n), byLevel, last, days: new Set(E.map(e => e.d)).size };
    });
  }
  const LEVEL_IDS = { math: ['e5', 'e6', 'm1', 'm2', 'm3', 'h1', 'h2', 'h3'], science: ['e', 'm1', 'm2', 'm3', 'h1', 'h2', 'h3'], history: ['elem', 'mid', 'high', 'gong'], english: ['m1', 'm2', 'm3', 'h1', 'h2', 'h3'], talk: ['elem', 'middle', 'high', 'adult'] };
  const LEVEL_NAMES = { math: ['초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'], science: ['초등', '중1', '중2', '중3', '고1', '고2', '고3'], history: ['초등', '중등', '고등', '공무원'], english: ['중1', '중2', '중3', '고1', '고2', '고3'], talk: ['초등', '중등', '고등', '일반'] };
  // 목록에 없는 과목이 생겨도 홈이 깨지지 않도록, 불러온 학년 목록으로 대신한다
  const lvIds = subj => LEVEL_IDS[subj] || LP.subjects[subj].grades.map(g => g.id);
  const lvName = (subj, id) => (LEVEL_NAMES[subj] || [])[lvIds(subj).indexOf(id)] || (LP.gradeOf(subj, id) || {}).short || id;
  function recommend() {
    const out = [];
    for (const A of analyze()) {
      const { s, cur, at, acc } = A, ids = lvIds(s.id), i = ids.indexOf(cur), next = ids[i + 1], prev = ids[i - 1];
      if (!A.E.length) { out.push({ subj: s.id, type: 'start', score: 20, level: cur, title: `${s.name} 시작하기 — ${lvName(s.id, cur)}`, text: `아직 기록이 없어요. ${lvName(s.id, cur)} 단계 첫 단원부터 시작해 보세요.` }); continue; }
      if (at.n >= 20 && acc >= 85) {
        if (next) out.push({ subj: s.id, type: 'advance', score: 100 + acc, level: next, title: `${s.name} 선행 학습 — ${lvName(s.id, next)}`, text: `${lvName(s.id, cur)} 단계 ${at.n}문제 정답률 ${acc}%! ${lvName(s.id, next)} 과정을 미리 공부해 보세요.` });
        else out.push({ subj: s.id, type: 'master', score: 90, level: cur, title: `${s.name} 최고 단계 심화`, text: `가장 높은 단계에서 ${acc}%예요. 심화(5) 난이도에 도전해 보세요.` });
      } else if (at.n >= 20 && acc < 60) {
        if (acc < 50 && prev) out.push({ subj: s.id, type: 'down', score: 85, level: prev, title: `${s.name} 기초 다지기 — ${lvName(s.id, prev)}`, text: `${lvName(s.id, cur)} 정답률이 ${acc}%예요. ${lvName(s.id, prev)} 단계로 복습하면 훨씬 수월해져요.` });
        else out.push({ subj: s.id, type: 'review', score: 80, level: cur, title: `${s.name} 복습 — ${lvName(s.id, cur)}`, text: `정답률 ${acc}%예요. 쉬운 난이도로 다시 풀어 80%를 넘겨 보세요.` });
      } else if (at.n >= 20) out.push({ subj: s.id, type: 'keep', score: 40 + acc - 60, level: cur, title: `${s.name} 다지기 — ${lvName(s.id, cur)}`, text: `정답률 ${acc}%예요. 85%를 넘기면 ${next ? lvName(s.id, next) + ' 선행 학습을 추천해요' : '최고 난이도를 추천해요'}.` });
      else out.push({ subj: s.id, type: 'keep', score: 30, level: cur, title: `${s.name} 계속하기 — ${lvName(s.id, cur)}`, text: `최근 ${at.n}문제를 풀었어요. ${20 - at.n}문제 더 풀면 선행 학습 여부를 알려 드려요.` });
      if (A.last && A.last < addDays(dkey(), -7)) out.push({ subj: s.id, type: 'idle', score: 75, level: cur, title: `${s.name} 쉬는 중`, text: `마지막 공부는 ${dayLabel(A.last)}이에요. 오늘 한 단원 해 볼까요?` });
    }
    // 단원 단위 선행: 어려운 문제를 잘 푼 단원 → 이어지는 단원
    for (const [key, sk] of Object.entries(D.skill)) {
      const t = LP.topics[key]; if (!t) continue;
      const hi = [4, 5].reduce((a, l) => (sk[l] ? [a[0] + sk[l][0], a[1] + sk[l][1]] : a), [0, 0]), all = Object.values(sk).reduce((a, r) => [a[0] + r[0], a[1] + r[1]], [0, 0]);
      let why = null;
      if (hi[1] >= 4 && hi[0] / hi[1] >= 0.8) why = `「${t.title}」 응용·심화 ${hi[1]}문제 중 ${hi[0]}개 정답. 다음 내용으로 앞서 가 봐요.`;
      else if (all[1] >= 10 && all[0] / all[1] >= 0.9) why = `「${t.title}」 ${all[1]}문제 중 ${all[0]}개 정답! 한 발 앞서 가 볼 때예요.`;
      if (!why) continue;
      const s = LP.subjects[t.subj], g = LP.gradeOf(t.subj, t.grade);
      let to = s.adv && s.adv(key);
      if (!to || D.prog[to]) { const ng = s.grades[s.grades.indexOf(g) + 1]; to = [...g.topics.slice(g.topics.indexOf(key) + 1), ...(ng ? ng.topics : [])].find(k => !D.prog[k]); }
      if (to && LP.topics[to] && !D.prog[to] && !out.some(o => o.to === to)) out.push({ subj: t.subj, type: 'advance', score: 95, from: key, to, title: `${s.name} 선행 — ${LP.topics[to].title}`, text: why, why });
    }
    return out.sort((a, b) => b.score - a.score);
  }
  const RECO_TAG = { advance: ['🚀', '선행'], master: ['🏆', '심화'], down: ['🧱', '기초'], review: ['🔁', '복습'], keep: ['💪', '다지기'], idle: ['⏰', '다시'], start: ['✨', '시작'] };
  let recos = [];
  function recoCard(r) {
    recos.push(r); const s = LP.subjects[r.subj], [ico, tag] = RECO_TAG[r.type];
    return `<section class="card adv reco" style="--gc:${s.color}"><div class="eyebrow">${ico} ${tag} · ${s.emoji} ${s.name}</div><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p><button class="btn primary" data-reco="${recos.length - 1}">${r.to ? '미리 배우러 가기 →' : r.level !== myLevel(s) ? `${esc(lvName(r.subj, r.level))} 단계로 시작 →` : '공부하러 가기 →'}</button></section>`;
  }
  function bindReco() {
    $$('[data-reco]').forEach(b => b.onclick = () => {
      const r = recos[+b.dataset.reco], s = LP.subjects[r.subj];
      if (r.to) return openTopic(r.to);
      if (r.level && r.level !== myLevel(s)) { LP.setLevel(s.id, r.level); toast(`${s.name}: ${lvName(s.id, r.level)} 단계로 바꿨어요`); }
      go('grade', { subj: s.id, gid: r.level || myLevel(s) });
    });
  }

  /* ───────── 기록 탭 (하나의 학습 기록) ───────── */
  let calMonth = dkey().slice(0, 7), selDay = dkey();
  function renderRecords() {
    appbar('학습 기록', '모든 과목의 기록을 한곳에서'); tabbar('records');
    const sub = state.sub || 'cal', segs = [['cal', '📅 날짜별'], ['reco', '🎯 실력·추천'], ['wrong', '📝 오답 노트'], ['arch', '📦 보관함']];
    recos = [];
    const body = { cal: recCal, reco: recReco, wrong: recWrong, arch: recArch }[sub]();
    $('#view').innerHTML = `<div class="stack"><div class="seg">${segs.map(([k, l]) => `<button data-seg="${k}" class="${k === sub ? 'on' : ''}">${l}</button>`).join('')}</div>${body}</div>`;
    $$('[data-seg]').forEach(b => b.onclick = () => { state.sub = b.dataset.seg; renderRecords(); });
    bindList(); bindReco();
    ({ cal: bindCal, reco: () => {}, wrong: bindWrong, arch: bindArch })[sub]();
  }
  const evLine = e => { const s = LP.subjects[e.s], c = LP.score(e); return `<div class="row"><span class="t">${s.emoji} [${esc(lvName(e.s, e.g))}] ${esc(e.ti)}</span><span class="s ${pct(c.ok, c.n) >= 80 ? 'good' : pct(c.ok, c.n) < 50 ? 'bad' : ''}">${c.ok}/${c.n}${e.ai ? ` · 미션 ${e.ai.m}/${e.ai.n}` : ''} ${'★'.repeat(c.stars)}</span></div>`; };
  function recCal() {
    const evs = LP.events(), byDay = {}; evs.forEach(e => (byDay[e.d] = byDay[e.d] || new Set()).add(e.s));
    const [y, m] = calMonth.split('-').map(Number), first = new Date(y, m - 1, 1).getDay(), nd = new Date(y, m, 0).getDate();
    let cells = DOW.split('').map(d => `<b>${d}</b>`).join('') + '<span></span>'.repeat(first);
    for (let d = 1; d <= nd; d++) { const k = `${calMonth}-${String(d).padStart(2, '0')}`, set = byDay[k]; cells += `<span class="${set ? 'on' : ''} ${k === dkey() ? 'now' : ''} ${k === selDay ? 'sel' : ''}" data-day="${k}">${d}<i>${set ? SUBJ().filter(s => set.has(s.id)).map(s => `<em style="background:${s.color}"></em>`).join('') : ''}</i></span>`; }
    const day = evs.filter(e => e.d === selDay), tot = day.reduce((a, e) => { const c = LP.score(e); return [a[0] + c.ok, a[1] + c.n]; }, [0, 0]);
    const monthDays = [...D.days].filter(k => k.startsWith(calMonth)).length;
    return `<div class="cols"><section class="card sec"><div class="calhead"><button class="btn small" data-mon="-1">◀</button><h3 style="margin:0">${y}년 ${m}월 · ${monthDays}일 공부</h3><button class="btn small" data-mon="1">▶</button></div><div class="cal">${cells}</div>
      <div class="legend">${SUBJ().map(s => `<span><em style="background:${s.color}"></em>${s.name}</span>`).join('')}</div></section>
      <section class="card sec"><h3>${dayLabel(selDay)}</h3>${day.length ? `<p class="hint">${day.length}번 수업 · 문제 ${tot[1]}개 중 ${tot[0]}개 정답 (${pct(tot[0], tot[1])}%)</p><div class="daylog">${day.map(evLine).join('')}</div>` : '<p class="hint">이 날은 공부한 기록이 없어요.</p>'}
        <button class="btn kakao" id="shareDay">💬 이 날 공부한 내용 카톡으로 보내기</button><button class="btn" id="shareWeek">최근 7일 보고서 보내기</button></section></div>`;
  }
  function bindCal() {
    $$('[data-mon]').forEach(b => b.onclick = () => { const [y, m] = calMonth.split('-').map(Number); calMonth = dkey(new Date(y, m - 1 + +b.dataset.mon, 1)).slice(0, 7); renderRecords(); });
    $$('[data-day]').forEach(b => b.onclick = () => { selDay = b.dataset.day; renderRecords(); });
    $('#shareDay').onclick = () => shareDialog(selDay, selDay);
    $('#shareWeek').onclick = () => shareDialog(addDays(dkey(), -6), dkey());
  }
  function recReco() {
    const A = analyze(), rs = recommend();
    const perf = A.map(a => { const s = a.s; return `<div class="perf" style="--gc:${s.color}"><div class="ph"><b>${s.emoji} ${s.name}</b><span class="hint">내 단계 ${esc(lvName(s.id, a.cur))} · 공부한 날 ${a.days}일 · 수업 ${a.E.length}번</span></div>
      ${lvIds(s.id).map(id => { const b = a.byLevel[id]; return b ? `<div class="lvbar2"><span>${lvName(s.id, id)}${id === a.cur ? ' ◀' : ''}</span><span class="bt"><i style="width:${pct(b.ok, b.n)}%"></i><em></em></span><span class="n">${pct(b.ok, b.n)}% <small>(${b.n})</small></span></div>` : ''; }).join('') || '<p class="hint">최근 30일 기록이 없어요.</p>'}</div>`; }).join('');
    const lvAll = [1, 2, 3, 4, 5].map(l => Object.values(D.skill).reduce((a, s) => (s[l] ? [a[0] + s[l][0], a[1] + s[l][1]] : a), [0, 0]));
    return `<div class="cols"><div class="stack"><p class="hint">최근 30일 정답률로 판단해요. 내 단계에서 20문제 이상 풀고 85% 이상이면 다음 단계 선행 학습을 추천합니다.</p>${rs.map(recoCard).join('')}</div>
      <div class="stack"><section class="card sec"><h3>과목별 수행능력 (최근 30일)</h3>${perf}<p class="hint">세로선은 선행 학습 기준(85%)이에요.</p></section>
      <section class="card sec"><h3>난이도별 정답률 (전체 과목)</h3><div class="lvbars">${lvAll.map((r, i) => `<div class="lvbar">${lvTag(i + 1)}<span class="bar"><i style="width:${r[1] ? pct(r[0], r[1]) : 0}%;background:${i >= 3 ? 'var(--hi)' : 'var(--good)'}"></i></span><span class="n">${r[1] ? pct(r[0], r[1]) + '%' : '–'}</span></div>`).join('')}</div></section></div></div>`;
  }
  function recWrong() {
    const ws = Object.entries(D.wrong);
    if (!ws.length) return '<section class="card"><div class="empty">틀린 문제가 없어요. 확인 문제를 풀면 틀린 문제가 여기에 모여요.</div></section>';
    const unloaded = [...new Set(ws.map(([k]) => k.split('/')[0]))].filter(id => !LP.subjects[id].loaded);
    if (unloaded.length) { Promise.all(unloaded.map(LP.load)).then(() => state.view === 'records' && renderRecords()); return '<div class="empty">오답 노트를 불러오는 중…</div>'; }
    return ws.filter(([k]) => LP.topics[k]).map(([k, v]) => { const t = LP.topics[k], s = LP.subjects[t.subj], all = LP.bank(t);
      return `<section class="card sec wq" style="--gc:${s.color}"><div class="eyebrow">${s.emoji} ${esc(LP.gradeOf(t.subj, t.grade).name)} · ${esc(t.title)}</div>${v.slice(0, 8).map(i => { const q = all[i]; return q ? `<div><div class="qt">${lvTag(q.lv)} ${q.q}</div><div class="why" style="display:block;margin-top:6px">정답 ${'①②③④'[q.a]} ${q.o[q.a]}<br>${q.why || ''}</div></div>` : ''; }).join('')}
        <div class="acts"><button data-rv="${k}">틀린 문제 다시 풀기 (${v.length}) →</button></div></section>`; }).join('');
  }
  function bindWrong() {
    $$('[data-rv]').forEach(b => b.onclick = () => { const k = b.dataset.rv, t = LP.topics[k]; const L = { step: 0, ans: {}, mode: 'mix', set: (D.wrong[k] || []).slice(0, 10), review: true, lang: t.talk ? t.lang() : undefined }; L.step = lessonSteps(t, L).findIndex(x => x.k === 'q'); LP.setLesson(k, L); openTopic(k); });
  }
  function recArch() {
    const list = LP.archives();
    return `<section class="card sec"><h3>학습 기록 초기화</h3><p class="hint">초기화하면 지금 기록은 아래 보관함으로 옮겨져요(${LP.GH.on() ? '다른 기기에도 함께 보관' : '이 기기에 보관'}). 언제든 보거나 되돌릴 수 있어요.</p>
      <div class="checks">${SUBJ().map(s => `<label><input type="checkbox" value="${s.id}" checked> ${s.emoji} ${s.name}</label>`).join('')}</div>
      <button class="btn" id="resetBtn" style="color:var(--bad)">선택한 과목 기록 초기화</button></section>
      ${list.length ? list.map(a => { const d = new Date(a.at), sm = a.summary || {}; return `<section class="card sec arch"><div class="eyebrow">${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 보관 · ${esc(a.reason)}</div>
        <p class="hint">${Object.entries(sm.bySubj || {}).map(([id, x]) => `${LP.subjects[id].emoji}${LP.subjects[id].name} 수업 ${x.lessons}번 · ${x.n}문제 ${pct(x.ok, x.n)}%`).join(' / ')}${sm.from ? ` · ${sm.from.slice(5)}~${sm.to.slice(5)}` : ''}</p>
        <div class="navrow"><button class="btn" data-av="${a.id}">날짜별 기록</button><button class="btn" data-ar="${a.id}">되돌리기</button><button class="btn" data-ad="${a.id}" style="color:var(--muted)">삭제</button></div><div class="daylog" id="al-${a.id}" hidden></div></section>`; }).join('')
      : '<section class="card"><div class="empty">아직 보관된 기록이 없어요.</div></section>'}`;
  }
  function bindArch() {
    $('#resetBtn').onclick = () => {
      const ids = $$('.checks input:checked').map(i => i.value); if (!ids.length) return toast('과목을 골라 주세요');
      modal(`<h3>기록을 초기화할까요?</h3><p>${ids.map(id => LP.subjects[id].emoji + ' ' + LP.subjects[id].name).join(', ')}의 지금 기록을 보관함으로 옮기고 새로 시작해요.</p>`, [
        { label: '초기화하기', cls: 'danger', fn: () => { toast(LP.reset(ids) ? '초기화했어요. 이전 기록은 보관함에 있어요' : '옮길 기록이 없었어요'); renderRecords(); } }, { label: '취소' }]);
    };
    $$('[data-av]').forEach(b => b.onclick = () => { const box = $('#al-' + b.dataset.av); if (!box.hidden) { box.hidden = true; return; } const evs = LP.events(b.dataset.av), ds = [...new Set(evs.map(e => e.d))].sort().reverse();
      box.innerHTML = ds.map(k => `<div class="eyebrow" style="margin-top:6px">${dayLabel(k)}</div>${evs.filter(e => e.d === k).map(evLine).join('')}`).join('') || '<p class="hint">기록이 없어요.</p>'; box.hidden = false; });
    $$('[data-ar]').forEach(b => b.onclick = () => modal('<h3>이 기록으로 되돌릴까요?</h3><p>지금 기록은 먼저 보관함에 저장한 뒤 되돌려요.</p>', [{ label: '되돌리기', cls: 'primary', fn: () => { LP.restoreArchive(b.dataset.ar); toast('되돌렸어요'); renderRecords(); } }, { label: '취소' }]));
    $$('[data-ad]').forEach(b => b.onclick = () => modal('<h3>보관 기록을 삭제할까요?</h3><p>삭제하면 되살릴 수 없어요.</p>', [{ label: '삭제', cls: 'danger', fn: () => { LP.deleteArchive(b.dataset.ad); renderRecords(); } }, { label: '취소' }]));
  }

  /* ───────── 보고서 · 카카오톡 ───────── */
  function report(from, to) {
    const evs = LP.events().filter(e => e.d >= from && e.d <= to), who = prof().name || LP.user().id, single = from === to;
    const head = `📚 ${who}의 학습 보고 — ${dayLabel(from)}${single ? '' : ' ~ ' + dayLabel(to)}`;
    if (!evs.length) return { full: `${head}\n\n이 기간에는 공부한 기록이 없어요.`, short: `${head}\n공부 기록 없음` };
    const tot = evs.reduce((a, e) => { const c = LP.score(e); return [a[0] + c.ok, a[1] + c.n]; }, [0, 0]);
    const subs = SUBJ().filter(s => evs.some(e => e.s === s.id));
    const lines = [head, `${subs.map(s => s.emoji + s.name).join(' ')} · 수업 ${evs.length}번 · ${tot[1]}문제 · 정답률 ${pct(tot[0], tot[1])}%`];
    if (!single) lines.push(`공부한 날 ${new Set(evs.map(e => e.d)).size}일 · 연속 ${LP.streak()}일`);
    for (const s of subs) {
      const se = evs.filter(e => e.s === s.id), st = se.reduce((a, e) => { const c = LP.score(e); return [a[0] + c.ok, a[1] + c.n]; }, [0, 0]);
      lines.push('', `${s.emoji} ${s.name} — ${st[1]}문제 ${pct(st[0], st[1])}%`);
      for (const e of se) { const c = LP.score(e); lines.push(` ${pct(c.ok, c.n) >= 80 ? '⭕' : pct(c.ok, c.n) >= 50 ? '🔺' : '❌'} [${lvName(e.s, e.g)}] ${e.ti} ${c.ok}/${c.n}${e.ai ? ` · AI 미션 ${e.ai.m}/${e.ai.n}` : ''}${single ? '' : ` (${e.d.slice(5).replace('-', '/')})`}`); }
    }
    const rs = recommend().filter(r => r.type !== 'start').slice(0, 3);
    if (rs.length) { lines.push('', '🎯 다음 추천'); rs.forEach(r => lines.push(' · ' + r.title)); }
    lines.push('', `누적 ${D.pts}P · 완료 ${Object.keys(D.prog).length}단원 — 통합 학습기`);
    const short = [head, lines[1], ...subs.map(s => { const se = evs.filter(e => e.s === s.id); const st = se.reduce((a, e) => { const c = LP.score(e); return [a[0] + c.ok, a[1] + c.n]; }, [0, 0]); return `${s.emoji}${s.name} ${st[1]}문제 ${pct(st[0], st[1])}%`; })].join('\n').slice(0, 195);
    return { full: lines.join('\n'), short };
  }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } }
  function loadKakaoSdk() { if (window.Kakao) return Promise.resolve(); return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'; s.crossOrigin = 'anonymous'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function sendKakao(rep) {
    if (!navigator.onLine) { const ok = await copyText(rep.full); return toast(ok ? '📴 오프라인이에요. 보고서를 복사해 두었으니 인터넷이 되면 카카오톡에 붙여넣으세요' : '📴 오프라인이에요'); }
    const key = (LP.device.kakaoKey || '').trim(), url = location.href.split('#')[0];
    if (key) { try { await loadKakaoSdk(); if (!Kakao.isInitialized()) Kakao.init(key); await copyText(rep.full); Kakao.Share.sendDefault({ objectType: 'text', text: rep.short, link: { mobileWebUrl: url, webUrl: url }, buttonTitle: '학습기 열기' }); return toast('전체 보고서는 복사해 두었어요. 대화방에 붙여넣으면 자세히 볼 수 있어요'); } catch (e) { toast('카카오 연결에 실패해서 공유창으로 보낼게요'); } }
    if (navigator.share) { try { await navigator.share({ title: '학습 보고', text: rep.full }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const ok = await copyText(rep.full); toast(ok ? '복사했어요! 카카오톡 대화방에 붙여넣기 하세요' : '복사에 실패했어요');
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) setTimeout(() => { location.href = 'kakaotalk://launch'; }, 800);
  }
  function shareDialog(from, to) {
    let range = { from, to }; const t = dkey();
    const draw = () => {
      const rep = report(range.from, range.to);
      modal(`<h3>💬 카카오톡으로 보내기</h3><div class="seg"><button data-r="day" class="${range.from === range.to ? 'on' : ''}">${dayLabel(from === to ? from : t)}</button><button data-r="week" class="${range.from !== range.to ? 'on' : ''}">최근 7일</button></div>
        ${prof().parent ? `<p class="hint">받는 사람: ${esc(prof().parent)}</p>` : ''}<textarea class="rep" readonly>${esc(rep.full)}</textarea>`,
        [{ label: '💬 카카오톡으로 보내기', cls: 'kakao', fn: () => sendKakao(rep) }, { label: '복사하기', keep: true, fn: () => copyText(rep.full).then(ok => toast(ok ? '복사했어요' : '복사 실패')) }, { label: '닫기' }]);
      $$('.modal [data-r]').forEach(b => b.onclick = () => { range = b.dataset.r === 'week' ? { from: addDays(t, -6), to: t } : (from === to ? { from, to } : { from: t, to: t }); draw(); });
    };
    draw();
  }

  /* ───────── 설정 ───────── */
  function renderSettings() {
    const p = prof(), d = LP.device; appbar('설정', `${p.name || ''} (${LP.user().id})`); tabbar('settings');
    $('#view').innerHTML = `<div class="masonry">
      <section class="card sec"><h3>👤 프로필</h3><label class="fld">이름<input id="stName" maxlength="12" value="${esc(p.name || '')}"></label>
        <div class="fld">학년</div><div class="chips" id="stGrade">${GRADES.map(g => `<button class="chip ${p.grade === g ? 'on' : ''}" data-gr="${g}">${g}</button>`).join('')}</div>
        <label class="fld">보고서 받는 사람<input id="stParent" maxlength="12" placeholder="예: 엄마" value="${esc(p.parent || '')}"></label>
        <button class="btn" id="logout">로그아웃 (다른 사용자로 로그인)</button></section>
      <section class="card sec"><h3>📚 과목별 내 단계</h3><p class="hint">오늘의 계획과 추천이 이 단계를 기준으로 나와요.</p>
        ${SUBJ().map(s => `<div class="fld">${s.emoji} ${s.name}</div><div class="chips">${lvIds(s.id).map(id => `<button class="chip ${myLevel(s) === id ? 'on' : ''}" data-lvset="${s.id}:${id}">${lvName(s.id, id)}</button>`).join('')}</div>`).join('')}
        <div class="fld">🗣️ 회화 언어</div>${langSwitch()}</section>
      <section class="card sec"><h3>☁️ 기록 동기화 (GitHub)</h3>${syncFormHTML()}<button class="btn" id="syNow" ${LP.GH.on() ? '' : 'disabled'}>지금 동기화</button></section>
      <section class="card sec"><h3>🤖 회화 AI (OpenAI)</h3><p class="hint">AI와 말하기 단계에서 써요. 키는 이 기기에만 저장되고 OpenAI로만 전송돼요. 없으면 연습용 대화로 진행해요.</p>
        <label class="fld">API 키<input id="stApi" type="password" placeholder="sk-…" value="${esc(d.apiKey)}" autocomplete="off"></label>
        <label class="fld">모델<input id="stModel" value="${esc(d.model || 'gpt-4o-mini')}"></label></section>
      <section class="card sec"><h3>💬 카카오톡 보내기</h3><p class="hint">키 없이도 휴대폰 공유창에서 카카오톡을 고르면 돼요. PC에서는 내용이 복사돼요.</p>
        <label class="fld">카카오 JavaScript 키 (선택)<input id="stKakao" value="${esc(d.kakaoKey)}"></label></section>
      <section class="card sec"><h3>📲 앱 설치 · 오프라인</h3><div id="offlineBox">${offlineHTML()}</div></section></div>`;
    $('#stName').onchange = e => LP.setProfile({ name: e.target.value.trim() });
    $('#stParent').onchange = e => LP.setProfile({ parent: e.target.value.trim() });
    $('#stGrade').onclick = e => { const b = e.target.closest('[data-gr]'); if (!b) return; LP.setProfile({ grade: b.dataset.gr }); renderSettings(); toast(`학년을 ${b.dataset.gr}(으)로 바꿨어요`); };
    $$('[data-lvset]').forEach(b => b.onclick = () => { const [s, id] = b.dataset.lvset.split(':'); LP.setLevel(s, id); renderSettings(); });
    bindLang(); bindSyncForm();
    $('#syNow').onclick = () => { LP.sync(); toast('동기화를 시작했어요'); };
    $('#stApi').onchange = e => { d.apiKey = e.target.value.trim(); LP.saveDevice(); };
    $('#stModel').onchange = e => { d.model = e.target.value.trim() || 'gpt-4o-mini'; LP.saveDevice(); };
    $('#stKakao').onchange = e => { d.kakaoKey = e.target.value.trim(); LP.saveDevice(); };
    $('#logout').onclick = () => { LP.logout(); hist = []; state = { view: 'home' }; render(); };
    bindInstall(); askSW();
  }

  /* ───────── 오프라인 · 설치 ───────── */
  const swOK = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  let offlineStatus = null, installEvt = null;
  if (swOK) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'status') { offlineStatus = e.data; const b = $('#offlineBox'); if (b) { b.innerHTML = offlineHTML(); bindInstall(); } } });
    navigator.serviceWorker.addEventListener('controllerchange', askSW);
  }
  function askSW() { if (swOK) navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('status')); }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  function offlineHTML() {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const st = !swOK ? '⚠️ 이 주소(http)에서는 오프라인 저장이 안 돼요. https 주소로 열어 주세요.' : !offlineStatus ? '오프라인 준비 상태를 확인하는 중…' : offlineStatus.cached >= offlineStatus.total ? `✅ 오프라인 준비 완료 — 파일 ${offlineStatus.total}개를 이 기기에 저장했어요.` : `⏳ 오프라인용 파일 내려받는 중… ${offlineStatus.cached}/${offlineStatus.total}`;
    const how = standalone ? '✅ 앱으로 설치되어 실행 중이에요.' : ios ? '아이폰·아이패드: Safari 공유 버튼 → <b>홈 화면에 추가</b>' : '컴퓨터(크롬·엣지): 주소창 오른쪽 설치 아이콘 · 안드로이드: 메뉴(⋮) → <b>앱 설치</b>';
    return `<p class="hint">${st}</p><p class="hint">${how}</p>${installEvt ? '<button class="btn primary" id="btnInstall">📲 이 기기에 앱 설치</button>' : ''}
      <ul class="netlist"><li>📴 인터넷 없이: 네 과목 수업·문제 전체, 회화 듣기·연습 대화, 기록·추천·보관함</li><li>🌐 인터넷 필요: 회화 AI 대화, 기록 동기화(연결되면 자동), 카카오톡 보내기</li></ul>`;
  }
  function bindInstall() { const b = $('#btnInstall'); if (b) b.onclick = async () => { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; render(); }; }

  /* ───────── 시작 ───────── */
  function preload() { // 첫 화면을 그린 뒤 과목 데이터를 차례로 불러온다(오늘의 계획·진도용)
    LP.order.reduce((p, id) => p.then(() => LP.load(id)).then(() => { if (['home', 'learn'].includes(state.view) && LP.user()) render(); }), Promise.resolve());
  }
  LP.onSync((st, changed) => {
    const chip = $('#netChip'); if (chip) chip.outerHTML = netChip();
    const m = $('#syMsg'); if (m) m.textContent = syncStatusText();
    if (changed && ['home', 'records'].includes(state.view)) render(); // 다른 기기의 기록이 들어왔을 때
  });
  window.addEventListener('online', () => { render(); toast('인터넷에 연결됐어요'); });
  window.addEventListener('offline', () => { const c = $('#netChip'); if (c) c.outerHTML = netChip(); toast('인터넷 없이 공부 중이에요. 기록은 연결되면 자동으로 올라가요'); });
  document.addEventListener('click', e => { if (e.target.closest('#netChip')) { if (LP.user()) { hist = []; go('settings', {}, false); } } });
  if (LP.restore()) { LP.sync(); preload(); }
  render();
  window.App = { report, recommend, go };
})();
