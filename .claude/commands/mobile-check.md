# モバイル対応検証

指定されたHTMLページ（$ARGUMENTS または全4ページ）に対してモバイル対応を検証してください。

## 検証項目

### 1. レスポンシブレイアウト
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` が設定されているか
- ブレイクポイント定義が統一されているか:
  - Mobile: `max-width: 767px`
  - Tablet: `768px - 1023px`
  - Desktop: `min-width: 1024px`
- グリッドレイアウトがモバイルで1カラムに折りたたまれるか
  - `.numbers-grid`: 4列 → 2列
  - `.reassurance-grid`: 3列 → 1列
  - `.store-item`: 縦並び → 横並び（120px + 1fr グリッド）
- ヒーローセクションがモバイルで縦方向に折りたたまれるか
- テーブル（`.job-block`, `.job-table`）がモバイルで読めるか
  - `.table-scroll-wrapper` でテーブルが横スクロール可能にラップされているか

### 2. タッチ UI
- 全インタラクティブ要素のタッチターゲットが最小 44x44px か
  - `.nav-link`, `.faq-question`, `.entry-radio`, `.btn-*` 系を確認
  - フォーム入力要素: min-height 48px が設定されているか
  - フローティングCTA: min-height 52px が設定されているか
- タップ可能な要素同士の間隔が 8px 以上か
- リンクやボタンが指で押しやすい位置にあるか
- タッチフィードバック: `:active` で `scale(0.97)` がボタン・カードに設定されているか

### 3. フローティング CTA
- モバイル（767px以下）で `.floating-cta` が画面下部に固定表示されるか
- スクロール方向で表示/非表示が切り替わるか（`js/main.js` の `initFloatingCTA`）
- `.floating-cta-btn` と `.floating-cta-phone` が適切なサイズか
- フッターに `padding-bottom: 80px` が追加されてフローティングCTAと重ならないか
- `#page-top-btn` の `bottom` がフローティングCTAを避けているか

### 4. モバイルメニュー（全画面ダークネイビーオーバーレイ）
- ハンバーガーボタン（`.hamburger`）がモバイルで表示されるか
- メニューが全画面ダークネイビーオーバーレイとして開くか（`.mobile-menu__inner`）
  - 背景: `rgba(11,22,40,0.85)` + `backdrop-filter: blur(4px)` が適用されているか
  - ※旧仕様の300pxスライドインドロワーではない
- 閉じるボタン（`.mobile-menu__close`）と `[data-menu-close]` 属性が機能するか
- `.mobile-menu__phone` に電話番号（03-4363-7710）が表示されているか
- `.mobile-menu__cta` に応募ボタンが表示されているか
- `.mobile-menu__footer` にフッター情報が表示されているか
- body スクロールがロックされるか（`overflow: hidden`）

### 5. テキスト・画像
- モバイルでのフォントサイズが読みやすいか（最小 13px）
- 画像が `max-width: 100%` で収まるか
- 長い単語やURLが横スクロールを発生させないか

### 6. スクロール進捗バー
- `.scroll-progress` がモバイルで画面上部に固定表示されるか
- スクロール量に応じて幅が 0% 〜 100% に変化するか
- ヘッダーと重ならず、視認性があるか

## 出力フォーマット
各項目ごとに ✅ / ⚠️ / ❌ で評価し、問題箇所にはスクリーンサイズ・ファイル名・行番号・修正案を提示してください。
