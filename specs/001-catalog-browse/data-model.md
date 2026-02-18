# データモデル: カタログ閲覧機能

**Branch**: `001-catalog-browse` | **Date**: 2026-02-13

## エンティティ

### Product（商品）

既存の `src/contracts/catalog.ts` の `ProductSchema` を拡張する。

| フィールド | 型 | 必須 | バリデーション | 備考 |
|-----------|-----|------|---------------|------|
| id | string (UUID) | ✅ | UUID 形式 | 自動生成 |
| name | string | ✅ | 1〜200 文字 | 商品名 |
| price | number | ✅ | 整数、0 以上 | 円単位 |
| description | string | ❌ | 最大 2000 文字 | 商品説明 |
| imageUrl | string | ❌ | URL 形式 | 未設定時はプレースホルダー画像を表示 |
| stock | number | ❌ | 整数、0 以上、デフォルト 0 | **新規追加**。在庫数。0 の場合「在庫切れ」表示 |
| status | ProductStatus | ✅ | 'draft' \| 'published' \| 'archived' | 購入者には published のみ表示 |
| createdAt | Date | ✅ | - | 自動設定 |
| updatedAt | Date | ✅ | - | 自動設定 |

### 変更点（既存 contracts からの差分）

#### 追加フィールド: `stock`

```
stock: z.number().int().min(0).default(0).optional()
```

- `.default(0)` により、既存のサンプルデータ（stock フィールドなし）は自動的に 0 として扱われる
- `.optional()` により、既存の CreateProduct/UpdateProduct の入力も互換性を維持する
- サンプルコード保護の原則に準拠

#### 追加パラメータ: `keyword`（GetProductsInput）

```
keyword: z.string().max(200).optional()
```

- 商品名（name）および説明文（description）の部分一致検索
- 大文字小文字を区別しない
- 空文字列の場合は検索条件なし（全件表示）と同等

#### 追加パラメータ: `keyword`（ProductRepository.findAll）

```
findAll(params: {
  status?: Product['status'];
  offset: number;
  limit: number;
  keyword?: string;  // 新規追加（オプション）
}): Promise<Product[]>;
```

- オプショナルパラメータのため、既存のサンプルコードへの影響なし

## API エンドポイント

### GET /api/catalog/products（商品一覧取得）

既存エンドポイント。パラメータ拡張。

**リクエスト（クエリパラメータ）**:

| パラメータ | 型 | 必須 | デフォルト | 備考 |
|-----------|-----|------|-----------|------|
| page | number | ❌ | 1 | ページ番号（1 始まり） |
| limit | number | ❌ | 20 | 1 ページあたり件数（本番 UI は 12 を指定） |
| status | string | ❌ | - | admin のみ指定可。buyer は自動的に published |
| keyword | string | ❌ | - | **新規追加**。検索キーワード |

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-...",
        "name": "商品名",
        "price": 3000,
        "description": "商品説明",
        "imageUrl": "https://images.unsplash.com/...",
        "stock": 10,
        "status": "published",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### GET /api/catalog/products/:id（商品詳細取得）

既存エンドポイント。変更なし（stock フィールドが Product に追加されるため自動的にレスポンスに含まれる）。

## シードデータ

### ベースデータ（BASE_PRODUCTS） — 変更不可

既存の 6 件（5 件 published + 1 件 draft）。stock フィールドなし → `.default(0)` で 0 扱い。

### 拡張データ（EXTENSION_PRODUCTS） — 新規追加

20 件の商品データを追加。ページネーション検証のため十分な件数を確保する。

- published: 18 件（stock > 0: 15 件、stock = 0（在庫切れ）: 3 件）
- imageUrl なし: 1 件（プレースホルダー画像テスト用）
- 画像 URL: Unsplash の高品質画像 URL を使用（実装時に HTTP リクエストで存在確認予定）

合計: ベース published 5 件 + 拡張 published 18 件 = **23 件 published**（2 ページ目まで: 12 + 11）

> **注意**: 画像 URL の存在確認は plan 時点では検証予定。実装時に各 URL に HTTP リクエストを送信し、失敗した場合は代替 URL に置換する。
