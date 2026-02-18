'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetail } from '@/domains/catalog/ui';
import type { Product } from '@/contracts/catalog';

interface ApiResponse {
  success: boolean;
  data: Product;
  error?: { code: string; message: string };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/catalog/products/${id}`);
      const data: ApiResponse = await res.json();
      if (res.ok && data.success) {
        setProduct(data.data);
      } else {
        setError(data.error?.message || '商品が見つかりません');
      }
    } catch {
      setError('商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleBack = () => {
    router.push('/catalog');
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      // cart API may not be implemented yet
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductDetail
        product={product}
        isLoading={isLoading}
        error={error}
        onBack={handleBack}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
