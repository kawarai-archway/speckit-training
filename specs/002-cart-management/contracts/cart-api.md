# カート API コントラクト

**ブランチ**: `002-cart-management` | **日付**: 2026-02-18

## 共通

### 認証
すべてのカート API は `buyer` ロール以上が必要。未認証時は 401、権限不足時は 403 を返す。

### レスポンス形式
```
成功: { success: true, data: T }
失敗: { success: false, error: { code: string, message: string, fieldErrors?: Array<{field, message}> } }
```

---

## GET /api/cart

カート取得。セッションの userId からカートを特定する。

### リクエスト
- パラメータなし（セッションから userId を取得）

### レスポンス

**200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "productName": "商品名",
        "price": 1000,
        "imageUrl": "https://...",
        "quantity": 2,
        "addedAt": "2026-02-18T00:00:00.000Z"
      }
    ],
    "subtotal": 2000,
    "tax": 200,
    "total": 2200,
    "itemCount": 2,
    "createdAt": "2026-02-18T00:00:00.000Z",
    "updatedAt": "2026-02-18T00:00:00.000Z"
  }
}
```

**401 Unauthorized**: 未ログイン

---

## POST /api/cart/items

カートに商品を追加する。同一商品が存在する場合は数量を加算する。

### リクエスト
```json
{
  "productId": "uuid（必須）",
  "quantity": 1
}
```

| フィールド | 型 | 必須 | 制約 | デフォルト |
|-----------|-----|------|------|-----------|
| productId | UUID | はい | 有効な商品 ID | - |
| quantity | integer | いいえ | 1 〜 99 | 1 |

### レスポンス

**201 Created**: 更新後のカート全体（GET /api/cart と同じ形式）

**400 Bad Request**: バリデーションエラー（無効な UUID、数量範囲外）

**404 Not Found**: 商品が存在しない

**409 Conflict**: 在庫切れまたは在庫数超過
- `{ code: "CONFLICT", message: "在庫が不足しています" }`

**401 Unauthorized**: 未ログイン

---

## PUT /api/cart/items/:productId

カート内商品の数量を更新する。

### リクエスト
```json
{
  "quantity": 3
}
```

| フィールド | 型 | 必須 | 制約 |
|-----------|-----|------|------|
| quantity | integer | はい | 1 〜 99、在庫数以下 |

### パスパラメータ
- `productId`: 対象商品の UUID

### レスポンス

**200 OK**: 更新後のカート全体

**400 Bad Request**: バリデーションエラー（数量範囲外）

**404 Not Found**: カート内に該当商品がない

**409 Conflict**: 在庫数超過
- `{ code: "CONFLICT", message: "在庫数を超えています。在庫数: {stock}" }`

**401 Unauthorized**: 未ログイン

---

## DELETE /api/cart/items/:productId

カートから商品を削除する。

### パスパラメータ
- `productId`: 対象商品の UUID

### レスポンス

**200 OK**: 更新後のカート全体

**404 Not Found**: カート内に該当商品がない

**401 Unauthorized**: 未ログイン
