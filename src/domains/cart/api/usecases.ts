/**
 * Cart ドメイン - ユースケース
 * カート関連のビジネスロジック
 */
import type { SessionData } from '@/foundation/auth/session';
import { authorize, AuthorizationError, AuthenticationError } from '@/foundation/auth/authorize';
import { validate, ValidationError } from '@/foundation/validation/runtime';
import {
  GetCartInputSchema,
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
  RemoveFromCartInputSchema,
  type Cart,
  type CartItem,
  type GetCartOutput,
  type AddToCartInput,
  type AddToCartOutput,
  type UpdateCartItemInput,
  type UpdateCartItemOutput,
  type RemoveFromCartInput,
  type RemoveFromCartOutput,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';

// 既存の外部参照を維持するための再エクスポート
export type { CartRepository, ProductFetcher } from '@/contracts/cart';
export { AuthenticationError } from '@/foundation/auth/authorize';

// ─────────────────────────────────────────────────────────────────
// コンテキスト
// ─────────────────────────────────────────────────────────────────

export interface CartContext {
  session: SessionData | null;
  repository: CartRepository;
  productFetcher: ProductFetcher;
}

// ─────────────────────────────────────────────────────────────────
// エラー
// ─────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor(productId: string) {
    super(`カート内に商品が見つかりません: ${productId}`);
    this.name = 'CartItemNotFoundError';
  }
}

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockError';
  }
}

// ─────────────────────────────────────────────────────────────────
// 税計算ヘルパー
// ─────────────────────────────────────────────────────────────────

function calculateTaxAndTotal(subtotal: number): { tax: number; total: number } {
  const tax = Math.floor(subtotal * 0.1); // 10%, 端数切り捨て
  const total = subtotal + tax;
  return { tax, total };
}

function enrichCartWithTax(cart: Cart): Cart {
  const { tax, total } = calculateTaxAndTotal(cart.subtotal);
  return {
    ...cart,
    tax,
    total,
  };
}

// ─────────────────────────────────────────────────────────────────
// カート取得
// ─────────────────────────────────────────────────────────────────

export async function getCart(
  rawInput: unknown,
  context: CartContext
): Promise<GetCartOutput> {
  authorize(context.session, 'buyer');
  validate(GetCartInputSchema, rawInput);

  // session is guaranteed to be non-null after authorize check
  const session = context.session!;
  let cart = await context.repository.findByUserId(session.userId);

  if (!cart) {
    cart = await context.repository.create(session.userId);
  }

  return enrichCartWithTax(cart);
}

// ─────────────────────────────────────────────────────────────────
// カート追加
// ─────────────────────────────────────────────────────────────────

export async function addToCart(
  rawInput: unknown,
  context: CartContext
): Promise<AddToCartOutput> {
  authorize(context.session, 'buyer');

  const input = validate(AddToCartInputSchema, rawInput);

  // session is guaranteed to be non-null after authorize check
  const session = context.session!;

  // 商品存在確認
  const product = await context.productFetcher.findById(input.productId);
  if (!product) {
    throw new NotFoundError('商品が見つかりません');
  }

  // 在庫チェック
  if (product.stock !== undefined && product.stock <= 0) {
    throw new StockError('在庫切れです');
  }

  // 新規追加数量が在庫を超えるかチェック
  if (product.stock !== undefined && (input.quantity ?? 1) > product.stock) {
    throw new StockError(`在庫数を超えています。在庫数: ${product.stock}`);
  }

  // 既存カート確認して同一商品の場合は数量制限チェック
  const existingCart = await context.repository.findByUserId(session.userId);
  if (existingCart) {
    const existingItem = existingCart.items.find(item => item.productId === input.productId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + (input.quantity ?? 1);
      if (product.stock !== undefined && newQuantity > product.stock) {
        throw new StockError(`在庫数を超えています。在庫数: ${product.stock}`);
      }
    }
  }

  const cart = await context.repository.addItem(session.userId, {
    productId: product.id,
    productName: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    quantity: input.quantity ?? 1,
  });

  return enrichCartWithTax(cart);
}

// ─────────────────────────────────────────────────────────────────
// カート更新
// ─────────────────────────────────────────────────────────────────

export async function updateCartItem(
  rawInput: unknown,
  context: CartContext
): Promise<UpdateCartItemOutput> {
  authorize(context.session, 'buyer');

  const input = validate(UpdateCartItemInputSchema, rawInput);

  // session is guaranteed to be non-null after authorize check
  const session = context.session!;

  const existingCart = await context.repository.findByUserId(session.userId);
  if (!existingCart) {
    throw new CartItemNotFoundError(input.productId);
  }

  const itemExists = existingCart.items.some((item) => item.productId === input.productId);
  if (!itemExists) {
    throw new CartItemNotFoundError(input.productId);
  }

  // 在庫チェック
  const product = await context.productFetcher.findById(input.productId);
  if (!product) {
    throw new NotFoundError('商品が見つかりません');
  }
  if (product.stock !== undefined && input.quantity > product.stock) {
    throw new StockError(`在庫数を超えています。在庫数: ${product.stock}`);
  }

  const cart = await context.repository.updateItemQuantity(
    session.userId,
    input.productId,
    input.quantity
  );

  return enrichCartWithTax(cart);
}

// ─────────────────────────────────────────────────────────────────
// カート削除
// ─────────────────────────────────────────────────────────────────

export async function removeFromCart(
  rawInput: unknown,
  context: CartContext
): Promise<RemoveFromCartOutput> {
  authorize(context.session, 'buyer');

  const input = validate(RemoveFromCartInputSchema, rawInput);

  // session is guaranteed to be non-null after authorize check
  const session = context.session!;

  const existingCart = await context.repository.findByUserId(session.userId);
  if (!existingCart) {
    throw new CartItemNotFoundError(input.productId);
  }

  const itemExists = existingCart.items.some((item) => item.productId === input.productId);
  if (!itemExists) {
    throw new CartItemNotFoundError(input.productId);
  }

  const cart = await context.repository.removeItem(session.userId, input.productId);

  return enrichCartWithTax(cart);
}