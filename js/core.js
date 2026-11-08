/* 통합 학습기 — 핵심: 과목 데이터 등록, 사용자별 학습 기록(하나의 기록), GitHub 동기화
   ─────────────────────────────────────────────────────────────
   과목(LP.subjects): { id, name, emoji, color, files[], build(), grades[] }
   단원(LP.topics[key]): { key, subj, grade, title, sub, kw, sections[], bank[] | makeBank(), ... }
   문제: { lv:1~5, q:HTML, o:[보기 4개 이하], a:정답 번호, why:해설 }

   사용자 기록(doc) — 기기에 저장하고 GitHub 저장소의 users/<아이디>.json 과 합친다
   { v, id, pass, profile:{name, grade, parent, levels:{과목:단계}, talkLang, mt},
     events:{ id: 학습 1회 }, archives:{ id: 보관 정보 }, mt }
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

  /* ───────── 기기 설정(동기화 정보·API 키 등, 사용자와 무관) ───────── */
  const DEV_KEY = 'lp.device';
  LP.device = { repo: '', token: '', apiKey: '', model: 'gpt-4o-mini', kakaoKey: '', ...J.get(DEV_KEY, {}) };
  LP.saveDevice = () => J.set(DEV_KEY, LP.device);

  /* ───────── 사용자 ───────── */
  let doc = null, lessons = {};
  const docKey = id => 'lp.user.' + id;
  LP.users = () => J.get('lp.users', []);
  LP.user = () => doc;
  async function hash(id, pw) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`learner:${id}:${pw}`));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function useDoc(d) {
    doc = d; J.set(docKey(d.id), d); J.set('lp.current', d.id);
    const us = LP.users().filter(u => u !== d.id); us.unshift(d.id); J.set('lp.users', us.slice(0, 8));
    lessons = J.get('lp.lessons.' + d.id, {});
    derive();
  }
  LP.restore = () => { const id = J.get('lp.current', null), d = id && J.get(docKey(id), null); if (d) { useDoc(d); return true; } return false; };
  LP.logout = () => { J.del('lp.current'); doc = null; };
  // 로그인: 동기화가 켜져 있고 인터넷이 되면 서버 기록을 먼저 확인한다
  LP.login = async (id, pw, create) => {
    id = id.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(id)) throw new Error('아이디는 영문 소문자·숫자 2~20자로 정해 주세요');
    if (pw.length < 4) throw new Error('비밀번호는 4자 이상이에요');
    const h = await hash(id, pw);
    let local = J.get(docKey(id), null), remote = null;
    if (GH.on() && navigator.onLine) {
      try { remote = (await GH.get(id)).doc; } catch (e) { if (e.status === 401 || e.status === 403) throw new Error('GitHub 토큰을 확인해 주세요'); }
    }
    const known = remote || local;
    if (known) {
      if (known.pass !== h) throw new Error('비밀번호가 맞지 않아요');
      useDoc(merge(local, remote)); LP.sync(); return 'login';
    }
    if (!create) return 'new';
    useDoc({ v: 1, id, pass: h, profile: { ...create, levels: {}, talkLang: 'en', mt: Date.now() }, events: {}, archives: {}, mt: Date.now() });
    LP.sync(); return 'created';
  };
  LP.changed = () => { doc.mt = Date.now(); J.set(docKey(doc.id), doc); derive(); LP.sync(2500); };
  LP.setProfile = patch => { Object.assign(doc.profile, patch, { mt: Date.now() }); LP.changed(); };
  LP.setLevel = (subj, gid) => LP.setProfile({ levels: { ...doc.profile.levels, [subj]: gid } });

  /* 진행 중인 수업(기기에만 저장) */
  LP.lesson = key => lessons[key];
  LP.setLesson = (key, L) => { if (L) lessons[key] = L; else delete lessons[key]; J.set('lp.lessons.' + doc.id, lessons); };
  LP.lessons = () => lessons;

  /* ───────── 기록 ───────── */
  // 잠시 따로 있던 '영어 단어'(words) 과목 기록은 영어 과목의 단어 단원으로 옮겨 읽는다
  const fixOld = e => { if (e.s === 'words') { e.s = 'english'; e.t = String(e.t).replace(/^words\/(\w+)-(\d+)$/, 'english/$1-v$2'); } return e; };
  LP.events = (box = 'cur') => Object.values(doc ? doc.events : {}).map(fixOld).filter(e => e.box === box && e.t).sort((a, b) => a.at - b.at);
  LP.addEvent = e => { const at = Date.now(); const ev = { id: rid(), at, d: dkey(at), box: 'cur', mt: at, ...e }; doc.events[ev.id] = ev; LP.changed(); return ev; };
  // 이벤트에서 별·포인트 계산
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
    for (const k of Object.keys(lessons)) if (LP.topics[k] ? subjects.includes(LP.topics[k].subj) : subjects.includes(k.split('/')[0])) delete lessons[k];
    J.set('lp.lessons.' + doc.id, lessons);
    LP.changed(); return id;
  };
  LP.archives = () => Object.values(doc ? doc.archives : {}).filter(a => !a.deleted).sort((a, b) => b.at - a.at);
  LP.restoreArchive = id => {
    const a = doc.archives[id]; if (!a) return;
    LP.reset(a.subjects, '되돌리기 전 자동 보관');
    const now = Date.now();
    for (const e of LP.events(id)) { e.box = 'cur'; e.mt = now; }
    a.deleted = true; a.mt = now; LP.changed();
  };
  LP.deleteArchive = id => {
    const a = doc.archives[id]; if (!a) return; const now = Date.now();
    for (const e of LP.events(id)) doc.events[e.id] = { id: e.id, box: 'del', mt: now }; // 내용은 지우고 표시만 남긴다(다른 기기와 합칠 때 되살아나지 않게)
    a.deleted = true; a.mt = now; LP.changed();
  };

  /* ───────── GitHub 동기화 ─────────
     비공개 저장소 하나에 사용자마다 users/<아이디>.json 파일을 둔다. 토큰은 그 저장소의 Contents 읽기·쓰기 권한만 주면 된다. */
  const GH = {
    on: () => !!(LP.device.repo && LP.device.token),
    url: id => `https://api.github.com/repos/${LP.device.repo}/contents/users/${encodeURIComponent(id)}.json`,
    headers: () => ({ Authorization: `Bearer ${LP.device.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }),
    async get(id) {
      const r = await fetch(GH.url(id) + '?t=' + Date.now(), { headers: GH.headers(), cache: 'no-store' });
      if (r.status === 404) return { doc: null, sha: null };
      if (!r.ok) { const e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
      const j = await r.json();
      let text;
      if (j.content) text = new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\n/g, '')), c => c.charCodeAt(0)));
      else { // 1MB가 넘으면 content가 비어 오므로 원문으로 다시 받는다
        const raw = await fetch(GH.url(id), { headers: { ...GH.headers(), Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
        text = await raw.text();
      }
      return { doc: JSON.parse(text), sha: j.sha };
    },
    async put(id, d, sha) {
      const bytes = new TextEncoder().encode(JSON.stringify(d));
      let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      const r = await fetch(GH.url(id), { method: 'PUT', headers: GH.headers(),
        body: JSON.stringify({ message: `학습 기록 저장: ${id}`, content: btoa(bin), ...(sha ? { sha } : {}) }) });
      if (!r.ok) { const e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
    },
    async test() {
      const r = await fetch(`https://api.github.com/repos/${LP.device.repo}`, { headers: GH.headers(), cache: 'no-store' });
      if (!r.ok) throw new Error(r.status === 404 ? '저장소를 찾을 수 없어요(이름·토큰 권한 확인)' : r.status === 401 ? '토큰이 올바르지 않아요' : 'GitHub 오류 ' + r.status);
      const j = await r.json(); return j.private;
    },
  };
  LP.GH = GH;
  function newer(a, b) { return !a ? b : !b ? a : (b.mt || 0) > (a.mt || 0) ? b : a; }
  function merge(a, b) {
    if (!a) return b; if (!b) return a;
    const out = { ...a, pass: b.pass || a.pass, profile: newer(a.profile, b.profile), events: { ...a.events }, archives: { ...a.archives }, mt: Math.max(a.mt || 0, b.mt || 0) };
    for (const [k, v] of Object.entries(b.events || {})) out.events[k] = newer(out.events[k], v);
    for (const [k, v] of Object.entries(b.archives || {})) out.archives[k] = newer(out.archives[k], v);
    return out;
  }
  LP.merge = merge;
  // 동기화 상태: off | idle | busy | ok | offline | error
  LP.syncState = { st: GH.on() ? 'idle' : 'off', at: 0, msg: '' };
  const listeners = new Set();
  LP.onSync = f => listeners.add(f);
  const setState = (st, msg = '') => { Object.assign(LP.syncState, { st, msg }, st === 'ok' ? { at: Date.now() } : {}); listeners.forEach(f => f(LP.syncState)); };
  let timer = null, running = null, again = false;
  LP.sync = (delay = 0) => {
    if (!doc) return;
    if (!GH.on()) { setState('off'); return; }
    clearTimeout(timer); timer = setTimeout(run, delay);
  };
  async function run() {
    if (!doc) return;
    if (!navigator.onLine) { setState('offline'); return; }
    if (running) { again = true; return; }
    running = (async () => {
      setState('busy');
      for (let tries = 0; tries < 3; tries++) {
        try {
          const { doc: remote, sha } = await GH.get(doc.id);
          const before = JSON.stringify(doc);
          const merged = merge(doc, remote);
          if (JSON.stringify(merged) !== before) { doc = merged; J.set(docKey(doc.id), doc); derive(); listeners.forEach(f => f(LP.syncState, true)); }
          if (!remote || JSON.stringify(merged) !== JSON.stringify(remote)) await GH.put(doc.id, merged, sha);
          setState('ok'); return;
        } catch (e) {
          if (e.status === 409 || e.status === 422) continue; // 다른 기기가 먼저 저장함 → 다시 받아서 합치기
          setState('error', e.status === 401 || e.status === 403 ? '토큰 권한을 확인해 주세요' : e.status === 404 ? '저장소를 찾을 수 없어요' : '잠시 후 다시 시도할게요');
          return;
        }
      }
      setState('error', '다른 기기와 동시에 저장하고 있어요. 잠시 후 다시 시도할게요');
    })();
    await running; running = null;
    if (again) { again = false; LP.sync(500); }
  }
  window.addEventListener('online', () => LP.sync(300));
  window.addEventListener('offline', () => GH.on() && setState('offline'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') LP.sync(300); });
  setInterval(() => { if (document.visibilityState === 'visible') LP.sync(); }, 90000);

  Object.assign(LP, { dkey, rid, J });
  window.LP = LP;
})();
