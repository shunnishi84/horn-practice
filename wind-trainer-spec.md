# 管楽器練習アプリ（仮称：WindTrainer）仕様書

## 概要

ブラウザで動作する管楽器の基礎練習補助アプリ。
ロングトーン・スケール・アルペジオなどのプリセット譜をテンポに合わせて画面スクロールさせ、ユーザーがマイクに向かって演奏した音を**リアルタイム判定**する。音程（ピッチ）・タイミング（ノートオン/オフ）・音価（音の長さ）の3軸で評価し、100点満点でスコアリング。

苦手な音の傾向（音名・オクターブ・進行方向別）を蓄積し、練習履歴をGitHub草型カレンダーで可視化する。

サーバー不要のローカル動作。データはIndexedDB保存、ポータブルファイルでエクスポート/インポート可能。PWA化してスマホホーム画面対応。

---

## 技術スタック（推奨）

選定はClaude Codeに委ねるが、以下を推奨する。

- **フロントエンド**: React + TypeScript + Vite
- **状態管理**: Zustand
- **楽譜描画**: VexFlow もしくは OpenSheetMusicDisplay（OSMD）
- **音声入力**: Web Audio API + MediaStream（`getUserMedia`）
- **ピッチ検出**: YIN アルゴリズムまたは autocorrelation（`pitchy` ライブラリ等を活用）
- **オンセット検出**: スペクトラルフラックス または RMSエネルギー閾値
- **データ保存**: IndexedDB（`idb` ライブラリ）
- **PWA**: `vite-plugin-pwa`
- **スタイリング**: Tailwind CSS
- **チャート/カレンダー**: Recharts + 自作のヒートマップカレンダーコンポーネント
- **ビルド**: 静的ファイル出力

---

## データモデル

### Instrument（楽器設定）

```ts
type InstrumentKey = 'soprano_sax' | 'alto_sax' | 'tenor_sax' | 'baritone_sax'
                   | 'trumpet' | 'horn' | 'flute' | 'clarinet' | 'trombone' | 'tuba';

type Transposition = 'C' | 'Bb' | 'Eb' | 'F';

interface InstrumentProfile {
  key: InstrumentKey;
  displayName: string;        // "アルトサックス" 等
  defaultTransposition: Transposition;
  range: {                    // 推奨音域
    lowest: string;           // "Bb3" 等の科学的音高表記
    highest: string;
  };
}
```

### Preset（プリセット譜）

```ts
type PresetCategory = 'long_tone' | 'scale' | 'arpeggio' | 'interval' | 'tonguing';

interface Preset {
  id: string;
  category: PresetCategory;
  title: string;              // "Cメジャースケール（上行下行）" 等
  description?: string;
  // 楽譜は内部的にノートシーケンスとして保持
  notes: NoteEvent[];
  defaultBpm: number;
  timeSignature: { numerator: number; denominator: number };
  // 表示用にMusicXMLまたは独自JSONを別途保持してもよい
  scoreData: string;          // MusicXMLまたは独自JSON
}

interface NoteEvent {
  pitch: string;              // "C4", "F#4" 等の科学的音高（concert pitch記譜時）
  startBeat: number;          // 開始拍位置（小節先頭から通算）
  durationBeats: number;      // 音価（拍数）
  isRest: boolean;
}
```

### Settings（アプリ設定）

```ts
interface Settings {
  instrument: InstrumentKey;
  transposition: Transposition;       // in Bb / in C / in Eb / in F
  tuningHz: number;                   // A基準周波数。デフォルト440、範囲415〜470
  pitchToleranceCents: number;        // 許容セント数。デフォルト20、範囲5〜50
  timingToleranceMs: number;          // 許容ミリ秒。デフォルト80、範囲20〜200
  durationToleranceRatio: number;     // 音価の許容比率。デフォルト0.15（±15%）
  countdownSeconds: 3;                // 開始合図の秒数（固定3秒推奨）
  metronomeOn: boolean;               // 練習中のメトロノーム鳴動
  inputDeviceId?: string;             // 選択中のマイクデバイス
}
```

