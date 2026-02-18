/**
 * Catalog ドメイン - API 統合テスト（本番）
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  GetProductByIdOutputSchema,
  ProductSchema,
  type Product,
  type ProductRepository,
} from '@/contracts/catalog';
import {
  getProducts,
  getProductById,
} from '@/domains/catalog/api/usecases';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: 'user-123',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createGuestSession(): Session {
  return {
    userId: 'guest',
    role: 'buyer',
    expiresAt: new Date(),
  };
}

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: '商品の説明',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });
}

function createMockRepository(): ProductRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────
// 統合テスト - US1
// ─────────────────────────────────────────────────────────────────

describe('Catalog API 統合テスト（本番）', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('GET /api/catalog/products', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const rawInput = { page: '1', limit: '12' };
      const validatedInput = GetProductsInputSchema.parse(rawInput);

      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(validatedInput, {
        session: createMockSession(),
        repository,
      });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(12);
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });

    it('stock フィールドがレスポンスに含まれる', async () => {
      const products = [
        createMockProduct({ stock: 10 }),
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', stock: 0 }),
      ];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      expect(result.products[0].stock).toBe(10);
      expect(result.products[1].stock).toBe(0);
    });

    it('認証なし（ゲスト）で published 商品のみ取得できる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(
        { page: 1, limit: 12 },
        { session: createGuestSession(), repository }
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
    });

    it('page/limit パラメータが正しく処理される', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(
        { page: 2, limit: 12 },
        { session: createMockSession(), repository }
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 12, limit: 12 })
      );
    });
  });

  describe('GET /api/catalog/products/:id', () => {
    it('出力スキーマに準拠した商品を返す', async () => {
      const product = createMockProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession(), repository }
      );

      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.id).toBe(product.id);
      expect(validated.name).toBe('テスト商品');
    });

    it('stock フィールドが含まれる', async () => {
      const product = createMockProduct({ stock: 5 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession(), repository }
      );

      expect(result.stock).toBe(5);
    });

    it('存在しない商品 ID で NotFoundError', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        getProductById(
          { id: '550e8400-e29b-41d4-a716-446655440999' },
          { session: createMockSession(), repository }
        )
      ).rejects.toThrow('商品が見つかりません');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // US3: キーワード検索
  // ─────────────────────────────────────────────────────────────────

  describe('GET /api/catalog/products?keyword=X', () => {
    it('keyword パラメータが repository に渡される', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(
        { page: 1, limit: 12, keyword: 'シャツ' },
        { session: createMockSession(), repository }
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'シャツ' })
      );
    });

    it('keyword 検索でも出力スキーマに準拠する', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 12, keyword: 'テスト' },
        { session: createMockSession(), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
    });

    it('該当なしで空配列を返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getProducts(
        { page: 1, limit: 12, keyword: '存在しないキーワード' },
        { session: createMockSession(), repository }
      );

      expect(result.products).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('keyword + ページネーションの組み合わせ', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(15);

      const result = await getProducts(
        { page: 2, limit: 12, keyword: 'シャツ' },
        { session: createMockSession(), repository }
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.total).toBe(15);
      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 12, keyword: 'シャツ' })
      );
    });
  });
});
