/* 통합 학습기 — 핵심: 과목 데이터 등록, 사용자별 학습 기록(하나의 기록), Firebase 동기화
   ─────────────────────────────────────────────────────────────
   과목(LP.subjects): { id, name, emoji, color, files[], build(), grades[] }
   단원(LP.topics[key]): { key, subj, grade, title, sub, kw, sections[], bank[] | makeBank(), ... }
   문제: { lv:1~5, q:HTML, o:[보기 4개 이하], a:정답 번호, why:해설 }

   사용자 기록(doc) — 기기에 저장(오프라인에서도 공부)하고, 인터넷이 되면 Firebase(js/cloud.js)와 주고받는다
   { v:2, id, uid, status:'pending'|'approved'|'rejected', hash(오프라인 로그인 확인용),
     profile:{name, grade, parent, levels:{과목:단계}, talkLang, mt}, events:{ id: 학습 1회 }, archives:{ id: 보관 정보 } }
   학습 1회(event): { id, at, d:'YYYY-MM-DD', s:과목, t:단원 key, g:단계, ti:단원 이름, m:난이도 모드,
                     q:[[문제 번호, 난이도, 맞음 1/0]], ai?:{m:완료 미션, n:미션 수, said:말한 수}, box:'cur'|보관 id|'del', mt }
   초기화하면 지금 기록의 box를 보관 id로 바꾼다(지우지 않음). 합칠 때는 같은 id 중 mt가 큰 쪽이 이긴다. */
