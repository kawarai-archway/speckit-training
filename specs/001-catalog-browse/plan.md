# 実装計画: カタログ閲覧機能

**Branch**: `001-catalog-browse` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-catalog-browse/spec.md`

## 概要

購入者が認証不要で商品カタログを閲覧できる機能を実装する。既存の Catalog ドメインスタブ（NotImplementedError）を本番実装に置換し、商品一覧表示（12件/ページ、ページネーション付き）、商品詳細表示（カート追加ボタン付き）、キーワード検索の3機能を提供する。既存の `src/contracts/catalog.ts` に `stock`（在庫数）フィールドと `keyword`（検索）パラメータを後方互換で追加し、Unsplash 画像 URL を使用した 20 件の拡張シードデータでページネーション動作を確認可能にする。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict mode)
**主要フレームワーク**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**ストレージ**: インメモリストア（`globalThis` + `Map<string, Product>`）
**テスト**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）、React Testing Library 16
**対象プラットフォーム**: Web ブラウザ（サーバー: Node.js 18+）
**プロジェクトタイプ**: Web アプリケーション（Next.js 統合型）
**パフォーマンス目標**: 一覧ページ初回ロード 3 秒以内
**制約**: 認証不要でアクセス可能、インメモリストア使用（DB 不使用）
**スケール/スコープ**: 商品 25 件（ベース 5 件 + 拡張 20 件）、3 画面（一覧・詳細・検索結果）

## 憲章チェック

*ゲート: Phase 0 リサーチ開始前に合格必須。Phase 1 設計後に再チェック。*

| 原則 | 状態 | 備考 |
|------|------|------|
| I. テンプレート駆動開発 | ✅ 合格 | UI は `@/templates/ui/pages/`（ListPage, DetailPage）および `@/templates/ui/components/`（Loading, Error, Empty）を使用。API は `@/templates/api/usecase` パターンを使用。リポジトリは既存の `productRepository` を拡張 |
| II. ドメイン分離 | ✅ 合格 | `src/domains/catalog/` に api/ と ui/ の 2 層で実装。ドメイン間依存は Cart API 呼び出しのみ（REST 経由） |
| III. TDD 必須（非交渉） | ✅ 合格 | 各ユーザーストーリーで Red → Green → Refactor → 検証 の 4 フェーズを実施。4 種別テスト（ユースケース単体・UI 単体・API 統合・E2E）を Red フェーズで作成 |
| IV. 共通 UI コンポーネント利用 | ✅ 合格 | `@/templates/ui/components/status/`（Loading, Error, Empty）を使用。ページネーションボタンは共通コンポーネントがないためドメイン固有として実装 |
| V. 実装ワークフロー | ✅ 合格 | スタブ置換パターンで実装。contracts 拡張は `.default()` / `.optional()` 付与でサンプル互換性維持。spec.md を唯一の情報源とする |

**品質基準チェック**:

| 基準 | 状態 | 備考 |
|------|------|------|
| TypeScript strict / ESLint エラー 0 | ✅ 適用 | 各フェーズで確認 |
| テストカバレッジ 80% 以上 | ✅ 適用 | 検証フェーズで確認 |
| E2E テスト主要導線カバー | ✅ 適用 | ストーリー完了ゲートで実行 |
| 外部リソース検証 | ✅ 適用 | Unsplash URL は実装時に HTTP リクエストで確認予定（plan 時点では検証予定） |
| サンプルコード保護 | ✅ 適用 | contracts 拡張は `.default()` / `.optional()`、シードデータは EXTENSION_PRODUCTS に分離 |
| パフォーマンス（3 秒以内） | ✅ 適用 | インメモリストアのため性能問題は想定されない |

## プロジェクト構造

### ドキュメント（本機能）

```text
specs/001-catalog-browse/
├── plan.md              # 本ファイル（実装計画）
├── research.md          # Phase 0 リサーチ結果
├── data-model.md        # Phase 1 データモデル
├── quickstart.md        # Phase 1 クイックスタート
├── contracts/           # Phase 1 contracts 拡張仕様
│   └── catalog-extensions.md
└── tasks.md             # Phase 2 タスク一覧（/speckit.tasks で生成）
```

### ソースコード（変更対象）

```text
src/
├── contracts/
│   └── catalog.ts                          # ProductSchema に stock 追加、GetProductsInputSchema に keyword 追加
├── domains/
│   └── catalog/
│       ├── api/
│       │   ├── index.ts                    # スタブ → 本番ユースケースのエクスポートに置換
│       │   └── usecases.ts                 # 新規: getProducts, getProductById 実装
│       └── ui/
│           ├── index.tsx                   # プレースホルダー → 本番コンポーネントのエクスポートに置換
│           ├── ProductList.tsx             # 新規: 商品一覧（検索・ページネーション付き）
│           ├── ProductCard.tsx             # 新規: 商品カード
│           └── ProductDetail.tsx           # 新規: 商品詳細
├── infrastructure/
│   └── repositories/
│       └── product.ts                      # EXTENSION_PRODUCTS に 20 件追加、findAll/count に keyword 対応
└── app/
    └── (buyer)/
        ├── catalog/
        │   ├── page.tsx                    # スタブ → データフェッチ + 本番 ProductList
        │   └── [id]/
        │       └── page.tsx                # スタブ → データフェッチ + 本番 ProductDetail
        └── layout.tsx                      # navLinks にカタログリンク追加

