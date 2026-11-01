/* 통합 학습기 — Firebase 연결(로그인 · 학습 기록 저장)
   아이디는 '<아이디>@learner.app' 형식의 이메일 계정으로 만든다(메일은 보내지 않음).
   Firestore 구조
     users/{uid}                 프로필 { id, name, grade, parent, levels, talkLang, status:'pending'|'approved'|'rejected', createdAt, mt }
     users/{uid}/events/{id}     학습 1회
     users/{uid}/archives/{id}   보관함 정보
   승인 규칙은 firestore.rules가 서버에서 지킨다(승인 전에는 기록을 읽고 쓸 수 없음, 승인은 관리자만). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence,
  browserLocalPersistence, browserSessionPersistence, updatePassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { FIREBASE_CONFIG, ADMIN_ID } from './firebase-config.js';

const DOMAIN = '@learner.app';
const PROFILE_KEYS = ['name', 'grade', 'parent', 'levels', 'talkLang', 'mt'];
const ready = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey);
let auth = null, db = null;
if (ready) { const app = initializeApp(FIREBASE_CONFIG); auth = getAuth(app); db = getFirestore(app); }

const email = id => id + DOMAIN;
const idOf = user => (user && user.email ? user.email.replace(DOMAIN, '') : null);
// 자주 나오는 오류를 한국어로
function friendly(e) {
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return '아이디 또는 비밀번호가 맞지 않아요';
  if (c.includes('email-already-in-use')) return '이미 있는 아이디예요. 다른 아이디를 써 주세요';
  if (c.includes('weak-password')) return '비밀번호는 6자 이상으로 정해 주세요';
  if (c.includes('network-request-failed') || c.includes('unavailable')) return '인터넷 연결을 확인해 주세요';
  if (c.includes('too-many-requests')) return '잠시 후 다시 시도해 주세요';
  if (c.includes('permission-denied')) return '권한이 없어요(관리자 승인 전이거나 승인이 취소됨)';
  return (e && e.message) || '알 수 없는 오류';
}
const wrap = f => async (...a) => { try { return await f(...a); } catch (e) { const err = new Error(friendly(e)); err.code = e && e.code; throw err; } };

window.Cloud = {
  ready, ADMIN_ID,
  isAdminId: id => id === ADMIN_ID,
  onAuth(cb) { if (!ready) return cb(null); onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, id: idOf(u) } : null)); },
  current: () => (auth && auth.currentUser ? { uid: auth.currentUser.uid, id: idOf(auth.currentUser) } : null),
  signIn: wrap(async (id, pw, remember) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const r = await signInWithEmailAndPassword(auth, email(id), pw); return { uid: r.user.uid, id };
  }),
  signUp: wrap(async (id, pw, profile, remember) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const r = await createUserWithEmailAndPassword(auth, email(id), pw);
    const p = { id, ...pick(profile), status: id === ADMIN_ID ? 'approved' : 'pending', createdAt: Date.now() };
    await setDoc(doc(db, 'users', r.user.uid), p);
    return { uid: r.user.uid, id, profile: p };
  }),
  signOut: () => (auth ? signOut(auth) : Promise.resolve()),
  changePassword: wrap(pw => updatePassword(auth.currentUser, pw)),
  getProfile: wrap(async uid => { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; }),
  // 프로필 중 학습 관련 값만 저장한다(status는 관리자만 바꿀 수 있음)
  saveProfile: wrap((uid, p) => setDoc(doc(db, 'users', uid), pick(p), { merge: true })),
  // since 이후에 바뀐 기록을 받는다
  pull: wrap(async (uid, since) => {
    const get = async name => (await getDocs(query(collection(db, 'users', uid, name), where('mt', '>', since)))).docs.map(d => d.data());
    return { events: await get('events'), archives: await get('archives') };
  }),
  push: wrap(async (uid, events, archives) => {
    const all = [...events.map(e => ['events', e]), ...archives.map(a => ['archives', a])];
    for (let i = 0; i < all.length; i += 400) {
      const b = writeBatch(db);
      all.slice(i, i + 400).forEach(([name, x]) => b.set(doc(db, 'users', uid, name, x.id), x));
      await b.commit();
    }
  }),
  // 관리자: 사용자 목록과 승인
  listUsers: wrap(async () => (await getDocs(collection(db, 'users'))).docs.map(d => ({ uid: d.id, ...d.data() }))),
  setStatus: wrap((uid, status) => setDoc(doc(db, 'users', uid), { status, statusAt: Date.now() }, { merge: true })),
};
function pick(p) { const o = {}; PROFILE_KEYS.forEach(k => { if (p && p[k] !== undefined) o[k] = p[k]; }); return o; }
window.dispatchEvent(new Event('cloud-ready'));
