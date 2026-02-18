/**
 * Catalog ドメイン - ユースケース単体テスト（本番）
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  getProducts,
  getProductById,
} from '@/domains/catalog/api/usecases';
import { ProductSchema, type Product, type ProductRepository } from '@/contracts/catalog';

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
// 商品一覧取得 (getProducts) - US1
// ─────────────────────────────────────────────────────────────────

describe('getProducts', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 認証済み購入者', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: published 商品のみ返す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
      });

      it('Then: ページネーション情報を正しく計算する', async () => {
        const products = [
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
        ];
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(25);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(result.products).toHaveLength(2);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 12,
          total: 25,
          totalPages: 3,
        });
      });

      it('Then: offset を正しく計算して渡す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 3, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 24, limit: 12 })
        );
      });
    });
  });

  describe('Given: ゲストユーザー', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: published 商品のみ返す', async () => {
        const guestSession: Session = {
          userId: 'guest',
          role: 'buyer',
          expiresAt: new Date(),
        };
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12 },
          { session: guestSession, repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
      });
    });
  });

  describe('Given: stock フィールドを持つ商品', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: stock フィールドが返却される', async () => {
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
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品詳細取得 (getProductById) - US2
// ─────────────────────────────────────────────────────────────────

describe('getProductById', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 存在する published 商品 ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: 商品情報を返す', async () => {
        const product = createMockProduct();
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: createMockSession(), repository }
        );

        expect(result.id).toBe(product.id);
        expect(result.name).toBe('テスト商品');
      });

      it('Then: stock フィールドが返却される', async () => {
        const product = createMockProduct({ stock: 5 });
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: createMockSession(), repository }
        );

        expect(result.stock).toBe(5);
      });
    });
  });

  describe('Given: 存在しない商品 ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: NotFoundError をスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getProductById(
            { id: '550e8400-e29b-41d4-a716-446655440999' },
            { session: createMockSession(), repository }
          )
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });

  describe('Given: draft 商品', () => {
    describe('When: buyer が詳細を取得する', () => {
      it('Then: NotFoundError をスローする（buyer は published のみ）', async () => {
        const draftProduct = createMockProduct({ status: 'draft' });
        vi.mocked(repository.findById).mockResolvedValue(draftProduct);

        await expect(
          getProductById(
            { id: draftProduct.id },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });

  describe('Given: ゲストユーザー', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: published 商品を取得できる', async () => {
        const guestSession: Session = {
          userId: 'guest',
          role: 'buyer',
          expiresAt: new Date(),
        };
        const product = createMockProduct();
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: guestSession, repository }
        );

        expect(result.id).toBe(product.id);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品検索 (getProducts + keyword) - US3
// ─────────────────────────────────────────────────────────────────

describe('getProducts (keyword 検索)', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: keyword パラメータあり', () => {
    describe('When: キーワードで検索する', () => {
      it('Then: keyword を repository に渡す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12, keyword: 'コットン' },
          { session: createMockSession(), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: 'コットン' })
        );
        expect(repository.count).toHaveBeenCalledWith('published', 'コットン');
      });
    });
  });

  describe('Given: 空文字の keyword', () => {
    describe('When: 検索する', () => {
      it('Then: keyword を渡さない（全件取得）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12, keyword: '' },
          { session: createMockSession(), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: undefined })
        );
      });
    });
  });

  describe('Given: keyword なし', () => {
    describe('When: 検索する', () => {
      it('Then: keyword を渡さない（全件取得）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession(), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: undefined })
        );
      });
    });
  });
});
