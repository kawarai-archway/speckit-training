/**
 * 認可（RBAC）基盤
 * ECサイト向けアーキテクチャ基盤 - 認可チェック
 */
import type { SessionData, Role } from './session';

/**
 * ロール階層（adminはbuyerを包含）
 */
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  buyer: ['buyer'],
  admin: ['admin', 'buyer'],
};

/**
 * 認証失敗エラー（401 Unauthorized）
 */
export class AuthenticationError extends Error {
  public readonly shouldRedirectToLogin = true;
  public readonly loginUrl = '/login';
  public readonly status = 401;
  public readonly code = 'AUTHENTICATION_REQUIRED';

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * 認可失敗エラー（403 Forbidden）
 */
export class ForbiddenError extends Error {
  constructor(message = 'この操作を行う権限がありません') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * 指定されたロールを持っているかチェックする
 * @param session セッションデータ
 * @param requiredRole 必要なロール
 * @returns ロールを持っている場合true
 */
export function hasRole(session: SessionData, requiredRole: Role): boolean {
  const userRoles = ROLE_HIERARCHY[session.role];
  return userRoles.includes(requiredRole);
}

/**
 * 認可チェックを行う
 * @param session セッションデータ（nullの場合は未認証）
 * @param requiredRole 必要なロール（単一または複数）
 * @throws AuthenticationError 未認証時（401）
 * @throws ForbiddenError 認可失敗時（403）
 */
export function authorize(
  session: SessionData | null,
  requiredRole: Role | Role[]
): void {
  if (!session) {
    throw new AuthenticationError('Authentication required');
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasRequiredRole = roles.some((role) => hasRole(session, role));

  if (!hasRequiredRole) {
    throw new ForbiddenError();
  }
}

/**
 * ユースケース向け認可デコレータ用のメタデータ
 */
export interface AuthorizeMetadata {
  /** 必要なロール */
  requiredRole: Role | Role[];
  /** 操作説明（監査ログ用） */
  action: string;
}

/**
 * ユースケース認可要件を定義するヘルパー
 */
export function defineAuthorization<T extends Record<string, AuthorizeMetadata>>(
  config: T
): T {
  return config;
}

// Re-export Role type
export type { Role };

/**
 * 認可エラー（AuthenticationError と ForbiddenError の統合）
 */
export const AuthorizationError = ForbiddenError;
export type AuthorizationError = ForbiddenError;

// Note: AuthenticationError is already exported above as a class
