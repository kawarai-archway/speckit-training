# データモデル: カート管理機能

**ブランチ**: `002-cart-management` | **日付**: 2026-02-18

## エンティティ

### Cart（カート）

購入者ごとに 1 つ存在するカート。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | 必須、一意 | カート識別子 |
| userId | UUID | 必須 | 購入者 ID |
| items | CartItem[] | 必須 | カート内商品一覧 |
| subtotal | integer | >= 0 | 商品合計（税抜） |
| tax | integer | >= 0、オプション（デフォルト 0） | 消費税（subtotal × 10%、端数切り捨て） |
| total | integer | >= 0、オプション（デフォルト 0） | 総合計（subtotal + tax） |
| itemCount | integer | >= 0 | 商品数（items の quantity 合計） |
| createdAt | datetime | 必須 | 作成日時 |
| updatedAt | datetime | 必須 | 更新日時 |

**備考**: `tax` と `total` は既存 CartSchema への拡張フィールド。`.optional().default(0)` で追加し、サンプルコードとの互換性を維持する。計算はドメインユースケース層で実行する。

### CartItem（カート項目）

カート内の 1 商品を表す。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| productId | UUID | 必須 | 商品 ID |
| productName | string | 必須 | 商品名 |
| price | integer | >= 0 | 単価 |
| imageUrl | string (URL) | オプション | 商品画像 URL |
| quantity | integer | 1 〜 99 | 数量 |
| addedAt | datetime | 必須 | 追加日時 |

### Product（商品）— 参照エンティティ

カタログ機能で管理される既存エンティティ。カート機能は `ProductFetcher` インターフェース経由で参照する。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | 必須 | 商品 ID |
| name | string | 必須 | 商品名 |
| price | integer | >= 0 | 単価 |
| imageUrl | string (URL) | オプション | 商品画像 URL |
| stock | integer | >= 0、オプション | 在庫数（拡張フィールド） |

**備考**: `stock` フィールドは ProductFetcher への拡張。既存の ProductFetcher は `{id, name, price, imageUrl?}` を返すが、在庫チェック要件（FR-003, FR-013, FR-014）を満たすために `stock` を追加する。

## リレーション

```text
Cart (1) ──── (N) CartItem
  │                    │
  └─ userId           └─ productId ──── Product（参照のみ）
```

- 購入者（userId）1 人につきカートは 1 つ
- カートは 0 個以上の CartItem を持つ
- CartItem は Product を参照するが、価格・名前はスナップショットとして CartItem に保持（カート追加時点の値）

## バリデーションルール

| ルール | 対象 | 条件 |
|--------|------|------|
| 数量範囲 | CartItem.quantity | 1 〜 99 |
| 在庫上限 | CartItem.quantity | <= Product.stock |
| 在庫切れ | カート追加 | Product.stock > 0 であること |
| 同一商品 | カート追加 | 既存の場合は数量加算（新規項目作成しない） |
| 消費税計算 | Cart.tax | Math.floor(subtotal * 0.1) |
| 総合計 | Cart.total | subtotal + tax |

## 状態遷移

カートエンティティには明示的なステータスフィールドはない。状態は items の有無で暗黙的に決定される。

```text
カート空 (items.length === 0)
  ↓ 商品追加
カート有り (items.length > 0)
  ↓ 数量変更 / 商品削除
カート有り or カート空
```

## コントラクト変更サマリー

### `src/contracts/cart.ts` への変更

1. **CartSchema 拡張**:
   - `tax: z.number().int().min(0).optional().default(0)` を追加
   - `total: z.number().int().min(0).optional().default(0)` を追加

2. **数量バリデーション強化**:
   - `AddToCartInputSchema.quantity`: `.max(99, '数量は99以下で指定してください')` を追加
   - `UpdateCartItemInputSchema.quantity`: `.max(99, '数量は99以下で指定してください')` を追加

3. **ProductFetcher 拡張**:
   - 返り値に `stock?: number` を追加
