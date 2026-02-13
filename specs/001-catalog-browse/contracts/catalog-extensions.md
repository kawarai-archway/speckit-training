# Contracts 拡張仕様: カタログ閲覧機能

**Branch**: `001-catalog-browse` | **Date**: 2026-02-13

## 概要

既存の `src/contracts/catalog.ts` に対する拡張仕様を定義する。
サンプルコード保護の原則に基づき、すべての追加フィールドは
`.default()` または `.optional()` を付与する。

## 変更対象: ProductSchema

### 追加フィールド

```typescript
// 既存の ProductSchema に stock フィールドを追加
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  stock: z.number().int().min(0).default(0).optional(), // 新規追加
  status: ProductStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
```

**互換性**: `.default(0).optional()` により、stock フィールドを持たない
既存データは自動的に `0` として扱われる。

## 変更対象: GetProductsInputSchema

### 追加パラメータ

```typescript
export const GetProductsInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
  keyword: z.string().max(200).optional(), // 新規追加
});
```

**互換性**: `.optional()` のため、keyword を指定しない既存の
API 呼び出しは影響を受けない。

## 変更対象: ProductRepository インターフェース

### パラメータ追加

```typescript
export interface ProductRepository {
  findAll(params: {
    status?: Product['status'];
    offset: number;
    limit: number;
    keyword?: string; // 新規追加（オプション）
  }): Promise<Product[]>;
  // ... 他のメソッドは変更なし
  count(status?: Product['status'], keyword?: string): Promise<number>;
  // count にも keyword を追加（オプション）
}
```

**互換性**: オプショナルパラメータのため、既存のサンプル実装は
影響を受けない。

## 影響範囲

| ファイル | 変更種別 | 互換性 |
|---------|---------|--------|
| `src/contracts/catalog.ts` | フィールド追加 | ✅ 後方互換 |
| `src/infrastructure/repositories/product.ts` | 検索ロジック追加 | ✅ 後方互換 |
| サンプルテスト | 変更不要 | ✅ 影響なし |
