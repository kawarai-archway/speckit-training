'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartView } from '@/domains/cart/ui';
import type { Cart } from '@/contracts/cart';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const res = await fetch('/api/cart');
      const data = await res.json();

      if (res.ok && data.success) {
        setCart(data.data);
      } else if (res.status === 401) {
        // 未認証の場合はログインページにリダイレクト
        window.location.href = `/login?returnTo=${encodeURIComponent('/cart')}`;
        return;
      } else {
        setError(data.error?.message || 'カートの読み込みに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCart(data.data);
        // カート更新イベントを発火
        window.dispatchEvent(new Event('cart-updated'));
      } else if (res.status === 409) {
        setError(data.error?.message || '在庫数を超えています');
      } else {
        setError(data.error?.message || '数量の更新に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    }
  }, []);

  const handleRemove = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCart(data.data);
        // カート更新イベントを発火
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        setError(data.error?.message || '商品の削除に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    }
  }, []);

  const handleCheckout = useCallback(() => {
    // 注文機能は未実装
    alert('注文機能は未実装です');
  }, []);

  // カート更新イベントを監視
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [fetchCart]);

  // 初回読み込み
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-base-900">カート</h1>
      <CartView
        cart={cart}
        isLoading={isLoading}
        error={error}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
