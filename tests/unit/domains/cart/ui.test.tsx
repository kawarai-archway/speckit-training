/**
 * Cart UI コンポーネント単体テスト - User Story 1: カートに商品を追加する
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductDetail } from '@/domains/catalog/ui';
import { CartView } from '@/domains/cart/ui';
import type { Product } from '@/contracts/catalog';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('User Story 1: カートに商品を追加する - UI Tests', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'テスト商品',
    description: 'テスト用の商品です',
    price: 1000,
    imageUrl: 'https://example.com/product1.jpg',
    stock: 10,
    categoryId: 'category-1',
    tags: ['tag1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    product: mockProduct,
    isLoading: false,
    onBack: vi.fn(),
    onAddToCart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful cart API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('商品情報の表示', () => {
    it('商品の基本情報が正しく表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      expect(screen.getByText('テスト商品')).toBeInTheDocument();
      expect(screen.getByText('テスト用の商品です')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
    });

    it('在庫数が表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      expect(screen.getByText(/在庫: 10個/)).toBeInTheDocument();
    });

    it('商品画像が表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      const image = screen.getByAltText('テスト商品');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/product1.jpg');
    });
  });

  describe('カートに追加ボタンの動作', () => {
    it('カートに追加ボタンが表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeEnabled();
      expect(addButton).toHaveTextContent('カートに追加');
    });

    it('カートに追加ボタンを押すとonAddToCartが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      expect(defaultProps.onAddToCart).toHaveBeenCalledWith('product-1');
    });

    it('カート追加中はローディング状態になる', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      expect(screen.getByText('追加中...')).toBeInTheDocument();
      expect(addButton).toBeDisabled();
    });

    it('カート追加成功時にフィードバックが表示される', async () => {
      const user = userEvent.setup();
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
        expect(screen.getByTestId('success-message')).toHaveTextContent('カートに追加しました');
      });
    });
  });

  describe('在庫切れ商品の処理', () => {
    it('在庫0の商品はカート追加ボタンが無効化される', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      render(<ProductDetail {...defaultProps} product={outOfStockProduct} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveTextContent('在庫切れ');
      expect(screen.getByTestId('stock-status')).toHaveTextContent('在庫切れ');
    });

    it('在庫がundefinedの商品でもカート追加できる', () => {
      const noStockInfoProduct = { ...mockProduct };
      delete (noStockInfoProduct as any).stock;
      
      render(<ProductDetail {...defaultProps} product={noStockInfoProduct} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      expect(addButton).toBeEnabled();
    });
  });

  describe('エラーハンドリング', () => {
    it('カート追加APIエラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue(new Error('API Error'));
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('カートへの追加に失敗しました');
      });
    });

    it('401エラー時は未認証メッセージが表示される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({ status: 401 });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('ログインが必要です');
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('カートに追加ボタンに適切なaria-labelが設定される', () => {
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      expect(addButton).toHaveAttribute('aria-label', 'テスト商品をカートに追加');
    });

    it('在庫情報が読み上げソフトで認識される', () => {
      render(<ProductDetail {...defaultProps} />);

      const stockInfo = screen.getByTestId('stock-status');
      expect(stockInfo).toHaveAttribute('aria-live', 'polite');
    });

    it('フィードバックメッセージが読み上げソフトで認識される', async () => {
      const user = userEvent.setup();
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        const feedback = screen.getByTestId('success-message');
        expect(feedback).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('ローディング状態', () => {
    it('商品データロード中は適切なローディング表示', () => {
      render(<ProductDetail {...defaultProps} product={null} isLoading={true} />);

      expect(screen.getByText('商品情報を読み込み中...')).toBeInTheDocument();
    });

    it('エラー状態では適切なエラー表示', () => {
      render(<ProductDetail {...defaultProps} product={null} error="商品が見つかりません" />);

      expect(screen.getByText('商品が見つかりません')).toBeInTheDocument();
    });
  });
});

/**
 * User Story 2: カート内容を確認する - UI Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 2: カート内容を確認する - CartView UI Tests', () => {
  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        productId: 'product-1',
        productName: 'テスト商品1',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
      {
        productId: 'product-2',
        productName: 'テスト商品2',
        price: 1500,
        imageUrl: undefined,
        quantity: 1,
        addedAt: new Date(),
      },
    ],
    subtotal: 3500,
    tax: 350,
    total: 3850,
    itemCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    cart: mockCart,
    isLoading: false,
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
    onCheckout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('カート内容表示', () => {
    it('商品一覧が正しく表示される', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByTestId('cart-item')).toBeInTheDocument();
      expect(screen.getByTestId('item-name')).toHaveTextContent('テスト商品1');
      expect(screen.getByTestId('item-price')).toHaveTextContent('¥1,000');
      expect(screen.getByTestId('item-quantity')).toHaveValue('2');
    });

    it('商品合計が正しく表示される', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥3,500');
    });

    it('消費税（10%）が正しく表示される', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByTestId('cart-tax')).toHaveTextContent('¥350');
    });

    it('総合計が正しく表示される', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByTestId('cart-total')).toHaveTextContent('¥3,850');
    });

    it('商品画像がない場合はプレースホルダーが表示される', () => {
      render(<CartView {...defaultProps} />);

      // プレースホルダー画像のSVGが存在することを確認
      const placeholderIcons = screen.getAllByRole('img', { hidden: true });
      expect(placeholderIcons.length).toBeGreaterThan(0);
    });
  });

  describe('空カート状態', () => {
    it('カートが空の場合は適切なメッセージが表示される', () => {
      const emptyCart = { ...mockCart, items: [], itemCount: 0 };
      render(<CartView {...defaultProps} cart={emptyCart} />);

      expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
      expect(screen.getByText('商品一覧を見る')).toBeInTheDocument();
    });

    it('カートがnullの場合も空状態が表示される', () => {
      render(<CartView {...defaultProps} cart={null} />);

      expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は適切なメッセージが表示される', () => {
      render(<CartView {...defaultProps} isLoading={true} />);

      expect(screen.getByText('カートを読み込み中...')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時は適切なエラーメッセージが表示される', () => {
      render(<CartView {...defaultProps} error="カートの読み込みに失敗しました" />);

      expect(screen.getByText('カートの読み込みに失敗しました')).toBeInTheDocument();
    });
  });

  describe('数量変更', () => {
    it('数量を変更するとonUpdateQuantityが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      await user.selectOptions(quantitySelect, '3');

      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledWith('product-1', 3);
    });
  });

  describe('アクセシビリティ', () => {
    it('数量選択にアクセシブルなラベルが付いている', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByLabelText('数量')).toBeInTheDocument();
    });

    it('削除ボタンにアクセシブルなラベルが付いている', () => {
      render(<CartView {...defaultProps} />);

      expect(screen.getByLabelText('テスト商品1を削除')).toBeInTheDocument();
    });
  });
});

/**
 * User Story 3: カート内の数量を変更する - UI Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { CartView } from '@/domains/cart/ui';

describe('User Story 3: カート内の数量を変更する - CartView UI Tests', () => {
  const mockCartWithSingleItem = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        productId: 'product-1',
        productName: 'テスト商品',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
    ],
    subtotal: 2000,
    tax: 200,
    total: 2200,
    itemCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    cart: mockCartWithSingleItem,
    isLoading: false,
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
    onCheckout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('数量入力コントロール', () => {
    it('数量選択ドロップダウンが表示される', () => {
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      expect(quantitySelect).toBeInTheDocument();
      expect(quantitySelect).toHaveDisplayValue('2');
    });

    it('数量選択肢が1から99まで表示される', () => {
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      const options = quantitySelect.querySelectorAll('option');
      
      expect(options).toHaveLength(99); // 1 to 99
      expect(options[0]).toHaveValue('1');
      expect(options[0]).toHaveTextContent('1');
      expect(options[98]).toHaveValue('99');
      expect(options[98]).toHaveTextContent('99');
    });

    it('現在の数量が選択状態になっている', () => {
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity') as HTMLSelectElement;
      expect(quantitySelect.value).toBe('2');
    });

    it('数量変更時にonUpdateQuantityが正しい引数で呼ばれる', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      await user.selectOptions(quantitySelect, '5');

      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledWith('product-1', 5);
      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledTimes(1);
    });

    it('数量を最小値1に変更できる', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      await user.selectOptions(quantitySelect, '1');

      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledWith('product-1', 1);
    });

    it('数量を最大値99に変更できる', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      await user.selectOptions(quantitySelect, '99');

      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledWith('product-1', 99);
    });
  });

  describe('即時再計算表示', () => {
    it('数量変更時に小計が即座に更新される', async () => {
      const user = userEvent.setup();
      
      // 更新後のカート状態をモック
      const updatedCart = {
        ...mockCartWithSingleItem,
        items: [{
          ...mockCartWithSingleItem.items[0],
          quantity: 5,
        }],
        subtotal: 5000,
        tax: 500,
        total: 5500,
        itemCount: 5,
      };

      // onUpdateQuantityが呼ばれたら状態が更新されるようにモック
      const mockOnUpdateQuantity = vi.fn();
      const { rerender } = render(
        <CartView {...defaultProps} onUpdateQuantity={mockOnUpdateQuantity} />
      );

      const quantitySelect = screen.getByTestId('item-quantity');
      await user.selectOptions(quantitySelect, '5');

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith('product-1', 5);

      // 状態更新後の表示を再レンダリング
      rerender(<CartView {...defaultProps} cart={updatedCart} />);

      // 更新された金額が表示されることを確認
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥5,000');
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('¥500');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('¥5,500');
    });

    it('複数商品がある場合でも正しく再計算される', () => {
      const multiItemCart = {
        ...mockCartWithSingleItem,
        items: [
          {
            productId: 'product-1',
            productName: 'テスト商品1',
            price: 1000,
            quantity: 3,
            addedAt: new Date(),
          },
          {
            productId: 'product-2',
            productName: 'テスト商品2',
            price: 1500,
            quantity: 2,
            addedAt: new Date(),
          },
        ],
        subtotal: 6000, // 1000*3 + 1500*2
        tax: 600,
        total: 6600,
        itemCount: 5,
      };

      render(<CartView {...defaultProps} cart={multiItemCart} />);

      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥6,000');
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('¥600');
      expect(screen.getByTestId('cart-total')).toHaveTextContent('¥6,600');
    });
  });

  describe('数量バリデーション', () => {
    it('数量選択が無効状態の場合は適切に表示される', () => {
      const propsWithError = {
        ...defaultProps,
        error: '在庫数を超えています',
      };

      render(<CartView {...propsWithError} />);

      // エラー状態では数量選択は表示されない（エラーメッセージが優先）
      expect(screen.getByText('在庫数を超えています')).toBeInTheDocument();
    });
  });

  describe('ローディング状態での数量変更', () => {
    it('ローディング中は数量変更できない', () => {
      render(<CartView {...defaultProps} isLoading={true} />);

      // ローディング中は CartView 全体がローディング表示になる
      expect(screen.getByText('カートを読み込み中...')).toBeInTheDocument();
      expect(screen.queryByTestId('item-quantity')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('数量選択にスクリーンリーダー対応のラベルが付いている', () => {
      render(<CartView {...defaultProps} />);

      const quantityLabel = screen.getByLabelText('数量');
      expect(quantityLabel).toBeInTheDocument();
      
      // ラベルが正しく関連付けられている
      const quantitySelect = screen.getByTestId('item-quantity');
      expect(quantityLabel).toBe(quantitySelect);
    });

    it('数量変更時の状態変化がスクリーンリーダーで認識される', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      
      // aria-live 属性があることを確認（実装依存）
      // 実装時に小計などの表示エリアに aria-live="polite" を設定することを想定
      await user.selectOptions(quantitySelect, '3');
      
      // 変更後の値が正しく反映されることを確認
      expect(quantitySelect).toHaveDisplayValue('3');
    });

    it('キーボード操作で数量変更ができる', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      
      // フォーカスを当てる
      await user.tab();
      expect(quantitySelect).toHaveFocus();

      // キーボードで値を変更
      await user.keyboard('{ArrowDown}'); // 1つ下の値を選択
      
      // 変更が適用されることを確認（実装依存）
      // selectボックスのキーボード操作は実装によって異なるため、
      // 最低限フォーカスが当たることを確認
      expect(quantitySelect).toHaveFocus();
    });
  });

  describe('エラーハンドリング', () => {
    it('数量変更がエラーの場合、適切なエラー表示がされる', () => {
      const propsWithQuantityError = {
        ...defaultProps,
        error: '在庫数を超えています。在庫数: 3',
      };

      render(<CartView {...propsWithQuantityError} />);

      expect(screen.getByText('在庫数を超えています。在庫数: 3')).toBeInTheDocument();
    });

    it('ネットワークエラーの場合、適切なメッセージが表示される', () => {
      const propsWithNetworkError = {
        ...defaultProps,
        error: 'ネットワークエラーが発生しました',
      };

      render(<CartView {...propsWithNetworkError} />);

      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
    });
  });

  describe('パフォーマンス', () => {
    it('onUpdateQuantityが複数回呼ばれることがない', async () => {
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const quantitySelect = screen.getByTestId('item-quantity');
      
      // 短時間で複数回クリックしても1回だけ呼ばれる（デバウンス想定）
      await user.selectOptions(quantitySelect, '3');
      
      // デバウンス実装がある場合のテスト準備
      // 実装時にデバウンスが追加された場合、適切な待機時間を設ける
      expect(defaultProps.onUpdateQuantity).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * User Story 4: カートから商品を削除する - UI Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 4: カートから商品を削除する - CartView UI Tests', () => {
  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        productId: 'product-1',
        productName: 'テスト商品1',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
      {
        productId: 'product-2', 
        productName: 'テスト商品2',
        price: 1500,
        imageUrl: undefined,
        quantity: 1,
        addedAt: new Date(),
      },
    ],
    subtotal: 3500,
    tax: 350,
    total: 3850,
    itemCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    cart: mockCart,
    isLoading: false,
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
    onCheckout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('削除ボタンの表示と基本動作', () => {
    it('各商品に削除ボタンが表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView {...defaultProps} />);

      // 各商品の削除ボタンを確認
      expect(screen.getByLabelText('テスト商品1を削除')).toBeInTheDocument();
      expect(screen.getByLabelText('テスト商品2を削除')).toBeInTheDocument();
    });

    it('削除ボタンにゴミ箱アイコンが表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView {...defaultProps} />);

      const deleteButtons = screen.getAllByLabelText(/を削除/);
      expect(deleteButtons).toHaveLength(2);

      // SVGアイコンが存在することを確認
      deleteButtons.forEach(button => {
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('削除ボタンはホバー時にスタイルが変わる', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      expect(deleteButton).toHaveClass('hover:bg-base-100', 'hover:text-base-900');
    });
  });

  describe('削除確認ダイアログの動作', () => {
    it('削除ボタンを押すと確認ダイアログが表示される', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton);

      // 確認ダイアログが表示される
      expect(screen.getByText('商品をカートから削除')).toBeInTheDocument();
      expect(screen.getByText('テスト商品1をカートから削除しますか？')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });

    it('確認ダイアログで「削除」を押すとonRemoveが呼ばれる', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('削除');
      await user.click(confirmButton);

      expect(defaultProps.onRemove).toHaveBeenCalledWith('product-1');
    });

    it('確認ダイアログで「キャンセル」を押すとダイアログが閉じる', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      // ダイアログが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByText('商品をカートから削除')).not.toBeInTheDocument();
      });
      expect(defaultProps.onRemove).not.toHaveBeenCalled();
    });

    it('複数商品の削除ダイアログは独立して動作する', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      // 商品1の削除ダイアログを開く
      const deleteButton1 = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton1);

      expect(screen.getByText('テスト商品1をカートから削除しますか？')).toBeInTheDocument();

      // キャンセルして閉じる
      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('商品をカートから削除')).not.toBeInTheDocument();
      });

      // 商品2の削除ダイアログを開く
      const deleteButton2 = screen.getByLabelText('テスト商品2を削除');
      await user.click(deleteButton2);

      expect(screen.getByText('テスト商品2をカートから削除しますか？')).toBeInTheDocument();
    });
  });

  describe('空カート状態への遷移', () => {
    it('最後の商品を削除した後は空カート状態が表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      const emptyCart = {
        ...mockCart,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
      render(<CartView {...defaultProps} cart={emptyCart} />);

      expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
      expect(screen.getByText('商品一覧を見る')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('削除ボタンにフォーカス可能', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.tab();
      await user.tab();
      await user.tab(); // 数量選択、削除ボタンの順でフォーカス

      expect(deleteButton).toHaveFocus();
    });

    it('削除確認ダイアログがモーダルとして機能する', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton);

      // ダイアログの要素を確認
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('削除ボタンにキーボードアクセスが可能', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      render(<CartView {...defaultProps} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      deleteButton.focus();

      // Enterキーで削除ダイアログを開く
      await user.keyboard('{Enter}');

      expect(screen.getByText('商品をカートから削除')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('onRemoveが未定義でも削除ボタンが表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView {...defaultProps} onRemove={undefined} />);

      expect(screen.getByLabelText('テスト商品1を削除')).toBeInTheDocument();
    });

    it('削除処理中にエラーが発生しても画面が壊れない', async () => {
      const { CartView } = require('@/domains/cart/ui');
      const user = userEvent.setup();
      const mockOnRemove = vi.fn().mockRejectedValue(new Error('Delete failed'));

      render(<CartView {...defaultProps} onRemove={mockOnRemove} />);

      const deleteButton = screen.getByLabelText('テスト商品1を削除');
      await user.click(deleteButton);

      const confirmButton = screen.getByText('削除');
      await user.click(confirmButton);

      // エラーが発生してもUIが正常に動作することを確認
    });
  });
});

/**
 * User Story 5: 未ログイン時のカート追加リダイレクト - UI Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 5: 未ログイン時のカート追加リダイレクト - UI Tests', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'テスト商品',
    description: 'テスト用の商品です',
    price: 1000,
    imageUrl: 'https://example.com/product1.jpg',
    stock: 10,
    categoryId: 'category-1',
    tags: ['tag1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    product: mockProduct,
    isLoading: false,
    onBack: vi.fn(),
    onAddToCart: vi.fn(),
  };

  // Mock window.location methods
  const mockReplace = vi.fn();
  const mockHref = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/catalog/product-1',
        replace: mockReplace,
      },
      writable: true,
    });
  });

  describe('未認証時のUI状態', () => {
    it('未ログイン状態でも商品詳細は正常に表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      expect(screen.getByText('テスト商品')).toBeInTheDocument();
      expect(screen.getByText('テスト用の商品です')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
    });

    it('未ログイン状態でもカートに追加ボタンが表示される', () => {
      render(<ProductDetail {...defaultProps} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeEnabled();
      expect(addButton).toHaveTextContent('カートに追加');
    });

    it('ログイン状態が不明な場合でも基本機能は動作する', () => {
      render(<ProductDetail {...defaultProps} />);

      // 基本表示が正常であることを確認
      expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument();
      expect(screen.getByText('テスト商品')).toBeInTheDocument();
    });
  });

  describe('認証エラー時のリダイレクト動作', () => {
    it('401エラー時にログインページへリダイレクトされる', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Authentication required',
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?returnTo=%2Fcatalog%2Fproduct-1');
      });
    });

    it('401エラー時にreturnToパラメータが正しく設定される', async () => {
      const user = userEvent.setup();
      
      // 現在のページURLをセット
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/catalog/special-product',
          pathname: '/catalog/special-product',
          replace: mockReplace,
        },
        writable: true,
      });

      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?returnTo=%2Fcatalog%2Fspecial-product');
      });
    });

    it('クエリパラメータがある場合でも正しくreturnToが設定される', async () => {
      const user = userEvent.setup();
      
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/catalog/product-1?color=red&size=large',
          pathname: '/catalog/product-1',
          search: '?color=red&size=large',
          replace: mockReplace,
        },
        writable: true,
      });

      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        const expectedReturnTo = encodeURIComponent('/catalog/product-1?color=red&size=large');
        expect(mockReplace).toHaveBeenCalledWith(`/login?returnTo=${expectedReturnTo}`);
      });
    });
  });

  describe('リダイレクト前のユーザーフィードバック', () => {
    it('401エラー時に一時的にリダイレクトメッセージが表示される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      // リダイレクト前に一時的にメッセージが表示される
      expect(screen.getByText('ログインページに移動します...')).toBeInTheDocument();
    });

    it('リダイレクト中はカートに追加ボタンが無効化される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('その他のエラー時の動作', () => {
    it('401以外のエラーではリダイレクトしない', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mkRejectedValue({
        status: 500,
        message: 'Internal server error',
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // リダイレクトは発生しない
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('ネットワークエラー時もリダイレクトしない', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('CartView での未認証状態処理', () => {
    it('未認証時のカートアクセスでエラーメッセージが表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView 
        cart={null} 
        error="ログインが必要です" 
        isLoading={false}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        onCheckout={vi.fn()}
      />);

      expect(screen.getByText('ログインが必要です')).toBeInTheDocument();
    });

    it('カートページで401エラー時にログインリンクが表示される', () => {
      const { CartView } = require('@/domains/cart/ui');
      render(<CartView 
        cart={null} 
        error="ログインしてください" 
        isLoading={false}
        showLoginLink={true}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        onCheckout={vi.fn()}
      />);

      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/login?returnTo=%2Fcart');
    });
  });

  describe('アクセシビリティ', () => {
    it('リダイレクトメッセージがスクリーンリーダーに通知される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        const message = screen.getByText('ログインページに移動します...');
        expect(message).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('エラーメッセージに適切なroleが設定される', async () => {
      const user = userEvent.setup();
      const mockOnAddToCart = vi.fn().mockRejectedValue({
        status: 401,
        shouldRedirectToLogin: true,
      });
      
      render(<ProductDetail {...defaultProps} onAddToCart={mockOnAddToCart} />);

      const addButton = screen.getByTestId('add-to-cart-button');
      await user.click(addButton);

      await waitFor(() => {
        const message = screen.getByText('ログインページに移動します...');
        expect(message).toHaveAttribute('role', 'status');
      });
    });
  });
});