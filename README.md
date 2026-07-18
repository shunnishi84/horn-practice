# WindTrainer

ブラウザで動作する管楽器の基礎練習補助アプリ。ロングトーン・スケール・アルペジオ等のプリセットをテンポに合わせて画面スクロールさせ、マイクから入力された演奏音をリアルタイムで判定する。

## セットアップ

```bash
npm install
npm run dev          # 開発サーバ http://127.0.0.1:5173
npm run build        # 本番ビルド (dist/)
npm run preview      # ビルド済みをプレビュー http://127.0.0.1:4173
npm run test:e2e     # Playwright E2E テスト
```

初回 E2E 実行時は `npx playwright install chromium` でブラウザを取得しておく。

## 使い方

1. ホーム → 「練習を始める」 → カテゴリ・プリセットを選ぶ
2. 練習設定で BPM・楽器・移調・マイクを選び「3・2・1で開始」
3. カウントダウンの後にスクロール楽譜が動き、現在地ラインに重なる音符を演奏
4. 演奏終了でリザルト画面に遷移、3軸スコア（音程・タイミング・音価）と苦手音が表示
5. 統計画面で GitHub 草型カレンダーと音名ヒートマップを確認
6. エクスポート画面で `.windtrn` ファイルにバックアップ

## 判定アルゴリズム概要

- **ピッチ検出**: `pitchy` の YIN 系アルゴリズムで毎フレーム基音 Hz を抽出。RMS 閾値とクラリティ閾値で雑音を除外
- **オンセット検出**: エネルギー閾値ベース。発音開始時刻を期待開始時刻と比較
- **音価判定**: 検出されたオンセット〜オフセットの長さと期待音価の比率
- **音程スコア**: `cents = 1200 * log2(detectedHz / expectedHz)` を計算し、許容セント以内なら 100、許容の 2 倍以上で 0、線形補間
- **タイミングスコア**: 許容 ms 以内 100、4 倍以上で 0
- **音価スコア**: 許容比率以内 100、3 倍以上で 0
- **総合**: 3 軸の単純平均

## 移調の扱い

- 楽譜表示は **奏者から見た記譜**（in 楽器調）
- 内部のノートは **concert pitch（実音）** で保持
- 表示時のみ移調オフセットを適用（in Bb なら長 2 度上、in Eb なら長 6 度上、in F なら完全 5 度上）
- マイクから拾った音は実音なので、そのまま比較可能

## ディレクトリ

```
src/
├── audio/        # micInput, pitchDetector, onsetDetector, metronome
├── components/   # ScoreScroller, Countdown, PitchMeter, HeatmapCalendar, NoteHeatmap
├── pages/        # Home, PresetSelect, PracticeSetup, Practice, Result, Stats, Settings, ExportImport
├── music/        # noteUtils, transposition, instruments, presets
├── scoring/      # scoring, statistics
├── store/        # Zustand store
├── db/           # IndexedDB (idb)
├── lib/          # exporter
└── types/
```

## E2E テスト

`?e2e=1` クエリで練習画面はマイク取得をスキップしダミー結果を生成するため、CI/ヘッドレス環境で全フローを通す。

## クラウド同期（ログイン + 練習履歴のサーバー保存）

デフォルトでは従来通り IndexedDB のみで動作する（ゲストモード）。以下を設定するとナビゲーションにログインボタンが現れ、Google ログイン後は練習履歴・設定が Cloudflare Workers API（`worker/` 参照）経由で D1 に保存される。

1. Firebase プロジェクトを作成し、Authentication で Google プロバイダを有効化
2. `worker/README.md` の手順で D1 作成・マイグレーション・Worker デプロイ
3. `src/config.ts` の `firebaseConfig`（Firebase コンソールのウェブアプリ設定値）と `API_BASE_URL`（デプロイした Worker の URL）を実際の値に書き換える

ログイン直後にローカルの履歴がサーバーへアップロードされる（セッション ID で重複排除されるため何度でも安全）。ログイン中の練習結果は IndexedDB とサーバーの両方に保存される。

## GitHub Pages へのデプロイ

`main` ブランチへの push で `.github/workflows/deploy.yml` が自動的にビルドして GitHub Pages に公開する。

初回のみ、リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定しておく。

公開URL: `https://<owner>.github.io/horn-practice/`

マイク入力（`getUserMedia`）は HTTPS 配信が必須だが、GitHub Pages は標準で HTTPS 配信のため追加設定は不要。
