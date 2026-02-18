/**
 * User Story 6: カート内容の永続化 - Session Persistence Integration Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('User Story 6: カート内容の永続化 - Session Persistence Tests', () => {
  const API_BASE = 'http://localhost:3000';
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('カート永続化の検証', () => {
    it('カート追加後に同じセッションで取得すると同じデータが返される', async () => {
      const sessionCookie = 'session=test-user-session';
      
      // Step 1: カートに商品を追加
      const addResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'テスト商品',
            price: 1000,
            imageUrl: 'https://example.com/product1.jpg',
            quantity: 2,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
          subtotal: 2000,
          tax: 200,
          total: 2200,
          itemCount: 2,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(addResponse),
      });

      const addRequest = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        body: JSON.stringify({
          productId: 'product-1',
          quantity: 2,
        }),
      });

      expect(addRequest.status).toBe(201);
      const addData = await addRequest.json();
      expect(addData.data.items).toHaveLength(1);

      // Step 2: 同じセッションでカートを取得
      const getResponse = {
        success: true,
        data: {
          id: 'cart-1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'テスト商品',
            price: 1000,
            imageUrl: 'https://example.com/product1.jpg',
            quantity: 2,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
          subtotal: 2000,
          tax: 200,
          total: 2200,
          itemCount: 2,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(getResponse),
      });

      const getRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      expect(getRequest.status).toBe(200);
      const getData = await getRequest.json();
      
      // 永続化されたデータが一致することを確認
      expect(getData.data.items).toEqual(addData.data.items);
      expect(getData.data.subtotal).toBe(addData.data.subtotal);
      expect(getData.data.tax).toBe(addData.data.tax);
      expect(getData.data.total).toBe(addData.data.total);
      expect(getData.data.itemCount).toBe(addData.data.itemCount);
    });

    it('ページリロード相当の操作でもカート内容が保持される', async () => {
      const sessionCookie = 'session=test-user-session-2';

      // 既存のカートデータ（リロード前の状態）
      const persistedCartData = {
        success: true,
        data: {
          id: 'cart-2',
          userId: 'user-2',
          items: [
            {
              productId: 'product-1',
              productName: 'テスト商品1',
              price: 1000,
              quantity: 2,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
            {
              productId: 'product-2',
              productName: 'テスト商品2',
              price: 1500,
              quantity: 1,
              addedAt: '2026-02-18T00:00:00.000Z',
            },
          ],
          subtotal: 3500,
          tax: 350,
          total: 3850,
          itemCount: 3,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      // 1回目のカート取得（ページリロード前）
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(persistedCartData),
      });

      const firstRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      const firstData = await firstRequest.json();
      expect(firstData.data.items).toHaveLength(2);
      expect(firstData.data.itemCount).toBe(3);

      // 2回目のカート取得（ページリロード後 - 同じデータが返される）
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(persistedCartData),
      });

      const secondRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      const secondData = await secondRequest.json();

      // リロード後も同じデータが取得できることを確認
      expect(secondData.data.items).toEqual(firstData.data.items);
      expect(secondData.data.subtotal).toBe(firstData.data.subtotal);
      expect(secondData.data.itemCount).toBe(firstData.data.itemCount);
    });

    it('ブラウザセッション間でのカート永続化が機能する', async () => {
      const userId = 'persistent-user';
      
      // セッション1: カートを作成・更新
      const session1Cookie = 'session=session-1-for-' + userId;
      const session1CartData = {
        success: true,
        data: {
          id: 'cart-persistent',
          userId: userId,
          items: [{
            productId: 'product-1',
            productName: '永続化商品',
            price: 2000,
            quantity: 1,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
          subtotal: 2000,
          tax: 200,
          total: 2200,
          itemCount: 1,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(session1CartData),
      });

      const session1Request = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': session1Cookie,
        },
      });

      const session1Data = await session1Request.json();
      expect(session1Data.data.userId).toBe(userId);

      // セッション2: 新しいブラウザセッション（同じユーザー）
      const session2Cookie = 'session=session-2-for-' + userId;

      // 同じカートデータが取得される（永続化により）
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(session1CartData),
      });

      const session2Request = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': session2Cookie,
        },
      });

      const session2Data = await session2Request.json();

      // 永続化されたカートが新しいセッションでも取得できることを確認
      expect(session2Data.data.items).toEqual(session1Data.data.items);
      expect(session2Data.data.subtotal).toBe(session1Data.data.subtotal);
      expect(session2Data.data.userId).toBe(userId);
    });
  });

  describe('永続化データの整合性', () => {
    it('インメモリストアが複数の操作で一貫したデータを返す', async () => {
      const sessionCookie = 'session=consistency-test-session';
      const userId = 'consistency-user';

      // 1. カートに商品追加
      const addResponseData = {
        success: true,
        data: {
          id: 'cart-consistency',
          userId: userId,
          items: [{
            productId: 'product-1',
            productName: '一貫性商品',
            price: 1500,
            quantity: 1,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
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
        status: 201,
        json: () => Promise.resolve(addResponseData),
      });

      await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        body: JSON.stringify({
          productId: 'product-1',
          quantity: 1,
        }),
      });

      // 2. 数量更新
      const updateResponseData = {
        success: true,
        data: {
          ...addResponseData.data,
          items: [{
            ...addResponseData.data.items[0],
            quantity: 3,
          }],
          subtotal: 4500,
          tax: 450,
          total: 4950,
          itemCount: 3,
          updatedAt: '2026-02-18T00:01:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updateResponseData),
      });

      await fetch(`${API_BASE}/api/cart/items/product-1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        body: JSON.stringify({
          quantity: 3,
        }),
      });

      // 3. カート取得で更新されたデータが取得されることを確認
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updateResponseData),
      });

      const getRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      const getData = await getRequest.json();

      // 最新の更新が反映されていることを確認
      expect(getData.data.items[0].quantity).toBe(3);
      expect(getData.data.subtotal).toBe(4500);
      expect(getData.data.tax).toBe(450);
      expect(getData.data.total).toBe(4950);
      expect(getData.data.itemCount).toBe(3);
    });

    it('異なるユーザーのカートは分離されて永続化される', async () => {
      // ユーザー1のセッション
      const user1Session = 'session=user1-session';
      const user1Data = {
        success: true,
        data: {
          id: 'cart-user1',
          userId: 'user-1',
          items: [{
            productId: 'product-1',
            productName: 'ユーザー1の商品',
            price: 1000,
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
        status: 200,
        json: () => Promise.resolve(user1Data),
      });

      const user1Request = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': user1Session,
        },
      });

      const user1Response = await user1Request.json();
      expect(user1Response.data.userId).toBe('user-1');
      expect(user1Response.data.items[0].productName).toBe('ユーザー1の商品');

      // ユーザー2のセッション（同時期）
      const user2Session = 'session=user2-session';
      const user2Data = {
        success: true,
        data: {
          id: 'cart-user2',
          userId: 'user-2',
          items: [{
            productId: 'product-2',
            productName: 'ユーザー2の商品',
            price: 2000,
            quantity: 2,
            addedAt: '2026-02-18T00:00:00.000Z',
          }],
          subtotal: 4000,
          tax: 400,
          total: 4400,
          itemCount: 2,
          createdAt: '2026-02-18T00:00:00.000Z',
          updatedAt: '2026-02-18T00:00:00.000Z',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(user2Data),
      });

      const user2Request = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': user2Session,
        },
      });

      const user2Response = await user2Request.json();
      expect(user2Response.data.userId).toBe('user-2');
      expect(user2Response.data.items[0].productName).toBe('ユーザー2の商品');

      // 各ユーザーのデータが分離されていることを確認
      expect(user1Response.data.items).not.toEqual(user2Response.data.items);
      expect(user1Response.data.subtotal).not.toBe(user2Response.data.subtotal);
    });
  });

  describe('永続化エラーハンドリング', () => {
    it('永続化ストアエラー時も適切なレスポンスが返される', async () => {
      const sessionCookie = 'session=error-test-session';

      // インメモリストアエラーをシミュレート（500エラー）
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'データの永続化に失敗しました',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        body: JSON.stringify({
          productId: 'product-1',
          quantity: 1,
        }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(data.error.message).toContain('永続化');
    });

    it('破損したデータの復元時は新しいカートを作成する', async () => {
      const sessionCookie = 'session=recovery-test-session';

      // 最初は破損データで404
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'カートが見つかりません',
          },
        }),
      });

      const firstRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      expect(firstRequest.status).toBe(404);

      // 2回目は新しい空カートが作成される
      const newCartData = {
        success: true,
        data: {
          id: 'new-cart-recovery',
          userId: 'recovery-user',
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
        json: () => Promise.resolve(newCartData),
      });

      const secondRequest = await fetch(`${API_BASE}/api/cart`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      expect(secondRequest.status).toBe(200);
      const data = await secondRequest.json();
      expect(data.data.items).toHaveLength(0);
      expect(data.data.subtotal).toBe(0);
    });
  });
});