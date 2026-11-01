/* 통합 학습기 서비스워커 — 설치할 때 네 과목 앱 파일을 모두 내려받아 두어 인터넷 없이도 동작한다.
   파일 목록과 버전은 precache.js(node tools/build-sw.js 로 생성)에 있다.
   - 같은 출처 파일: 캐시 먼저(없으면 네트워크에서 받아 캐시에 추가)
   - 글꼴(Google Fonts): 한 번 받으면 캐시해서 오프라인에서도 사용
   - 그 밖의 외부 요청(회화 AI = OpenAI, 카카오 SDK): 손대지 않음 → 인터넷이 있을 때만 동작 */
importScripts('precache.js');
const { version, files } = self.PRECACHE;
const CACHE = 'learner-' + version, FONTS = 'learner-fonts';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 한 번에 너무 많이 요청하지 않도록 8개씩. 하나가 실패해도 나머지는 계속 받는다
    for (let i = 0; i < files.length; i += 8) {
      await Promise.all(files.slice(i, i + 8).map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('learner-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'status') caches.open(CACHE).then(c => c.keys()).then(ks => e.source.postMessage({ type: 'status', version, cached: ks.length, total: files.length }));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }).catch(() => new Response('', { status: 503 })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') return (await c.match('./')) || (await c.match('index.html'));
      return new Response('', { status: 504 });
    }
  })());
});
