// 그림 문제용 SVG 그림
const svg = (body, vb = '0 0 320 200') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" font-family="Jua, sans-serif" role="img">${body}</svg>`;
const label = (x, y, t, c = '#e5484d') =>
  `<g><circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="${c}" stroke-width="3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" fill="${c}" font-weight="700">${t}</text></g>`;

const IMAGES = {
  magnet: () => svg(`
    <rect width="320" height="200" fill="#eef7ff"/>
    <path d="M60 50 h40 v70 a30 30 0 0 0 60 0 v-70 h40 v70 a70 70 0 0 1 -140 0z" fill="#e5484d"/>
    <rect x="60" y="50" width="40" height="30" fill="#ddd"/><rect x="160" y="50" width="40" height="30" fill="#ddd"/>
    <text x="80" y="72" text-anchor="middle" font-size="16">N</text><text x="180" y="72" text-anchor="middle" font-size="16">S</text>
    <path d="M232 60 q20 -10 30 5 q10 15 -10 25 q-20 10 -30 -5 q-5 -10 10 -15" fill="none" stroke="#777" stroke-width="5"/>
    <rect x="235" y="125" width="60" height="22" rx="6" fill="#f6a5c0"/>
    <path d="M215 32 l8 -10 M240 30 l0 -12 M265 34 l8 -10" stroke="#f5b400" stroke-width="3"/>`),

  plant: () => svg(`
    <rect width="320" height="200" fill="#eaf8ff"/><rect y="125" width="320" height="75" fill="#c58b55"/>
    <path d="M160 125 V45" stroke="#3a9b2a" stroke-width="7"/>
    <ellipse cx="128" cy="78" rx="30" ry="13" fill="#58cc02" transform="rotate(-25 128 78)"/>
    <ellipse cx="192" cy="92" rx="30" ry="13" fill="#58cc02" transform="rotate(25 192 92)"/>
    <circle cx="160" cy="38" r="16" fill="#ffc800"/><circle cx="160" cy="38" r="7" fill="#ff9600"/>
    <path d="M160 125 l-25 45 M160 125 l0 55 M160 125 l25 42 M147 150 l-15 10 M172 148 l14 12" stroke="#f3e6c8" stroke-width="4" fill="none"/>
    ${label(220, 165, '가')}<path d="M206 162 l-25 -2" stroke="#e5484d" stroke-width="2"/>`),

  moonHalf: () => svg(`
    <rect width="320" height="200" fill="#1b2350"/>
    ${Array.from({ length: 25 }, (_, i) => `<circle cx="${(i * 73) % 320}" cy="${(i * 41) % 200}" r="1.5" fill="#fff"/>`).join('')}
    <circle cx="160" cy="100" r="60" fill="#3a4170"/>
    <path d="M160 40 a60 60 0 0 1 0 120 z" fill="#ffe680"/>`),

  circuitParallel: () => {
    const bulb = (x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="#fff7a8" stroke="#555" stroke-width="3"/><path d="M${x - 6} ${y + 3} q6 -12 12 0" stroke="#e5a100" stroke-width="2" fill="none"/>
      <path d="M${x} ${y - 30} l-8 -10 M${x - 26} ${y - 22} l-10 -6 M${x + 26} ${y - 22} l10 -6" stroke="#ffc800" stroke-width="3"/>`;
    return svg(`
      <rect width="320" height="200" fill="#f7f9fc"/>
      <g stroke="#333" stroke-width="4" fill="none">
        <path d="M60 160 H260 V40 H60 Z"/><path d="M160 40 V160"/>
      </g>
      <rect x="20" y="85" width="80" height="30" rx="6" fill="#ff9600" stroke="#333" stroke-width="3"/>
      <text x="60" y="106" text-anchor="middle" font-size="14" fill="#fff">전지</text>
      ${bulb(160, 100)}${bulb(260, 100)}`);
  },

  waterCycle: () => svg(`
    <rect width="320" height="200" fill="#dff3ff"/>
    <path d="M0 150 Q80 140 160 150 T320 150 V200 H0Z" fill="#1cb0f6"/>
    <path d="M220 150 L260 80 L300 150Z" fill="#7b8a6a"/>
    <circle cx="40" cy="35" r="20" fill="#ffc800"/>
    <ellipse cx="170" cy="40" rx="45" ry="18" fill="#fff"/><ellipse cx="200" cy="35" rx="30" ry="15" fill="#fff"/>
    <path d="M90 135 V70" stroke="#e5484d" stroke-width="4" marker-end="url(#ar)"/>
    <path d="M200 60 l-8 15 M215 60 l-8 15 M230 60 l-8 15" stroke="#1cb0f6" stroke-width="3"/>
    <defs><marker id="ar" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#e5484d"/></marker></defs>
    ${label(115, 100, '가')}`),

  foodChain: () => {
    const items = [['🌿', '풀'], ['🦗', '메뚜기'], ['🐸', '개구리'], ['🐍', '뱀']];
    return svg(`<rect width="320" height="200" fill="#f2fbe8"/>` + items.map(([e, n], i) => {
      const x = 40 + i * 80;
      return `<text x="${x}" y="100" text-anchor="middle" font-size="40">${e}</text><text x="${x}" y="140" text-anchor="middle" font-size="15" fill="#333">${n}</text>` +
        (i < 3 ? `<path d="M${x + 24} 88 H${x + 52}" stroke="#555" stroke-width="3"/><path d="M${x + 52} 82 l8 6 l-8 6z" fill="#555"/>` : '');
    }).join(''));
  },

  earthLayers: () => svg(`
    <rect width="320" height="200" fill="#0f1a3a"/>
    <circle cx="160" cy="100" r="88" fill="#8b5a2b"/>
    <circle cx="160" cy="100" r="80" fill="#e8743b"/>
    <circle cx="160" cy="100" r="45" fill="#ffb02e"/>
    <circle cx="160" cy="100" r="20" fill="#ffe680"/>
    ${label(280, 40, '가')}<path d="M266 46 L228 62" stroke="#e5484d" stroke-width="2"/>`),

  particles: () => {
    let dots = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) dots += `<circle cx="${82 + c * 26}" cy="${48 + r * 26}" r="11" fill="#1cb0f6" stroke="#0a7bb0" stroke-width="2"/>`;
    return svg(`<rect width="320" height="200" fill="#f5f7fb"/><rect x="62" y="28" width="196" height="144" rx="8" fill="none" stroke="#999" stroke-width="3"/>${dots}`);
  },

  wave: () => svg(`
    <rect width="320" height="200" fill="#f5fbff"/>
    <path d="M10 100 H310" stroke="#bbb" stroke-dasharray="5 5"/>
    <path d="M10 100 C35 40, 65 40, 90 100 S145 160, 170 100 S225 40, 250 100 S290 140, 310 115" stroke="#1cb0f6" stroke-width="4" fill="none"/>
    <path d="M50 55 V100" stroke="#e5484d" stroke-width="2"/><text x="36" y="82" font-size="16" fill="#e5484d" font-weight="700">A</text>
    <path d="M50 30 H210" stroke="#8a4fff" stroke-width="2"/><path d="M50 24 V36 M210 24 V36" stroke="#8a4fff" stroke-width="2"/>
    <text x="130" y="24" text-anchor="middle" font-size="16" fill="#8a4fff" font-weight="700">B</text>`),

  atom: () => svg(`
    <rect width="320" height="200" fill="#f7f4ff"/>
    <ellipse cx="160" cy="100" rx="95" ry="30" fill="none" stroke="#8a4fff" stroke-width="2"/>
    <ellipse cx="160" cy="100" rx="95" ry="30" fill="none" stroke="#8a4fff" stroke-width="2" transform="rotate(60 160 100)"/>
    <ellipse cx="160" cy="100" rx="95" ry="30" fill="none" stroke="#8a4fff" stroke-width="2" transform="rotate(-60 160 100)"/>
    <circle cx="160" cy="100" r="18" fill="#e5484d"/><text x="160" y="106" text-anchor="middle" fill="#fff" font-size="16">+</text>
    <circle cx="255" cy="100" r="7" fill="#1cb0f6"/><circle cx="207.5" cy="182.3" r="7" fill="#1cb0f6"/><circle cx="112.5" cy="17.7" r="7" fill="#1cb0f6"/>
    ${label(60, 40, '가')}<path d="M72 48 L145 92" stroke="#e5484d" stroke-width="2"/>`),

  moonOrbit: () => {
    const pos = { A: [160, 40], B: [80, 100], C: [160, 160], D: [240, 100] };
    return svg(`
      <rect width="320" height="200" fill="#10183a"/>
      <circle cx="160" cy="100" r="60" fill="none" stroke="#556" stroke-dasharray="4 4"/>
      <circle cx="160" cy="100" r="20" fill="#1cb0f6"/><path d="M160 80 a20 20 0 0 0 0 40z" fill="#0b4f70"/>
      <text x="160" y="105" text-anchor="middle" font-size="11" fill="#fff">지구</text>
      <text x="300" y="30" text-anchor="end" font-size="13" fill="#ffc800">태양 빛 ←</text>
      <path d="M300 60 H260 M300 140 H260 M300 100 H275" stroke="#ffc800" stroke-width="3"/>
      ${Object.entries(pos).map(([k, [x, y]]) => `<circle cx="${x}" cy="${y}" r="11" fill="#ccc"/><path d="M${x} ${y - 11} a11 11 0 0 1 0 22z" fill="#ffe680"/><text x="${x - 18}" y="${y - 12}" font-size="14" fill="#fff" font-weight="700">${k}</text>`).join('')}
      <text x="12" y="190" font-size="11" fill="#aab">※ 태양은 오른쪽에 있어요</text>`);
  },

  graphV: () => svg(`
    <rect width="320" height="200" fill="#fff"/>
    <path d="M50 20 V170 H300" stroke="#333" stroke-width="2.5" fill="none"/>
    <path d="M50 20 l-5 8 h10z M300 170 l-8 -5 v10z" fill="#333"/>
    <text x="30" y="30" font-size="13">속력</text><text x="280" y="190" font-size="13">시간</text>
    <path d="M50 80 H280" stroke="#ff4b4b" stroke-width="4"/>
    <text x="40" y="186" font-size="12">0</text>`),
};

function renderImage(key) {
  return IMAGES[key] ? IMAGES[key]() : '';
}