(function () {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const dkey = t => { const d = t ? new Date(t) : new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const J = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
              set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
              del(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } } };

  /* ───────── 과목 데이터 ───────── */
  const LP = { subjects: {}, order: [], topics: {}, totals: J.get('lp.totals', {}) };
  LP.subject = def => { def.grades = []; def.loaded = false; LP.subjects[def.id] = def; LP.order.push(def.id); };
  LP.addGrade = (subj, g) => { g.subj = subj; g.topics = []; LP.subjects[subj].grades.push(g); return g; };
  LP.addTopic = (subj, gid, t) => {
    const s = LP.subjects[subj], g = s.grades.find(x => x.id === gid);
    t.subj = subj; t.grade = gid; t.sections = t.sections || []; LP.topics[t.key] = t; g.topics.push(t.key); return t;
  };
  LP.gradeOf = (subj, gid) => (LP.subjects[subj].grades.find(g => g.id === gid) || null);
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s);
  });
  LP.load = subj => {
    const s = LP.subjects[subj];
    if (s._p) return s._p;
    s._p = (async () => {
      if (s.before) s.before();
      for (const f of s.files) await loadScript(f).catch(e => console.warn('불러오기 실패', e.message));
      s.build(); s.loaded = true;
      LP.totals[subj] = s.grades.reduce((a, g) => a + g.topics.length, 0); J.set('lp.totals', LP.totals);
    })();
    return s._p;
  };
  // 단원의 문제 은행(회화는 언어에 따라 만들어 둔다)
  LP.bank = t => (t.makeBank ? t.makeBank() : t.bank || []);

  /* ───────── 기기 설정(API 키 등, 사용자와 무관) ───────── */
  const DEV_KEY = 'lp.device';
  LP.device = { apiKey: '', model: 'gpt-4o-mini', kakaoKey: '', ...J.get(DEV_KEY, {}) };
  delete LP.device.repo; delete LP.device.token; // 예전 GitHub 동기화 설정은 쓰지 않는다
  LP.saveDevice = () => J.set(DEV_KEY, LP.device);

  /* ───────── 사용자 · 로그인 ─────────
     자동 로그인을 켜면 현재 사용자를 localStorage에, 끄면 sessionStorage(브라우저를 닫으면 사라짐)에 둔다. */
  let doc = null, lessons = {};
  const docKey = id => 'lp.user.' + id;
  const dirtyKey = () => 'lp.dirty.' + doc.id, pullKey = () => 'lp.pull.' + doc.id;
  LP.user = () => doc;
  LP.savedId = () => J.get('lp.savedId', '');
  LP.prefs = () => ({ saveId: true, auto: true, ...J.get('lp.loginPrefs', {}) });
  async function hash(id, pw) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`learner:${id}:${pw}`));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function useDoc(d, auto) {
    doc = d; J.set(docKey(d.id), d);
    try { sessionStorage.setItem('lp.current', d.id); } catch (e) { /* 무시 */ }
    if (auto) J.set('lp.current', d.id); else J.del('lp.current');
    lessons = J.get('lp.lessons.' + d.id, {});
    derive();
  }
  LP.restore = () => {
    let id = J.get('lp.current', null);
    if (!id) try { id = sessionStorage.getItem('lp.current'); } catch (e) { /* 무시 */ }
    const d = id && J.get(docKey(id), null);
    if (d && d.v === 2) { useDoc(d, !!J.get('lp.current', null)); return true; }
    return false;
  };
  LP.logout = async () => {
    J.del('lp.current'); try { sessionStorage.removeItem('lp.current'); } catch (e) { /* 무시 */ }
    doc = null; if (window.Cloud) await Cloud.signOut().catch(() => {});
  };
  const PROFILE_DEFAULT = { name: '', grade: '초5', parent: '', levels: {}, talkLang: 'en', mt: 0 };
  const onlyProfile = p => { const o = { ...PROFILE_DEFAULT }; for (const k of Object.keys(PROFILE_DEFAULT)) if (p && p[k] !== undefined) o[k] = p[k]; return o; };
  // 로그인 / 가입. create가 있으면 새로 가입한다. 반환: 'approved' | 'pending' | 'rejected'
  LP.login = async (id, pw, { create, saveId, auto } = {}) => {
    id = id.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(id)) throw new Error('아이디는 영문 소문자·숫자 2~20자로 정해 주세요');
    if (pw.length < 6) throw new Error('비밀번호는 6자 이상이에요');
    J.set('lp.loginPrefs', { saveId: !!saveId, auto: !!auto });
    if (saveId) J.set('lp.savedId', id); else J.del('lp.savedId');
    const h = await hash(id, pw), local = J.get(docKey(id), null);
    if (!window.Cloud || !Cloud.ready) throw new Error('로그인 서버가 아직 설정되지 않았어요');
    if (!navigator.onLine) { // 인터넷이 없으면 이 기기에서 전에 로그인한 계정만 열 수 있다
      if (!create && local && local.v === 2 && local.hash === h) { useDoc(local, auto); return local.status; }
      throw new Error(create ? '가입은 인터넷에 연결된 상태에서 해 주세요' : '이 기기에서 처음 로그인할 때는 인터넷이 필요해요');
    }
    let uid, prof;
    if (create) { const r = await Cloud.signUp(id, pw, { ...PROFILE_DEFAULT, ...create, mt: Date.now() }, auto); uid = r.uid; prof = r.profile; }
    else { const r = await Cloud.signIn(id, pw, auto); uid = r.uid; prof = await Cloud.getProfile(uid); }
    const d = { v: 2, id, uid, hash: h, status: (prof && prof.status) || 'pending', profile: onlyProfile(prof), events: {}, archives: {} };
    if (local) { // 이 기기에 있던 기록(예전 방식 포함)은 새 계정으로 함께 올린다
      d.events = local.events || {}; d.archives = local.archives || {};
      if (local.v !== 2 || local.uid !== uid) J.set('lp.dirty.' + id, { e: Object.fromEntries(Object.keys(d.events).map(k => [k, 1])), a: Object.fromEntries(Object.keys(d.archives).map(k => [k, 1])) });
      if (local.v !== 2 && local.profile && !prof?.mt) d.profile = onlyProfile({ ...local.profile, mt: Date.now() });
    }
    if (local && local.uid && local.uid !== uid) J.del('lp.pull.' + id);
    useDoc(d, auto); LP.sync(); return d.status;
  };
  // 승인 상태 다시 확인(대기 화면의 '새로고침', 앱 시작 때)
  LP.refreshStatus = async () => {
    if (!doc || !navigator.onLine || !window.Cloud || !Cloud.ready) return doc && doc.status;
    const p = await Cloud.getProfile(doc.uid).catch(() => null);
    if (p) { doc.status = p.status; if ((p.mt || 0) > (doc.profile.mt || 0)) doc.profile = onlyProfile(p); J.set(docKey(doc.id), doc); }
    return doc.status;
  };
  LP.isAdmin = () => !!(doc && window.Cloud && Cloud.isAdminId(doc.id));
  function markDirty(kind, ids) { const d = J.get(dirtyKey(), {}); if (kind === 'p') d.p = 1; else { d[kind] = d[kind] || {}; ids.forEach(i => (d[kind][i] = 1)); } J.set(dirtyKey(), d); }
  LP.changed = () => { J.set(docKey(doc.id), doc); derive(); LP.sync(2500); };
  LP.setProfile = patch => { Object.assign(doc.profile, patch, { mt: Date.now() }); markDirty('p'); LP.changed(); };
  LP.setLevel = (subj, gid) => LP.setProfile({ levels: { ...doc.profile.levels, [subj]: gid } });

  /* 진행 중인 수업(기기에만 저장) */
  LP.lesson = key => lessons[key];
  LP.setLesson = (key, L) => { if (L) lessons[key] = L; else delete lessons[key]; J.set('lp.lessons.' + doc.id, lessons); };
  LP.lessons = () => lessons;

  /* ───────── 기록 ───────── */
  LP.events = (box = 'cur') => Object.values(doc ? doc.events : {}).filter(e => e.box === box && e.t).sort((a, b) => a.at - b.at);
  LP.addEvent = e => { const at = Date.now(); const ev = { id: rid(), at, d: dkey(at), box: 'cur', mt: at, ...e }; doc.events[ev.id] = ev; markDirty('e', [ev.id]); LP.changed(); return ev; };
  LP.score = e => { const n = e.q.length, ok = e.q.filter(x => x[2]).length; return { n, ok, stars: !n ? 3 : ok === n ? 3 : ok >= Math.ceil(n * 0.6) ? 2 : 1 }; };

  // 지금 기록에서 진도·난이도별 실력·오답·포인트를 다시 계산한다
  const D = { prog: {}, skill: {}, wrong: {}, days: new Set(), pts: 0 };
  LP.D = D;
  function derive() {
    D.prog = {}; D.skill = {}; D.wrong = {}; D.days = new Set(); D.pts = 0;
    for (const e of LP.events()) {
      const { n, ok, stars } = LP.score(e);
      const p = D.prog[e.t] || (D.prog[e.t] = { done: false, stars: 0, seen: [], n: 0, ok: 0, times: 0 });
      if (!p.done) D.pts += 20;
      p.done = true; p.stars = Math.max(p.stars, stars); p.n += n; p.ok += ok; p.times++; p.last = e.at;
      p.seen.push(...e.q.map(x => x[0])); if (p.seen.length > 120) p.seen = p.seen.slice(-120);
      const s = D.skill[e.t] || (D.skill[e.t] = {});
      const w = new Set(D.wrong[e.t] || []);
      for (const [qi, lv, good] of e.q) {
        const r = s[lv] || (s[lv] = [0, 0]); r[1]++; if (good) { r[0]++; D.pts += lv * 2; w.delete(qi); } else w.add(qi);
      }
      if (w.size) D.wrong[e.t] = [...w]; else delete D.wrong[e.t];
      D.days.add(e.d);
    }
  }
  LP.derive = derive;
  LP.streak = () => { let n = 0; const d = new Date(); if (!D.days.has(dkey(d))) d.setDate(d.getDate() - 1); while (D.days.has(dkey(d))) { n++; d.setDate(d.getDate() - 1); } return n; };

  /* 초기화 · 보관함 — 기록을 지우지 않고 보관함 상자로 옮긴다 */
  function summarize(evs) {
    const s = {}; for (const e of evs) { const x = s[e.s] || (s[e.s] = { n: 0, ok: 0, lessons: 0, days: new Set() }); const c = LP.score(e); x.n += c.n; x.ok += c.ok; x.lessons++; x.days.add(e.d); }
    for (const k in s) s[k].days = s[k].days.size;
    const ds = evs.map(e => e.d).sort(); return { bySubj: s, from: ds[0] || '', to: ds[ds.length - 1] || '' };
  }
  LP.reset = (subjects, reason = '초기화') => {
    const evs = LP.events().filter(e => subjects.includes(e.s));
    if (!evs.length) return null;
    const now = Date.now(), id = 'a' + rid();
    doc.archives[id] = { id, at: now, reason, subjects, summary: summarize(evs), mt: now };
    for (const e of evs) { e.box = id; e.mt = now; }
    markDirty('e', evs.map(e => e.id)); markDirty('a', [id]);
    for (const k of Object.keys(lessons)) if (LP.topics[k] ? subjects.includes(LP.topics[k].subj) : subjects.includes(k.split('/')[0])) delete lessons[k];
    J.set('lp.lessons.' + doc.id, lessons);
    LP.changed(); return id;
  };
  LP.archives = () => Object.values(doc ? doc.archives : {}).filter(a => !a.deleted).sort((a, b) => b.at - a.at);
  LP.restoreArchive = id => {
    const a = doc.archives[id]; if (!a) return;
    LP.reset(a.subjects, '되돌리기 전 자동 보관');
    const now = Date.now(), evs = LP.events(id);
    for (const e of evs) { e.box = 'cur'; e.mt = now; }
    a.deleted = true; a.mt = now; markDirty('e', evs.map(e => e.id)); markDirty('a', [id]); LP.changed();
  };
  LP.deleteArchive = id => {
    const a = doc.archives[id]; if (!a) return; const now = Date.now(), evs = LP.events(id);
    for (const e of evs) doc.events[e.id] = { id: e.id, box: 'del', mt: now }; // 내용은 지우고 표시만 남긴다(다른 기기와 합칠 때 되살아나지 않게)
    a.deleted = true; a.mt = now; markDirty('e', evs.map(e => e.id)); markDirty('a', [id]); LP.changed();
  };

  /* ───────── Firebase 동기화 ─────────
     바뀐 기록(dirty)을 올리고, 마지막으로 받은 뒤 바뀐 기록을 받아 합친다. 오프라인이면 기다렸다가 연결되면 한다. */
  const newer = (a, b) => (!a ? b : !b ? a : (b.mt || 0) > (a.mt || 0) ? b : a);
  LP.syncState = { st: 'off', at: 0, msg: '' };
  const listeners = new Set();
  LP.onSync = f => listeners.add(f);
  const setState = (st, msg = '') => { Object.assign(LP.syncState, { st, msg }, st === 'ok' ? { at: Date.now() } : {}); listeners.forEach(f => f(LP.syncState)); };
  let timer = null, running = null, again = false;
  LP.sync = (delay = 0) => { if (!doc) return; clearTimeout(timer); timer = setTimeout(run, delay); };
  async function run() {
    if (!doc) return;
    if (!window.Cloud || !Cloud.ready) { setState('off'); return; }
    if (!navigator.onLine) { setState('offline'); return; }
    if (running) { again = true; return; }
    running = (async () => {
      setState('busy');
      try {
        if (!Cloud.current()) { setState('error', '다시 로그인해 주세요'); return; }
        await LP.refreshStatus();
        if (doc.status !== 'approved') { setState('pending'); listeners.forEach(f => f(LP.syncState, true)); return; }
        const dirty = J.get(dirtyKey(), {});
        if (dirty.p) await Cloud.saveProfile(doc.uid, doc.profile);
        const evs = Object.keys(dirty.e || {}).map(k => doc.events[k]).filter(Boolean), arcs = Object.keys(dirty.a || {}).map(k => doc.archives[k]).filter(Boolean);
        if (evs.length || arcs.length) await Cloud.push(doc.uid, evs, arcs);
        // 올리는 사이에 새로 바뀐 것은 남겨 둔다
        const now = J.get(dirtyKey(), {}); evs.forEach(e => now.e && delete now.e[e.id]); arcs.forEach(a => now.a && delete now.a[a.id]); if (dirty.p) delete now.p; J.set(dirtyKey(), now);
        const start = Date.now(), since = J.get(pullKey(), 0);
        const r = await Cloud.pull(doc.uid, Math.max(0, since - 120000)); // 기기 시계 차이를 감안해 2분 겹쳐 받는다
        let changed = false;
        for (const e of r.events) { const m = newer(doc.events[e.id], e); if (m !== doc.events[e.id]) { doc.events[e.id] = m; changed = true; } }
        for (const a of r.archives) { const m = newer(doc.archives[a.id], a); if (m !== doc.archives[a.id]) { doc.archives[a.id] = m; changed = true; } }
        J.set(pullKey(), start);
        if (changed) { J.set(docKey(doc.id), doc); derive(); }
        setState('ok'); if (changed) listeners.forEach(f => f(LP.syncState, true));
      } catch (e) { setState('error', e.message || '잠시 후 다시 시도할게요'); }
    })();
    await running; running = null;
    if (again) { again = false; LP.sync(500); }
  }
  window.addEventListener('online', () => LP.sync(300));
  window.addEventListener('offline', () => setState('offline'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') LP.sync(300); });
  setInterval(() => { if (document.visibilityState === 'visible') LP.sync(); }, 90000);

  Object.assign(LP, { dkey, rid, J });
  window.LP = LP;
})();
