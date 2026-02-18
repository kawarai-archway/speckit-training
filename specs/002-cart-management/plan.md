# Implementation Plan: カート管理機能

**Branch**: `002-cart-management` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-cart-management/spec.md`

## Summary

購入者が商品をカートに追加し、内容の確認・数量変更・削除を行えるカート管理機能を実装する。既存のスタブ置換パターンに従い、`src/domains/cart/` のスタブを本番実装に置き換える。コントラクト（`src/contracts/cart.ts`）を消費税・在庫チェック要件に合わせて拡張し、ドメイン API 層でビジネスロジック、UI 層でカート表示・操作コンポーネントを実装する。

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 14 (App Router), React 18, Zod, Tailwind CSS 3
**Storage**: インメモリストア（`globalThis` + `Map<string, T>`）— 既存の `src/infrastructure/repositories/cart.ts`
**Testing**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）、React Testing Library 16
**Target Platform**: Web（ブラウザ）
**Project Type**: Web アプリケーション（Next.js フルスタック）
**Performance Goals**: 一覧ページ初回ロード 3 秒以内、数量変更時の合計更新 1 秒以内
**Constraints**: カート永続化はインメモリ（DB 永続化は将来フェーズ）
**Scale/Scope**: 単一ドメイン（cart）、6 ユーザーストーリー、19 機能要件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 事前チェック（Phase 0 前）

| 原則 | 準拠状況 | 詳細 |
|------|---------|------|
| I. テンプレート駆動開発 | ✅ 準拠 | UI は `@/templates/ui/components/` を使用、API は既存ルートハンドラパターンに従う、リポジトリは `createHmrSafeStore` パターン使用済み |
| II. ドメイン分離 | ✅ 準拠 | `src/domains/cart/` に api/ と ui/ の 2 層で実装。カタログ（Product）参照は ProductFetcher IF 経由 |
| III. TDD 必須 | ✅ 準拠予定 | Red → Green → Refactor → 検証の 4 フェーズを各ストーリーで実施。テスト配置は `tests/` 配下 |
| IV. 共通 UI コンポーネント | ✅ 準拠 | Loading, Error, Empty, ConfirmDialog 等のテンプレートコンポーネントを使用 |
| V. 実装ワークフロー | ✅ 準拠 | スタブ置換パターンで `src/domains/cart/` を置き換え。navLinks のコメント解除含む |

### 品質基準チェック

| 基準 | 準拠状況 | 詳細 |
|------|---------|------|
| TypeScript strict | ✅ 準拠 | strict モード、コンパイルエラー 0 件 |
| ESLint エラー 0 件 | ✅ 準拠予定 | |
| テストカバレッジ 80%+ | ✅ 準拠予定 | ストーリー完了時にカバレッジ確認 |
| E2E テスト | ✅ 準拠予定 | 主要導線をカバー |
| サンプルコード保護 | ✅ 準拠 | コントラクト拡張は `.optional().default()` を付与 |
| 保護レイヤー変更禁止 | ⚠️ コントラクト拡張あり | `src/contracts/cart.ts` に tax/total/stock を追加（憲章原則 V の「contracts にない場合は拡張する」に基づき正当化） |

### 設計後チェック（Phase 1 後）

| 原則 | 準拠状況 | 詳細 |
|------|---------|------|
| I. テンプレート駆動開発 | ✅ 準拠 | CartView は templates の Loading/Error/Empty/ConfirmDialog を使用 |
| II. ドメイン分離 | ✅ 準拠 | cart ドメインは ProductFetcher IF 経由でのみ catalog を参照。直接インポートなし |
| III. TDD 必須 | ✅ 準拠予定 | 4 種テスト（単体 usecase/UI、統合、E2E）をストーリーごとに実施 |
| IV. 共通 UI コンポーネント | ✅ 準拠 | ConfirmDialog（削除確認）を共通コンポーネントから使用 |
| V. 実装ワークフロー | ✅ 準拠 | spec.md の全要件を実装。コントラクト不足分は拡張 |

## Project Structure

### Documentation (this feature)

```text
specs/002-cart-management/
├── plan.md              # 本ファイル
├── spec.md              # 機能仕様書
├── research.md          # Phase 0 リサーチ結果
├── data-model.md        # Phase 1 データモデル
├── quickstart.md        # Phase 1 クイックスタート
├── contracts/           # Phase 1 API コントラクト
│   └── cart-api.md
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # Phase 2 出力（/speckit.tasks で生成）
```

### Source Code (repository root)

```text
src/
├── contracts/
│   └── cart.ts                          # 拡張: tax, total, stock, quantity max
├── domains/
│   └── cart/
│       ├── api/
│       │   ├── index.ts                 # 置換: エクスポート（スタブ → 本番）
│       │   └── usecases.ts              # 新規: ビジネスロジック
│       └── ui/
│           ├── index.tsx                # 置換: エクスポート（スタブ → 本番）
│           └── CartView.tsx             # 新規: カート表示・操作コンポーネント
├── app/
│   ├── (buyer)/
│   │   ├── layout.tsx                   # 修正: カートリンク有効化、cartUrl 修正
│   │   ├── cart/
│   │   │   └── page.tsx                 # 修正: データ取得・イベント処理
│   │   └── catalog/
│   │       └── [id]/
│   │           └── page.tsx             # 修正: API URL、認証リダイレクト、フィードバック
│   └── api/
│       └── cart/                        # 既存: 変更なし
│           ├── route.ts                 # GET /api/cart
│           └── items/
│               ├── route.ts             # POST /api/cart/items
│               └── [productId]/
│                   └── route.ts         # PUT, DELETE /api/cart/items/:productId

tests/
├── unit/
│   └── domains/
│       └── cart/
│           ├── usecase.test.ts          # 新規: ユースケース単体テスト
│           └── ui.test.tsx              # 新規: UI 単体テスト
├── integration/
│   └── domains/
│       └── cart/
│           └── api.test.ts              # 新規: API 統合テスト
└── e2e/
    └── cart-buyer-flow.spec.ts          # 新規: E2E テスト
```

**Structure Decision**: 既存の Next.js フルスタック構造に従う。ドメイン分離原則に基づき `src/domains/cart/` に api/ と ui/ を配置。テストは `tests/` 配下の本番テストディレクトリに配置（`src/samples/tests/` はサンプル専用）。

## Complexity Tracking

| 違反 | 必要な理由 | よりシンプルな代替案を却下した理由 |
|------|-----------|----------------------------------|
| コントラクト拡張（tax, total, stock） | spec.md が消費税表示・在庫チェックを要求 | 憲章原則 V「contracts にない場合は拡張する」に基づき正当化。`.optional().default()` でサンプルコード互換性を維持。UI 層のみでの計算は、ビジネスロジックの分散を招くため却下 |