### Session（練習セッション）

```ts
interface Session {
  id: string;
  presetId: string;
  instrument: InstrumentKey;
  transposition: Transposition;
  tuningHz: number;
  bpm: number;
  startedAt: string;          // ISO8601
  endedAt: string;
  durationSec: number;
  totalScore: number;         // 0-100
  pitchScore: number;         // 0-100
  timingScore: number;        // 0-100
  durationScore: number;      // 0-100
  noteResults: NoteResult[];
}

interface NoteResult {
  noteIndex: number;          // Preset.notes 上のインデックス
  expectedPitch: string;      // "C4"
  detectedPitchHz?: number;   // 実際に検出された平均周波数
  pitchDeviationCents?: number; // 期待値からのズレ（セント）
  onsetDeviationMs?: number;  // 発音タイミングのズレ（ms、+遅れ/-早すぎ）
  offsetDeviationMs?: number; // 切り目タイミングのズレ
  durationRatio?: number;     // 期待音価に対する実際の比率
  pitchScore: number;         // 0-100
  timingScore: number;        // 0-100
  durationScore: number;      // 0-100
  totalScore: number;         // 0-100
}
```

### NoteStatistics（音別統計）

セッションログから集計する派生データ。永続化はキャッシュ程度で可。

```ts
interface NoteStatistics {
  pitchClass: string;         // "C", "D", "Eb" 等（concert pitchベース）
  octave: number;
  direction?: 'ascending' | 'descending' | 'static'; // 直前の音からの進行方向
  sampleCount: number;
  avgPitchDeviationCents: number;  // 平均ズレ（符号付き：低い傾向ならマイナス）
  avgPitchScore: number;
  avgTimingScore: number;
  avgDurationScore: number;
}
```

---

## 画面構成

### 1. ホーム画面

- 今日の練習サマリー（実施時間、平均スコア、ストリーク日数）
- 直近のセッション履歴
- 「練習を始める」ボタン → プリセット選択画面へ
- カレンダー（後述、コンパクト版）
- ナビ：プリセット選択 / 統計 / 設定 / エクスポート

### 2. プリセット選択画面

- カテゴリタブ：ロングトーン / スケール / アルペジオ / インターバル / タンギング
- 各プリセットをカード表示（楽譜サムネイル＋曲名＋デフォルトBPM）
- プリセットを選ぶ → 練習設定画面へ

### 3. 練習設定画面

- 選択したプリセットのフルスコアプレビュー
- BPM調整（スライダー＋数値入力）
- 楽器選択（ドロップダウン）
- 移調（in C / Bb / Eb / F）
- マイクデバイス選択
- 「3・2・1で開始」ボタン

### 4. 練習画面（中核）

**カウントダウン**
- 「3」「2」「1」を画面中央に大きく表示しつつメトロノーム音
- カウントダウン中にマイクの動作確認も兼ねる（音量メーター表示）

**スクロール表示**
- 楽譜が右から左にBPMに合わせてスクロール
- 画面中央に縦の「現在地ライン」
- ラインに重なっている音符が「いま吹くべき音」
- 演奏中の音符は色変化（リアルタイムフィードバック）：
  - 緑＝音程・タイミング・音価すべて◎
  - 黄＝一部ズレあり
  - 赤＝大きくズレている／吹けていない
- 音程のズレは音符の上下に矢印（↑高い／↓低い）でリアルタイム表示
- セント単位の数値も小さく表示

**判定ロジック概要**
- マイク入力を一定間隔（例：10msフレーム）でピッチ検出
- 各ノート期間の中央部分の安定したピッチを抽出して評価
- オンセット検出（スペクトラルフラックスまたはエネルギー上昇）でタイミング評価
- オンセット〜オフセットの長さで音価評価

