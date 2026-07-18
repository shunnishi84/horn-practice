// クラウド同期（ログイン + 練習履歴のサーバー保存）の設定。
// Firebaseコンソールの「プロジェクトの設定 > マイアプリ > ウェブアプリ」の値と、
// デプロイ済みWorkerのURLを設定すると、ナビゲーションにログインボタンが現れる。
// 未設定のままなら従来通りIndexedDBのみ（ゲストモード）で動作する。

export const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
};

// 例: 'https://wind-trainer-api.<your-subdomain>.workers.dev'
export const API_BASE_URL = 'REPLACE_WITH_WORKER_URL';

export function isCloudSyncConfigured(): boolean {
  return (
    !firebaseConfig.apiKey.startsWith('REPLACE_WITH') &&
    !API_BASE_URL.startsWith('REPLACE_WITH')
  );
}
