/**
 * Cart ユースケース単体テスト - User Stories 1, 2, 4: カート操作
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addToCart, getCart, removeFromCart } from '@/domains/cart/api/usecases';
import type { CartContext } from '@/domains/cart/api/usecases';
import type { Cart, CartRepository, ProductFetcher } from '@/contracts/cart';

describe('User Story 1: カートに商品を追加する - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/product1.jpg',
    stock: 10,
  };

  const mockSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  beforeEach(() => {
    mockRepository = {
      findByUserId: async () => null,
      create: async (userId) => ({
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      addItem: async (userId, item) => ({
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId,
        items: [{
          ...item,
          addedAt: new Date(),
        }],
        subtotal: item.price * item.quantity,
        tax: Math.floor(item.price * item.quantity * 0.1),
        total: item.price * item.quantity + Math.floor(item.price * item.quantity * 0.1),
        itemCount: item.quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateItemQuantity: async () => { throw new Error('Not implemented'); },
      removeItem: async () => { throw new Error('Not implemented'); },
    };

    mockProductFetcher = {
      findById: async (id) => id === mockProduct.id ? mockProduct : null,
    };

    context = {
      session: mockSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('正常系', () => {
    it('有効な商品IDと数量でカートに商品を追加できる', async () => {
      const result = await addToCart(
        { productId: mockProduct.id, quantity: 2 },
        context
      );

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(mockProduct.id);
      expect(result.items[0].quantity).toBe(2);
      expect(result.subtotal).toBe(2000);
      expect(result.tax).toBe(200);
      expect(result.total).toBe(2200);
    });

    it('数量を省略した場合はデフォルトで1が設定される', async () => {
      const result = await addToCart(
        { productId: mockProduct.id },
        context
      );

      expect(result.items[0].quantity).toBe(1);
      expect(result.subtotal).toBe(1000);
    });
  });

  describe('在庫チェック', () => {
    it('在庫切れ商品は追加できない', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      mockProductFetcher.findById = async () => outOfStockProduct;

      await expect(
        addToCart({ productId: mockProduct.id, quantity: 1 }, context)
      ).rejects.toThrow('在庫切れです');
    });

    it('在庫数を超える数量は追加できない', async () => {
      await expect(
        addToCart({ productId: mockProduct.id, quantity: 11 }, context)
      ).rejects.toThrow('在庫数を超えています');
    });
  });

  describe('重複商品の処理', () => {
    it('既存商品の場合は数量が加算される', async () => {
      // 既にカートに商品が1つある状態をセットアップ
      const existingCart = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: mockSession.userId,
        items: [{
          productId: mockProduct.id,
          productName: mockProduct.name,
          price: mockProduct.price,
          quantity: 1,
          addedAt: new Date(),
        }],
        subtotal: 1000,
        tax: 100,
        total: 1100,
        itemCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByUserId = async () => existingCart;
      mockRepository.addItem = async (userId, item) => ({
        ...existingCart,
        items: [{
          ...existingCart.items[0],
          quantity: existingCart.items[0].quantity + item.quantity,
        }],
        subtotal: 2000,
        tax: 200,
        total: 2200,
        itemCount: 2,
        updatedAt: new Date(),
      });

      const result = await addToCart(
        { productId: mockProduct.id, quantity: 1 },
        context
      );

      expect(result.items[0].quantity).toBe(2);
    });

    it('既存商品 + 新規数量が在庫を超える場合はエラー', async () => {
      const existingCart = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: mockSession.userId,
        items: [{
          productId: mockProduct.id,
          productName: mockProduct.name,
          price: mockProduct.price,
          quantity: 8,
          addedAt: new Date(),
        }],
        subtotal: 8000,
        tax: 800,
        total: 8800,
        itemCount: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByUserId = async () => existingCart;

      await expect(
        addToCart({ productId: mockProduct.id, quantity: 3 }, context)
      ).rejects.toThrow('在庫数を超えています。在庫数: 10');
    });
  });

  describe('認証・認可', () => {
    it('未認証ユーザーはエラーになる', async () => {
      const unauthenticatedContext = {
        ...context,
        session: { ...mockSession, role: 'guest' as any },
      };

      await expect(
        addToCart({ productId: mockProduct.id }, unauthenticatedContext)
      ).rejects.toThrow();
    });
  });

  describe('バリデーション', () => {
    it('存在しない商品IDはエラーになる', async () => {
      await expect(
        addToCart({ productId: '550e8400-e29b-41d4-a716-446655440999' }, context)
      ).rejects.toThrow('商品が見つかりません');
    });

    it('不正な数量（0以下）はエラーになる', async () => {
      await expect(
        addToCart({ productId: mockProduct.id, quantity: 0 }, context)
      ).rejects.toThrow();
    });

    it('不正な数量（100以上）はエラーになる', async () => {
      await expect(
        addToCart({ productId: mockProduct.id, quantity: 100 }, context)
      ).rejects.toThrow();
    });
  });
});

/**
 * User Story 2: カート内容を確認する - Usecase Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 2: カート内容を確認する - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  const mockCartWithItems: Cart = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: mockSession.userId,
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        productName: 'テスト商品1',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
      {
        productId: '550e8400-e29b-41d4-a716-446655440003',
        productName: 'テスト商品2',
        price: 1500,
        imageUrl: 'https://example.com/product2.jpg',
        quantity: 1,
        addedAt: new Date(),
      },
    ],
    subtotal: 3500, // 1000*2 + 1500*1
    tax: 350, // Math.floor(3500 * 0.1)
    total: 3850, // 3500 + 350
    itemCount: 3, // 2 + 1
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    };

    mockProductFetcher = {
      findById: vi.fn(),
    };

    context = {
      session: mockSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('getCart - カート取得', () => {
    it('既存のカートを取得できる（税・合計込み）', async () => {
      // 税・合計なしのカートデータをモック
      const cartWithoutTax = {
        ...mockCartWithItems,
        tax: undefined,
        total: undefined,
      };
      (mockRepository.findByUserId as any).mockResolvedValue(cartWithoutTax);

      const result = await getCart({}, context);

      expect(result).toEqual({
        ...cartWithoutTax,
        tax: 350, // 10%, 端数切り捨て
        total: 3850, // subtotal + tax
      });
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockSession.userId);
    });

    it('カートが存在しない場合は新規作成される', async () => {
      (mockRepository.findByUserId as any).mockResolvedValue(null);
      (mockRepository.create as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: mockSession.userId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getCart({}, context);

      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
      expect(mockRepository.create).toHaveBeenCalledWith(mockSession.userId);
    });

    it('税計算が正しく行われる（端数切り捨て）', async () => {
      const cartWithOddSubtotal = {
        ...mockCartWithItems,
        subtotal: 3333, // 10% = 333.3 → 333
        tax: undefined,
        total: undefined,
      };
      (mockRepository.findByUserId as any).mockResolvedValue(cartWithOddSubtotal);

      const result = await getCart({}, context);

      expect(result.tax).toBe(333); // Math.floor(3333 * 0.1)
      expect(result.total).toBe(3666); // 3333 + 333
    });

    it('未ログインの場合はAuthorizationErrorが発生する', async () => {
      const unauthorizedContext = {
        ...context,
        session: { ...mockSession, role: 'guest' as const },
      };

      await expect(getCart({}, unauthorizedContext)).rejects.toThrow();
    });
  });
});

/**
 * User Story 4: カートから商品を削除する - Usecase Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 4: カートから商品を削除する - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  const mockCartWithMultipleItems: Cart = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: mockSession.userId,
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        productName: 'テスト商品1',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
      {
        productId: '550e8400-e29b-41d4-a716-446655440003',
        productName: 'テスト商品2',
        price: 1500,
        imageUrl: 'https://example.com/product2.jpg',
        quantity: 1,
        addedAt: new Date(),
      },
    ],
    subtotal: 3500, // 1000*2 + 1500*1
    tax: 350,
    total: 3850,
    itemCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartWithSingleItem: Cart = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: mockSession.userId,
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        productName: 'テスト商品1',
        price: 1000,
        imageUrl: 'https://example.com/product1.jpg',
        quantity: 1,
        addedAt: new Date(),
      },
    ],
    subtotal: 1000,
    tax: 100,
    total: 1100,
    itemCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    };

    mockProductFetcher = {
      findById: vi.fn(),
    };

    context = {
      session: mockSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('removeFromCart - カート商品削除', () => {
    it('カート内の商品を削除できる', async () => {
      // 削除前のカートを設定
      (mockRepository.findByUserId as any).mockResolvedValue(mockCartWithMultipleItems);
      
      // 削除後のカート（商品2のみ残る）
      const cartAfterRemoval = {
        ...mockCartWithMultipleItems,
        items: [mockCartWithMultipleItems.items[1]], // 商品2のみ
        subtotal: 1500,
        tax: 150,
        total: 1650,
        itemCount: 1,
      };
      (mockRepository.removeItem as any).mockResolvedValue(cartAfterRemoval);

      const result = await removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440000' },
        context
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('550e8400-e29b-41d4-a716-446655440003');
      expect(result.subtotal).toBe(1500);
      expect(result.tax).toBe(150);
      expect(result.total).toBe(1650);
      expect(mockRepository.removeItem).toHaveBeenCalledWith(
        mockSession.userId,
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('最後の商品を削除すると空カートになる', async () => {
      // 1商品のみのカートを設定
      (mockRepository.findByUserId as any).mockResolvedValue(mockCartWithSingleItem);
      
      // 削除後は空カート
      const emptyCart = {
        ...mockCartWithSingleItem,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
      (mockRepository.removeItem as any).mockResolvedValue(emptyCart);

      const result = await removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440000' },
        context
      );

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('存在しない商品IDを削除しようとするとエラーになる', async () => {
      (mockRepository.findByUserId as any).mockResolvedValue(mockCartWithMultipleItems);

      await expect(
        removeFromCart({ productId: '550e8400-e29b-41d4-a716-446655440999' }, context)
      ).rejects.toThrow('カート内に商品が見つかりません');
    });

    it('空のカートから削除しようとするとエラーになる', async () => {
      (mockRepository.findByUserId as any).mockResolvedValue(null);

      await expect(
        removeFromCart({ productId: '550e8400-e29b-41d4-a716-446655440000' }, context)
      ).rejects.toThrow('カート内に商品が見つかりません');
    });

    it('未ログインの場合はAuthorizationErrorが発生する', async () => {
      const unauthorizedContext = {
        ...context,
        session: { ...mockSession, role: 'guest' as const },
      };

      await expect(
        removeFromCart({ productId: '550e8400-e29b-41d4-a716-446655440000' }, unauthorizedContext)
      ).rejects.toThrow();
    });

    it('不正な商品IDはバリデーションエラーになる', async () => {
      await expect(
        removeFromCart({ productId: '' }, context)
      ).rejects.toThrow();

      await expect(
        removeFromCart({ productId: null }, context)
      ).rejects.toThrow();

      await expect(
        removeFromCart({}, context)
      ).rejects.toThrow();
    });
  });
});

/**
 * User Story 3: カート内の数量を変更する - Usecase Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
import { updateCartItem } from '@/domains/cart/api/usecases';

describe('User Story 3: カート内の数量を変更する - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/product1.jpg',
    stock: 10,
  };

  const mockCartWithItem: Cart = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: mockSession.userId,
    items: [
      {
        productId: mockProduct.id,
        productName: mockProduct.name,
        price: mockProduct.price,
        imageUrl: mockProduct.imageUrl,
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

  beforeEach(() => {
    mockRepository = {
      findByUserId: async () => mockCartWithItem,
      create: async () => { throw new Error('Not implemented'); },
      addItem: async () => { throw new Error('Not implemented'); },
      updateItemQuantity: async (userId, productId, quantity) => ({
        ...mockCartWithItem,
        items: [{
          ...mockCartWithItem.items[0],
          quantity,
        }],
        subtotal: mockProduct.price * quantity,
        tax: Math.floor(mockProduct.price * quantity * 0.1),
        total: mockProduct.price * quantity + Math.floor(mockProduct.price * quantity * 0.1),
        itemCount: quantity,
        updatedAt: new Date(),
      }),
      removeItem: async () => { throw new Error('Not implemented'); },
    };

    mockProductFetcher = {
      findById: async (id) => id === mockProduct.id ? mockProduct : null,
    };

    context = {
      session: mockSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('正常系', () => {
    it('カート内商品の数量を更新できる', async () => {
      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 5 },
        context
      );

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(5);
      expect(result.subtotal).toBe(5000); // 1000 * 5
      expect(result.tax).toBe(500); // Math.floor(5000 * 0.1)
      expect(result.total).toBe(5500); // 5000 + 500
    });

    it('数量を1に変更できる', async () => {
      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 1 },
        context
      );

      expect(result.items[0].quantity).toBe(1);
      expect(result.subtotal).toBe(1000);
      expect(result.tax).toBe(100);
      expect(result.total).toBe(1100);
    });

    it('数量を最大値99に変更できる', async () => {
      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 99 },
        context
      );

      expect(result.items[0].quantity).toBe(99);
      expect(result.subtotal).toBe(99000);
    });
  });

  describe('在庫チェック', () => {
    it('在庫数を超える数量には更新できない', async () => {
      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 11 }, context)
      ).rejects.toThrow('在庫数を超えています。在庫数: 10');
    });

    it('在庫数ちょうどには更新できる', async () => {
      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 10 },
        context
      );

      expect(result.items[0].quantity).toBe(10);
    });

    it('商品に在庫情報がない場合は制限なし', async () => {
      const productWithoutStock = { ...mockProduct, stock: undefined };
      mockProductFetcher.findById = async () => productWithoutStock;

      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 50 },
        context
      );

      expect(result.items[0].quantity).toBe(50);
    });
  });

  describe('エラー処理', () => {
    it('カートが存在しない場合はCartItemNotFoundErrorが発生する', async () => {
      mockRepository.findByUserId = async () => null;

      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 3 }, context)
      ).rejects.toThrow('カート内に商品が見つかりません');
    });

    it('カート内に該当商品がない場合はCartItemNotFoundErrorが発生する', async () => {
      const cartWithoutItem = {
        ...mockCartWithItem,
        items: [],
      };
      mockRepository.findByUserId = async () => cartWithoutItem;

      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 3 }, context)
      ).rejects.toThrow('カート内に商品が見つかりません');
    });

    it('存在しない商品IDでも在庫チェック時にエラーが発生する', async () => {
      mockProductFetcher.findById = async () => null;

      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 5 }, context)
      ).rejects.toThrow(); // StockError or other validation error
    });
  });

  describe('バリデーション', () => {
    it('数量が0以下はバリデーションエラーになる', async () => {
      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 0 }, context)
      ).rejects.toThrow();
    });

    it('数量が100以上はバリデーションエラーになる', async () => {
      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 100 }, context)
      ).rejects.toThrow();
    });

    it('不正なproductId形式はバリデーションエラーになる', async () => {
      await expect(
        updateCartItem({ productId: 'invalid-uuid', quantity: 3 }, context)
      ).rejects.toThrow();
    });
  });

  describe('認証・認可', () => {
    it('未認証ユーザーはエラーになる', async () => {
      const unauthenticatedContext = {
        ...context,
        session: { ...mockSession, role: 'guest' as any },
      };

      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 3 }, unauthenticatedContext)
      ).rejects.toThrow();
    });

    it('admin権限でも使用できる', async () => {
      const adminContext = {
        ...context,
        session: { ...mockSession, role: 'admin' as const },
      };

      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 3 },
        adminContext
      );

      expect(result.items[0].quantity).toBe(3);
    });
  });

  describe('税・合計の再計算', () => {
    it('数量変更後に税・合計が正しく再計算される', async () => {
      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 7 },
        context
      );

      expect(result.subtotal).toBe(7000); // 1000 * 7
      expect(result.tax).toBe(700); // Math.floor(7000 * 0.1)
      expect(result.total).toBe(7700); // 7000 + 700
      expect(result.itemCount).toBe(7);
    });

    it('端数のある金額でも税計算が正しく行われる', async () => {
      // 価格を333にして端数テスト
      const productWithOddPrice = { ...mockProduct, price: 333 };
      mockProductFetcher.findById = async () => productWithOddPrice;
      
      const cartWithOddPrice = {
        ...mockCartWithItem,
        items: [{
          ...mockCartWithItem.items[0],
          price: 333,
        }],
      };
      mockRepository.findByUserId = async () => cartWithOddPrice;
      mockRepository.updateItemQuantity = async (userId, productId, quantity) => ({
        ...cartWithOddPrice,
        items: [{
          ...cartWithOddPrice.items[0],
          quantity,
        }],
        subtotal: 333 * quantity,
        tax: Math.floor(333 * quantity * 0.1),
        total: 333 * quantity + Math.floor(333 * quantity * 0.1),
        itemCount: quantity,
      });

      const result = await updateCartItem(
        { productId: mockProduct.id, quantity: 3 },
        context
      );

      expect(result.subtotal).toBe(999); // 333 * 3
      expect(result.tax).toBe(99); // Math.floor(999 * 0.1)
    });
  });
});

/**
 * User Story 5: 未ログイン時のカート追加リダイレクト - Usecase Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 5: 未ログイン時のカート追加リダイレクト - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/product1.jpg',
    stock: 10,
  };

  const unauthenticatedSession = {
    userId: '',
    role: 'guest' as const,
    name: '',
  };

  const authenticatedSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  beforeEach(() => {
    mockRepository = {
      findByUserId: async () => null,
      create: async (userId) => ({
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      addItem: async (userId, item) => ({
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId,
        items: [{
          ...item,
          addedAt: new Date(),
        }],
        subtotal: item.price * item.quantity,
        tax: Math.floor(item.price * item.quantity * 0.1),
        total: item.price * item.quantity + Math.floor(item.price * item.quantity * 0.1),
        itemCount: item.quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateItemQuantity: async () => { throw new Error('Not implemented'); },
      removeItem: async () => { throw new Error('Not implemented'); },
    };

    mockProductFetcher = {
      findById: async (id) => id === mockProduct.id ? mockProduct : null,
    };

    context = {
      session: unauthenticatedSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('認証チェック', () => {
    it('未認証時のaddToCartは AuthenticationError を投げる', async () => {
      await expect(
        addToCart({ productId: mockProduct.id, quantity: 1 }, context)
      ).rejects.toThrow('Authentication required');
    });

    it('未認証時のgetCartは AuthenticationError を投げる', async () => {
      await expect(
        getCart({}, context)
      ).rejects.toThrow('Authentication required');
    });

    it('未認証時のupdateCartItemは AuthenticationError を投げる', async () => {
      await expect(
        updateCartItem({ productId: mockProduct.id, quantity: 2 }, context)
      ).rejects.toThrow('Authentication required');
    });

    it('未認証時のremoveFromCartは AuthenticationError を投げる', async () => {
      await expect(
        removeFromCart({ productId: mockProduct.id }, context)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('認証後の正常動作', () => {
    it('認証済みユーザーは正常にカート操作できる', async () => {
      const authenticatedContext = {
        ...context,
        session: authenticatedSession,
      };

      const result = await addToCart(
        { productId: mockProduct.id, quantity: 1 },
        authenticatedContext
      );

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(mockProduct.id);
    });

    it('roleがbuyerでない場合も AuthenticationError を投げる', async () => {
      const invalidRoleContext = {
        ...context,
        session: { ...authenticatedSession, role: 'seller' as any },
      };

      await expect(
        addToCart({ productId: mockProduct.id, quantity: 1 }, invalidRoleContext)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('エラーの詳細情報', () => {
    it('AuthenticationErrorはHTTPステータス401に対応する', async () => {
      try {
        await addToCart({ productId: mockProduct.id, quantity: 1 }, context);
        fail('Expected AuthenticationError to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Authentication required');
        expect(error.status).toBe(401);
        expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      }
    });

    it('AuthenticationErrorはログインリダイレクト用の情報を含む', async () => {
      try {
        await addToCart({ productId: mockProduct.id, quantity: 1 }, context);
        fail('Expected AuthenticationError to be thrown');
      } catch (error: any) {
        expect(error.shouldRedirectToLogin).toBe(true);
        expect(error.loginUrl).toBe('/login');
      }
    });
  });
});

/**
 * User Story 6: カート内容の永続化 - Usecase Tests
 * TDD Red Phase - これらのテストは最初は FAIL する必要がある
 */
