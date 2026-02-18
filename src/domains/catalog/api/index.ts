/**
 * Catalog ドメイン - API エクスポート
 * 本番ユースケースを re-export する。未実装の操作は NotImplementedError をスローする。
 */

/**
 * ドメイン未実装エラー
 */
export class NotImplementedError extends Error {
  constructor(domain: string, operation: string) {
    super(`ドメイン未実装: ${domain}.${operation}`);
    this.name = 'NotImplementedError';
  }
}

// 本番ユースケース
export { getProducts, getProductById, NotFoundError } from './usecases';

// 未実装操作（スタブ維持）
export function createProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'createProduct');
}

export function updateProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'updateProduct');
}

export function deleteProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'deleteProduct');
}
