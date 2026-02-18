# クイックスタート: カート管理機能

**ブランチ**: `002-cart-management` | **日付**: 2026-02-18

## 前提条件

- Node.js がインストール済み
- `npm install` 実行済み
- カタログ機能（001-catalog-browse）がマージ済み

## 開発サーバー起動

```bash
npm run dev
```

## テスト実行

```bash
# 単体テスト
npx vitest run tests/unit/domains/cart/

# 統合テスト
npx vitest run tests/integration/domains/cart/

# E2E テスト（事前に Playwright ブラウザインストール要）
npx playwright install --with-deps chromium
npx playwright test tests/e2e/cart-buyer-flow.spec.ts

# カバレッジ
npx vitest run --coverage
```

## 実装対象ファイル

### ドメイン層（スタブ置換）

| ファイル | 操作 | 説明 |
|---------|------|------|
| `src/domains/cart/api/index.ts` | 置換 | NotImplementedError → 本番ユースケース |
| `src/domains/cart/api/usecases.ts` | 新規 | ビジネスロジック実装 |
| `src/domains/cart/ui/index.tsx` | 置換 | プレースホルダー → CartView エクスポート |
| `src/domains/cart/ui/CartView.tsx` | 新規 | カート表示・操作 UI |

### コントラクト拡張

| ファイル | 操作 | 説明 |
|---------|------|------|
| `src/contracts/cart.ts` | 修正 | tax/total 追加、数量上限追加、ProductFetcher に stock 追加 |

### ページ・レイアウト修正

| ファイル | 操作 | 説明 |
|---------|------|------|
| `src/app/(buyer)/cart/page.tsx` | 修正 | データ取得・イベント処理追加 |
| `src/app/(buyer)/catalog/[id]/page.tsx` | 修正 | API URL 修正、認証リダイレクト、フィードバック追加 |
| `src/app/(buyer)/layout.tsx` | 修正 | カートリンク有効化、cartUrl 修正 |

### テスト

| ファイル | 操作 | 説明 |
|---------|------|------|
| `tests/unit/domains/cart/usecase.test.ts` | 新規 | ユースケース単体テスト |
| `tests/unit/domains/cart/ui.test.tsx` | 新規 | UI コンポーネント単体テスト |
| `tests/integration/domains/cart/api.test.ts` | 新規 | API 統合テスト |
| `tests/e2e/cart-buyer-flow.spec.ts` | 新規 | E2E テスト |

## 参考リソース

- サンプル実装: `src/samples/domains/cart/`
- サンプルテスト: `src/samples/tests/*/domains/cart/`
- コントラクト: `src/contracts/cart.ts`
- リポジトリ実装: `src/infrastructure/repositories/cart.ts`
- テンプレート UI: `src/templates/ui/components/`

## デモユーザー

| ロール | メール | パスワード |
|--------|--------|-----------|
| buyer | buyer@example.com | demo |
| admin | admin@example.com | demo |
