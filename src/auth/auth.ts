import { firebaseConfig, isCloudSyncConfigured } from '../config';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// firebaseはクラウド同期設定済みのときだけ動的importする。
// 未設定環境（ローカル開発・E2E・フォーク）ではバンドルの読み込み自体を避ける。
async function getFirebaseAuth() {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getAuth(app);
}

export function subscribeAuth(callback: (user: AuthUser | null) => void): () => void {
  if (!isCloudSyncConfigured()) {
    callback(null);
    return () => {};
  }
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  void (async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const auth = await getFirebaseAuth();
    if (cancelled) return;
    unsubscribe = onAuthStateChanged(auth, (u) => {
      callback(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
    });
  })();
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export async function signInWithGoogle(): Promise<void> {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const auth = await getFirebaseAuth();
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutUser(): Promise<void> {
  const { signOut } = await import('firebase/auth');
  const auth = await getFirebaseAuth();
  await signOut(auth);
}

export async function getIdToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('not signed in');
  return user.getIdToken();
}
