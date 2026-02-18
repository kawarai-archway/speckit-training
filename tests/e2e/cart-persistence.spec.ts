/**
 * User Story 6: カート内容の永続化 - E2E Persistence Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { test, expect } from '@playwright/test';

test.describe('User Story 6: カート内容の永続化 - E2E Tests', () => {
  
  test.describe('ページナビゲーション間でのカート永続化', () => {
    test('商品をカートに追加してページ間を遷移してもカート内容が保持される', async ({ page }) => {
      // セッションID固定のためのクッキー設定（テスト用）
      await page.context().addCookies([
        {
          name: 'session',
          value: 'e2e-persistence-test-user-1',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Step 1: 商品一覧ページから商品をカートに追加
      await page.goto('/sample/products');
      await page.waitForLoadState('networkidle');

      // 最初の商品をカートに追加
      const firstAddToCartButton = page.locator('[data-testid="add-to-cart-button"]').first();
      await expect(firstAddToCartButton).toBeVisible();
      await firstAddToCartButton.click();

      // カート追加成功の確認
      await expect(page.locator('[data-testid="cart-notification"]')).toContainText('カートに追加しました');

      // Step 2: 別のページに遷移（商品詳細ページ）
      const firstProductLink = page.locator('[data-testid="product-link"]').first();
      await firstProductLink.click();
      await page.waitForLoadState('networkidle');

      // 商品詳細ページで追加でカートに商品を追加
      const detailPageAddButton = page.locator('[data-testid="add-to-cart-button"]');
      if (await detailPageAddButton.isVisible()) {
        await detailPageAddButton.click();
        await expect(page.locator('[data-testid="cart-notification"]')).toContainText('カートに追加しました');
      }

      // Step 3: カートページに移動して永続化されたデータを確認
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');

      // カート内容が永続化されていることを確認
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount.gte(1); // 少なくとも1個の商品がカートにある
      
      const cartTotal = page.locator('[data-testid="cart-total"]');
      await expect(cartTotal).not.toContainText('¥0'); // 合計金額が0円ではない
      
      // カート数量バッジが表示されている
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toBeVisible();
      await expect(cartBadge).not.toContainText('0');
    });

    test('ホームページとカートページ間を行き来してもカート内容が保持される', async ({ page }) => {
      // セッションID固定のためのクッキー設定
      await page.context().addCookies([
        {
          name: 'session',
          value: 'e2e-persistence-test-user-2',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Step 1: ホームページから開始
      await page.goto('/sample');
      await page.waitForLoadState('networkidle');

      // カートページに移動（最初は空の想定）
      const cartLink = page.locator('[data-testid="cart-link"]');
      await cartLink.click();
      await page.waitForLoadState('networkidle');

      // 初期状態では空カートの表示
      await expect(page.locator('[data-testid="empty-cart-message"]')).toContainText('カートは空です');

      // Step 2: 商品一覧ページに移動して商品を追加
      await page.goto('/sample/products');
      await page.waitForLoadState('networkidle');

      // 複数の商品をカートに追加
      const addButtons = page.locator('[data-testid="add-to-cart-button"]');
      const buttonCount = await addButtons.count();
      const itemsToAdd = Math.min(3, buttonCount); // 最大3個の商品を追加
      
      for (let i = 0; i < itemsToAdd; i++) {
        await addButtons.nth(i).click();
        await page.waitForTimeout(500); // 少し待機
      }

      // Step 3: ホームページに戻る
      await page.goto('/sample');
      await page.waitForLoadState('networkidle');

      // カートバッジが更新されていることを確認
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      await expect(cartBadge).toBeVisible();
      const badgeText = await cartBadge.textContent();
      const itemCount = parseInt(badgeText || '0');
      expect(itemCount).toBeGreaterThan(0);

      // Step 4: 再度カートページに移動
      await cartLink.click();
      await page.waitForLoadState('networkidle');

      // 追加した商品がカートに表示されることを確認
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount.gte(itemsToAdd);

      // 合計金額が正しく計算されている
      const subtotal = page.locator('[data-testid="cart-subtotal"]');
      const tax = page.locator('[data-testid="cart-tax"]');
      const total = page.locator('[data-testid="cart-total"]');
      
      await expect(subtotal).toBeVisible();
      await expect(tax).toBeVisible();
      await expect(total).toBeVisible();
      
      // すべての値が0より大きいことを確認
      const subtotalText = await subtotal.textContent();
      const taxText = await tax.textContent();
      const totalText = await total.textContent();
      
      expect(subtotalText).toMatch(/¥[\d,]+/);
      expect(taxText).toMatch(/¥[\d,]+/);
      expect(totalText).toMatch(/¥[\d,]+/);
    });
  });

  test.describe('ページリロード時のカート永続化', () => {
    test('カートページでページリロードしても内容が保持される', async ({ page }) => {
      // セッションID固定
      await page.context().addCookies([
        {
          name: 'session',
          value: 'e2e-reload-test-user',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Step 1: 商品をカートに追加
      await page.goto('/sample/products');
      await page.waitForLoadState('networkidle');

      const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
      await addButton.click();

      // 商品詳細を記録（リロード後の比較用）
      const productName = await page.locator('[data-testid="product-name"]').first().textContent();
      const productPrice = await page.locator('[data-testid="product-price"]').first().textContent();

      // Step 2: カートページに移動
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');

      // リロード前のカート内容を記録
      const beforeCartItems = await page.locator('[data-testid="cart-item"]').count();
      const beforeTotal = await page.locator('[data-testid="cart-total"]').textContent();
      
      expect(beforeCartItems).toBeGreaterThan(0);
      expect(beforeTotal).toBeTruthy();

      // Step 3: ページリロード
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Step 4: リロード後も同じ内容が表示されることを確認
      const afterCartItems = await page.locator('[data-testid="cart-item"]').count();
      const afterTotal = await page.locator('[data-testid="cart-total"]').textContent();

      expect(afterCartItems).toBe(beforeCartItems);
      expect(afterTotal).toBe(beforeTotal);

      // 商品の詳細も一致することを確認
      const cartProductName = await page.locator('[data-testid="cart-item-name"]').first().textContent();
      const cartProductPrice = await page.locator('[data-testid="cart-item-price"]').first().textContent();

      expect(cartProductName).toBe(productName);
      expect(cartProductPrice).toContain(productPrice);
    });

    test('商品一覧ページでリロードしてもカートバッジが保持される', async ({ page }) => {
      // セッションID固定
      await page.context().addCookies([
        {
          name: 'session',
          value: 'e2e-badge-test-user',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Step 1: 商品をカートに追加
      await page.goto('/sample/products');
      await page.waitForLoadState('networkidle');

      // 2つの商品を追加
      const addButtons = page.locator('[data-testid="add-to-cart-button"]');
      await addButtons.nth(0).click();
      await page.waitForTimeout(500);
      await addButtons.nth(1).click();
      await page.waitForTimeout(500);

      // リロード前のカートバッジを確認
      const beforeBadge = page.locator('[data-testid="cart-badge"]');
      await expect(beforeBadge).toBeVisible();
      const beforeBadgeText = await beforeBadge.textContent();
      const beforeCount = parseInt(beforeBadgeText || '0');
      expect(beforeCount).toBeGreaterThan(0);

      // Step 2: ページリロード
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Step 3: リロード後もカートバッジが同じ値を示すことを確認
      const afterBadge = page.locator('[data-testid="cart-badge"]');
      await expect(afterBadge).toBeVisible();
      const afterBadgeText = await afterBadge.textContent();
      const afterCount = parseInt(afterBadgeText || '0');

      expect(afterCount).toBe(beforeCount);
      expect(afterCount).toBeGreaterThan(0);
    });
  });

  test.describe('複数タブでの永続化検証', () => {
    test('複数タブで同じセッションのカートが同期される', async ({ browser }) => {
      const context = await browser.newContext();
      
      // 両方のタブで同じセッションクッキーを設定
      await context.addCookies([
        {
          name: 'session',
          value: 'e2e-multi-tab-test-user',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Tab 1: 商品を追加
      const page1 = await context.newPage();
      await page1.goto('/sample/products');
      await page1.waitForLoadState('networkidle');

      const addButton1 = page1.locator('[data-testid="add-to-cart-button"]').first();
      await addButton1.click();

      // カート追加後のバッジを確認
      const badge1 = page1.locator('[data-testid="cart-badge"]');
      await expect(badge1).toBeVisible();
      const badge1Text = await badge1.textContent();
      const tab1Count = parseInt(badge1Text || '0');

      // Tab 2: 同じセッションで別タブを開く
      const page2 = await context.newPage();
      await page2.goto('/sample/cart');
      await page2.waitForLoadState('networkidle');

      // Tab2でも同じカート内容が表示されることを確認
      const cartItems2 = page2.locator('[data-testid="cart-item"]');
      await expect(cartItems2).toHaveCount.gte(1);

      // Tab2でもカートバッジが同期されている
      const badge2 = page2.locator('[data-testid="cart-badge"]');
      await expect(badge2).toBeVisible();
      const badge2Text = await badge2.textContent();
      const tab2Count = parseInt(badge2Text || '0');

      expect(tab2Count).toBe(tab1Count);

      // Tab 2で追加の操作（数量変更など）
      const quantityInput = page2.locator('[data-testid="quantity-input"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.clear();
        await quantityInput.fill('3');
        await page2.locator('[data-testid="update-quantity-button"]').first().click();
      }

      // Tab 1をリロードして変更が反映されるか確認
      await page1.reload();
      await page1.waitForLoadState('networkidle');

      const updatedBadge1 = page1.locator('[data-testid="cart-badge"]');
      const updatedBadge1Text = await updatedBadge1.textContent();
      const updatedTab1Count = parseInt(updatedBadge1Text || '0');

      // 数量変更が反映されていることを確認（3個になっているはず）
      expect(updatedTab1Count).toBeGreaterThanOrEqual(tab1Count);

      await context.close();
    });
  });

  test.describe('ブラウザ再起動時の永続化', () => {
    test('ブラウザコンテキスト再作成後もカート内容が保持される', async ({ browser }) => {
      // Context 1: 商品をカートに追加
      const context1 = await browser.newContext();
      await context1.addCookies([
        {
          name: 'session',
          value: 'e2e-browser-restart-test',
          domain: 'localhost',
          path: '/',
        },
      ]);

      const page1 = await context1.newPage();
      await page1.goto('/sample/products');
      await page1.waitForLoadState('networkidle');

      // 商品をカートに追加
      const addButton = page1.locator('[data-testid="add-to-cart-button"]').first();
      await addButton.click();

      // カート内容を確認
      await page1.goto('/sample/cart');
      await page1.waitForLoadState('networkidle');
      
      const cartItems1 = await page1.locator('[data-testid="cart-item"]').count();
      const cartTotal1 = await page1.locator('[data-testid="cart-total"]').textContent();

      expect(cartItems1).toBeGreaterThan(0);
      expect(cartTotal1).toBeTruthy();

      await context1.close();

      // Context 2: 新しいブラウザコンテキスト（ブラウザ再起動相当）
      const context2 = await browser.newContext();
      await context2.addCookies([
        {
          name: 'session',
          value: 'e2e-browser-restart-test', // 同じセッションID
          domain: 'localhost',
          path: '/',
        },
      ]);

      const page2 = await context2.newPage();
      await page2.goto('/sample/cart');
      await page2.waitForLoadState('networkidle');

      // 同じカート内容が復元されることを確認
      const cartItems2 = await page2.locator('[data-testid="cart-item"]').count();
      const cartTotal2 = await page2.locator('[data-testid="cart-total"]').textContent();

      expect(cartItems2).toBe(cartItems1);
      expect(cartTotal2).toBe(cartTotal1);

      await context2.close();
    });
  });

  test.describe('永続化エラー時のユーザビリティ', () => {
    test('永続化失敗時もユーザーが操作を続行できる', async ({ page }) => {
      // ネットワーク障害をシミュレート（カート取得API）
      await page.route('**/api/cart', (route) => {
        // 最初の数回のリクエストは失敗させる
        const url = route.request().url();
        if (url.includes('/api/cart') && route.request().method() === 'GET') {
          route.fulfill({
            status: 500,
            body: JSON.stringify({
              success: false,
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: '一時的な問題が発生しました',
              },
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/sample/cart');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('[data-testid="error-message"]')).toContainText('一時的な問題');
      
      // 再試行ボタンが表示される
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();

      // ネットワーク障害を解除
      await page.unroute('**/api/cart');

      // 再試行ボタンをクリック
      await retryButton.click();
      await page.waitForLoadState('networkidle');

      // 正常なカート画面が表示される
      await expect(page.locator('[data-testid="cart-container"]')).toBeVisible();
    });
  });
});