**スコア計算**
- 音程スコア：許容セント以内なら100、許容の2倍以上ズレたら0、線形補間
- タイミングスコア：許容ms以内なら100、4倍以上ズレたら0
- 音価スコア：許容比率以内なら100、許容の3倍以上ズレたら0
- ノート総合スコア：3軸の単純平均（後で重み付け可能に）
- セッション総合：全ノートの平均

**操作**
- 一時停止／再開
- 中断（途中までのスコアで保存するか破棄するか選択）

### 5. リザルト画面

- 総合スコア（大きく表示）
- 3軸スコアのレーダーチャート
- ノート別の結果テーブル（ズレ量と各軸スコア）
- 苦手ノートのハイライト（このセッションで著しく低かった音）
- 「もう一度」「設定変更して再挑戦」「ホームに戻る」

### 6. 統計画面

**カレンダーセクション（GitHub草型）**
- 過去365日のヒートマップ
- 色の濃淡：練習時間 or 平均スコアのどちらを基準にするか切替可能
- 連続練習日数（ストリーク）と最長ストリーク表示
- 週ごと・月ごとの合計練習時間バーチャート

**苦手音分析セクション**
- 鍵盤型UI で各音名のスコアをヒートマップ表示
- フィルタ：
  - **音名ごと**（ド・レ・ミ…のスコア集計）
  - **オクターブ別**（低音域・中音域・高音域で別集計）
  - **進行方向別**（上行時・下行時・静止時で別集計）
- 表形式で「ズレ傾向（平均：低め○セント / 高め○セント）」を可視化
- 期間フィルタ（直近7日 / 30日 / 全期間）

### 7. 設定画面

- 楽器・移調設定
- チューニング基準Hz（415〜470の範囲、1Hz刻み）
- 許容セント数（5〜50）
- 許容ミリ秒（20〜200）
- 音価許容比率（5%〜30%）
- メトロノーム音量・音色
- マイクデバイス選択・入力レベル確認
- ダーク/ライトテーマ

### 8. エクスポート/インポート画面

- 全データ（設定 + セッション履歴 + カスタムプリセット）を単一ファイルに
- 形式：拡張子 `.windtrn`（中身はZIP、`manifest.json` ＋ 各種JSON）
- インポート時：上書き or 追加マージ選択

---

## 重要な技術検討事項

### 移調の扱い

- 楽譜表示は**奏者から見た記譜（in 楽器調）**で行う
- 内部のNoteEventは**concert pitch（in C実音）**で保持
- 表示時のみ移調適用：例えば in Bb なら全体を長2度上げて表示
- マイクで拾った音は実音なので、そのままconcert pitchで比較すればよい

### ピッチ検出の精度確保

- サンプリングレート：48kHz推奨
- フレームサイズ：2048サンプル程度（低音もカバー）
- ホップサイズ：512サンプル（約10ms間隔）
- ハイパスフィルタで低域ノイズ除去
- 基音だけでなく倍音構成も見て誤検出（オクターブエラー）を抑制

### オンセット検出

- スペクトラルフラックスを基本に
- 連続音（レガート）では音高変化点も検出対象に
- ノイズフロア自動推定で環境音と区別

### A基準Hzの反映

- セント計算時は基準Hzを反映：`cents = 1200 * log2(detectedHz / expectedHz)`
- expectedHzはA基準Hzから平均律で算出

---

## 内蔵プリセット譜（最低限の初期セット）

サポート楽器：ソプラノサックス・アルトサックス・テナーサックス・バリトンサックス・トランペット・ホルン・フルート・クラリネット・トロンボーン・チューバ

各カテゴリで以下を用意：

**ロングトーン**
- 全音符ロングトーン（半音階上行下行、各楽器の実用音域内）
- クレッシェンド／デクレッシェンド付き

