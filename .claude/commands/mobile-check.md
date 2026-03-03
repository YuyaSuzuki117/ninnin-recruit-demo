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

### 2. タッチ UI
- 全インタラクティブ要素のタッチターゲットが最小 44x44px か
  - `.nav-link`, `.faq-question`, `.entry-radio`, `.btn-*` 系を確認
- タップ可能な要素同士の間隔が 8px 以上か
- リンクやボタンが指で押しやすい位置にあるか

### 3. フローティング CTA
- モバイル（767px以下）で `.floating-cta` が画面下部に固定表示されるか
- スクロール方向で表示/非表示が切り替わるか（`js/main.js` の `initFloatingCTA`）
- `.floating-cta-btn` と `.floating-cta-phone` が適切なサイズか
- フッターに `padding-bottom: 80px` が追加されてフローティングCTAと重ならないか
- `#page-top-btn` の `bottom` がフローティングCTAを避けているか

### 4. モバイルメニュー
- ハンバーガーボタン（`.hamburger`）がモバイルで表示されるか
- メニューがスライドイン/アウトするか（`.mobile-menu.open`）
- オーバーレイ（`.mobile-menu-overlay`）が表示されるか
- body スクロールがロックされるか（`overflow: hidden`）

### 5. テキスト・画像
- モバイルでのフォントサイズが読みやすいか（最小 13px）
- 画像が `max-width: 100%` で収まるか
- 長い単語やURLが横スクロールを発生させないか

## 出力フォーマット
各項目ごとに ✅ / ⚠️ / ❌ で評価し、問題箇所にはスクリーンサイズ・ファイル名・行番号・修正案を提示してください。
