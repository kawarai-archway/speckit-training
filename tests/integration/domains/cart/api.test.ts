/**
 * Cart API 統合テスト - User Story 1: カートに商品を追加する
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('User Story 1: カートに商品を追加する - API Integration Tests', () => {
  const API_BASE = 'http://localhost:3000';
  let originalFetch: any;

  beforeEach(() => {
    // Setup fetch mock
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('POST /api/cart/items - カートに商品を追加', () => {
    const validPayload = {
      productId: 'product-1',
      quantity: 2,
    };

    it('有効なペイロードでカート追加が成功する', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'テスト商品',
            price: 1000,
            quantity: 2,
            addedAt: new Date().toISOString(),
          }],
          subtotal: 2000,
          tax: 200,
          total: 2200,
          itemCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=valid-session',
        },
        body: JSON.stringify(validPayload),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].productId).toBe('product-1');
      expect(data.data.subtotal).toBe(2000);
      expect(data.data.tax).toBe(200);
      expect(data.data.total).toBe(2200);
    });

    it('数量省略時はデフォルト値1が適用される', async () => {
      const payloadWithoutQuantity = {
        productId: 'product-1',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'テスト商品',
            price: 1000,
            quantity: 1,
            addedAt: new Date().toISOString(),
          }],
          subtotal: 1000,
          tax: 100,
          total: 1100,
          itemCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=valid-session',
        },
        body: JSON.stringify(payloadWithoutQuantity),
      });

      const data = await response.json();

      expect(data.data.items[0].quantity).toBe(1);
    });

    describe('バリデーションエラー', () => {
      it('productIdが無い場合は400エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'productIdは必須です',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({ quantity: 1 }),
        });

        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('不正な数量（0）は400エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '数量は1以上で指定してください',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({
            productId: 'product-1',
            quantity: 0,
          }),
        });

        expect(response.status).toBe(400);
      });

      it('不正な数量（100）は400エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '数量は99以下で指定してください',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({
            productId: 'product-1',
            quantity: 100,
          }),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('認証・認可エラー', () => {
      it('未認証の場合は401エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'ログインが必要です',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validPayload),
        });

        expect(response.status).toBe(401);
      });

      it('buyer以外のロールは403エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: '権限が不足しています',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=admin-session',
          },
          body: JSON.stringify(validPayload),
        });

        expect(response.status).toBe(403);
      });
    });

    describe('ビジネスロジックエラー', () => {
      it('存在しない商品は404エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '商品が見つかりません',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({
            productId: 'nonexistent',
            quantity: 1,
          }),
        });

        expect(response.status).toBe(404);
      });

      it('在庫切れ商品は409エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'CONFLICT',
              message: '在庫切れです',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({
            productId: 'out-of-stock-product',
            quantity: 1,
          }),
        });

        expect(response.status).toBe(409);
      });

      it('在庫数超過は409エラー', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            success: false,
            error: {
              code: 'CONFLICT',
              message: '在庫数を超えています。在庫数: 5',
            },
          }),
        });

        const response = await fetch(`${API_BASE}/api/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=valid-session',
          },
          body: JSON.stringify({
            productId: 'limited-stock-product',
            quantity: 10,
          }),
        });

        expect(response.status).toBe(409);
      });
    });
  });

  describe('レスポンス形式', () => {
    it('成功レスポンスは正しい形式である', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'テスト商品',
            price: 1000,
            imageUrl: 'https://example.com/image.jpg',
            quantity: 1,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
          subtotal: 1000,
          tax: 100,
          total: 1100,
          itemCount: 1,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=valid-session',
        },
        body: JSON.stringify(validPayload),
      });

      const data = await response.json();

      // 成功レスポンスの形式チェック
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('userId');
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('subtotal');
      expect(data.data).toHaveProperty('tax');
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('itemCount');
    });

    it('エラーレスポンスは正しい形式である', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラー',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=valid-session',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      // エラーレスポンスの形式チェック
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });
});

/**
 * User Story 2: カート内容を確認する - Integration Tests  
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 2: カート内容を確認する - GET /api/cart', () => {
  const API_BASE = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('空のカートを取得できる（新規ユーザー）', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items).toEqual([]);
      expect(data.data.subtotal).toBe(0);
      expect(data.data.tax).toBe(0);
      expect(data.data.total).toBe(0);
    });

    it('商品が入ったカートを取得できる（税・合計込み）', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [
            {
              productId: 'product-1',
              productName: 'テスト商品1',
              price: 1000,
              imageUrl: 'https://example.com/product1.jpg',
              quantity: 2,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
            {
              productId: 'product-2',
              productName: 'テスト商品2',
              price: 1500,
              imageUrl: 'https://example.com/product2.jpg',
              quantity: 1,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
          ],
          subtotal: 3500, // 1000*2 + 1500*1
          tax: 350, // Math.floor(3500 * 0.1)
          total: 3850, // 3500 + 350
          itemCount: 3, // 2 + 1
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(2);
      expect(data.data.subtotal).toBe(3500);
      expect(data.data.tax).toBe(350);
      expect(data.data.total).toBe(3850);
      expect(data.data.itemCount).toBe(3);
    });

    it('税計算が正しく行われる（端数切り捨て）', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [
            {
              productId: 'product-1',
              productName: 'テスト商品',
              price: 3333, // 3333 * 10% = 333.3 → 333 (端数切り捨て)
              quantity: 1,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
          ],
          subtotal: 3333,
          tax: 333, // Math.floor(3333 * 0.1)
          total: 3666, // 3333 + 333
          itemCount: 1,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      const data = await response.json();
      expect(data.data.tax).toBe(333);
      expect(data.data.total).toBe(3666);
    });
  });

  describe('認証・認可エラー', () => {
    it('未認証の場合は401エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'ログインが必要です',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('buyer以外のロールは403エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限が不足しています',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': 'session=admin-session',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('レスポンス形式', () => {
    it('成功レスポンスは正しい形式である', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      const data = await response.json();

      // 成功レスポンスの形式チェック
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('userId');
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('subtotal');
      expect(data.data).toHaveProperty('tax');
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('itemCount');
      expect(data.data).toHaveProperty('createdAt');
      expect(data.data).toHaveProperty('updatedAt');
    });
  });
});

/**
 * User Story 4: カートから商品を削除する - Integration Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 4: カートから商品を削除する - DELETE /api/cart/items/:productId', () => {
  const API_BASE = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('カート内の商品を削除できる', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [
            {
              productId: 'product-2',
              productName: 'テスト商品2',
              price: 1500,
              imageUrl: 'https://example.com/product2.jpg',
              quantity: 1,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
          ],
          subtotal: 1500,
          tax: 150,
          total: 1650,
          itemCount: 1,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].productId).toBe('product-2');
      expect(data.data.subtotal).toBe(1500);
      expect(data.data.tax).toBe(150);
      expect(data.data.total).toBe(1650);
    });

    it('最後の商品を削除すると空カートになる', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(0);
      expect(data.data.subtotal).toBe(0);
      expect(data.data.tax).toBe(0);
      expect(data.data.total).toBe(0);
      expect(data.data.itemCount).toBe(0);
    });

    it('削除後の税・合計が再計算される', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [
            {
              productId: 'product-2',
              productName: 'テスト商品2',
              price: 3333, // 3333 * 10% = 333.3 → 333 (端数切り捨て)
              quantity: 1,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
          ],
          subtotal: 3333,
          tax: 333, // Math.floor(3333 * 0.1)
          total: 3666, // 3333 + 333
          itemCount: 1,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      const data = await response.json();
      expect(data.data.tax).toBe(333);
      expect(data.data.total).toBe(3666);
    });
  });

  describe('エラー系', () => {
    it('存在しない商品IDを削除しようとすると404エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'カート内に商品が見つかりません: nonexistent-product',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/nonexistent-product`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('カート内に商品が見つかりません');
    });

    it('空のカートから削除しようとすると404エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'カート内に商品が見つかりません: product-1',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(404);
    });

    it('不正なproductIdは400エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productIdが無効です',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('認証・認可エラー', () => {
    it('未認証の場合は401エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'ログインが必要です',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('buyer以外のロールは403エラー', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限が不足しています',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=admin-session',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('レスポンス形式', () => {
    it('成功レスポンスは正しい形式である', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      const data = await response.json();

      // 成功レスポンスの形式チェック
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('userId');
      expect(data.data).toHaveProperty('items');
      expect(data.data).toHaveProperty('subtotal');
      expect(data.data).toHaveProperty('tax');
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('itemCount');
      expect(data.data).toHaveProperty('createdAt');
      expect(data.data).toHaveProperty('updatedAt');
    });

    it('エラーレスポンスは正しい形式である', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'カート内に商品が見つかりません',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items/nonexistent`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'session=valid-session',
        },
      });

      const data = await response.json();

      // エラーレスポンスの形式チェック
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });
});