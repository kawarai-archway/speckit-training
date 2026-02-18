# クイックスタート: カタログ閲覧機能

**Branch**: `001-catalog-browse` | **Date**: 2026-02-13

## 前提条件

- Node.js 18 以上
- pnpm（パッケージマネージャー）
- 依存関係インストール済み（`pnpm install`）

## セットアップ

```bash
# ブランチ切り替え
git checkout 001-catalog-browse

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev
```

## 実装対象ファイル

### Contracts（共有インターフェース拡張）

| ファイル | 変更内容 |
|---------|---------|
| `src/contracts/catalog.ts` | ProductSchema に stock 追加、GetProductsInputSchema に keyword 追加、ProductRepository に keyword パラメータ追加 |

### ドメイン実装（スタブ置換）

| ファイル | 変更内容 |
|---------|---------|
| `src/domains/catalog/api/index.ts` | NotImplementedError → 本番ユースケース（getProducts, getProductById） |
| `src/domains/catalog/api/usecases.ts` | **新規作成**: getProducts, getProductById ユースケース実装 |
| `src/domains/catalog/ui/index.tsx` | プレースホルダー → 本番コンポーネントのエクスポート |
| `src/domains/catalog/ui/ProductList.tsx` | **新規作成**: 商品一覧コンポーネント（検索・ページネーション付き） |
| `src/domains/catalog/ui/ProductCard.tsx` | **新規作成**: 商品カードコンポーネント |
| `src/domains/catalog/ui/ProductDetail.tsx` | **新規作成**: 商品詳細コンポーネント |

### インフラ（リポジトリ拡張）

| ファイル | 変更内容 |
|---------|---------|
| `src/infrastructure/repositories/product.ts` | EXTENSION_PRODUCTS に 20 件追加、findAll に keyword 検索ロジック追加、count に keyword 対応追加 |

### ページ（既存ファイル修正）

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(buyer)/catalog/page.tsx` | ProductList スタブ → データフェッチ + 本番 ProductList |
| `src/app/(buyer)/catalog/[id]/page.tsx` | ProductDetail スタブ → データフェッチ + 本番 ProductDetail |
| `src/app/(buyer)/layout.tsx` | navLinks に `{ href: '/catalog', label: '商品一覧' }` を追加 |

### テスト

| ファイル | 変更内容 |
|---------|---------|
| `tests/unit/domains/catalog/usecase.test.ts` | **新規作成**: ユースケース単体テスト |
| `tests/unit/domains/catalog/ui.test.tsx` | **新規作成**: UI コンポーネント単体テスト |
| `tests/integration/domains/catalog/api.test.ts` | **新規作成**: API 統合テスト |
| `tests/e2e/catalog.spec.ts` | **新規作成**: E2E テスト |

## テスト実行

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2E テスト
pnpm test:e2e

# サンプルテスト（リグレッション確認）
pnpm test:unit:samples
pnpm test:integration:samples
```

## 動作確認

1. `pnpm dev` で開発サーバーを起動
2. `http://localhost:3000/catalog` にアクセス → 商品一覧が表示される
3. 商品カードをクリック → 商品詳細画面に遷移する
4. 検索フィールドにキーワードを入力 → 該当商品のみ表示される