tests/
├── unit/
│   └── domains/
│       └── catalog/
│           ├── usecase.test.ts             # 新規: ユースケース単体テスト
│           └── ui.test.tsx                 # 新規: UI コンポーネント単体テスト
├── integration/
│   └── domains/
│       └── catalog/
│           └── api.test.ts                 # 新規: API 統合テスト
└── e2e/
    └── catalog.spec.ts                     # 新規: E2E テスト
```

**構造決定**: 既存の EC Site Architecture Template のディレクトリ構造をそのまま使用。Catalog ドメインのスタブ（`src/domains/catalog/`）を本番実装に置換するパターン。本番ページ（`src/app/(buyer)/catalog/`）と API Routes（`src/app/api/catalog/products/`）は配置済みで、`@/domains/` のスタブ置換により自動的に動作する。

## 複雑性トラッキング

> 憲章チェックに違反なし。記載不要。

## 実装方針

### contracts 拡張（サンプルコード保護）

1. `ProductSchema` に `stock: z.number().int().min(0).default(0).optional()` を追加
2. `GetProductsInputSchema` に `keyword: z.string().max(200).optional()` を追加
3. `ProductRepository.findAll` パラメータに `keyword?: string` を追加
4. `ProductRepository.count` パラメータに `keyword?: string` を追加
5. すべて `.default()` または `.optional()` 付与により後方互換

### シードデータ（EXTENSION_PRODUCTS）

- 20 件の商品データを `EXTENSION_PRODUCTS` 配列に追加
- 画像 URL: Unsplash の高品質画像（`https://images.unsplash.com/photo-{id}?w=400&h=400&fit=crop`）
- 在庫切れ商品（stock: 0）を 3 件含む
- 画像なし商品を 1 件含む（プレースホルダー画像テスト用）
- 外部 URL は実装時に HTTP リクエストで存在を検証する（plan 時点では検証予定）

### ユースケース実装

- `src/samples/domains/catalog/api/usecases.ts` を参考に本番ユースケースを実装
- `getProducts`: ページネーション（limit=12）、keyword 検索、buyer は published のみ
- `getProductById`: ID 指定で商品取得、存在しない場合 NotFoundError

### UI 実装

- `src/samples/domains/catalog/ui/` を参考に本番 UI コンポーネントを実装
- `ProductList`: 検索フィールド + 商品カードグリッド + ページネーション
- `ProductCard`: 商品画像・名前・価格・在庫状況のカード表示
- `ProductDetail`: 商品詳細表示 + 「カートに追加」ボタン
- 共通コンポーネント（Loading, Error, Empty）を使用
- 在庫切れ表示: `stock === 0` の場合「在庫切れ」ラベルを表示
- 画像未設定: プレースホルダー SVG（サンプルの ProductCard と同様のパターン）

### ページ実装

- `src/app/(buyer)/catalog/page.tsx`: クライアントコンポーネントとして API からデータフェッチ → ProductList に渡す
- `src/app/(buyer)/catalog/[id]/page.tsx`: クライアントコンポーネントとして API からデータフェッチ → ProductDetail に渡す
- ナビゲーション: `layout.tsx` の navLinks に `{ href: '/catalog', label: '商品一覧' }` を追加
