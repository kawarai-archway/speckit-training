/**
 * Catalog ドメイン - UI コンポーネント単体テスト（本番）
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/domains/catalog/ui/ProductCard';
import { ProductList } from '@/domains/catalog/ui/ProductList';
import { ProductDetail } from '@/domains/catalog/ui/ProductDetail';
import { ProductSchema, type Product } from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return ProductSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: '商品の説明文です。',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────
// ProductCard - US1
// ─────────────────────────────────────────────────────────────────

describe('ProductCard', () => {
  describe('Given: 商品データ', () => {
    describe('When: カードを表示する', () => {
      it('Then: 商品名・価格・画像を表示する', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        expect(screen.getByText('テスト商品')).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });

      it('Then: 商品詳細へのリンクを持つ', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/catalog/${product.id}`);
      });
    });

    describe('When: 画像がない商品を表示する', () => {
      it('Then: プレースホルダー画像を表示する', () => {
        const product = createMockProduct({ imageUrl: undefined });
        render(<ProductCard product={product} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      });
    });

    describe('When: 在庫切れ商品を表示する', () => {
      it('Then: 「在庫切れ」ラベルを表示する', () => {
        const product = createMockProduct({ stock: 0 });
        render(<ProductCard product={product} />);

        expect(screen.getByText('在庫切れ')).toBeInTheDocument();
      });
    });

    describe('When: 在庫あり商品を表示する', () => {
      it('Then: 「在庫切れ」ラベルを表示しない', () => {
        const product = createMockProduct({ stock: 10 });
        render(<ProductCard product={product} />);

        expect(screen.queryByText('在庫切れ')).not.toBeInTheDocument();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList - US1
// ─────────────────────────────────────────────────────────────────

describe('ProductList', () => {
  describe('Given: loading 状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<ProductList products={[]} isLoading={true} pagination={null} />);

        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: error 状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: エラー表示を出す', () => {
        render(
          <ProductList
            products={[]}
            isLoading={false}
            error="商品の取得に失敗しました"
            pagination={null}
          />
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('商品の取得に失敗しました')).toBeInTheDocument();
      });

      it('Then: リトライボタンを表示する', async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();

        render(
          <ProductList
            products={[]}
            isLoading={false}
            error="エラー"
            onRetry={onRetry}
            pagination={null}
          />
        );

        await user.click(screen.getByRole('button', { name: /再試行/i }));
        expect(onRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Given: empty 状態', () => {
    describe('When: 商品がない', () => {
      it('Then: 空状態メッセージを表示する', () => {
        render(<ProductList products={[]} isLoading={false} pagination={null} />);

        expect(screen.getByRole('status', { name: /データなし/i })).toBeInTheDocument();
        expect(screen.getByText(/商品がありません/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given: 商品データあり', () => {
    describe('When: リストを表示する', () => {
      it('Then: 商品カードをグリッド表示する', () => {
        const products = [
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440003', name: '商品C' }),
        ];
        const pagination = { page: 1, limit: 12, total: 3, totalPages: 1 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
        expect(screen.getByText('商品C')).toBeInTheDocument();
      });
    });

    describe('When: ページネーションがある', () => {
      it('Then: ページネーション情報を表示する', () => {
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByText(/全25件/)).toBeInTheDocument();
      });

      it('Then: 次ページボタンが動作する', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onPageChange={onPageChange}
          />
        );

        await user.click(screen.getByRole('button', { name: /次へ/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
      });

      it('Then: 最終ページでは次へボタンが無効', () => {
        const products = [createMockProduct()];
        const pagination = { page: 3, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByRole('button', { name: /次へ/i })).toBeDisabled();
      });

      it('Then: 1ページ目では前へボタンが無効', () => {
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 25, totalPages: 3 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByRole('button', { name: /前へ/i })).toBeDisabled();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductDetail - US2
// ─────────────────────────────────────────────────────────────────

describe('ProductDetail', () => {
  describe('Given: loading 状態', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<ProductDetail product={null} isLoading={true} />);

        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: error 状態', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: エラー表示を出す', () => {
        render(<ProductDetail product={null} isLoading={false} error="商品が見つかりません" />);

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('商品が見つかりません')).toBeInTheDocument();
      });
    });
  });

  describe('Given: 商品データあり', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: 商品情報を全て表示する', () => {
        const product = createMockProduct({ stock: 10 });
        render(<ProductDetail product={product} isLoading={false} />);

        expect(screen.getByRole('heading', { name: 'テスト商品' })).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByText('商品の説明文です。')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });

      it('Then: 在庫数を表示する', () => {
        const product = createMockProduct({ stock: 10 });
        render(<ProductDetail product={product} isLoading={false} />);

        expect(screen.getByText(/在庫: 10/)).toBeInTheDocument();
      });
    });

    describe('When: カートに追加ボタンをクリックする', () => {
      it('Then: onAddToCart コールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onAddToCart = vi.fn();
        const product = createMockProduct({ stock: 10 });

        render(
          <ProductDetail product={product} isLoading={false} onAddToCart={onAddToCart} />
        );

        await user.click(screen.getByRole('button', { name: /カートに追加/i }));
        expect(onAddToCart).toHaveBeenCalledWith(product.id);
      });
    });

    describe('When: 在庫切れ商品の場合', () => {
      it('Then: カートに追加ボタンが無効化される', () => {
        const product = createMockProduct({ stock: 0 });
        render(
          <ProductDetail product={product} isLoading={false} onAddToCart={vi.fn()} />
        );

        expect(screen.getByRole('button', { name: /カートに追加/i })).toBeDisabled();
      });
    });

    describe('When: 画像がない商品の場合', () => {
      it('Then: プレースホルダー画像を表示する', () => {
        const product = createMockProduct({ imageUrl: undefined });
        render(<ProductDetail product={product} isLoading={false} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      });
    });

    describe('When: 戻るボタンをクリックする', () => {
      it('Then: onBack コールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const product = createMockProduct();

        render(<ProductDetail product={product} isLoading={false} onBack={onBack} />);

        await user.click(screen.getByRole('button', { name: /戻る/i }));
        expect(onBack).toHaveBeenCalled();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList 検索フィールド - US3
// ─────────────────────────────────────────────────────────────────

describe('ProductList (検索機能)', () => {
  describe('Given: 検索フィールドが表示される', () => {
    describe('When: 検索が有効になっている', () => {
      it('Then: 検索入力フィールドが表示される', () => {
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onSearch={vi.fn()}
          />
        );

        expect(screen.getByPlaceholderText(/検索/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given: キーワードを入力して検索する', () => {
    describe('When: 検索ボタンをクリックする', () => {
      it('Then: onSearch コールバックが呼ばれる', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onSearch={onSearch}
          />
        );

        const input = screen.getByPlaceholderText(/検索/i);
        await user.type(input, 'コットン');
        await user.click(screen.getByRole('button', { name: /検索/i }));

        expect(onSearch).toHaveBeenCalledWith('コットン');
      });
    });
  });

  describe('Given: 検索クリア', () => {
    describe('When: クリアボタンをクリックする', () => {
      it('Then: onSearch が空文字で呼ばれる', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onSearch={onSearch}
            searchKeyword="コットン"
          />
        );

        await user.click(screen.getByRole('button', { name: /クリア/i }));
        expect(onSearch).toHaveBeenCalledWith('');
      });
    });
  });

  describe('Given: 検索結果が0件', () => {
    describe('When: 該当商品がない', () => {
      it('Then: 「該当する商品がありません」メッセージを表示する', () => {
        render(
          <ProductList
            products={[]}
            isLoading={false}
            pagination={null}
            onSearch={vi.fn()}
            searchKeyword="存在しないキーワード"
          />
        );

        expect(screen.getByText(/該当する商品がありません/i)).toBeInTheDocument();
      });
    });
  });
});