describe('User Story 6: カート内容の永続化 - Usecase Tests', () => {
  let mockRepository: CartRepository;
  let mockProductFetcher: ProductFetcher;
  let context: CartContext;

  const mockSession = {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'buyer' as const,
    name: 'Test User',
  };

  const mockPersistedCart: Cart = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: mockSession.userId,
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
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

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    };

    mockProductFetcher = {
      findById: vi.fn(),
    };

    context = {
      session: mockSession,
      repository: mockRepository,
      productFetcher: mockProductFetcher,
    };
  });

  describe('永続化の検証', () => {
    it('カート追加後にgetCartで同じデータが取得される', async () => {
      // カート追加をモック
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);

      const result = await getCart({}, context);

      expect(result).toEqual({
        ...mockPersistedCart,
        tax: 200,
        total: 2200,
      });
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockSession.userId);
    });

    it('ページリロード相当のシナリオでカートが保持される', async () => {
      // 初回取得 - カートあり
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);

      const firstCall = await getCart({}, context);
      
      // 2回目取得（ページリロード相当） - 同じカートが取得される
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);
      
      const secondCall = await getCart({}, context);

      expect(firstCall.items).toEqual(secondCall.items);
      expect(firstCall.subtotal).toBe(secondCall.subtotal);
      expect(firstCall.itemCount).toBe(secondCall.itemCount);
    });

    it('セッション間でのカート永続化が機能する', async () => {
      // 最初のセッション: カートを作成
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);
      
      const result = await getCart({}, context);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(2);
      
      // 新しいセッション（同じユーザー）: 永続化されたカートが取得される
      const newContext = {
        ...context,
        session: { ...mockSession }, // 新しいセッション
      };
      
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);
      
      const persistedResult = await getCart({}, newContext);
      
      expect(persistedResult.items).toEqual(result.items);
      expect(persistedResult.subtotal).toBe(result.subtotal);
    });

    it('インメモリストアが正しく動作しているかの間接確認', async () => {
      // リポジトリメソッドが適切に呼び出されることを確認
      (mockRepository.findByUserId as any).mockResolvedValue(mockPersistedCart);
      (mockRepository.addItem as any).mockResolvedValue(mockPersistedCart);

      // カート取得
      await getCart({}, context);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockSession.userId);

      // カート追加（インメモリ永続化のトリガー）
      const mockProduct = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: '新商品',
        price: 500,
        imageUrl: 'https://example.com/new-product.jpg',
        stock: 5,
      };
      
      mockProductFetcher.findById = async () => mockProduct;
      
      await addToCart({ productId: mockProduct.id, quantity: 1 }, context);
      
      // リポジトリの永続化メソッドが呼び出されることを確認
      expect(mockRepository.addItem).toHaveBeenCalledWith(
        mockSession.userId, 
        expect.objectContaining({
          productId: mockProduct.id,
          quantity: 1,
        })
      );
    });
  });

  describe('永続化の制限事項', () => {
    it('異なるユーザーのカートは分離されている', async () => {
      const anotherUserId = '550e8400-e29b-41d4-a716-446655440999';
      const anotherUserContext = {
        ...context,
        session: { ...mockSession, userId: anotherUserId },
      };

      // ユーザー1のカートは存在
      (mockRepository.findByUserId as any).mockImplementation(async (userId: string) => {
        if (userId === mockSession.userId) return mockPersistedCart;
        if (userId === anotherUserId) return null;
        return null;
      });

      // ユーザー1: カートあり
      const user1Cart = await getCart({}, context);
      expect(user1Cart.items).toHaveLength(1);

      // ユーザー2: カートなし（新規作成）
      (mockRepository.create as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: anotherUserId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user2Cart = await getCart({}, anotherUserContext);
      expect(user2Cart.items).toHaveLength(0);

      // 分離されていることを確認
      expect(user1Cart.items).not.toEqual(user2Cart.items);
    });
  });
});