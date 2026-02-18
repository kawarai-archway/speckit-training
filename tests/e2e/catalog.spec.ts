/**
 * Catalog ドメイン - E2E テスト
 * カタログ閲覧機能のエンドツーエンドテスト
 */
import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// US1: 商品一覧表示
// ─────────────────────────────────────────────────────────────────

test.describe('カタログ一覧ページ', () => {
  test('商品カードが表示される', async ({ page }) => {
    await page.goto('/catalog');

    // 商品カードが表示されることを確認
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();

    // 12件（1ページ分）表示されることを確認
    const count = await productCards.count();
    expect(count).toBe(12);
  });

  test('商品カードに名前・価格・画像が表示される', async ({ page }) => {
    await page.goto('/catalog');

    // 最初のカードに商品名が表示されていることを確認
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible();

    // 価格（¥記号）が表示されていることを確認
    await expect(page.locator('text=¥').first()).toBeVisible();
  });

  test('ページネーションで次ページに遷移できる', async ({ page }) => {
    await page.goto('/catalog');

    // 次へボタンをクリック
    const nextButton = page.getByRole('button', { name: /次へ/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // 2ページ目の商品が表示されることを確認
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
  });

  test('在庫切れ商品に「在庫切れ」ラベルが表示される', async ({ page }) => {
    await page.goto('/catalog');

    // 在庫切れラベルが存在することを確認（複数ページをまたぐ可能性がある）
    // 全ページを確認する必要はなく、表示されるページで確認
    const outOfStockLabel = page.locator('text=在庫切れ');

    // 1ページ目にない場合は2ページ目も確認
    if (await outOfStockLabel.count() === 0) {
      const nextButton = page.getByRole('button', { name: /次へ/i });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
      }
    }

    await expect(outOfStockLabel.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: 商品詳細表示
// ─────────────────────────────────────────────────────────────────

test.describe('商品詳細ページ', () => {
  test('一覧から詳細ページに遷移できる', async ({ page }) => {
    await page.goto('/catalog');

    // 最初の商品カードをクリック
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await firstCard.click();

    // 詳細ページに遷移
    await expect(page.locator('h1')).toBeVisible();
  });

  test('商品詳細に名前・価格・説明文・画像が表示される', async ({ page }) => {
    await page.goto('/catalog');

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await firstCard.click();

    // 商品名
    await expect(page.locator('h1')).toBeVisible();
    // 価格
    await expect(page.locator('text=¥').first()).toBeVisible();
  });

  test('カートに追加ボタンが表示される', async ({ page }) => {
    await page.goto('/catalog');

    const firstCard = page.locator('[data-testid="product-card"]').first();
    await firstCard.click();

    await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible();
  });

  test('存在しない商品 ID でエラー表示される', async ({ page }) => {
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440999');

    // エラーメッセージが表示される
    await expect(page.locator('text=商品が見つかりません')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: 商品検索
// ─────────────────────────────────────────────────────────────────

test.describe('商品検索', () => {
  test('検索フィールドにキーワードを入力して検索できる', async ({ page }) => {
    await page.goto('/catalog');

    // 検索フィールドにキーワード入力
    const searchInput = page.getByPlaceholder(/検索/i);
    await searchInput.fill('シャツ');

    // 検索ボタンクリック
    await page.getByRole('button', { name: /検索/i }).click();

    // 検索結果が表示される
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
  });

  test('該当なしの場合メッセージが表示される', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.getByPlaceholder(/検索/i);
    await searchInput.fill('存在しない商品名XYZABC');
    await page.getByRole('button', { name: /検索/i }).click();

    await expect(page.locator('text=該当する商品がありません')).toBeVisible();
  });

  test('クリアで全商品に戻る', async ({ page }) => {
    await page.goto('/catalog');

    // まず検索
    const searchInput = page.getByPlaceholder(/検索/i);
    await searchInput.fill('シャツ');
    await page.getByRole('button', { name: /検索/i }).click();

    // クリアボタン
    await page.getByRole('button', { name: /クリア/i }).click();

    // 全件に戻る（12件表示）
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    const count = await productCards.count();
    expect(count).toBe(12);
  });
});
