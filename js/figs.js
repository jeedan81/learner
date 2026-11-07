/* 통합 학습기 — 문제 그림 자동 생성
   수학 문제 글에서 도형·치수·식·자료를 읽어 그림(SVG)을 그린다. 그림에는 문제에 주어진 값만 적고 답은 적지 않는다.
   - 보기(선택지)는 읽지 않는다 → 정답 보기를 그림으로 알려 주는 일이 없다
   - 그래프는 모양만 보이고 눈금 숫자는 적지 않는다(절편·꼭짓점을 그림에서 읽어 내지 못하게)
   - 답이 그림에서 바로 보이는 문제(예: 점이 어느 사분면?)는 그리지 않는다
   회화 상황 그림(talkScene)도 여기 있다. 색은 platform.css 토큰만 써서 밝은·어두운 화면 모두에서 보인다. */
(function () {
  'use strict';
  const INK = 'var(--ink)', MUTED = 'var(--muted)', ACC = 'var(--accent)', HI = 'var(--hi)', GOOD = 'var(--good)', LINE = 'var(--line)', SOFT = 'var(--soft)';
  const r1 = v => Math.round(v * 10) / 10;
  const escA = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 폭이 좁은 그림(주사위·동전 등)은 320 폭 가운데에 놓아 다른 그림과 크기를 맞춘다
  const svg = (w, h, body, label) => `<svg viewBox="${w < 320 ? -(320 - w) / 2 : 0} 0 ${Math.max(w, 320)} ${h}" role="img" aria-label="${escA(label)}" font-family="inherit" font-size="14" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
  const tx = (x, y, s, o = {}) => `<text x="${r1(x)}" y="${r1(y)}" fill="${o.c || INK}" stroke="none" text-anchor="${o.a || 'middle'}" dominant-baseline="middle" font-size="${o.s || 14}"${o.b ? ' font-weight="700"' : ''}>${escA(s)}</text>`;
  const ln = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"${o.c ? ` stroke="${o.c}"` : ''}${o.d ? ' stroke-dasharray="5 4"' : ''}${o.w ? ` stroke-width="${o.w}"` : ''}/>`;
  const poly = (pts, o = {}) => `<polygon points="${pts.map(p => p.map(r1).join(',')).join(' ')}" fill="${o.f || SOFT}"${o.c ? ` stroke="${o.c}"` : ''}${o.d ? ' stroke-dasharray="5 4"' : ''}/>`;
  const path = (d, o = {}) => `<path d="${d}" fill="${o.f || 'none'}"${o.c ? ` stroke="${o.c}"` : ''}${o.d ? ' stroke-dasharray="5 4"' : ''}${o.w ? ` stroke-width="${o.w}"` : ''}/>`;
  const dot = (x, y, c = INK, r = 4) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${c}" stroke="none"/>`;
  const rad = d => (d * Math.PI) / 180;
  // 꼭짓점 p에서 a·b 방향 사이의 각 표시(호 + 글자)
  function angMark(p, a, b, label, rr = 22, c = HI) {
    let t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
    let d = t2 - t1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const x1 = p[0] + rr * Math.cos(t1), y1 = p[1] + rr * Math.sin(t1), x2 = p[0] + rr * Math.cos(t1 + d), y2 = p[1] + rr * Math.sin(t1 + d), m = t1 + d / 2;
    return path(`M${r1(x1)} ${r1(y1)} A${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} ${r1(x2)} ${r1(y2)}`, { c }) + (label ? tx(p[0] + (rr + 16) * Math.cos(m), p[1] + (rr + 16) * Math.sin(m), label, { c, s: 13, b: 1 }) : '');
  }
  const rightMark = (p, a, b, s = 12) => { const u = norm(a, p, s), v = norm(b, p, s); return path(`M${r1(p[0] + u[0])} ${r1(p[1] + u[1])} L${r1(p[0] + u[0] + v[0])} ${r1(p[1] + u[1] + v[1])} L${r1(p[0] + v[0])} ${r1(p[1] + v[1])}`, { c: MUTED }); };
  function norm(a, p, s) { const dx = a[0] - p[0], dy = a[1] - p[1], L = Math.hypot(dx, dy) || 1; return [(dx / L) * s, (dy / L) * s]; }
  // 선분 옆에 길이 글자(도형 바깥쪽으로 off만큼)
  function side(a, b, label, off = 16, c = ACC) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return tx(mx + (dy / L) * off, my - (dx / L) * off, label, { c, b: 1 }); }
  const fitScale = (w, h, W, H) => Math.min(W / w, H / h);
  const clampRatio = (a, b, lo = 0.35) => { const m = Math.max(a, b); return [Math.max(a, m * lo), Math.max(b, m * lo)]; };

  /* ───────── 문제 글 다듬기 ───────── */
  function plain(html) {
    return String(html).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<sub>(.*?)<\/sub>/g, '_$1').replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
  }
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', 'ⁿ': 'n' };
  const supFix = s => s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join(''));
  const num = s => parseFloat(String(s).replace(/,/g, ''));
  const unitOf = t => (/cm/.test(t) ? ' cm' : /\bm\b/.test(t) ? ' m' : '');
  // 분수(2/3 m 등)의 앞부분만 읽는 일이 없도록, 바로 뒤에 '/숫자'가 오면 값을 버린다
  const val = (t, re) => { const m = t.match(re); return m && !/^\s*\/\s*\d/.test(t.slice(m.index + m[0].length)) ? num(m[1]) : null; };
  const lab = (v, u) => (v == null ? '' : fmt(v) + u);
  const fmt = v => String(+(+v).toFixed(2));
  const KN = { 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9, 십: 10 };

  /* ───────── 평면도형 ───────── */
  function rectFig(w, h, lw, lh, name) {
    const [a, b] = clampRatio(w, h), k = fitScale(a, b, 220, 130), W = a * k, H = b * k, x = (320 - W) / 2, y = (200 - H) / 2;
    return svg(320, 200, poly([[x, y], [x + W, y], [x + W, y + H], [x, y + H]]) + rightMark([x, y + H], [x, y], [x + W, y + H]) + side([x, y + H], [x + W, y + H], lw, -18) + (lh ? side([x + W, y + H], [x + W, y], lh, -24) : ''), name);
  }
  function triFig(b, h, lb, lh) {
    const [a, c] = clampRatio(b, h), k = fitScale(a, c, 230, 140), W = a * k, H = c * k, x = (320 - W) / 2, y = (200 + H) / 2, px = x + W * 0.32;
    return svg(320, 200, poly([[x, y], [x + W, y], [px, y - H]]) + ln(px, y - H, px, y, { d: 1, c: MUTED }) + rightMark([px, y], [px, y - H], [x + W, y], 9) + side([x, y], [x + W, y], lb, -18) + (lh ? tx(px + 10, y - H / 2, lh, { a: 'start', c: ACC, b: 1 }) : ''), '삼각형');
  }
  function trapFig(a, b, h, la, lb, lh) {
    const m = Math.max(a, b, h), k = Math.min(230 / Math.max(a, b), 130 / Math.max(h, m * 0.35)), A = a * k, B = b * k, H = Math.max(h, m * 0.35) * k, x = (320 - B) / 2, y = (200 + H) / 2, tx0 = x + (B - A) * 0.35;
    return svg(320, 200, poly([[x, y], [x + B, y], [tx0 + A, y - H], [tx0, y - H]]) + ln(tx0, y - H, tx0, y, { d: 1, c: MUTED }) + side([tx0, y - H], [tx0 + A, y - H], la, 16) + side([x, y], [x + B, y], lb, -18) + (lh ? tx(tx0 + 8, y - H / 2, lh, { a: 'start', c: ACC, b: 1 }) : ''), '사다리꼴');
  }
  function paraFig(b, h, lb, lh, names, angLabel) {
    const [a, c] = clampRatio(b, h, 0.45), k = fitScale(a * 1.3, c, 230, 130), W = a * k, H = c * k, s = W * 0.3, x = (320 - W - s) / 2, y = (200 + H) / 2;
    const P = [[x, y], [x + W, y], [x + W + s, y - H], [x + s, y - H]];
    let body = poly(P);
    if (lh) body += ln(x + s, y - H, x + s, y, { d: 1, c: MUTED }) + tx(x + s + 8, y - H / 2, lh, { a: 'start', c: ACC, b: 1 });
    if (lb) body += side(P[0], P[1], lb, -18);
    if (names) body += tx(x - 10, y + 6, names[0]) + tx(x + W + 10, y + 6, names[1]) + tx(x + W + s + 10, y - H - 6, names[2]) + tx(x + s - 10, y - H - 6, names[3]);
    if (angLabel) body += angMark(P[0], P[1], P[3], angLabel);
    return svg(320, 200, body, '평행사변형');
  }
  function rhombusFig(d1, d2, l1, l2) {
    const [a, b] = clampRatio(d1, d2), k = fitScale(a, b, 220, 150), W = a * k, H = b * k, cx = 160, cy = 100;
    return svg(320, 200, poly([[cx - W / 2, cy], [cx, cy - H / 2], [cx + W / 2, cy], [cx, cy + H / 2]]) + ln(cx - W / 2, cy, cx + W / 2, cy, { d: 1, c: MUTED }) + ln(cx, cy - H / 2, cx, cy + H / 2, { d: 1, c: MUTED }) + tx(cx + W / 4, cy + 12, l1, { c: ACC, b: 1 }) + tx(cx + 8, cy - H / 4, l2, { a: 'start', c: ACC, b: 1 }), '마름모');
  }
  function circleFig(r, label, diam) {
    const R = 70, cx = 160, cy = 100;
    return svg(320, 200, `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${SOFT}"/>` + dot(cx, cy) + (diam ? ln(cx - R, cy, cx + R, cy, { c: ACC }) : ln(cx, cy, cx + R, cy, { c: ACC })) + (label ? tx(diam ? cx : cx + R / 2, cy - 14, label, { c: ACC, b: 1 }) : ''), '원');
  }
  function sectorFig(rLabel, deg) {
    const R = 90, cx = 160, cy = 150, a0 = -90 - deg / 2, a1 = -90 + deg / 2, p0 = [cx + R * Math.cos(rad(a0)), cy + R * Math.sin(rad(a0))], p1 = [cx + R * Math.cos(rad(a1)), cy + R * Math.sin(rad(a1))];
    return svg(320, 200, path(`M${cx} ${cy} L${r1(p0[0])} ${r1(p0[1])} A${R} ${R} 0 ${deg > 180 ? 1 : 0} 1 ${r1(p1[0])} ${r1(p1[1])} Z`, { f: SOFT }) + angMark([cx, cy], p0, p1, deg + '°', 20) + (rLabel ? side([cx, cy], p0, rLabel, 16) : ''), '부채꼴');
  }
  function regPolyFig(n, ask) {
    const a0 = -90 + (n % 2 ? 0 : 180 / n), R = 80, cx = 160, cy = 102, P = [...Array(n)].map((_, i) => [cx + R * Math.cos(rad(a0 + (360 * i) / n)), cy + R * Math.sin(rad(a0 + (360 * i) / n))]);
    return svg(320, 200, poly(P) + (ask ? angMark(P[1], P[0], P[2], '?', 18) : ''), `정${n}각형`);
  }

  /* ───────── 입체도형(빗각 투영) ───────── */
  function boxFig(a, b, c, la, lb, lc, name) {
    const m = Math.max(a, b, c), A = Math.max(a, m * 0.4), B = Math.max(b, m * 0.4), C = Math.max(c, m * 0.4), k = Math.min(170 / (A + B * 0.5), 150 / (C + B * 0.5));
    const W = A * k, D = B * k * 0.5, H = C * k, x = (320 - W - D) / 2, y = (200 + H + D) / 2 - 4;
    const f = [[x, y], [x + W, y], [x + W, y - H], [x, y - H]], o = [D, -D];
    const bk = f.map(p => [p[0] + o[0], p[1] + o[1]]);
    let s = poly(f) + poly([f[3], f[2], bk[2], bk[3]], { f: 'none' }) + poly([f[1], bk[1], bk[2], f[2]], { f: 'none' });
    s += ln(f[0][0], f[0][1], bk[0][0], bk[0][1], { d: 1, c: MUTED }) + ln(bk[0][0], bk[0][1], bk[1][0], bk[1][1], { d: 1, c: MUTED }) + ln(bk[0][0], bk[0][1], bk[3][0], bk[3][1], { d: 1, c: MUTED });
    s += (la ? side(f[0], f[1], la, -18) : '') + (lb ? side(f[1], bk[1], lb, -16) : '') + (lc ? side(bk[1], bk[2], lc, -18) : '');
    return svg(320, 200, s, name);
  }
  function cylFig(rl, hl, cone) {
    const cx = 160, rx = 60, ry = 16, top = 40, bot = 160;
    let s = cone
      ? path(`M${cx - rx} ${bot} L${cx} ${top} L${cx + rx} ${bot}`) + ln(cx, top, cx, bot, { d: 1, c: MUTED })
      : `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${SOFT}"/>` + ln(cx - rx, top, cx - rx, bot) + ln(cx + rx, top, cx + rx, bot) + ln(cx, top, cx, bot, { d: 1, c: MUTED });
    s += path(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 0 ${cx + rx} ${bot}`) + path(`M${cx - rx} ${bot} A${rx} ${ry} 0 0 1 ${cx + rx} ${bot}`, { d: 1, c: MUTED });
    s += ln(cx, bot, cx + rx, bot, { c: ACC }) + dot(cx, bot, INK, 3);
    if (rl) s += tx(cx + rx / 2, bot + 26, rl, { c: ACC, b: 1 });
    if (hl) s += tx(cx + 8, (top + bot) / 2, hl, { a: 'start', c: ACC, b: 1 });
    return svg(320, 200, s, cone ? '원뿔' : '원기둥');
  }
  function sphereFig(rl) {
    const cx = 160, cy = 100, R = 75;
    return svg(320, 200, `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${SOFT}"/>` + path(`M${cx - R} ${cy} A${R} 20 0 0 0 ${cx + R} ${cy}`) + path(`M${cx - R} ${cy} A${R} 20 0 0 1 ${cx + R} ${cy}`, { d: 1, c: MUTED }) + dot(cx, cy, INK, 3) + ln(cx, cy, cx + R, cy, { c: ACC }) + (rl ? tx(cx + R / 2, cy - 14, rl, { c: ACC, b: 1 }) : ''), '구');
  }
  function prismFig(n, pyramid) {
    const cx = 160, rx = 75, ry = 22, bot = 160, top = 40;
    const base = [...Array(n)].map((_, i) => { const t = rad(90 + (360 * i) / n); return [cx + rx * Math.cos(t), bot + ry * Math.sin(t)]; });
    const hidden = i => base[i][1] < bot - 2; // 뒤쪽 꼭짓점
    let s = '';
    for (let i = 0; i < n; i++) { const a = base[i], b = base[(i + 1) % n]; s += ln(a[0], a[1], b[0], b[1], hidden(i) && hidden((i + 1) % n) ? { d: 1, c: MUTED } : {}); }
    if (pyramid) base.forEach((p, i) => (s += ln(p[0], p[1], cx, top, hidden(i) ? { d: 1, c: MUTED } : {})));
    else {
      const up = base.map(p => [p[0], p[1] - (bot - top - ry)]);
      for (let i = 0; i < n; i++) { const a = up[i], b = up[(i + 1) % n]; s += ln(a[0], a[1], b[0], b[1]); s += ln(base[i][0], base[i][1], up[i][0], up[i][1], hidden(i) ? { d: 1, c: MUTED } : {}); }
    }
    return svg(320, 200, s, pyramid ? '각뿔' : '각기둥');
  }

  /* ───────── 각 ───────── */
  function crossFig(deg) {
    const c = [160, 100], L = 120, t = rad(deg), a = [c[0] + L, c[1]], b = [c[0] - L, c[1]], p = [c[0] + L * 0.8 * Math.cos(-t), c[1] + L * 0.8 * Math.sin(-t)], q = [c[0] - L * 0.8 * Math.cos(-t), c[1] - L * 0.8 * Math.sin(-t)];
    return svg(320, 200, ln(b[0], b[1], a[0], a[1]) + ln(q[0], q[1], p[0], p[1]) + angMark(c, a, p, deg + '°', 24) + angMark(c, b, q, '?', 24, ACC), '두 직선이 만나는 각');
  }
  function parallelFig(deg) {
    const y1 = 70, y2 = 140, t = rad(deg), dx = 70 / Math.tan(t), x1 = 160 - dx / 2, x2 = 160 + dx / 2;
    const P = [x1 + (y1 - 70) * 0, y1], Q = [x2, y2];
    const ext = 30 / Math.tan(t);
    return svg(320, 200, ln(30, y1, 290, y1) + ln(30, y2, 290, y2) + tx(300, y1, 'l', { c: MUTED }) + tx(300, y2, 'm', { c: MUTED })
      + ln(P[0] - ext, y1 - 30, Q[0] + ext, y2 + 30) + angMark(P, [290, y1], [P[0] - ext, y1 - 30], deg + '°', 22) + angMark(Q, [290, y2], [P[0] - ext, y1 - 30], '', 22, ACC), '평행선과 한 직선');
  }
  function isoFig(apex, base) {
    const A = [160, 30], B = [80, 170], C = [240, 170];
    let s = poly([A, B, C]) + tx(A[0], A[1] - 14, 'A') + tx(B[0] - 12, B[1] + 6, 'B') + tx(C[0] + 12, C[1] + 6, 'C');
    s += side(A, B, '', 0) + `<g stroke="${MUTED}">${ln(118, 98, 126, 104)}${ln(194, 104, 202, 98)}</g>`;
    if (apex) s += angMark(A, B, C, apex + '°', 26);
    if (base) s += angMark(B, C, A, base + '°', 24);
    return svg(320, 200, s, '이등변삼각형');
  }
  function centerFig(kind, ang) {
    const A = [130, 30], B = [50, 170], C = [270, 170];
    let s = poly([A, B, C]) + tx(A[0], A[1] - 14, 'A') + tx(B[0] - 12, B[1] + 6, 'B') + tx(C[0] + 12, C[1] + 6, 'C');
    const a = Math.hypot(B[0] - C[0], B[1] - C[1]), b = Math.hypot(A[0] - C[0], A[1] - C[1]), c = Math.hypot(A[0] - B[0], A[1] - B[1]);
    let P;
    if (kind === 'I') { P = [(a * A[0] + b * B[0] + c * C[0]) / (a + b + c), (a * A[1] + b * B[1] + c * C[1]) / (a + b + c)]; const r = Math.abs(170 - P[1]); s += `<circle cx="${r1(P[0])}" cy="${r1(P[1])}" r="${r1(r)}" stroke="${MUTED}" stroke-dasharray="5 4"/>`; }
    else { const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])), sq = p => p[0] * p[0] + p[1] * p[1]; P = [(sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d, (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d]; }
    s += ln(P[0], P[1], B[0], B[1], { c: MUTED }) + ln(P[0], P[1], C[0], C[1], { c: MUTED }) + dot(P[0], P[1], ACC) + tx(P[0], P[1] - 14, kind, { c: ACC, b: 1 });
    if (ang) s += angMark(A, B, C, ang + '°', 22);
    return svg(320, 200, s, kind === 'I' ? '삼각형의 내심' : '삼각형의 외심');
  }
  function circAngFig(center, inscribed) {
    const cx = 160, cy = 105, R = 80, a = rad(150), b = rad(30), A = [cx + R * Math.cos(a), cy + R * Math.sin(a)], B = [cx + R * Math.cos(b), cy + R * Math.sin(b)], P = [cx + R * Math.cos(rad(-100)), cy + R * Math.sin(rad(-100))], O = [cx, cy];
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}"/>` + ln(O[0], O[1], A[0], A[1], { c: MUTED }) + ln(O[0], O[1], B[0], B[1], { c: MUTED }) + ln(P[0], P[1], A[0], A[1]) + ln(P[0], P[1], B[0], B[1]) + dot(O[0], O[1]);
    s += tx(A[0] - 12, A[1] + 8, 'A') + tx(B[0] + 12, B[1] + 8, 'B') + tx(P[0], P[1] - 14, 'P') + tx(O[0] - 12, O[1] - 2, 'O');
    s += angMark(O, A, B, center ? center + '°' : '', 18) + angMark(P, A, B, inscribed ? inscribed + '°' : '?', 26, ACC);
    return svg(320, 210, s, '원의 중심각과 원주각');
  }
  function cyclicFig(angA) {
    const cx = 160, cy = 105, R = 85, pt = d => [cx + R * Math.cos(rad(d)), cy + R * Math.sin(rad(d))], A = pt(200), B = pt(110), C = pt(-20), D = pt(-110);
    return svg(320, 210, `<circle cx="${cx}" cy="${cy}" r="${R}"/>` + poly([A, B, C, D]) + tx(A[0] - 12, A[1], 'A') + tx(B[0], B[1] + 14, 'B') + tx(C[0] + 12, C[1], 'C') + tx(D[0], D[1] - 14, 'D') + angMark(A, B, D, angA + '°', 22) + angMark(C, D, B, '?', 22, ACC), '원에 내접하는 사각형');
  }
  function tangentFig(len) {
    const cx = 120, cy = 100, R = 60, P = [290, 100], d = P[0] - cx, t = Math.acos(R / d), A = [cx + R * Math.cos(-t), cy + R * Math.sin(-t)], B = [cx + R * Math.cos(t), cy + R * Math.sin(t)];
    return svg(320, 200, `<circle cx="${cx}" cy="${cy}" r="${R}"/>` + dot(cx, cy) + tx(cx - 12, cy, 'O') + ln(P[0], P[1], A[0], A[1]) + ln(P[0], P[1], B[0], B[1]) + dot(P[0], P[1]) + tx(P[0] + 8, P[1], 'P', { a: 'start' }) + tx(A[0], A[1] - 14, 'A') + tx(B[0], B[1] + 14, 'B') + (len ? side(A, P, len, 14) : '') + side(B, P, '?', -14, HI), '원 밖의 점에서 그은 두 접선');
  }
  function rightTriFig(la, lb, lc, angA) {
    const B = [70, 160], C = [250, 160], A = [70, 40];
    let s = poly([A, B, C]) + rightMark(B, A, C) + tx(A[0] - 12, A[1], 'A') + tx(B[0] - 12, B[1] + 6, 'B') + tx(C[0] + 12, C[1] + 6, 'C');
    if (la) s += side(A, B, la, 18); if (lb) s += side(B, C, lb, -18); if (lc) s += side(A, C, lc, -18, HI);
    if (angA) s += angMark(C, B, A, angA, 34);
    return svg(320, 200, s, '직각삼각형');
  }
  function equiFig(l) {
    const A = [160, 30], B = [80, 168], C = [240, 168];
    return svg(320, 200, poly([A, B, C]) + ln(160, 30, 160, 168, { d: 1, c: MUTED }) + rightMark([160, 168], [160, 30], C, 9) + side(B, C, l, -18) + tx(168, 110, '?', { a: 'start', c: HI, b: 1 }), '정삼각형과 높이');
  }

  /* ───────── 좌표평면·그래프 ───────── */
  function plane(R, body, label, noTicks) {
    const S = 180, c = S / 2 + 20, k = S / (2 * R);
    let g = '';
    for (let i = -R; i <= R; i++) { if (!i) continue; const p = c + i * k; g += ln(p, c - S / 2, p, c + S / 2, { c: LINE, w: 1 }) + ln(c - S / 2, p, c + S / 2, p, { c: LINE, w: 1 }); }
    g += ln(c - S / 2 - 6, c, c + S / 2 + 8, c, { c: MUTED, w: 1.5 }) + ln(c, c + S / 2 + 6, c, c - S / 2 - 8, { c: MUTED, w: 1.5 }) + tx(c + S / 2 + 14, c, 'x', { c: MUTED }) + tx(c, c - S / 2 - 14, 'y', { c: MUTED }) + tx(c - 8, c + 10, 'O', { c: MUTED, s: 12 });
    if (!noTicks) g += tx(c + k, c + 12, '1', { c: MUTED, s: 11 });
    const X = x => c + x * k, Y = y => c - y * k;
    return svg(S + 40, S + 40, g + body(X, Y, k, c), label);
  }
  function pointsFig(pts) {
    const R = Math.max(5, ...pts.flatMap(p => [Math.abs(p[0]), Math.abs(p[1])]).map(v => Math.ceil(v)));
    if (R > 12) return '';
    return plane(R, (X, Y) => pts.map((p, i) => dot(X(p[0]), Y(p[1]), i ? ACC : HI, 4.5) + tx(X(p[0]) + 6, Y(p[1]) - 12, `(${fmt(p[0])}, ${fmt(p[1])})`, { a: 'start', s: 12, b: 1 })).join(''), '좌표평면 위의 점');
  }
  function vecFig(vs) {
    const R = Math.max(4, ...vs.flatMap(v => [Math.abs(v[1]), Math.abs(v[2])]).map(Math.ceil)); if (R > 10) return '';
    return plane(R, (X, Y) => vs.map(([n, x, y], i) => { const c = i ? ACC : HI; return ln(X(0), Y(0), X(x), Y(y), { c, w: 2.5 }) + dot(X(x), Y(y), c, 3.5) + tx(X(x) + 8, Y(y) - 10, n, { a: 'start', c, b: 1 }); }).join(''), '좌표평면 위의 벡터');
  }
  // 식 → 함수. 숫자·x·사칙연산·괄호·거듭제곱·sin/cos/tan/log/ln/e/√ 만 허용
  function toFn(expr) {
    let e = supFix(expr).replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 8320)).replace(/\s+/g, '').replace(/(sin|cos|tan)(\d*x)/g, '$1($2)').replace(/·/g, '*').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, '(PI)').replace(/√\(/g, 'sqrt(').replace(/√(\d+|x)/g, 'sqrt($1)');
    e = e.replace(/log_?(\d+)\(([^()]*)\)/g, '(log($2)/log($1))').replace(/log_?(\d+)x/g, '(log(x)/log($1))').replace(/ln/g, 'log');
    if (!/^[0-9x+\-*/().^a-zPI]*$/.test(e) || /[a-wyz]/.test(e.replace(/sqrt|sin|cos|tan|log|e\^|PI/g, ''))) return null;
    e = e.replace(/e\^/g, 'E^');
    e = e.replace(/(\d|x|\))(?=(x|\(|sin|cos|tan|log|sqrt|E|PI))/g, '$1*').replace(/(x)(?=\d)/g, '$1*');
    e = e.replace(/\^\(([^()]*)\)/g, '**($1)').replace(/\^(-?[\d.x]+)/g, '**($1)').replace(/E\*\*/g, 'E**').replace(/\bE\b/g, 'Math.E');
    e = e.replace(/(sin|cos|tan|log|sqrt)/g, 'Math.$1').replace(/PI/g, 'Math.PI');
    if (/\^/.test(e)) return null;
    // -x**2 는 JS에서 문법 오류 → (-x)**2 로 잘못 읽히지 않게 앞에 0을 붙여 0-x**2 로
    e = e.replace(/(^|\()-/g, '$10-');
    try { const f = new Function('x', `"use strict";return (${e});`); const t = f(1.3); return typeof t === 'number' ? f : null; } catch (err) { return null; }
  }
  function graphFig(fns, range = 5, trig) {
    const R = range, S = 180, c = S / 2 + 20, kx = S / (2 * R);
    const ys = [];
    fns.forEach(f => { for (let i = 0; i <= 200; i++) { const y = f(-R + (2 * R * i) / 200); if (isFinite(y)) ys.push(y); } });
    if (ys.length < 50) return '';
    let Ry = Math.max(...ys.map(Math.abs)); Ry = Math.min(Math.max(Ry * 1.1, 2), 12); if (trig) Ry = Math.max(Ry, 1.5);
    const ky = S / (2 * Ry), X = x => c + x * kx, Y = y => c - y * ky;
    let g = '';
    g += ln(c - S / 2 - 6, c, c + S / 2 + 8, c, { c: MUTED, w: 1.5 }) + ln(c, c + S / 2 + 6, c, c - S / 2 - 8, { c: MUTED, w: 1.5 }) + tx(c + S / 2 + 14, c, 'x', { c: MUTED }) + tx(c, c - S / 2 - 14, 'y', { c: MUTED }) + tx(c - 8, c + 10, 'O', { c: MUTED, s: 12 });
    const cols = [ACC, HI];
    fns.forEach((f, j) => {
      let d = '', pen = false, py = null;
      for (let i = 0; i <= 400; i++) {
        const x = -R + (2 * R * i) / 400, y = f(x);
        const ok = isFinite(y) && Math.abs(y) <= Ry * 1.05 && !(py != null && Math.abs(y - py) > Ry);
        if (ok) { d += (pen ? 'L' : 'M') + r1(X(x)) + ' ' + r1(Y(y)); pen = true; } else pen = false;
        py = isFinite(y) ? y : null;
      }
      if (d) g += path(d, { c: cols[j % 2], w: 2.5 });
    });
    return svg(S + 40, S + 40, g, '함수의 그래프');
  }
  function conicFig(kind, A, B) { // 타원·쌍곡선: x²/A ± y²/B = 1, 포물선: y² = A x (B='y2') 또는 x² = A y
    const R = Math.ceil(Math.max(Math.sqrt(Math.abs(A)), Math.sqrt(Math.abs(B || 1)), 3) * 1.5);
    return plane(R, (X, Y) => {
      let d = '';
      const P = pts => pts.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ' ' + r1(Y(p[1]))).join('');
      const rng = n => [...Array(n + 1)].map((_, i) => i / n);
      if (kind === 'ellipse') { const a = Math.sqrt(A), b = Math.sqrt(B); d = P(rng(80).map(t => [a * Math.cos(2 * Math.PI * t), b * Math.sin(2 * Math.PI * t)])) + 'Z'; }
      else if (kind === 'hyper') { const a = Math.sqrt(A), b = Math.sqrt(B), m = Math.acosh(R / a); [1, -1].forEach(s => (d += P(rng(60).map(t => { const u = -m + 2 * m * t; return [s * a * Math.cosh(u), b * Math.sinh(u)]; })))); }
      else if (kind === 'parY') { d = P(rng(60).map(t => { const y = -R + 2 * R * t; return [(y * y) / A, y]; }).filter(p => Math.abs(p[0]) <= R)); }
      else { d = P(rng(60).map(t => { const x = -R + 2 * R * t; return [x, (x * x) / A]; }).filter(p => Math.abs(p[1]) <= R)); }
      return path(d, { c: ACC, w: 2.5 });
    }, '이차곡선', true);
  }
  function circEqFig(a, b, r) {
    const R = Math.ceil(Math.max(Math.abs(a) + r, Math.abs(b) + r, 3) + 1); if (R > 12) return '';
    return plane(R, (X, Y, k) => `<circle cx="${r1(X(a))}" cy="${r1(Y(b))}" r="${r1(r * k)}" stroke="${ACC}" stroke-width="2.5"/>` + dot(X(a), Y(b), ACC, 3), '좌표평면 위의 원', true);
  }

  /* ───────── 자료·확률·집합·수직선 ───────── */
  function barsFig(vals) {
    const n = vals.length, mx = Math.max(...vals), mn = Math.min(0, ...vals), W = 280, bw = Math.min(40, (W - 20) / n - 8), k = 130 / (mx - mn || 1);
    let s = ln(20, 165, 300, 165, { c: MUTED });
    vals.forEach((v, i) => { const x = 20 + ((W - 10) * (i + 0.5)) / n - bw / 2, h = (v - mn) * k; s += `<rect x="${r1(x)}" y="${r1(165 - h)}" width="${r1(bw)}" height="${r1(h)}" rx="3" fill="${ACC}" fill-opacity=".75" stroke="none"/>` + tx(x + bw / 2, 165 - h - 10, fmt(v), { s: 12, b: 1 }); });
    return svg(320, 190, s, '자료 막대그림');
  }
  function diceFig(n) {
    const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    const faces = [5, 3, 6].slice(0, n), W = faces.length * 90 + 20;
    return svg(W, 110, faces.map((f, i) => { const x = 20 + i * 90, y = 15; return `<rect x="${x}" y="${y}" width="70" height="70" rx="12" fill="${SOFT}"/>` + pips[f].map(([a, b]) => dot(x + 35 + a * 20, y + 35 + b * 20, INK, 6)).join(''); }).join(''), `주사위 ${n}개`);
  }
  function coinsFig(n) {
    n = Math.min(n, 5); const W = n * 80 + 20;
    return svg(W, 100, [...Array(n)].map((_, i) => `<circle cx="${60 + i * 80 - 10}" cy="50" r="32" fill="${SOFT}" stroke="var(--hi)"/><circle cx="${60 + i * 80 - 10}" cy="50" r="24" stroke="var(--hi)" stroke-width="1"/>` + tx(60 + i * 80 - 10, 51, '?', { c: HI, b: 1, s: 18 })).join(''), `동전 ${n}개`);
  }
  function cardsFig(a, b) {
    const n = b - a + 1; if (n < 2 || n > 12) return '';
    const cw = Math.min(40, 300 / n - 4), W = n * (cw + 4) + 16;
    return svg(W, 80, [...Array(n)].map((_, i) => { const x = 10 + i * (cw + 4); return `<rect x="${r1(x)}" y="12" width="${r1(cw)}" height="56" rx="6" fill="${SOFT}"/>` + tx(x + cw / 2, 41, String(a + i), { b: 1, s: 15 }); }).join(''), `${a}부터 ${b}까지 적힌 카드`);
  }
  const BALL = { 빨간: 'var(--bad)', 파란: 'var(--accent)', 흰: '#ffffff', 검은: '#333a4d', 노란: '#f5b400', 초록: 'var(--good)' };
  function ballsFig(list) {
    const all = list.flatMap(([c, n]) => Array(Math.min(n, 10)).fill(c)); if (!all.length || all.length > 20) return '';
    const per = Math.min(all.length, 7), rows = Math.ceil(all.length / per);
    let s = path(`M70 40 Q60 150 160 160 Q260 150 250 40`, { f: SOFT }) + path('M60 40 Q160 20 260 40', { c: MUTED });
    all.forEach((c, i) => { const r = Math.floor(i / per), k = i % per, nr = Math.min(per, all.length - r * per), x = 160 + (k - (nr - 1) / 2) * 26, y = 140 - r * 26 - (rows > 3 ? 0 : 0); s += `<circle cx="${r1(x)}" cy="${y}" r="11" fill="${BALL[c]}" stroke="${INK}" stroke-width="1.5"/>`; });
    return svg(320, 180, s, '주머니 속 공');
  }
  function vennFig(three) {
    let s = `<circle cx="125" cy="${three ? 85 : 100}" r="65" fill="${ACC}" fill-opacity=".12" stroke="${ACC}"/><circle cx="195" cy="${three ? 85 : 100}" r="65" fill="${HI}" fill-opacity=".12" stroke="${HI}"/>`;
    s += tx(80, three ? 40 : 45, 'A', { c: ACC, b: 1, s: 16 }) + tx(240, three ? 40 : 45, 'B', { c: HI, b: 1, s: 16 });
    if (three) s += `<circle cx="160" cy="140" r="65" fill="${GOOD}" fill-opacity=".12" stroke="${GOOD}"/>` + tx(160, 195, 'C', { c: GOOD, b: 1, s: 16 });
    return svg(320, three ? 215 : 200, `<rect x="20" y="10" width="280" height="${three ? 195 : 180}" rx="8" stroke="${MUTED}"/>` + tx(32, 24, 'U', { c: MUTED, s: 12 }) + s, '벤 다이어그램');
  }
  function numLineFig(nums) {
    const R = Math.max(5, ...nums.map(v => Math.ceil(Math.abs(v)))); if (R > 12) return '';
    const k = 280 / (2 * R), X = v => 160 + v * k;
    let s = ln(10, 60, 310, 60, { c: INK });
    for (let i = -R; i <= R; i++) s += ln(X(i), 54, X(i), 66, { c: i ? MUTED : INK, w: i ? 1.5 : 2.5 }) + (i % (R > 8 ? 2 : 1) === 0 ? tx(X(i), 82, String(i).replace('-', '−'), { s: 11, c: MUTED }) : '');
    nums.forEach((v, i) => (s += dot(X(v), 60, i ? ACC : HI, 5)));
    return svg(320, 100, s, '수직선');
  }
  function ratioFig(parts, total) {
    const sum = parts.reduce((a, b) => a + b, 0); if (sum > 30 || sum < 2) return '';
    const W = 280, u = W / sum; let x = 20, s = '';
    parts.forEach((p, i) => { for (let j = 0; j < p; j++) { s += `<rect x="${r1(x)}" y="50" width="${r1(u)}" height="40" fill="${i ? HI : ACC}" fill-opacity="${i ? 0.35 : 0.55}" stroke="${INK}" stroke-width="1"/>`; x += u; } });
    let xx = 20; parts.forEach((p, i) => { s += tx(xx + (p * u) / 2, 110, String(p), { b: 1, c: i ? HI : ACC }); xx += p * u; });
    if (total) s += path(`M20 40 L20 32 L300 32 L300 40`, { c: MUTED }) + tx(160, 20, total, { b: 1 });
    return svg(320, 130, s, '비율 막대');
  }
  function seqFig(vals) { // 주어진 항만 점으로, 다음 항 자리는 ?
    const n = vals.length + 1, mx = Math.max(...vals.map(Math.abs), 1), X = i => 40 + (250 * i) / (n - 1), Y = v => 100 - (v / mx) * 70;
    let s = ln(20, 100, 305, 100, { c: MUTED });
    vals.forEach((v, i) => (s += ln(X(i), 100, X(i), Y(v), { c: LINE }) + dot(X(i), Y(v), ACC, 5) + tx(X(i), Y(v) + (v < 0 ? 16 : -14), fmt(v), { s: 12, b: 1 }) + tx(X(i), 188, `${i + 1}항`, { s: 11, c: MUTED })));
    s += tx(X(n - 1), 100 - 20, '?', { c: HI, b: 1, s: 18 }) + tx(X(n - 1), 188, '…', { s: 11, c: MUTED });
    return svg(320, 200, s, '수열의 항');
  }
  function pieFig(pct) {
    const cx = 160, cy = 100, R = 75, a = rad(-90 + (pct * 360) / 100), p = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    return svg(320, 200, `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${SOFT}"/>` + path(`M${cx} ${cy} L${cx} ${cy - R} A${R} ${R} 0 ${pct > 50 ? 1 : 0} 1 ${r1(p[0])} ${r1(p[1])} Z`, { f: ACC }) + tx(cx + R + 30, cy - R + 20, pct + '%', { c: ACC, b: 1 }), '원그래프');
  }
  function normalFig(mu, sd) {
    const W = 300, X = z => 160 + z * 45, Y = z => 150 - 110 * Math.exp(-z * z / 2);
    let d = ''; for (let i = 0; i <= 120; i++) { const z = -3.2 + (6.4 * i) / 120; d += (i ? 'L' : 'M') + r1(X(z)) + ' ' + r1(Y(z)); }
    let s = ln(10, 150, 310, 150, { c: MUTED }) + path(d, { c: ACC, w: 2.5 }) + ln(X(0), 150, X(0), Y(0), { d: 1, c: MUTED }) + tx(X(0), 166, mu != null ? 'm = ' + fmt(mu) : 'm', { s: 12 });
    if (sd != null) s += ln(X(1), 150, X(1), Y(1), { d: 1, c: MUTED }) + ln(X(-1), 150, X(-1), Y(-1), { d: 1, c: MUTED }) + tx(X(1), 166, '+σ', { s: 12, c: MUTED }) + tx(X(-1), 166, '−σ', { s: 12, c: MUTED });
    return svg(320, 180, s, '정규분포 곡선');
  }
  function fracFig(fs) {
    fs = fs.filter(([a, b]) => b >= 2 && b <= 12 && a > 0 && a <= 3 * b).slice(0, 3); if (!fs.length) return '';
    let y = 14, s = '';
    for (const [a, b] of fs) {
      const wholes = Math.max(1, Math.ceil(a / b)), W = Math.min(270, 90 * wholes + (wholes - 1) * 8) / wholes, seg = W / b;
      for (let w = 0; w < wholes; w++) for (let j = 0; j < b; j++) { const k = w * b + j, x = 40 + w * (W + 8) + j * seg; s += `<rect x="${r1(x)}" y="${y}" width="${r1(seg)}" height="28" fill="${k < a ? ACC : 'none'}" fill-opacity=".6" stroke="${INK}" stroke-width="1.2"/>`; }
      s += tx(22, y + 14, `${a}/${b}`, { b: 1, s: 13 });
      y += 44;
    }
    return svg(320, y, s, '분수 막대');
  }

  /* ───────── 수학 문제 → 그림 ───────── */
  const POINT = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  function eqs(t, lhs) { // "y = ...", "f(x) = ..." 식 뽑기
    const out = [], re = lhs === 'f' ? /f\(x\)\s*=\s*([^가-힣,?]+)/g : /(?:^|[^a-z])y\s*=\s*([^가-힣,?]+)/g; let m;
    while ((m = re.exec(t)) && out.length < 2) { let e = m[1].replace(/\s(의|와|과|을|를|에|이|은|는|위|로|으로)$/, '').trim().replace(/\($/, ''); if (!/x/.test(e)) continue; const f = toFn(e); if (f) out.push(f); }
    return out;
  }
  function math(id, html) {
    const t = plain(html), ts = supFix(t), u = unitOf(t);
    const n = re => val(t, re);
    // 평면도형 넓이·둘레
    if (/사다리꼴/.test(t)) { const a = n(/윗변\s*(\d+(?:\.\d+)?)/), b = n(/아랫변\s*(\d+(?:\.\d+)?)/), h = n(/높이\s*(\d+(?:\.\d+)?)/); if (a && b && h) return trapFig(a, b, h, lab(a, u), lab(b, u), lab(h, u)); }
    if (/마름모/.test(t)) { const m = t.match(/대각선(?:의 길이)?(?:이|가)?\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*(?:,|와|과)\s*(\d+(?:\.\d+)?)/); if (m) return rhombusFig(+m[1], +m[2], lab(m[1], u), lab(m[2], u)); }
    if (/평행사변형/.test(t) && !/ABCD/.test(t)) { const b = n(/밑변\s*(\d+(?:\.\d+)?)/), h = n(/높이\s*(\d+(?:\.\d+)?)/); if (b && h) return paraFig(b, h, lab(b, u), lab(h, u)); }
    if (/삼각형/.test(t) && !/직각삼각형|정삼각형|이등변/.test(t)) { const b = n(/밑변\s*(\d+(?:\.\d+)?)/), h = n(/높이\s*(\d+(?:\.\d+)?)/); if (b && h) return triFig(b, h, lab(b, u), lab(h, u)); }
    if (/정육면체/.test(t)) { const a = n(/모서리(?:의 길이)?(?:가|이)?\s*(\d+(?:\.\d+)?)/); if (a || /^e5-cuboid|^e6-volume|^m1-solid/.test(id)) return boxFig(1, 1, 1, lab(a, u), '', '', '정육면체'); }
    if (/직육면체/.test(t) || (/가로/.test(t) && /세로/.test(t) && /높이/.test(t))) { const a = n(/가로\s*(\d+(?:\.\d+)?)/), b = n(/세로\s*(\d+(?:\.\d+)?)/), c = n(/높이\s*(\d+(?:\.\d+)?)/); if (a && b && c) return boxFig(a, b, c, lab(a, u), lab(b, u), lab(c, u), '직육면체'); if (/^e5-cuboid|^e6-volume/.test(id)) return boxFig(5, 3, 3, '', '', '', '직육면체'); }
    if (/가로/.test(t) && /세로/.test(t) && /직사각형|넓이|둘레/.test(t)) { const a = n(/가로\s*(\d+(?:\.\d+)?)/), b = n(/세로\s*(\d+(?:\.\d+)?)/); if (a && b) return rectFig(a, b, lab(a, u), lab(b, u), '직사각형'); }
    if (/정사각형/.test(t)) { const a = n(/한 변(?:의 길이)?(?:이|가)?\s*(\d+(?:\.\d+)?)/); if (a) return rectFig(1, 1, lab(a, u), '', '정사각형'); }
    // 입체도형
    const kn = t.match(/(삼|사|오|육|칠|팔|구|십)각(기둥|뿔)/);
    if (kn && /^e6-prism|^m1-solid|^e6-/.test(id)) return prismFig(KN[kn[1]], kn[2] === '뿔');
    if (/원기둥|원뿔/.test(t)) { const r = n(/반지름(?:이|은|의 길이가)?\s*(\d+(?:\.\d+)?)/), h = n(/높이(?:가|는)?\s*(\d+(?:\.\d+)?)/); return cylFig(lab(r, u), lab(h, u), /원뿔/.test(t) && !/원기둥/.test(t)); }
    if (/구의|구 의|구\b|반구/.test(t) && /반지름/.test(t)) return sphereFig(lab(n(/반지름(?:이|은|의 길이가)?\s*(\d+(?:\.\d+)?)/), u));
    // 원·부채꼴
    if (/부채꼴/.test(t)) { const r = n(/반지름(?:이|은)?\s*(\d+(?:\.\d+)?)/), d = n(/중심각(?:의 크기)?(?:이|가|은)?\s*(\d+)\s*°/); if (d && d < 360) return sectorFig(lab(r, u), d); }
    if (/^e6-circle|^m1-polygon/.test(id) && /원/.test(t) && !/원주율.*무엇|원그래프/.test(t)) { const r = n(/반지름(?:이|은)?\s*(\d+(?:\.\d+)?)/), d = n(/지름(?:이|은)?\s*(\d+(?:\.\d+)?)/), c = n(/원주(?:가|는)\s*(\d+(?:\.\d+)?)/); if (r) return circleFig(r, lab(r, u)); if (d && !/반지름/.test(t)) return circleFig(d / 2, lab(d, u), true); if (c) return circleFig(1, ''); }
    const rp = t.match(/정(삼|사|오|육|칠|팔|구|십|십이)각형/);
    if (rp && /^m1-polygon|^e5-/.test(id)) return regPolyFig(KN[rp[1]] || 12, /내각|외각|각의 크기/.test(t));
    // 각
    if (/맞꼭지각/.test(t)) { const d = n(/(\d+)\s*°/); if (d && d < 180) return crossFig(d); }
    if (/평행/.test(t) && /동위각|엇각/.test(t)) { const d = n(/(\d+)\s*°/); if (d && d < 180) return parallelFig(d); }
    if (/이등변삼각형/.test(t)) { const a = n(/꼭지각(?:이|의 크기가)?\s*(\d+)\s*°/), b = n(/밑각(?:이|의 크기가)?\s*(\d+)\s*°/); if (a || b) return isoFig(a, b); if (/^m2-triangle/.test(id)) return isoFig(); }
    if (/내심/.test(t)) return centerFig('I', n(/∠A\s*=\s*(\d+)/));
    if (/외심/.test(t)) return centerFig('O', n(/∠A\s*=\s*(\d+)/));
    if (/평행사변형 ABCD/.test(t)) { const a = n(/∠A\s*=\s*(\d+)/); return paraFig(5, 3, '', '', ['A', 'B', 'C', 'D'], a ? a + '°' : ''); }
    if (/내접하는 사각형|내접사각형/.test(t)) { const a = n(/∠A\s*=\s*(\d+)/); if (a) return cyclicFig(a); }
    if (/중심각|원주각/.test(t) && /^m3-circle/.test(id)) return circAngFig(n(/중심각(?:이|의 크기가)?\s*(\d+)/), n(/원주각(?:이|의 크기가)?\s*(\d+)/));
    if (/접선/.test(t) && /PA/.test(t) && /^m3-circle/.test(id)) return tangentFig(lab(n(/PA\s*=\s*(\d+(?:\.\d+)?)/), ''));
    // 직각삼각형·피타고라스·삼각비
    if (/정삼각형/.test(t) && /높이/.test(t)) { const a = n(/한 변(?:의 길이)?(?:이|가)?\s*(\d+(?:\.\d+)?)/); if (a) return equiFig(lab(a, u)); }
    if (/직각을 낀 두 변/.test(t)) { const m = t.match(/두 변(?:의 길이)?(?:이|가)?\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*(?:,|와|과)\s*(\d+(?:\.\d+)?)/); if (m) return rightTriFig(m[1] + u, m[2] + u, '?'); }
    if (/^m3-trig/.test(id) && /직각삼각형|빗변|∠|sin|cos|tan/.test(t)) { const h = n(/빗변(?:의 길이가|이)?\s*(\d+(?:\.\d+)?)/); return rightTriFig('', '', h ? fmt(h) + u : '', /예각 A|∠A|cos A|sin A|tan A/.test(t) ? 'A' : ''); }
    if (/^m2-pythag/.test(id) && /직각삼각형/.test(t)) { const h = n(/빗변(?:의 길이가|이)?\s*(\d+(?:\.\d+)?)/); return rightTriFig('', '', h ? fmt(h) + u : ''); }
    // 좌표·벡터·그래프
    if (/^h3-vector/.test(id)) { const vs = [...ts.matchAll(/([a-z])\s*=\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g)].map(m => [m[1], +m[2], +m[3]]); if (vs.length) return vecFig(vs); }
    if (/^h3-conic/.test(id)) {
      let m = ts.match(/x\^2\s*\/\s*(\d+)\s*\+\s*y\^2\s*\/\s*(\d+)\s*=\s*1/); if (m) return conicFig('ellipse', +m[1], +m[2]);
      m = ts.match(/x\^2\s*\/\s*(\d+)\s*-\s*y\^2\s*\/\s*(\d+)\s*=\s*1/); if (m) return conicFig('hyper', +m[1], +m[2]);
      m = ts.match(/y\^2\s*=\s*(-?\d+)x/); if (m) return conicFig('parY', +m[1]);
      m = ts.match(/x\^2\s*=\s*(-?\d+)y/); if (m) return conicFig('parX', +m[1]);
    }
    if (/^h1-circle/.test(id)) {
      let m = ts.match(/x\^2\s*\+\s*y\^2\s*=\s*(\d+)/); if (m) return circEqFig(0, 0, Math.sqrt(+m[1]));
      m = ts.match(/중심이\s*\((-?\d+)\s*,\s*(-?\d+)\)\s*이고\s*반지름이\s*(\d+)/); if (m) return circEqFig(+m[1], +m[2], +m[3]);
      m = ts.match(/\(x\s*([+-])\s*(\d+)\)\^2\s*\+\s*\(y\s*([+-])\s*(\d+)\)\^2\s*=\s*(\d+)/); if (m) return circEqFig((m[1] === '-' ? 1 : -1) * m[2], (m[3] === '-' ? 1 : -1) * m[4], Math.sqrt(+m[5]));
    }
    if (/^m1-prop|^m2-linfunc|^m3-quadfunc|^h1-quad|^h1-func|^h2-expfunc|^h2-trig|^h2-int|^h2-diff|^h3-diff2|^h1-line/.test(id)) {
      const fs = eqs(ts, 'y').concat(/^h2-diff|^h2-int|^h3-diff2|^h1-func/.test(id) ? eqs(ts, 'f') : []).slice(0, 2);
      if (fs.length) { const g = graphFig(fs, /sin|cos|tan/.test(ts) ? 2 * Math.PI : /\^x|log|ln|e\^/.test(ts) ? 4 : 5, /sin|cos|tan/.test(ts)); if (g) return g; }
    }
    if (/^m1-coord|^m2-linfunc|^h1-line|^m1-prop/.test(id) && !/사분면/.test(t)) { const pts = [...t.matchAll(POINT)].map(m => [+m[1], +m[2]]).slice(0, 3); if (pts.length) return pointsFig(pts); }
    // 자료·확률·집합
    const list = t.match(/(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){3,9})/);
    if (list && /평균|중앙값|최빈값|분산|표준편차|자료|대푯값/.test(t)) return barsFig(list[1].split(',').map(Number));
    if (/주사위/.test(t)) { const m = t.match(/주사위\s*(\d|한|두|세)\s*개/); const k = m ? ({ 한: 1, 두: 2, 세: 3 }[m[1]] || +m[1]) : 1; return diceFig(Math.min(k, 3)); }
    if (/동전/.test(t)) { const m = t.match(/동전\s*(\d|한|두|세|네)\s*개/); const k = m ? ({ 한: 1, 두: 2, 세: 3, 네: 4 }[m[1]] || +m[1]) : 1; return coinsFig(k); }
    const cards = t.match(/(\d+)\s*부터\s*(\d+)\s*까지(?:의 (?:자연수|수)가)?\s*(?:하나씩\s*)?적힌\s*(?:\d+\s*장의\s*)?카드/); if (cards) return cardsFig(+cards[1], +cards[2]);
    const balls = [...t.matchAll(/(빨간|파란|흰|검은|노란|초록)\s*공\s*(\d+)\s*개/g)].map(m => [m[1], +m[2]]); if (balls.length) return ballsFig(balls);
    if (/^h1-set|^h3-prob/.test(id) && /n\(|∩|∪|집합|A\s*=\s*\{/.test(t)) return vennFig(/C\)|∩\s*C|n\(C/.test(t));
    if (/^h3-dist|^h3-estim/.test(id) && /N\(|정규분포|표본평균/.test(t)) { const m = t.match(/N\(\s*(\d+(?:\.\d+)?)\s*,/); return normalFig(m ? +m[1] : null, 1); }
    // 수·비율
    if (/^m1-integer/.test(id)) { const ns = [...t.matchAll(/\((-?\d+)\)|(?:^|\s)(-?\d+)(?=\s|$)/g)].map(m => +(m[1] || m[2])).filter(v => !isNaN(v)).slice(0, 3); if (ns.length >= 2 && !/\^|²/.test(t)) return numLineFig(ns); }
    if (/^e6-ratio|^e6-proportion/.test(id)) { const m = t.match(/(\d+)\s*:\s*(\d+)(?!\s*=)/); const tot = t.match(/(\d+(?:\.\d+)?)\s*(cm|m|개|명|원|g|kg|L)(?![a-z])/); if (m && (/나누|배분/.test(t) || /^e6-ratio/.test(id))) return ratioFig([+m[1], +m[2]], /나누|배분/.test(t) && tot ? tot[1] + ' ' + tot[2] : ''); }
    if (/^h2-seq|^h3-series/.test(id)) { const m = t.match(/(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){2,5})\s*,\s*(?:…|\.\.\.)/); if (m) return seqFig(m[1].split(',').map(Number)); }
    if (/^e6-graph/.test(id)) { const p = n(/(\d+)\s*%/); if (p && /원그래프/.test(t)) return pieFig(p); }
    if (/^e5-fracadd|^e5-fracmul|^e6-fracdiv/.test(id)) { const fs = [...t.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(m => [+m[1], +m[2]]); const g = fracFig(fs); if (g) return g; }
    return '';
  }

  /* ───────── 회화 상황 그림 ───────── */
  function talkScene(s, lc) {
    const em = s.emoji || '💬';
    return `<div class="scene"><span class="scene-em">${escA(em)}</span><span class="scene-tx"><b>${escA(s.place || s.title)}</b><small>🤖 ${escA(lc.ai || s.ai || '')} · 🙋 ${escA(s.user || '')}</small></span></div>`;
  }

  window.LPfig = { math, talkScene, plain };
})();
