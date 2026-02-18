/**
 * Cart ドメイン - API 実装
 * 本番実装。ユースケース関数を提供する。
 */

export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  NotFoundError,
  CartItemNotFoundError,
  StockError,
  type CartContext,
  type CartRepository,
  type ProductFetcher,
} from './usecases';
