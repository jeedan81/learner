// 그림 문제용 그림. 모두 직접 그린 SVG(사진·외부 이미지 없음). 문제에서는 "img": "그림id"로 부른다.
// 그림 크기는 viewBox 240×160(3:2). alt는 화면 낭독용 설명이며 정답 이름을 쓰지 않는다.
// 태극기는 위키미디어 공용 'Flag of South Korea.svg'(퍼블릭 도메인)의 도형을 그대로 썼다.
window.HISTORY_IMAGES = (function () {
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
  const svg = (body, defs) => `<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">${defs ? "<defs>" + defs + "</defs>" : ""}${body}</svg>`;
  const INK = "#3d3528";
  return {
    // ---------- 선사 ----------
    jumeok: { alt: "돌의 양면을 떼어 내 한쪽 끝을 뾰족하게 다듬은 손바닥만 한 석기", svg: svg(
      `<path d="M122 14C146 34 170 78 164 116C160 140 140 150 120 150C98 150 80 140 76 116C70 80 96 36 122 14Z" fill="#b8a98d" stroke="${INK}" stroke-width="2.5"/>
       <path d="M110 52L124 78L156 64L144 36Z" fill="#cfc3aa"/><path d="M104 104L118 150L98 150L80 134Z" fill="#9c8d73"/><path d="M124 78L140 110L164 116L158 76Z" fill="#a89a80"/>
       <path d="M122 14L110 52L124 78L104 104L118 150M110 52L84 70M124 78L156 64M104 104L76 114M124 78L140 110L164 116M140 110L132 150" fill="none" stroke="#6b5d48" stroke-width="1.6"/>`) },
    bitsal: { alt: "아래가 뾰족한 갈색 토기, 겉면에 짧은 빗금이 줄지어 새겨져 있다", svg: svg(
      `<path d="M64 26C62 60 76 110 120 150C164 110 178 60 176 26Z" fill="#a8835f" stroke="${INK}" stroke-width="2.5"/>
       <g clip-path="url(#bs-c)" stroke="#5b412a" stroke-width="2">${rep(9, (r) => rep(18, (k) => { const x = 58 + k * 7, y = 36 + r * 13; return r % 2 ? `<path d="M${x} ${y}l5 9"/>` : `<path d="M${x + 5} ${y}l-5 9"/>`; }))}</g>
       <ellipse cx="120" cy="26" rx="56" ry="7" fill="#6e5238" stroke="${INK}" stroke-width="2.5"/>`,
      `<clipPath id="bs-c"><path d="M66 34C66 62 80 108 120 146C160 108 174 62 174 34Z"/></clipPath>`) },
    goindol: { alt: "땅에 세운 두 개의 큰 받침돌 위에 넓적한 큰 돌을 탁자처럼 얹은 구조물", svg: svg(
      `<path d="M10 134H230" stroke="#6d7a4a" stroke-width="3"/>${rep(10, (i) => `<path d="M${20 + i * 22} 134l-3-7m3 7l3-8" stroke="#6d7a4a" stroke-width="1.5"/>`)}
       <path d="M74 72L98 70L101 134L71 134Z" fill="#8f8a7c" stroke="${INK}" stroke-width="2"/><path d="M142 70L166 72L169 134L139 134Z" fill="#8f8a7c" stroke="${INK}" stroke-width="2"/>
       <path d="M44 58L80 40L168 38L206 52L198 70L150 77L86 77L48 71Z" fill="#a39d8d" stroke="${INK}" stroke-width="2.5"/><path d="M80 40L92 60L168 38M92 60L150 77" fill="none" stroke="#7d786b" stroke-width="1.4"/>`) },
    bipa: { alt: "아랫부분이 둥글게 부풀고 가운데에 돌기가 있는 금속 칼날", svg: svg(
      `<g transform="translate(120 80) rotate(90) scale(1.3) translate(-120 -82)"><path d="M120 8C123 26 127 48 131 70C134 80 138 88 141 94C139 97 137 98 136 100C142 106 150 118 148 130C146 142 134 148 124 148L124 156L116 156L116 148C106 148 94 142 92 130C90 118 98 106 105 99C103 98 101 97 99 94C102 88 106 80 109 70C113 48 117 26 120 8Z" fill="#8b8256" stroke="#3f3a22" stroke-width="2.5"/>
       <path d="M120 16V150" stroke="#c8bf8a" stroke-width="3"/></g>`) },
    bandal: { alt: "반달 모양의 납작한 돌, 등 쪽에 구멍 두 개가 뚫려 있다", svg: svg(
      `<path d="M40 108Q120 6 200 108Q120 122 40 108Z" fill="#8e9188" stroke="${INK}" stroke-width="2.5"/><path d="M48 110Q120 120 192 110" fill="none" stroke="#c4c6bc" stroke-width="2"/>
       <circle cx="108" cy="72" r="5.5" fill="#f6f1e6" stroke="${INK}" stroke-width="1.5"/><circle cx="132" cy="72" r="5.5" fill="#f6f1e6" stroke="${INK}" stroke-width="1.5"/>`) },
    garak: { alt: "가운데에 구멍이 뚫린 둥근 흙 원판에 가는 막대가 꽂혀 있다", svg: svg(
      `<rect x="117" y="10" width="6" height="140" rx="3" fill="#6b4a2b"/>
       <path d="M70 84a50 50 0 1 0 100 0a50 50 0 1 0-100 0ZM111 84a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z" fill="#a9805a" fill-rule="evenodd" stroke="${INK}" stroke-width="2.5"/>
       <circle cx="120" cy="84" r="32" fill="none" stroke="#7a5638" stroke-width="2" stroke-dasharray="3 5"/>`) },
    // ---------- 삼국 ----------
    cheomseong: { alt: "아래가 넓고 위로 갈수록 좁아지는 병 모양의 돌탑, 가운데에 네모난 창이 있고 꼭대기에 우물 정(井) 자 모양의 돌이 있다", svg: svg(
      `<path d="M20 150H220" stroke="#6d7a4a" stroke-width="3"/><rect x="56" y="138" width="128" height="12" fill="#b9ad8e" stroke="${INK}" stroke-width="2"/><rect x="64" y="128" width="112" height="10" fill="#c3b797" stroke="${INK}" stroke-width="2"/>
       <path d="M72 128C80 92 90 64 94 42H146C150 64 160 92 168 128Z" fill="#cbbf9f" stroke="${INK}" stroke-width="2.5"/>
       <g clip-path="url(#cs-c)" stroke="#8c8064" stroke-width="1.3">${rep(12, (i) => `<path d="M60 ${48 + i * 7}H180"/>`)}</g>
       <rect x="110" y="80" width="20" height="18" fill="#3d3528"/>
       <rect x="86" y="30" width="68" height="12" fill="#bfb392" stroke="${INK}" stroke-width="2"/><rect x="86" y="18" width="68" height="12" fill="#cbbf9f" stroke="${INK}" stroke-width="2"/><path d="M98 18V42M142 18V42" stroke="${INK}" stroke-width="2"/>`,
      `<clipPath id="cs-c"><path d="M72 128C80 92 90 64 94 42H146C150 64 160 92 168 128Z"/></clipPath>`) },
    geumgwan: { alt: "금으로 만든 관. 둥근 띠 위에 나뭇가지 모양 장식 셋과 사슴뿔 모양 장식 둘이 서 있고, 동그란 달개와 푸른 굽은 구슬이 달려 있다", svg: svg(
      `<g fill="none" stroke="#c99a1e" stroke-width="6" stroke-linejoin="miter">
       ${[80, 120, 160].map((c) => `<path d="M${c} 124V20M${c - 11} 80V96H${c + 11}V80M${c - 11} 54V70H${c + 11}V54M${c - 10} 30V44H${c + 10}V30"/>`).join("")}
       <path d="M50 122C46 100 40 80 34 58M42 94C52 86 58 76 60 62M38 74C46 66 50 56 50 46M190 122C194 100 200 80 206 58M198 94C188 86 182 76 180 62M202 74C194 66 190 56 190 46"/></g>
       ${[[69, 54], [91, 54], [110, 30], [130, 30], [149, 54], [171, 54], [80, 108], [160, 108], [120, 108], [56, 70], [184, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#f0cf6a" stroke="#9c7614"/>`).join("")}
       ${[[100, 98], [140, 98], [100, 72], [140, 72]].map(([x, y]) => `<path d="M${x} ${y}a5 5 0 1 1 5 6q-1 5-6 7q3-5 1-13Z" fill="#3f8a63" stroke="#1f4d35"/>`).join("")}
       <path d="M36 116Q120 134 204 116L204 136Q120 154 36 136Z" fill="#d8aa2e" stroke="#8a6a12" stroke-width="2"/>${rep(15, (i) => `<circle cx="${46 + i * 11}" cy="${128 + Math.sin((i / 14) * Math.PI) * 9}" r="2" fill="#8a6a12"/>`)}`) },
    gwanggaeto: { alt: "사람 키의 서너 배쯤 되는 커다란 돌기둥 모양 비석, 네 면에 글자가 빽빽하게 새겨져 있다", svg: svg(
      `<path d="M20 152H220" stroke="#6d7a4a" stroke-width="3"/>
       <path d="M146 10L166 18L168 146L150 152Z" fill="#6f7163" stroke="${INK}" stroke-width="2"/><path d="M92 14L146 10L150 152L88 152Z" fill="#8d8f7f" stroke="${INK}" stroke-width="2.5"/>
       ${rep(8, (i) => `<path d="M${98 + i * 6.4} ${20 - i * 0.4}V${146}" stroke="#4d4f43" stroke-width="1.6" stroke-dasharray="3 3"/>`)}
       <circle cx="196" cy="118" r="5" fill="#3d3528"/><path d="M196 124V140M196 128l-7 7M196 128l7 7M196 140l-5 12M196 140l5 12" stroke="#3d3528" stroke-width="3" stroke-linecap="round"/>`) },
    // ---------- 남북국 ----------
    seokgatap: { alt: "2층 기단 위에 몸돌과 지붕돌을 세 층으로 쌓은 단정한 돌탑", svg: svg(
      `<g fill="#d6cfc0" stroke="#5a5348" stroke-width="2">
       <rect x="52" y="138" width="136" height="14"/><rect x="48" y="132" width="144" height="6"/><rect x="64" y="112" width="112" height="20"/><rect x="58" y="106" width="124" height="6"/>
       <rect x="86" y="84" width="68" height="22"/><rect x="78" y="80" width="84" height="4"/><path d="M60 80H180L174 72H66Z"/>
       <rect x="92" y="54" width="56" height="18"/><rect x="84" y="50" width="72" height="4"/><path d="M68 50H172L166 43H74Z"/>
       <rect x="98" y="28" width="44" height="15"/><rect x="90" y="24" width="60" height="4"/><path d="M76 24H164L158 17H82Z"/>
       <rect x="112" y="11" width="16" height="6"/></g>
       <path d="M120 2V11" stroke="#5a5348" stroke-width="2"/><ellipse cx="120" cy="6" rx="5" ry="2" fill="#d6cfc0" stroke="#5a5348"/>
       <path d="M92 84V106M148 84V106M98 54V72M142 54V72M104 28V43M136 28V43M76 112V132M164 112V132M120 112V132" stroke="#8d8577" stroke-width="1.5"/>`) },
    sinjong: { alt: "용 모양 고리와 대롱이 달린 커다란 종. 몸에 네모난 돌기 장식과 연꽃 모양의 치는 자리가 있다", svg: svg(
      `<path d="M98 46C94 24 112 14 126 20C136 26 132 40 126 46" fill="none" stroke="#4d6a5a" stroke-width="9" stroke-linecap="round"/><rect x="134" y="20" width="11" height="26" fill="#5e7b6b" stroke="#2f3f35" stroke-width="2"/><path d="M134 28h11M134 36h11" stroke="#2f3f35"/>
       <path d="M78 46C76 82 74 120 66 148H174C166 120 164 82 162 46Q120 38 78 46Z" fill="#5e7b6b" stroke="#2f3f35" stroke-width="2.5"/>
       <path d="M78 52Q120 44 162 52M77 60Q120 52 163 60M70 132Q120 126 170 132M69 140Q120 134 171 140" fill="none" stroke="#a9c3b2" stroke-width="2"/>
       ${[88, 130].map((x) => `<rect x="${x}" y="64" width="22" height="26" fill="none" stroke="#a9c3b2" stroke-width="2"/>${rep(9, (k) => `<circle cx="${x + 5 + (k % 3) * 6}" cy="${70 + Math.floor(k / 3) * 7}" r="2" fill="#a9c3b2"/>`)}`).join("")}
       <circle cx="120" cy="110" r="10" fill="none" stroke="#a9c3b2" stroke-width="2"/><circle cx="120" cy="110" r="4" fill="#a9c3b2"/>`) },
    // ---------- 고려 ----------
    cheongja: { alt: "어깨가 넓고 아래로 갈수록 좁아지는 비취색 병. 흰 원 안과 바깥에 날아가는 학과 구름 무늬가 새겨져 있다", svg: svg(
      `<rect x="110" y="10" width="20" height="8" rx="2" fill="#88ad94" stroke="#4c6b57" stroke-width="2"/>
       <path d="M112 18C84 22 66 40 68 64C70 92 92 118 98 144L96 150H144L142 144C148 118 170 92 172 64C174 40 156 22 128 18Z" fill="#9dbfa7" stroke="#4c6b57" stroke-width="2.5"/>
       <path d="M84 40C76 56 78 80 90 100" fill="none" stroke="#cfe3d4" stroke-width="5" stroke-linecap="round" opacity=".7"/>
       ${[[100, 60, 13], [140, 60, 13], [120, 98, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#f5f2ea" stroke-width="1.8"/><path d="M${x - 6} ${y + 4}l6-5l6 5M${x} ${y - 1}l-3-6" fill="none" stroke="#f5f2ea" stroke-width="1.6"/>`).join("")}
       ${[[120, 42], [86, 84], [154, 84], [108, 124], [134, 124]].map(([x, y]) => `<path d="M${x - 5} ${y}l5 4l5-4M${x} ${y + 4}l2 5" fill="none" stroke="#f5f2ea" stroke-width="1.5"/>`).join("")}
       <path d="M100 140q4-6 8 0q4-6 8 0q4-6 8 0q4-6 8 0q4-6 8 0" fill="none" stroke="#f5f2ea" stroke-width="1.4"/>`) },
    daejanggyeong: { alt: "글자가 빽빽하게 돋을새김된 직사각형 나무판, 양 끝에 마구리가 덧대어 있다", svg: svg(
      `<rect x="28" y="40" width="184" height="84" fill="#8a5a33" stroke="#3d2614" stroke-width="2.5"/><rect x="16" y="34" width="18" height="96" rx="2" fill="#6b4322" stroke="#3d2614" stroke-width="2"/><rect x="206" y="34" width="18" height="96" rx="2" fill="#6b4322" stroke="#3d2614" stroke-width="2"/>
       <rect x="16" y="34" width="18" height="8" fill="#a6a28f"/><rect x="16" y="122" width="18" height="8" fill="#a6a28f"/><rect x="206" y="34" width="18" height="8" fill="#a6a28f"/><rect x="206" y="122" width="18" height="8" fill="#a6a28f"/>
       <rect x="42" y="50" width="156" height="64" fill="#7a4c2a" stroke="#3d2614"/>
       ${rep(19, (c) => rep(8, (r) => `<rect x="${46 + c * 8}" y="${54 + r * 7.4}" width="5" height="5" fill="#c79d6e"/>`))}`) },
    // ---------- 조선 전기 ----------
    cheugugi: { alt: "네모난 돌 받침대 위에 금속으로 만든 둥근 원통이 놓여 있다", svg: svg(
      `<path d="M30 150H210" stroke="#6d7a4a" stroke-width="3"/><rect x="80" y="104" width="80" height="46" fill="#c9c2b2" stroke="${INK}" stroke-width="2.5"/><rect x="76" y="98" width="88" height="8" fill="#d8d2c4" stroke="${INK}" stroke-width="2"/>
       ${rep(6, (i) => `<path d="M${94 + i * 10} 112V142" stroke="#9a9384" stroke-width="2" stroke-dasharray="4 3"/>`)}
       <rect x="100" y="24" width="40" height="74" fill="#6d6550" stroke="${INK}" stroke-width="2.5"/><rect x="98" y="46" width="44" height="5" fill="#857c63" stroke="${INK}"/><rect x="98" y="72" width="44" height="5" fill="#857c63" stroke="${INK}"/>
       <ellipse cx="120" cy="24" rx="20" ry="4.5" fill="#3a3527" stroke="${INK}" stroke-width="2"/><path d="M106 30V92" stroke="#958c70" stroke-width="3" opacity=".7"/>`) },
    angbu: { alt: "하늘을 올려다보는 솥처럼 생긴 반구 모양 그릇. 안쪽에 가로세로 눈금이 있고 비스듬한 바늘이 꽂혀 있으며 네 개의 다리로 서 있다", svg: svg(
      `<path d="M58 140H182" stroke="#4b4434" stroke-width="6"/><path d="M76 96L66 140M164 96L174 140M102 112L98 140M138 112L142 140" stroke="#4b4434" stroke-width="5" stroke-linecap="round"/>
       <path d="M50 60C52 100 90 118 120 118C150 118 188 100 190 60Z" fill="#4b4434" stroke="#2a261d" stroke-width="2.5"/>
       <ellipse cx="120" cy="60" rx="70" ry="18" fill="#6a604a" stroke="#2a261d" stroke-width="2"/><ellipse cx="120" cy="61" rx="62" ry="14" fill="#25221b"/>
       <g fill="none" stroke="#d8d2b8" stroke-width="1.2"><path d="M66 63Q120 82 174 63M76 66Q120 80 164 66M88 69Q120 78 152 69"/>${rep(7, (i) => `<path d="M${78 + i * 14} ${52 + Math.abs(3 - i) * 1.5}L${84 + i * 12} ${72 - Math.abs(3 - i) * 1.5}"/>`)}</g>
       <path d="M120 48L148 66" stroke="#e8e2c8" stroke-width="2.4"/><circle cx="120" cy="48" r="2.5" fill="#e8e2c8"/>`) },
    geobukseon: { alt: "거북 등처럼 덮개를 씌우고 덮개에 송곳 같은 쇠못을 촘촘히 꽂은 배. 뱃머리에 용 머리가 있고 옆에 노가 줄지어 있다", svg: svg(
      `<path d="M10 128q15-6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" fill="none" stroke="#5b86a8" stroke-width="2.5"/>
       ${rep(8, (i) => `<path d="M${62 + i * 17} 110L${52 + i * 17} 138" stroke="#4a2f17" stroke-width="3" stroke-linecap="round"/>`)}
       <path d="M30 104L56 120H186L212 98L206 94H38Z" fill="#7a4f2a" stroke="#2e1d0f" stroke-width="2.5"/><rect x="44" y="82" width="160" height="14" fill="#8c5f35" stroke="#2e1d0f" stroke-width="2"/>
       ${rep(8, (i) => `<rect x="${56 + i * 18}" y="86" width="8" height="6" fill="#2e1d0f"/>`)}
       <path d="M44 82C70 50 172 48 204 82Z" fill="#3c3a35" stroke="#1d1c19" stroke-width="2.5"/><path d="M60 72C90 58 160 56 190 72M76 62C100 54 146 54 170 62" fill="none" stroke="#5a5852" stroke-width="1.5"/>
       ${rep(26, (i) => { const x = 58 + (i % 13) * 11 + (i >= 13 ? 5 : 0), y = i >= 13 ? 64 - Math.sin(((x - 44) / 160) * Math.PI) * 4 : 76 - Math.sin(((x - 44) / 160) * Math.PI) * 6; return `<path d="M${x - 2} ${y}l2-5l2 5" fill="#c9c7bf"/>`; })}
       <path d="M48 86L26 74Q16 66 24 60L36 63L50 76Z" fill="#8a5a2c" stroke="#2e1d0f" stroke-width="2"/><circle cx="28" cy="66" r="1.8" fill="#1d1c19"/><circle cx="14" cy="70" r="4" fill="#b8b5ad" opacity=".8"/><circle cx="7" cy="64" r="3" fill="#b8b5ad" opacity=".6"/>`) },
    hunmin: { alt: "괘선이 그어진 옛 책의 한 면. 한자 사이사이에 ㄱ, ㄴ, ㅏ 같은 새 글자가 크게 쓰여 있다", svg: svg(
      `<rect x="44" y="8" width="152" height="144" fill="#efe3c6" stroke="#8a7650" stroke-width="2.5"/><rect x="50" y="14" width="140" height="132" fill="none" stroke="#8a7650" stroke-width="1.2"/>
       ${rep(7, (i) => `<path d="M${70 + i * 20} 14V146" stroke="#b9a57a" stroke-width="1"/>`)}
       ${[0, 2, 3, 5, 6, 7].map((c) => rep(9, (r) => `<path d="M${176 - c * 20} ${24 + r * 13.5}h8M${180 - c * 20} ${20 + r * 13.5}v8" stroke="#4a3d28" stroke-width="1.6"/>`)).join("")}
       <g font-size="22" font-weight="700" fill="#2b2216" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif"><text x="160" y="46">ㄱ</text><text x="160" y="86">ㄴ</text><text x="160" y="126">ㄷ</text><text x="100" y="46">ㅏ</text><text x="100" y="86">ㅓ</text><text x="100" y="126">ㅗ</text></g>`) },
    // ---------- 조선 후기 ----------
    geojunggi: { alt: "나무 틀 꼭대기와 아래에 여러 개의 도르래를 달고 밧줄을 감아, 양옆의 물레를 돌려 무거운 돌을 들어 올리는 기계", svg: svg(
      `<path d="M10 150H230" stroke="#6d7a4a" stroke-width="3"/><g stroke="#7a5228" stroke-width="5" stroke-linecap="round"><path d="M30 150L62 24M92 150L62 24M148 150L178 24M210 150L178 24"/></g>
       <rect x="52" y="16" width="136" height="10" fill="#9a6b3a" stroke="#4a2f17" stroke-width="2"/>
       <rect x="102" y="28" width="36" height="14" fill="#9a6b3a" stroke="#4a2f17" stroke-width="2"/><rect x="102" y="86" width="36" height="14" fill="#9a6b3a" stroke="#4a2f17" stroke-width="2"/>
       ${rep(4, (i) => `<circle cx="${108 + i * 8}" cy="35" r="3.5" fill="#d9c9a5" stroke="#4a2f17"/><circle cx="${108 + i * 8}" cy="93" r="3.5" fill="#d9c9a5" stroke="#4a2f17"/><path d="M${106 + i * 8} 39V89M${110 + i * 8} 39V89" stroke="#c9b07a" stroke-width="1.2"/>`)}
       <path d="M112 100L104 112M128 100L136 112" stroke="#555" stroke-width="2"/><rect x="94" y="112" width="52" height="30" rx="3" fill="#9a978d" stroke="#45433d" stroke-width="2"/>
       <path d="M102 34L48 128M138 34L192 128" stroke="#c9b07a" stroke-width="1.6"/>
       ${[48, 192].map((x) => `<circle cx="${x}" cy="134" r="13" fill="none" stroke="#7a5228" stroke-width="3"/><path d="M${x - 13} 134h26M${x} 121v26M${x - 9} 125l18 18M${x + 9} 125l-18 18" stroke="#7a5228" stroke-width="2"/>`).join("")}`) },
    dalhangari: { alt: "보름달처럼 둥글고 커다란 흰 도자기 항아리", svg: svg(
      `<ellipse cx="120" cy="152" rx="44" ry="4" fill="#d8d0bd"/>
       <path d="M98 24C50 30 40 80 58 112C72 136 96 144 104 146L104 150H136L136 146C144 144 168 136 182 112C200 80 190 30 142 24Z" fill="url(#dh-g)" stroke="#a49c88" stroke-width="2"/>
       <rect x="96" y="16" width="48" height="9" rx="2" fill="#f4f1e8" stroke="#a49c88" stroke-width="2"/><path d="M58 70C60 52 72 40 86 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>`,
      `<radialGradient id="dh-g" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#fdfcf8"/><stop offset=".75" stop-color="#ece6d6"/><stop offset="1" stop-color="#d9d0ba"/></radialGradient>`) },
    sangpyeong: { alt: "가운데에 네모난 구멍이 뚫린 둥근 구리 동전, 구멍 둘레에 한자 네 글자가 있다", svg: svg(
      `<circle cx="120" cy="80" r="64" fill="#a8743a" stroke="#5a3c18" stroke-width="3"/><circle cx="120" cy="80" r="56" fill="none" stroke="#6b471d" stroke-width="2"/>
       <rect x="104" y="64" width="32" height="32" fill="#f6f1e6" stroke="#5a3c18" stroke-width="3"/>
       <g font-size="27" fill="#3a2510" text-anchor="middle" font-family="'Batang','Noto Serif KR','Noto Serif CJK KR',serif"><text x="120" y="56">常</text><text x="120" y="128">平</text><text x="158" y="90">通</text><text x="82" y="90">寶</text></g>`) },
    // ---------- 근대 ----------
    taegeukgi: { alt: "흰 바탕 가운데에 빨강과 파랑의 둥근 무늬가 있고 네 모서리에 검은 막대 무늬가 있는 깃발", svg:
      `<svg viewBox="-72 -48 144 96" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" stroke="#bbb" stroke-width=".6" d="M-72-48v96H72v-96z"/><g stroke="#000" stroke-width="4"><path transform="rotate(33.69006752598)" d="M-50-12v24m6 0v-24m6 0v24m76 0V1m0-2v-11m6 0v11m0 2v11m6 0V1m0-2v-11"/><path transform="rotate(-33.69006752598)" d="M-50-12v24m6 0V1m0-2v-11m6 0v24m76 0V1m0-2v-11m6 0v24m6 0V1m0-2v-11"/></g><g transform="rotate(33.69006752598)"><path fill="#cd2e3a" d="M12 0a18 18 0 11-36 0 24 24 0 1148 0"/><path fill="#0047a0" d="M-24 0a24 24 0 1048 0A12 12 0 100 0a12 12 0 11-24 0"/></g></svg>` },
    dongnipmun: { alt: "화강암을 벽돌처럼 쌓아 올리고 가운데에 둥근 아치 통로를 낸 문", svg: svg(
      `<path d="M10 150H230" stroke="#6d7a4a" stroke-width="3"/>
       <rect x="60" y="34" width="120" height="116" fill="#c9c3b6" stroke="${INK}" stroke-width="2.5"/>
       <g stroke="#9c9587" stroke-width="1.2">${rep(11, (r) => `<path d="M60 ${44 + r * 10}H180"/>` + rep(6, (k) => `<path d="M${68 + k * 22 + (r % 2) * 11} ${34 + r * 10}v10"/>`))}</g>
       <path d="M100 150V100A20 20 0 0 1 140 100V150Z" fill="#4a463e" stroke="${INK}" stroke-width="2"/>
       <rect x="54" y="26" width="132" height="10" fill="#d6d0c3" stroke="${INK}" stroke-width="2"/><rect x="60" y="12" width="120" height="14" fill="#d6d0c3" stroke="${INK}" stroke-width="2"/>${rep(11, (i) => `<rect x="${66 + i * 10.4}" y="15" width="5" height="8" fill="#9c9587"/>`)}
       <rect x="98" y="44" width="44" height="14" fill="#b5ae9f" stroke="${INK}" stroke-width="1.5"/>`) },
    train: { alt: "굴뚝에서 연기를 내뿜으며 철길 위를 달리는 옛날 증기 기관차", svg: svg(
      `<path d="M10 142H230" stroke="#555" stroke-width="3"/>${rep(12, (i) => `<rect x="${14 + i * 18}" y="142" width="10" height="5" fill="#7a5a3a"/>`)}
       <circle cx="78" cy="44" r="8" fill="#c9c9c9"/><circle cx="92" cy="32" r="10" fill="#d6d6d6"/><circle cx="112" cy="22" r="12" fill="#e2e2e2"/>
       <rect x="50" y="86" width="104" height="34" rx="6" fill="#2f3438" stroke="#111" stroke-width="2"/><path d="M64 86L66 66L58 56H88L80 66L82 86Z" fill="#2f3438" stroke="#111" stroke-width="2"/><path d="M104 86a10 10 0 0 1 20 0Z" fill="#3e454a" stroke="#111" stroke-width="2"/>
       <rect x="152" y="64" width="44" height="56" fill="#5a2f26" stroke="#111" stroke-width="2"/><rect x="146" y="58" width="56" height="7" fill="#2f3438"/><rect x="162" y="72" width="22" height="16" fill="#e8dfc6" stroke="#111"/>
       <path d="M50 108L34 134H52Z" fill="#7a2a22" stroke="#111" stroke-width="2"/><circle cx="48" cy="96" r="5" fill="#f1d36b" stroke="#111"/>
       ${[[64, 130, 10], [100, 126, 15], [136, 126, 15], [176, 130, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#a3322a" stroke="#111" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="3" fill="#111"/>`).join("")}<path d="M100 126H136" stroke="#ccc" stroke-width="3"/>`) },
    // ---------- 일제 강점기 ----------
    seoneonseo: { alt: "세로쓰기로 빽빽하게 적힌 옛 문서. 오른쪽 첫 줄에 굵은 한자 제목이 있다", svg: svg(
      `<rect x="30" y="8" width="180" height="144" fill="#f1e8d0" stroke="#8a7650" stroke-width="2.5"/>
       <g font-size="22" font-weight="700" fill="#1f1810" text-anchor="middle" font-family="'Batang','Noto Serif KR','Noto Serif CJK KR',serif"><text x="190" y="40">宣</text><text x="190" y="68">言</text><text x="190" y="96">書</text></g>
       ${rep(12, (c) => rep(c % 4 === 3 ? 6 : 10, (r) => `<path d="M${168 - c * 11.4} ${22 + r * 12.4}h6m-3-4v8" stroke="#3a2e1e" stroke-width="1.4"/>`))}`) },
    poster: { alt: "‘내 살림 내 것으로’, ‘조선 사람 조선 것’이라는 구호가 크게 적힌 옛 선전물", svg: svg(
      `<rect x="36" y="10" width="168" height="140" fill="#f3e6c4" stroke="#7a3b1f" stroke-width="3"/><rect x="36" y="10" width="168" height="22" fill="#7a3b1f"/>
       <g text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-weight="700"><text x="120" y="72" font-size="17" fill="#2b1a10">내 살림 내 것으로</text><text x="120" y="108" font-size="17" fill="#8a2a14">조선 사람 조선 것</text></g>
       <path d="M60 126H180" stroke="#7a3b1f" stroke-width="2"/><path d="M60 134H180" stroke="#7a3b1f" stroke-width="1"/>`) },
    // ---------- 현대 ----------
    tupyo: { alt: "투표 용지가 반쯤 들어간 투표함. 용지에 붉은 동그라미 도장이 찍혀 있다", svg: svg(
      `<path d="M70 70L90 56H190L170 70Z" fill="#f2ede1" stroke="${INK}" stroke-width="2"/><path d="M170 70L190 56V126L170 140Z" fill="#cfc8b7" stroke="${INK}" stroke-width="2"/><rect x="70" y="70" width="100" height="70" fill="#e8e2d4" stroke="${INK}" stroke-width="2.5"/>
       <path d="M108 64L150 64L146 61L112 61Z" fill="#3d3528"/>
       <g transform="rotate(-8 130 40)"><rect x="112" y="14" width="36" height="50" fill="#fff" stroke="#8a8a8a" stroke-width="1.5"/><path d="M118 24h24M118 34h24M118 44h24" stroke="#bbb"/><circle cx="138" cy="34" r="6" fill="none" stroke="#c62828" stroke-width="2"/><path d="M135 37l3-6l3 6" fill="none" stroke="#c62828" stroke-width="1.6"/></g>
       <text x="120" y="112" text-anchor="middle" font-size="18" font-weight="700" fill="#3d3528" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif">투표함</text>`) },
    export: { alt: "1964년, 1970년, 1977년의 수출액을 비교한 막대그래프. 1977년 막대가 가장 높다", svg: svg(
      `<g font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="12" fill="#2b2b2b" text-anchor="middle">
       <text x="120" y="16" font-size="13" font-weight="700">우리나라 수출액 변화</text>
       <text x="40" y="32" font-size="10" text-anchor="start" fill="#555">(단위: 달러)</text>
       <path d="M36 134H220M36 36V134" stroke="#555" stroke-width="2"/>
       <rect x="58" y="132" width="32" height="2" fill="#223c8f"/><rect x="118" y="126" width="32" height="8" fill="#223c8f"/><rect x="178" y="44" width="32" height="90" fill="#223c8f"/>
       <text x="74" y="126">1억</text><text x="134" y="120">약 8억</text><text x="194" y="39">100억</text>
       <text x="74" y="150">1964년</text><text x="134" y="150">1970년</text><text x="194" y="150">1977년</text></g>`) }
  };
})();
