'use client';

/**
 * ProductList コンポーネント（本番）
 * 商品一覧表示 — 12件/ページ、ページネーション付き、検索機能
 */
import React, { useState } from 'react';
import type { Product } from '@/contracts/catalog';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';
import { ProductCard } from './ProductCard';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error?: string;
  pagination: Pagination | null;
  onRetry?: () => void;
  onPageChange?: (page: number) => void;
  onAddToCart?: (productId: string) => void;
  onSearch?: (keyword: string) => void;
  searchKeyword?: string;
}

export function ProductList({
  products,
  isLoading,
  error,
  pagination,
  onRetry,
  onPageChange,
  onAddToCart,
  onSearch,
  searchKeyword,
}: ProductListProps) {
  const [inputValue, setInputValue] = useState(searchKeyword || '');

  if (isLoading) {
    return <Loading message="商品を読み込み中..." />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

  const handleSearch = () => {
    onSearch?.(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 検索中で0件の場合は検索結果なしメッセージ
  if (products.length === 0 && searchKeyword) {
    return (
      <div>
        {onSearch && (
          <SearchBar
            inputValue={inputValue}
            searchKeyword={searchKeyword}
            onInputChange={setInputValue}
            onSearch={handleSearch}
            onClear={handleClear}
            onKeyDown={handleKeyDown}
          />
        )}
        <Empty message="該当する商品がありません" />
      </div>
    );
  }

  if (products.length === 0) {
    return <Empty message="商品がありません" />;
  }

  return (
    <div>
      {/* 検索フィールド */}
      {onSearch && (
        <SearchBar
          inputValue={inputValue}
          searchKeyword={searchKeyword}
          onInputChange={setInputValue}
          onSearch={handleSearch}
          onClear={handleClear}
          onKeyDown={handleKeyDown}
        />
      )}

      {/* 商品グリッド */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>

      {/* ページネーション */}
      {pagination && (
        <div className="mt-8 flex items-center justify-between border-t border-base-900/10 pt-4">
          <p className="text-sm text-base-900/70">
            全{pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}〜
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              前へ
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBar({
  inputValue,
  searchKeyword,
  onInputChange,
  onSearch,
  onClear,
  onKeyDown,
}: {
  inputValue: string;
  searchKeyword?: string;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="mb-6 flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="商品名・説明文で検索"
        className="flex-1 rounded-md border border-base-900/20 px-4 py-2 text-sm focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
      />
      <button
        type="button"
        onClick={onSearch}
        className="rounded-md bg-base-900 px-4 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90"
      >
        検索
      </button>
      {searchKeyword && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100"
        >
          クリア
        </button>
      )}
    </div>
  );
}
