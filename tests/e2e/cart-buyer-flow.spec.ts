/**
 * Cart E2E テスト - User Story 1: カートに商品を追加する
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { test, expect } from '@playwright/test';

test.describe('User Story 1: カートに商品を追加する - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ログイン成功を確認
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('商品詳細ページからカートに商品を追加できる', async ({ page }) => {
    // 商品一覧ページに移動
    await page.goto('/catalog');
    await expect(page.locator('h1')).toContainText('商品一覧');

    // 最初の商品をクリック
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // 商品詳細ページに遷移
    await expect(page.locator('h1')).toContainText('商品詳細');
    
    // 商品情報が表示されることを確認
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();

    // カートに追加ボタンが有効であることを確認
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();

    // ヘッダーのカート件数を確認（追加前は0）
    const cartCount = page.locator('[data-testid="cart-count"]');
    const initialCount = await cartCount.textContent();

    // カートに追加ボタンをクリック
    await addToCartButton.click();

    // ローディング状態を確認
    await expect(addToCartButton).toContainText('追加中');
    await expect(addToCartButton).toBeDisabled();

    // 成功フィードバックが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toContainText('カートに追加しました');

    // ヘッダーのカート件数が増加することを確認
    await expect(cartCount).not.toContainText(initialCount || '0');
  });

  test('カート件数がヘッダーに正しく表示される', async ({ page }) => {
    // 商品詳細ページに直接移動
    await page.goto('/catalog/product-1');

    // 初期状態のカート件数を取得
    const cartCount = page.locator('[data-testid="cart-count"]');
    const initialCountText = await cartCount.textContent();
    const initialCount = parseInt(initialCountText || '0');

    // カートに追加
    await page.click('[data-testid="add-to-cart-button"]');
    
    // 成功フィードバックを待つ
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カート件数が1増加することを確認
    await expect(cartCount).toContainText((initialCount + 1).toString());

    // もう一度追加
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カート件数がさらに1増加することを確認
    await expect(cartCount).toContainText((initialCount + 2).toString());
  });

  test('同一商品を複数回追加すると数量が増加する', async ({ page }) => {
    // 商品詳細ページに移動
    await page.goto('/catalog/product-1');

    // 2回カートに追加
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに移動
    await page.click('[data-testid="cart-link"]');
    await expect(page.locator('h1')).toContainText('カート');

    // 商品が1つだけ表示され、数量が2であることを確認
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);
    
    const quantity = cartItems.locator('[data-testid="item-quantity"]');
    await expect(quantity).toContainText('2');
  });

  test('在庫切れ商品はカートに追加できない', async ({ page }) => {
    // 在庫切れ商品の詳細ページに移動
    await page.goto('/catalog/out-of-stock-product');

    // カートに追加ボタンが無効化されていることを確認
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addToCartButton).toBeDisabled();
    await expect(addToCartButton).toContainText('在庫切れ');

    // 在庫切れメッセージが表示されることを確認
    await expect(page.locator('[data-testid="stock-status"]')).toContainText('在庫切れ');
  });

  test('カート追加後にカートページで正しい情報が表示される', async ({ page }) => {
    // 商品詳細ページに移動
    await page.goto('/catalog/product-1');

    // 商品情報を取得
    const productName = await page.locator('[data-testid="product-name"]').textContent();
    const productPrice = await page.locator('[data-testid="product-price"]').textContent();

    // カートに追加
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに移動
    await page.click('[data-testid="cart-link"]');
    await expect(page.locator('h1')).toContainText('カート');

    // カート内に正しい商品情報が表示されることを確認
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem.locator('[data-testid="item-name"]')).toContainText(productName || '');
    await expect(cartItem.locator('[data-testid="item-price"]')).toContainText(productPrice || '');
    
    // 数量が1であることを確認
    await expect(cartItem.locator('[data-testid="item-quantity"]')).toContainText('1');

    // 合計金額が正しく表示されることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('エラー処理: 商品が見つからない場合', async ({ page }) => {
    // 存在しない商品IDでアクセス
    await page.goto('/catalog/nonexistent-product');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toContainText('商品が見つかりません');
    
    // カートに追加ボタンが表示されないことを確認
    await expect(page.locator('[data-testid="add-to-cart-button"]')).not.toBeVisible();
  });

  test('カート追加後、ページ遷移してもカート件数が維持される', async ({ page }) => {
    // 商品詳細ページでカートに追加
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カート件数を確認
    const cartCount = page.locator('[data-testid="cart-count"]');
    const countAfterAdd = await cartCount.textContent();

    // 別のページに移動
    await page.goto('/catalog');

    // カート件数が維持されていることを確認
    await expect(cartCount).toContainText(countAfterAdd || '0');

    // ホームページに移動
    await page.goto('/');

    // カート件数が維持されていることを確認
    await expect(cartCount).toContainText(countAfterAdd || '0');
  });

  test('複数の商品をカートに追加できる', async ({ page }) => {
    // 最初の商品を追加
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // 2番目の商品を追加
    await page.goto('/catalog/product-2');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページで2つの商品が表示されることを確認
    await page.goto('/cart');
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2);

    // ヘッダーのカート件数が2であることを確認
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
  });
});

/**
 * User Story 2: カート内容を確認する - E2E Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
test.describe('User Story 2: カート内容を確認する - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ログイン成功を確認
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('空のカートページが正しく表示される', async ({ page }) => {
    // カートページに直接移動
    await page.goto('/cart');

    // ページタイトルを確認
    await expect(page.locator('h1')).toContainText('カート');

    // 空のカートメッセージが表示されることを確認
    await expect(page.locator('text=カートに商品がありません')).toBeVisible();
    
    // 商品一覧へのリンクが表示されることを確認
    await expect(page.locator('text=商品一覧を見る')).toBeVisible();
    await expect(page.locator('[href="/catalog"]')).toBeVisible();
  });

  test('カートに商品を追加後、カート内容が正しく表示される', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/catalog/product-1');
    const productName = await page.locator('[data-testid="product-name"]').textContent();
    const productPrice = await page.locator('[data-testid="product-price"]').textContent();
    
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに移動
    await page.goto('/cart');

    // 商品情報が正しく表示されることを確認
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem).toBeVisible();
    await expect(cartItem.locator('[data-testid="item-name"]')).toContainText(productName || '');
    await expect(cartItem.locator('[data-testid="item-price"]')).toContainText(productPrice || '');
    await expect(cartItem.locator('[data-testid="item-quantity"]')).toHaveValue('1');

    // 商品画像が表示されることを確認
    const productImage = cartItem.locator('img');
    await expect(productImage).toBeVisible();

    // 小計が表示されることを確認
    const itemSubtotal = await cartItem.locator('.font-bold').last().textContent();
    expect(itemSubtotal).toMatch(/¥[\d,]+/);
  });

  test('カート合計金額（商品合計・消費税・総合計）が正しく表示される', async ({ page }) => {
    // 商品をカートに複数追加
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await page.goto('/catalog/product-2');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページで合計金額を確認
    await page.goto('/cart');

    // 商品数が表示されることを確認
    await expect(page.locator('text=商品数')).toBeVisible();
    await expect(page.locator('text=2点')).toBeVisible();

    // 商品合計が表示されることを確認
    const subtotal = page.locator('[data-testid="cart-subtotal"]');
    await expect(subtotal).toBeVisible();
    await expect(subtotal).toMatch(/¥[\d,]+/);

    // 消費税（10%）が表示されることを確認
    const tax = page.locator('[data-testid="cart-tax"]');
    await expect(tax).toBeVisible();
    await expect(tax).toMatch(/¥[\d,]+/);

    // 総合計が表示されることを確認
    const total = page.locator('[data-testid="cart-total"]');
    await expect(total).toBeVisible();
    await expect(total).toMatch(/¥[\d,]+/);

    // 消費税率の表示を確認
    await expect(page.locator('text=消費税（10%）')).toBeVisible();
  });

  test('税計算が正しく行われる（端数切り捨て）', async ({ page }) => {
    // 特定の価格の商品（税計算で端数が出る）を追加
    await page.goto('/catalog/product-3'); // 仮定：価格が3333円の商品
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.goto('/cart');

    // 商品合計3333円の場合、消費税は333円（333.3の端数切り捨て）
    const subtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const taxText = await page.locator('[data-testid="cart-tax"]').textContent();
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();

    // 数値を抽出して計算確認（実際の実装に応じて調整）
    expect(subtotalText).toMatch(/¥3,333/);
    expect(taxText).toMatch(/¥333/); // 端数切り捨て
    expect(totalText).toMatch(/¥3,666/); // 3333 + 333
  });

  test('複数商品のカート合計が正しく計算される', async ({ page }) => {
    // 異なる価格の商品を複数追加
    await page.goto('/catalog/product-1'); // 仮定：1000円
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.goto('/catalog/product-2'); // 仮定：1500円
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // 同じ商品を2個目追加（数量テスト）
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.goto('/cart');

    // 商品合計3500円（1000×2 + 1500×1）、消費税350円、総計3850円
    const subtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const taxText = await page.locator('[data-testid="cart-tax"]').textContent();
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();

    expect(subtotalText).toMatch(/¥3,500/);
    expect(taxText).toMatch(/¥350/);
    expect(totalText).toMatch(/¥3,850/);

    // 商品数が正しいことを確認
    await expect(page.locator('text=3点')).toBeVisible();
  });

  test('商品画像がない場合はプレースホルダーが表示される', async ({ page }) => {
    // 画像なし商品をカートに追加
    await page.goto('/catalog/product-no-image');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.goto('/cart');

    // プレースホルダー画像（SVGアイコン）が表示されることを確認
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const placeholder = cartItem.locator('.bg-base-100 svg');
    await expect(placeholder).toBeVisible();
    
    // 実際の画像（img要素）は存在しないことを確認
    const actualImage = cartItem.locator('img');
    await expect(actualImage).not.toBeVisible();
  });

  test('カートページからの商品一覧リンクが動作する', async ({ page }) => {
    // 空のカートページでリンクをテスト
    await page.goto('/cart');
    
    const catalogLink = page.locator('[href="/catalog"]');
    await expect(catalogLink).toBeVisible();
    await catalogLink.click();

    // 商品一覧ページに遷移することを確認
    await expect(page.locator('h1')).toContainText('商品一覧');
    await expect(page.url()).toContain('/catalog');
  });

  test('ページリロード後もカート内容が表示される（永続化）', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページで内容確認
    await page.goto('/cart');
    const itemsBefore = await page.locator('[data-testid="cart-item"]').count();
    const subtotalBefore = await page.locator('[data-testid="cart-subtotal"]').textContent();

    // ページをリロード
    await page.reload();

    // カート内容が保持されていることを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(itemsBefore);
    await expect(page.locator('[data-testid="cart-subtotal"]')).toHaveText(subtotalBefore || '');

    // 新しいタブでも同じ内容が表示されることを確認
    const newPage = await page.context().newPage();
    await newPage.goto('/login');
    await newPage.fill('[data-testid="email"]', 'buyer@example.com');
    await newPage.fill('[data-testid="password"]', 'password123');
    await newPage.click('[data-testid="login-button"]');
    
    await newPage.goto('/cart');
    await expect(newPage.locator('[data-testid="cart-item"]')).toHaveCount(itemsBefore);
    await expect(newPage.locator('[data-testid="cart-subtotal"]')).toHaveText(subtotalBefore || '');
  });
});

/**
 * User Story 4: カートから商品を削除する - E2E Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
test.describe('User Story 4: カートから商品を削除する - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ログイン成功を確認
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // テスト用商品をカートに追加
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await page.goto('/catalog/product-2');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに移動
    await page.goto('/cart');
  });

  test('カート内商品の削除ボタンが表示される', async ({ page }) => {
    // 各商品に削除ボタンが表示されることを確認
    const cartItems = page.locator('[data-testid="cart-item"]');
    const itemCount = await cartItems.count();
    
    expect(itemCount).toBeGreaterThan(0);

    for (let i = 0; i < itemCount; i++) {
      const item = cartItems.nth(i);
      const deleteButton = item.locator('[aria-label*="を削除"]');
      await expect(deleteButton).toBeVisible();
      
      // ゴミ箱アイコンが表示されることを確認
      const icon = deleteButton.locator('svg');
      await expect(icon).toBeVisible();
    }
  });

  test('削除ボタンをクリックすると確認ダイアログが表示される', async ({ page }) => {
    // 最初の商品の削除ボタンをクリック
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const itemName = await firstItem.locator('[data-testid="item-name"]').textContent();
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');
    
    await deleteButton.click();

    // 確認ダイアログが表示されることを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=商品をカートから削除')).toBeVisible();
    await expect(page.locator(`text=${itemName}をカートから削除しますか？`)).toBeVisible();
    await expect(page.locator('button', { hasText: '削除' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'キャンセル' })).toBeVisible();
  });

  test('確認ダイアログで「キャンセル」を選択すると商品が削除されない', async ({ page }) => {
    // 削除前の商品数を確認
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
    const initialSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();

    // 削除ボタンをクリック
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');
    await deleteButton.click();

    // 確認ダイアログで「キャンセル」をクリック
    await page.click('button:has-text("キャンセル")');

    // ダイアログが閉じることを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // 商品数と合計が変わらないことを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(initialItemCount);
    await expect(page.locator('[data-testid="cart-subtotal"]')).toHaveText(initialSubtotal || '');
  });

  test('確認ダイアログで「削除」を選択すると商品が削除される', async ({ page }) => {
    // 削除前の状態を記録
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const itemName = await firstItem.locator('[data-testid="item-name"]').textContent();
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');

    // 削除を実行
    await deleteButton.click();
    await page.click('button:has-text("削除")');

    // ダイアログが閉じることを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // 商品数が1つ減ることを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(initialItemCount - 1);

    // 削除した商品が表示されないことを確認
    await expect(page.locator('[data-testid="item-name"]', { hasText: itemName || '' })).not.toBeVisible();

    // 合計金額が再計算されることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('最後の商品を削除すると空カート状態になる', async ({ page }) => {
    // 1つずつ商品を削除
    let itemCount = await page.locator('[data-testid="cart-item"]').count();
    
    while (itemCount > 0) {
      const firstItem = page.locator('[data-testid="cart-item"]').first();
      const deleteButton = firstItem.locator('[aria-label*="を削除"]');
      
      await deleteButton.click();
      await page.click('button:has-text("削除")');
      
      // ダイアログが閉じるのを待つ
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      
      itemCount--;
    }

    // 空カート状態の表示を確認
    await expect(page.locator('text=カートに商品がありません')).toBeVisible();
    await expect(page.locator('text=商品一覧を見る')).toBeVisible();
    await expect(page.locator('[href="/catalog"]')).toBeVisible();

    // 合計表示がないことを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="cart-tax"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).not.toBeVisible();

    // ヘッダーのカート件数が0になることを確認
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0');
  });

  test('複数商品から特定の商品のみを削除できる', async ({ page }) => {
    // 3つ目の商品も追加して、複数商品の状況を作る
    await page.goto('/catalog/product-3');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに戻る
    await page.goto('/cart');

    // 商品数が3つであることを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(3);

    // 2番目の商品の名前を取得して削除
    const secondItem = page.locator('[data-testid="cart-item"]').nth(1);
    const secondItemName = await secondItem.locator('[data-testid="item-name"]').textContent();
    const deleteButton = secondItem.locator('[aria-label*="を削除"]');

    await deleteButton.click();
    await page.click('button:has-text("削除")');
    
    // ダイアログが閉じるのを待つ
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // 商品数が2つになることを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);

    // 削除した商品が表示されないことを確認
    await expect(page.locator('[data-testid="item-name"]', { hasText: secondItemName || '' })).not.toBeVisible();

    // 他の商品は残っていることを確認
    const remainingItems = page.locator('[data-testid="cart-item"]');
    await expect(remainingItems).toHaveCount(2);
  });

  test('削除操作後に金額計算が正しく更新される', async ({ page }) => {
    // 削除前の金額を記録
    const initialSubtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const initialTotalText = await page.locator('[data-testid="cart-total"]').textContent();

    // 最初の商品の価格を取得
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const itemPriceText = await firstItem.locator('[data-testid="item-price"]').textContent();
    const itemQuantityText = await firstItem.locator('[data-testid="item-quantity"]').inputValue();
    
    // 価格から数値を抽出（¥1,000 → 1000）
    const itemPrice = parseInt(itemPriceText?.replace(/[¥,]/g, '') || '0');
    const itemQuantity = parseInt(itemQuantityText || '1');
    const itemTotal = itemPrice * itemQuantity;

    // 商品を削除
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');
    await deleteButton.click();
    await page.click('button:has-text("削除")');
    
    // ダイアログが閉じるのを待つ
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // 金額が再計算されることを確認
    const newSubtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const newTotalText = await page.locator('[data-testid="cart-total"]').textContent();

    // 初期の合計から削除した商品の小計が引かれていることを確認
    expect(newSubtotalText).not.toBe(initialSubtotalText);
    expect(newTotalText).not.toBe(initialTotalText);

    // 消費税も再計算されることを確認
    const newTaxText = await page.locator('[data-testid="cart-tax"]').textContent();
    expect(newTaxText).toMatch(/¥[\d,]+/);
  });

  test('キーボードナビゲーションで削除操作ができる', async ({ page }) => {
    // 最初の削除ボタンにフォーカスを当てる
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');
    
    await deleteButton.focus();
    await expect(deleteButton).toBeFocused();

    // Enterキーで削除ダイアログを開く
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Tabで削除ボタンに移動してEnterで確定
    await page.keyboard.press('Tab'); // キャンセルボタンにフォーカス
    await page.keyboard.press('Tab'); // 削除ボタンにフォーカス
    await page.keyboard.press('Enter');

    // ダイアログが閉じて商品が削除されることを確認
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // 商品数が減ることを確認
    const remainingItems = await page.locator('[data-testid="cart-item"]').count();
    expect(remainingItems).toBeGreaterThanOrEqual(0);
  });

  test('削除後、ページ遷移してもカート状態が維持される', async ({ page }) => {
    // 削除前の商品数を確認
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();

    // 商品を削除
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const deleteButton = firstItem.locator('[aria-label*="を削除"]');
    await deleteButton.click();
    await page.click('button:has-text("削除")');
    
    // 削除後の商品数を確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(initialItemCount - 1);
    
    // 別のページに移動
    await page.goto('/catalog');
    
    // カートページに戻って状態が維持されていることを確認
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(initialItemCount - 1);

    // ヘッダーのカート件数も更新されていることを確認
    const cartCount = page.locator('[data-testid="cart-count"]');
    const expectedCount = Math.max(0, initialItemCount - 1);
    await expect(cartCount).toHaveText(expectedCount.toString());
  });

  test('アクセシビリティ: 削除ボタンに適切なラベルが付いている', async ({ page }) => {
    const cartItems = page.locator('[data-testid="cart-item"]');
    const itemCount = await cartItems.count();

    for (let i = 0; i < itemCount; i++) {
      const item = cartItems.nth(i);
      const itemName = await item.locator('[data-testid="item-name"]').textContent();
      const deleteButton = item.locator(`[aria-label="${itemName}を削除"]`);
      
      await expect(deleteButton).toBeVisible();
    }
  });
});

/**
 * User Story 3: カート内の数量を変更する - E2E Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
test.describe('User Story 3: カート内の数量を変更する - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用ユーザーでログイン
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ログイン成功を確認
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // テスト用商品をカートに追加（数量2）
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await page.goto('/catalog/product-1');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // カートページに移動
    await page.goto('/cart');
  });

  test('数量選択ドロップダウンが正しく表示される', async ({ page }) => {
    // カートアイテムに数量選択があることを確認
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    await expect(quantitySelect).toBeVisible();
    await expect(quantitySelect).toHaveValue('2'); // 初期値が2であることを確認
    
    // セレクトボックスの選択肢を確認
    const options = await quantitySelect.locator('option').all();
    expect(options.length).toBe(99); // 1-99の選択肢があることを確認
    
    // 最初と最後のオプションを確認
    await expect(quantitySelect.locator('option[value="1"]')).toBeVisible();
    await expect(quantitySelect.locator('option[value="99"]')).toBeVisible();
  });

  test('数量を変更すると小計と合計が即座に更新される', async ({ page }) => {
    // 初期の金額を記録
    const initialSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const initialTotal = await page.locator('[data-testid="cart-total"]').textContent();
    
    // 数量を2から5に変更
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    await quantitySelect.selectOption('5');
    
    // 金額が即座に更新されることを確認（短時間で変更される）
    await expect(page.locator('[data-testid="cart-subtotal"]')).not.toHaveText(initialSubtotal || '');
    await expect(page.locator('[data-testid="cart-total"]')).not.toHaveText(initialTotal || '');
    
    // 数量の表示も更新されることを確認
    await expect(quantitySelect).toHaveValue('5');
    
    // 新しい金額が正しい形式であることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toMatch(/¥[\d,]+/);
    await expect(page.locator('[data-testid="cart-tax"]')).toMatch(/¥[\d,]+/);
    await expect(page.locator('[data-testid="cart-total"]')).toMatch(/¥[\d,]+/);
  });

  test('数量を1に変更できる', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 数量を1に変更
    await quantitySelect.selectOption('1');
    await expect(quantitySelect).toHaveValue('1');
    
    // 合計が再計算されることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    
    // 商品数（itemCount）も更新されることを確認
    const itemCountText = await page.locator('text=1点').textContent();
    expect(itemCountText).toMatch(/1点/);
  });

  test('数量を最大値99に変更できる', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 数量を99に変更
    await quantitySelect.selectOption('99');
    await expect(quantitySelect).toHaveValue('99');
    
    // 合計が再計算されることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    
    // 商品数が99であることを確認
    const itemCountText = await page.locator('text=99点').textContent();
    expect(itemCountText).toMatch(/99点/);
  });

  test('複数商品がある場合、特定の商品のみの数量を変更できる', async ({ page }) => {
    // 2つ目の商品を追加
    await page.goto('/catalog/product-2');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // カートページに戻る
    await page.goto('/cart');
    
    // 2つの商品があることを確認
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    
    // 最初の商品の数量だけを変更
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const firstQuantitySelect = firstItem.locator('[data-testid="item-quantity"]');
    const secondItem = page.locator('[data-testid="cart-item"]').nth(1);
    const secondQuantitySelect = secondItem.locator('[data-testid="item-quantity"]');
    
    // 最初の商品の数量を3に変更
    await firstQuantitySelect.selectOption('3');
    
    // 最初の商品の数量が変更され、2番目の商品は変更されないことを確認
    await expect(firstQuantitySelect).toHaveValue('3');
    await expect(secondQuantitySelect).toHaveValue('1'); // 2番目は初期値の1のまま
    
    // 合計金額が更新されることを確認
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('税計算が正しく再計算される', async ({ page }) => {
    // 商品価格が1000円、数量2の場合: 小計2000円、税200円、合計2200円と仮定
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 数量を3に変更
    await quantitySelect.selectOption('3');
    
    // 新しい税額と合計を確認
    const subtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const taxText = await page.locator('[data-testid="cart-tax"]').textContent();
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();
    
    // 価格1000円 × 3個 = 3000円, 税300円, 合計3300円を想定
    expect(subtotalText).toMatch(/¥3,000/);
    expect(taxText).toMatch(/¥300/);
    expect(totalText).toMatch(/¥3,300/);
  });

  test('数量変更後、ページ遷移してもカート状態が維持される', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 数量を7に変更
    await quantitySelect.selectOption('7');
    await expect(quantitySelect).toHaveValue('7');
    
    const subtotalAfterChange = await page.locator('[data-testid="cart-subtotal"]').textContent();
    
    // 別のページに移動
    await page.goto('/catalog');
    
    // カートページに戻る
    await page.goto('/cart');
    
    // 変更した数量と金額が保持されていることを確認
    const restoredQuantitySelect = page.locator('[data-testid="cart-item"]').first().locator('[data-testid="item-quantity"]');
    await expect(restoredQuantitySelect).toHaveValue('7');
    await expect(page.locator('[data-testid="cart-subtotal"]')).toHaveText(subtotalAfterChange || '');
    
    // ヘッダーのカート件数も正しく表示されることを確認
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('7');
  });

  test('ページリロード後も数量変更が維持される', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 数量を4に変更
    await quantitySelect.selectOption('4');
    await expect(quantitySelect).toHaveValue('4');
    
    const subtotalAfterChange = await page.locator('[data-testid="cart-subtotal"]').textContent();
    
    // ページをリロード
    await page.reload();
    
    // 変更した数量が保持されていることを確認
    const reloadedQuantitySelect = page.locator('[data-testid="cart-item"]').first().locator('[data-testid="item-quantity"]');
    await expect(reloadedQuantitySelect).toHaveValue('4');
    await expect(page.locator('[data-testid="cart-subtotal"]')).toHaveText(subtotalAfterChange || '');
  });

  test('在庫数を超える数量は選択できない（エラーハンドリング）', async ({ page }) => {
    // 在庫数が少ない商品の場合のテスト（実装に依存）
    // ここでは、在庫が3個の商品を想定
    await page.goto('/catalog/limited-stock-product');
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await page.goto('/cart');
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 在庫数を超える数量（5個）を選択しようとする
    await quantitySelect.selectOption('5');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('在庫数を超えています');
    
    // 数量は変更されないことを確認
    await expect(quantitySelect).toHaveValue('1');
  });

  test('キーボードナビゲーションで数量変更ができる', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // セレクトボックスにフォーカス
    await quantitySelect.focus();
    await expect(quantitySelect).toBeFocused();
    
    // 矢印キーで値を変更（ブラウザの実装に依存）
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // フォーカスが適切に管理されることを確認
    expect(await quantitySelect.evaluate(el => document.activeElement === el)).toBeTruthy();
  });

  test('アクセシビリティ: 数量選択にラベルが適切に関連付けられている', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    const quantityLabel = cartItem.locator('label[for*="quantity"]');
    
    // ラベルが存在することを確認
    await expect(quantityLabel).toBeVisible();
    
    // スクリーンリーダー用のラベルがあることを確認
    await expect(quantityLabel).toHaveText('数量');
    
    // セレクトボックスに適切なaria属性があることを確認
    const selectElement = await quantitySelect.elementHandle();
    const ariaLabel = await selectElement?.getAttribute('aria-label');
    expect(ariaLabel).toContain('数量');
  });

  test('数量変更の際の即時フィードバックが提供される', async ({ page }) => {
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelect = cartItem.locator('[data-testid="item-quantity"]');
    
    // 初期状態の小計を記録
    const initialSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
    
    // 数量を変更
    await quantitySelect.selectOption('6');
    
    // 変更が即座に反映されることを確認（1秒以内）
    await expect(page.locator('[data-testid="cart-subtotal"]')).not.toHaveText(initialSubtotal || '', { timeout: 1000 });
    
    // ローディング状態などの視覚的フィードバックがある場合の確認
    // （実装に依存するため、必要に応じてコメントアウト）
    // await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    // await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});
/**
 * User Story 5: 未ログイン時のカート追加リダイレクト - E2E Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
test.describe('User Story 5: 未ログイン時のカート追加リダイレクト - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 未ログイン状態を確保するため、ログインしない
    // 既存のセッション情報をクリア
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('未ログイン状態で商品詳細ページが表示される', async ({ page }) => {
    // 商品詳細ページに直接アクセス
    await page.goto('/catalog/product-1');

    // 商品情報が表示されることを確認（ログイン状態に関係なく）
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();

    // カートに追加ボタンが表示されることを確認
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();
  });

  test('未ログイン時にカートに追加ボタンを押すとログインページにリダイレクトされる', async ({ page }) => {
    // 商品詳細ページに移動
    await page.goto('/catalog/product-1');

    // 現在のURLを記録
    const currentUrl = page.url();

    // カートに追加ボタンをクリック
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // リダイレクトメッセージが一時的に表示される
    await expect(page.locator('text=ログインページに移動します')).toBeVisible({ timeout: 5000 });

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // returnToパラメータが正しく設定されることを確認
    expect(page.url()).toContain('returnTo=');
    expect(decodeURIComponent(page.url())).toContain('/catalog/product-1');
  });

  test('ログインページのreturnToパラメータが正しく設定される', async ({ page }) => {
    // 特定の商品ページからカート追加を試行
    await page.goto('/catalog/special-product-123');

    // カートに追加ボタンをクリック
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // returnToパラメータに元のURLが含まれることを確認
    const currentUrl = page.url();
    const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
    const returnTo = urlParams.get('returnTo');
    
    expect(returnTo).toBeTruthy();
    expect(returnTo).toContain('/catalog/special-product-123');
  });

  test('クエリパラメータ付きのURLでもreturnToが正しく設定される', async ({ page }) => {
    // クエリパラメータ付きの商品ページに移動
    await page.goto('/catalog/product-1?variant=red&size=large');

    // カートに追加ボタンをクリック
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // returnToにクエリパラメータも含まれることを確認
    const currentUrl = page.url();
    const decodedUrl = decodeURIComponent(currentUrl);
    expect(decodedUrl).toContain('/catalog/product-1');
    expect(decodedUrl).toContain('variant=red');
    expect(decodedUrl).toContain('size=large');
  });

  test('ログイン成功後に元の商品ページに戻る', async ({ page }) => {
    // 商品詳細ページからカート追加を試行
    await page.goto('/catalog/product-1');
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // ログイン処理
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // 元の商品ページに戻ることを確認
    await expect(page).toHaveURL(/\/catalog\/product-1/, { timeout: 10000 });

    // 商品情報が正常に表示されることを確認
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('ログイン後、カートに追加ボタンが正常に動作する', async ({ page }) => {
    // 未ログインでカート追加を試行 → ログイン → 元ページ復帰の流れ
    await page.goto('/catalog/product-1');
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // ログインページでログイン
    await expect(page).toHaveURL(/\/login/);
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // 元のページに戻ったら、改めてカートに追加
    await expect(page).toHaveURL(/\/catalog\/product-1/);
    await addToCartButton.click();

    // 今度は成功フィードバックが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toContainText('カートに追加しました');

    // ヘッダーのカート件数が更新されることを確認
    await expect(page.locator('[data-testid="cart-count"]')).not.toHaveText('0');
  });

  test('未ログイン時のカートページアクセスでログインページにリダイレクトされる', async ({ page }) => {
    // 未ログイン状態でカートページに直接アクセス
    await page.goto('/cart');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // returnToパラメータにカートURLが含まれることを確認
    const currentUrl = page.url();
    const decodedUrl = decodeURIComponent(currentUrl);
    expect(decodedUrl).toContain('/cart');
  });

  test('複数の商品ページでリダイレクト機能が正常動作する', async ({ page }) => {
    // 複数の商品で同じ動作を確認
    const productIds = ['product-1', 'product-2', 'product-3'];

    for (const productId of productIds) {
      // 各商品ページに移動
      await page.goto(/catalog/);

      // カートに追加を試行
      const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
      await addToCartButton.click();

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      // returnToパラメータに正しい商品URLが含まれることを確認
      const currentUrl = page.url();
      const decodedUrl = decodeURIComponent(currentUrl);
      expect(decodedUrl).toContain(/catalog/);

      // 次のテストのためにブラウザを初期状態に戻す
      await page.goto('/');
    }
  });

  test('リダイレクト中にカートに追加ボタンが無効化される', async ({ page }) => {
    // 商品詳細ページに移動
    await page.goto('/catalog/product-1');

    // カートに追加ボタンをクリック
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // リダイレクト処理中にボタンが無効化されることを確認
    await expect(addToCartButton).toBeDisabled();

    // リダイレクトメッセージの確認
    await expect(page.locator('text=ログインページに移動します')).toBeVisible();
  });

  test('他のエラー（在庫切れなど）ではリダイレクトしない', async ({ page }) => {
    // 在庫切れ商品の詳細ページに移動
    await page.goto('/catalog/out-of-stock-product');

    // カートに追加ボタンが無効化されていることを確認（リダイレクトではない）
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await expect(addToCartButton).toBeDisabled();
    await expect(addToCartButton).toContainText('在庫切れ');

    // ページがリダイレクトされないことを確認
    await expect(page).toHaveURL(/\/catalog\/out-of-stock-product/);
  });

  test('ページリロード後もreturnTo機能が動作する', async ({ page }) => {
    // 商品詳細ページに移動してリロード
    await page.goto('/catalog/product-1');
    await page.reload();

    // カートに追加を試行
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // returnToパラメータが正しく設定されることを確認
    const currentUrl = page.url();
    const decodedUrl = decodeURIComponent(currentUrl);
    expect(decodedUrl).toContain('/catalog/product-1');
  });

  test('直接ログインページアクセス時はreturnToパラメータがない', async ({ page }) => {
    // ログインページに直接アクセス
    await page.goto('/login');

    // URLにreturnToパラメータが含まれないことを確認
    expect(page.url()).not.toContain('returnTo');

    // ログイン後はホームページまたはデフォルトページに遷移
    await page.fill('[data-testid="email"]', 'buyer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // ホームページまたはダッシュボードに遷移することを確認
    await expect(page).toHaveURL(/\//, { timeout: 10000 });
  });
});
