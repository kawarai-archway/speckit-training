'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductList } from '@/domains/catalog/ui';
import type { Product } from '@/contracts/catalog';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

const ITEMS_PER_PAGE = 12;

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const fetchProducts = useCallback(async (currentPage: number, searchKeyword: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      let url = `/api/catalog/products?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
      if (searchKeyword) {
        url += `&keyword=${encodeURIComponent(searchKeyword)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('商品の取得に失敗しました');
      }
      const data: ApiResponse = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      } else {
        throw new Error('商品の取得に失敗しました');
      }
    } catch {
      setError('商品の取得に失敗しました');
      setProducts([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, keyword);
  }, [page, keyword, fetchProducts]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  };

  const handleRetry = () => {
    fetchProducts(page, keyword);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>
      <ProductList
        products={products}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRetry={handleRetry}
        onSearch={handleSearch}
        searchKeyword={keyword}
      />
    </div>
  );
}
