/* 통합 학습기 — 집중 음악
   음원 파일 없이 Web Audio로 그 자리에서 소리를 만든다 → 용량 0, 인터넷 없이도 재생된다.
   앱바의 🎵 버튼(LPmusic.button())을 누르면 곡 목록 창이 열리고, 곡을 고르면 재생, 다시 누르거나 '정지'로 멈춘다.
   마지막 곡과 음량은 이 기기에 기억한다. */
(function () {
  'use strict';
  const KEY = 'lp-music';
  let ctx = null, master = null, cur = null, curId = null;
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  let vol = saved.vol ?? 0.6;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ vol, last: curId || saved.last })); } catch (e) {} };

  /* ───────── 재료: 잡음 버퍼, 앞당겨 예약하는 반복기 ───────── */
  const bufs = {};
  function noise(kind) { // 8초짜리 스테레오 잡음(white·pink·brown)을 한 번 만들어 둔다
    if (bufs[kind]) return bufs[kind];
    const n = ctx.sampleRate * 8, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w * 0.5;
        else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else { // pink (Paul Kellet)
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
      }
    }
    return (bufs[kind] = b);
  }
  // 끝없이 도는 잡음 → 필터 → 음량. 만든 노드를 모두 list에 넣어 두면 멈출 때 한꺼번에 끊는다
  function bed(list, kind, out, gain, filters = []) {
    const s = ctx.createBufferSource(); s.buffer = noise(kind); s.loop = true;
    const g = ctx.createGain(); g.gain.value = gain;
    let node = s;
    for (const [type, freq, q] of filters) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; node.connect(f); node = f; list.push(f); }
    node.connect(g); g.connect(out); s.start(0, Math.random() * 8); list.push(s, g); // 시작 위치를 달리해 반복이 덜 들리게
    return g;
  }
  function lfo(list, rate, depth, target) { // 느린 흔들림(파도의 밀려옴·빠짐 등)
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = rate; g.gain.value = depth;
    o.connect(g); g.connect(target); o.start(); list.push(o, g); return o;
  }
  // 백그라운드 탭에서도 끊기지 않도록 setTimeout 대신 오디오 시계 기준으로 1.5초 앞까지 미리 예약한다
  function loop(timers, fn, gap) {
    let t = ctx.currentTime + 0.1;
    const tick = () => { while (t < ctx.currentTime + 1.5) { fn(t); t += gap(); } };
    tick(); timers.push(setInterval(tick, 250));
  }
  function burst(out, t, dur, gain, type, freq, q) { // 짧은 잡음 한 번(빗방울·장작 튀는 소리)
    const s = ctx.createBufferSource(); s.buffer = noise('white');
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 7, dur + 0.05);
  }
  function tone(out, t, freq, dur, gain, type = 'sine', attack = 0.02) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function echo(list, out, time, fb, mix) { // 잔향 대신 쓰는 부드러운 메아리
    const inp = ctx.createGain(), d = ctx.createDelay(2), f = ctx.createGain(), lp = ctx.createBiquadFilter(), w = ctx.createGain();
    d.delayTime.value = time; f.gain.value = fb; lp.type = 'lowpass'; lp.frequency.value = 2200; w.gain.value = mix;
    inp.connect(out); inp.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(w); w.connect(out);
    list.push(inp, d, f, lp, w); return inp;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ───────── 곡 목록: 각 곡은 (출력) → 노드 목록에 소리를 붙인다 ─────────
     boost: 곡마다 원래 크기가 달라서 비슷한 크기(약 −14dB)로 맞추는 배율 */
  const TRACKS = [
    { id: 'rain', boost: 5, emoji: '🌧️', name: '빗소리', desc: '창밖에 조용히 내리는 비', make(out, L, T) {
      bed(L, 'pink', out, 0.55, [['highpass', 500], ['lowpass', 5500]]);
      bed(L, 'brown', out, 0.35, [['lowpass', 350]]);
      loop(T, t => burst(out, t, rnd(0.02, 0.06), rnd(0.03, 0.12), 'bandpass', rnd(1800, 5000), 2), () => rnd(0.02, 0.12));
    } },
    { id: 'waves', boost: 3, emoji: '🌊', name: '파도 소리', desc: '밀려왔다 빠지는 바닷가', make(out, L) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; L.push(f);
      const g = bed(L, 'brown', f, 0.45); f.connect(out);
      lfo(L, 1 / 11, 0.35, g.gain); lfo(L, 1 / 11, 600, f.frequency);
      bed(L, 'pink', out, 0.06, [['highpass', 2500]]);
    } },
    { id: 'fire', boost: 4.5, emoji: '🔥', name: '모닥불', desc: '타닥타닥 장작 타는 소리', make(out, L, T) {
      bed(L, 'brown', out, 0.5, [['lowpass', 700]]);
      loop(T, t => { const n = Math.random() < 0.15 ? 3 : 1; for (let i = 0; i < n; i++) burst(out, t + i * rnd(0.01, 0.04), rnd(0.005, 0.03), rnd(0.08, 0.35), 'highpass', rnd(1200, 3500)); }, () => rnd(0.05, 0.45));
    } },
    { id: 'piano', boost: 5, emoji: '🎹', name: '잔잔한 건반', desc: '느리게 흐르는 화음과 멜로디', make(out, L, T) {
      const wet = echo(L, out, 0.42, 0.38, 0.5);
      const CH = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]], SC = [60, 62, 64, 67, 69, 72, 74, 76];
      let c = 0;
      loop(T, t => { CH[c++ % 4].forEach(m => tone(wet, t, hz(m), 9, 0.05, 'sine', 2.5)); }, () => 8);
      loop(T, t => { const m = pick(SC); tone(wet, t, hz(m), 3, 0.09, 'triangle'); tone(wet, t, hz(m + 12), 1.5, 0.02); }, () => pick([0.8, 1.2, 1.6, 2.4]));
    } },
    { id: 'space', boost: 2, emoji: '🌌', name: '우주 앰비언트', desc: '깊고 넓게 퍼지는 배경음', make(out, L) {
      const wet = echo(L, out, 0.9, 0.5, 0.6);
      [[36, 0], [43, 3], [52, 7], [55, -4]].forEach(([m, det]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = hz(m); o.detune.value = det;
        g.gain.value = 0.05; o.connect(g); g.connect(wet); o.start(); L.push(o, g);
        lfo(L, rnd(0.03, 0.08), 0.04, g.gain);
      });
      bed(L, 'pink', out, 0.05, [['bandpass', 900, 0.7]]);
    } },
    { id: 'alpha', boost: 3, emoji: '🧠', name: '알파파', desc: '10Hz 바이노럴 비트 · 이어폰 권장', make(out, L) {
      const mg = ctx.createChannelMerger(2); mg.connect(out); L.push(mg);
      [[200, 0], [210, 1]].forEach(([f, ch]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = 0.18; o.connect(g); g.connect(mg, 0, ch); o.start(); L.push(o, g); });
      bed(L, 'pink', out, 0.08, [['lowpass', 1200]]);
    } },
    { id: 'brown', boost: 3.3, emoji: '🟤', name: '브라운 노이즈', desc: '낮고 묵직한 잡음 · 소음 가리기', make(out, L) { bed(L, 'brown', out, 0.7, [['lowpass', 900]]); } },
    { id: 'pink', boost: 5, emoji: '🩷', name: '핑크 노이즈', desc: '고르고 부드러운 잡음', make(out, L) { bed(L, 'pink', out, 0.45); } },
  ];

  /* ───────── 재생·정지 ───────── */
  // 아이폰·아이패드는 무음 스위치를 켜 두면 Web Audio 소리를 막는다.
  // 소리 종류를 '재생'으로 알리고(사파리 16.4+), 무음 <audio>를 함께 틀어 두면 무음 모드에서도 소리가 난다
  let keepAlive = null;
  function silentWav() {
    const n = 8000, b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (!keepAlive) { keepAlive = new Audio(silentWav()); keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); }
    const p = keepAlive.play(); if (p && p.catch) p.catch(() => {});
  }
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0;
      // 곡마다 소리를 키운 만큼 큰 소리가 깨지지 않도록 마지막에 리미터를 둔다
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.25;
      master.connect(lim); lim.connect(ctx.destination);
    }
    unlock();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return true;
  }
  function stop(fade = 0.8) {
    if (!cur) return;
    const c = cur; cur = null; curId = null;
    const g = c.out.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + fade);
    c.timers.forEach(clearInterval);
    if (keepAlive) keepAlive.pause();
    setTimeout(() => { c.nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); c.out.disconnect(); }, fade * 1000 + 100);
    refresh();
  }
  function play(id) {
    const tr = TRACKS.find(x => x.id === id); if (!tr) return;
    stop();
    if (!ensure()) return toast('이 브라우저는 소리 만들기를 지원하지 않아요');
    const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    const c = { out, nodes: [], timers: [] };
    tr.make(out, c.nodes, c.timers);
    out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(tr.boost || 4, ctx.currentTime + 1.5);
    master.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
    cur = c; curId = id; save(); refresh();
  }
  function setVol(v) { vol = v; if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); save(); }
  function toast(m) { const t = document.getElementById('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); }

  /* ───────── 화면 ───────── */
  const NOTE = '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
  const button = () => `<button class="icon-btn music-btn ${curId ? 'on' : ''}" id="musicBtn" aria-label="집중 음악" title="집중 음악">${NOTE}</button>`;
  let panel = null;
  function panelHtml() {
    const t = TRACKS.find(x => x.id === curId);
    return `<div class="mp-head"><b>🎵 집중 음악</b><button class="mp-x" data-mp="close" aria-label="닫기">✕</button></div>
      <div class="mp-now">${t ? `<span class="eq"><i></i><i></i><i></i></span> ${t.emoji} ${t.name} 재생 중` : '곡을 고르면 바로 재생돼요'}</div>
      <div class="mp-list">${TRACKS.map(x => `<button class="mp-item ${x.id === curId ? 'on' : ''}" data-mp="${x.id}"><span class="em">${x.emoji}</span><span><b>${x.name}</b><small>${x.desc}</small></span><span class="pp">${x.id === curId ? '⏸' : '▶'}</span></button>`).join('')}</div>
      <div class="mp-foot"><span>🔈</span><input type="range" min="0" max="1" step="0.01" value="${vol}" id="mpVol" aria-label="음량"><button class="btn small" data-mp="stop" ${curId ? '' : 'disabled'}>■ 정지</button></div>
      <p class="mp-note">음악은 앱 안에서 만들어져 인터넷 없이도 나와요. 다른 화면으로 가도 계속 재생돼요.</p>`;
  }
  function refresh() {
    const b = document.getElementById('musicBtn'); if (b) b.classList.toggle('on', !!curId);
    if (panel && !panel.hidden) { panel.innerHTML = panelHtml(); bindVol(); }
  }
  function bindVol() { const r = panel.querySelector('#mpVol'); r.oninput = () => setVol(+r.value); }
  function open() {
    if (!panel) {
      panel = document.createElement('div'); panel.className = 'music-panel card'; panel.hidden = true; document.body.appendChild(panel);
      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-mp]'); if (!b) return;
        const k = b.dataset.mp;
        if (k === 'close') close(); else if (k === 'stop') stop(); else if (k === curId) stop(); else play(k);
      });
    }
    panel.hidden = false; panel.innerHTML = panelHtml(); bindVol();
  }
  function close() { if (panel) panel.hidden = true; }
  document.addEventListener('click', e => {
    if (e.target.closest('#musicBtn')) { panel && !panel.hidden ? close() : open(); return; }
    // 곡을 누르면 창 내용을 다시 그려 e.target이 떨어져 나가므로, 클릭 경로로 창 안인지 본다
    if (panel && !panel.hidden && !e.composedPath().includes(panel)) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.LPmusic = { button, play, stop, tracks: TRACKS, get playing() { return curId; } };
})();