**スケール**
- 長音階（C / F / Bb / Eb / G / D / A メジャー）
- 自然短音階・和声短音階・旋律短音階（各調）
- 半音階

**アルペジオ**
- 各長調・短調の三和音アルペジオ
- 7thコードアルペジオ

**インターバル**
- 3度・4度・5度のインターバル練習

**タンギング**
- 同音連打（4分音符・8分音符・16分音符）
- スタッカート練習

楽器の音域に応じて、対応外の音は自動でオクターブ調整 or 該当プリセット非表示。

---

## 非機能要件

- **オフライン動作**: 初回ロード後はネット不要
- **マイク権限**: 初回利用時に明示的に許諾を求める
- **遅延**: 入力〜判定の遅延は50ms以下を目標
- **ブラウザ対応**: Chrome / Firefox / Safari の最新2バージョン（マイク権限とWeb Audio APIサポート必須）
- **モバイル対応**: iOS Safari / Android Chrome（マイク入力動作確認必須）
- **アクセシビリティ**: キーボード操作対応、判定結果は色だけでなくテキストでも示す

---

## ディレクトリ構成（推奨）

```
wind-trainer/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── ScoreScroller/      # スクロール楽譜
│   │   ├── PitchMeter/         # リアルタイムピッチ表示
│   │   ├── Countdown/
│   │   ├── HeatmapCalendar/    # GitHub草型
│   │   ├── NoteHeatmap/        # 鍵盤型苦手音ヒートマップ
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── PresetSelect.tsx
│   │   ├── PracticeSetup.tsx
│   │   ├── Practice.tsx
│   │   ├── Result.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── audio/
│   │   ├── pitchDetector.ts    # ピッチ検出
│   │   ├── onsetDetector.ts    # オンセット検出
│   │   ├── micInput.ts         # マイク入力管理
│   │   └── metronome.ts
│   ├── scoring/
│   │   ├── pitchScoring.ts
│   │   ├── timingScoring.ts
│   │   └── durationScoring.ts
│   ├── music/
│   │   ├── transposition.ts
│   │   ├── noteUtils.ts        # 音名⇔Hz変換
│   │   └── presets/            # 内蔵プリセット定義
│   ├── store/
│   ├── db/
│   ├── lib/exporter.ts
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 実装フェーズ提案

**Phase 1（コア判定エンジン）**
- マイク入力＋ピッチ検出のプロトタイプ
- 単音をリアルタイムでHz表示・セント表示
- ノイズ耐性検証

**Phase 2（楽譜表示と練習画面）**
- プリセット選択
- スクロール楽譜表示
- カウントダウン
- リアルタイム色フィードバック（音程のみ先行）

**Phase 3（スコアリング3軸）**
- オンセット/オフセット検出
- 音価判定
- ノート別・セッション別スコア集計
- リザルト画面

**Phase 4（履歴と分析）**
- セッション保存（IndexedDB）
- 苦手音統計集計
- カレンダー表示
- 鍵盤型ヒートマップ

**Phase 5（仕上げ）**
- 設定画面の全項目
- エクスポート/インポート
- PWA化
- 移調対応の仕上げ

---

## Claude Codeへの指示

- Phase 1から順に実装し、各Phase終わりで動作確認可能な状態にすること
- 型はTypeScriptで厳密に
- 音声処理はAudioWorkletNode を使うとメインスレッドを止めずに済む。可能な限りWorklet利用
- ピッチ検出は既存ライブラリ（`pitchy` 等）の利用を検討してよい
- 楽譜描画は VexFlow / OSMD のどちらか、スクロール実装しやすい方を選定
- マイク権限のエラーハンドリングを丁寧に（権限拒否時の案内画面）
- ブラウザのオーディオ自動再生制限に注意（ユーザー操作起点でAudioContext生成）
- README.mdにセットアップ手順、使い方、判定アルゴリズムの簡単な説明を載せること
- コミットはPhase単位 or 機能単位
