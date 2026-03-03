# アクセシビリティ検証 (WCAG 2.1 AA)

指定されたHTMLページ（$ARGUMENTS または全4ページ）に対して WCAG 2.1 AA 準拠のアクセシビリティ検証を実施してください。

## 検証項目

### 1. 知覚可能 (Perceivable)
- 全 `<img>` に適切な `alt` テキストがあるか
- 装飾画像に `alt=""` と `aria-hidden="true"` が設定されているか
- テキストと背景のコントラスト比が 4.5:1 以上（大文字 3:1 以上）か
  - 特に: `--color-primary`（#FFCB05）上のテキスト色を確認
  - `--color-secondary`（#1B2A4A）上の白テキストを確認
- `<html lang="ja">` が設定されているか
- フォームの `<label>` が対応する `<input>` と正しく紐付いているか（`for`/`id`）

### 2. 操作可能 (Operable)
- キーボードのみで全操作が可能か
  - Tab キーで全インタラクティブ要素にフォーカスが到達するか
  - Enter/Space で全ボタン・リンクが動作するか
  - Escape でモバイルメニューが閉じるか
- `*:focus-visible` のアウトラインスタイルが設定されているか
- フォーカストラップ: モバイルメニュー内で Tab が循環するか（`js/main.js`）
- スキップリンク（`.skip-link`）が存在し、メインコンテンツにジャンプできるか
- タッチターゲット: モバイルで全インタラクティブ要素が最小 44x44px か

### 3. 理解可能 (Understandable)
- フォームエラーメッセージが `aria-invalid`, `aria-describedby` で通知されるか
- エラー通知に `role="alert"` または `aria-live="polite"` が使われているか
- 必須フィールドに `required` 属性と視覚的な「必須」ラベルがあるか

### 4. 堅牢 (Robust)
- `aria-expanded`, `aria-hidden`, `aria-label` がモバイルメニューに設定されているか
- `prefers-reduced-motion: reduce` でアニメーションが完全無効化されるか（`custom.css` 末尾）
- `.sr-only` クラスがスクリーンリーダー専用テキストに使われているか

## 出力フォーマット
各原則ごとに ✅ / ⚠️ / ❌ で評価し、問題箇所にはファイル名・行番号・修正コード例を提示してください。
