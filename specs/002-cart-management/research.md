# リサーチ: カート管理機能

**ブランチ**: `002-cart-management` | **日付**: 2026-02-18

## 1. 既存インフラストラクチャの状態

### 決定: 既存の基盤をそのまま活用する

**根拠**: カート機能に必要なインフラストラクチャの大部分がすでに実装済み。

**調査結果**:

| レイヤー | ファイル | 状態 |
|---------|---------|------|
| コントラクト | `src/contracts/cart.ts` | Cart, CartItem, 全操作DTO、リポジトリIF定義済み |
| リポジトリ | `src/infrastructure/repositories/cart.ts` | インメモリ実装完了（HMR対応済み） |
| APIルート | `src/app/api/cart/route.ts` | GET のみ（カート取得） |
| APIルート | `src/app/api/cart/items/route.ts` | POST（カート追加） |
| APIルート | `src/app/api/cart/items/[productId]/route.ts` | PUT（数量更新）、DELETE（削除） |
| ドメインスタブ | `src/domains/cart/api/index.ts` | NotImplementedError スローのスタブ |
| ドメインスタブ | `src/domains/cart/ui/index.tsx` | 「ドメイン未実装」プレースホルダー |
| ページ | `src/app/(buyer)/cart/page.tsx` | CartView コンポーネント呼び出しのみ |
| レイアウト | `src/app/(buyer)/layout.tsx` | カートリンクがコメントアウト、cartUrl が `/` |
| サンプル | `src/samples/domains/cart/` | 参考実装あり（API + UI） |
| サンプルテスト | `src/samples/tests/*/domains/cart/` | 単体・統合・E2E テスト参考あり |

**代替案**: なし。憲法原則 V（スタブ置換パターン）に従い既存基盤を活用する。

---

## 2. コントラクト拡張の必要性

### 決定: CartSchema に `tax` / `total` フィールドを追加、ProductFetcher に `stock` を追加、数量に上限を追加

**根拠**: spec.md の要件を満たすために以下の拡張が必要。

**不足箇所と対応**:

| 要件 | 現在のコントラクト | 必要な変更 |
|------|-------------------|-----------|
| 消費税・総合計の表示（FR-010, FR-011） | CartSchema に tax/total なし | `tax`, `total` を optional + default(0) で追加 |
| 在庫数チェック（FR-003, FR-013, FR-014） | ProductFetcher に stock なし | `stock` フィールドを追加 |
| 数量範囲制限（FR-013: 1〜99） | quantity に min(1) のみ | max(99) を追加 |

**サンプルコード保護**:
- 新規フィールドは `.optional().default(0)` を付与（憲章品質基準に準拠）
- ProductFetcher の stock は `stock?: number` でオプショナル
- 既存のサンプルコードは変更なしで動作継続

**代替案検討**:
- 税計算を UI 層のみで行う → 却下。サーバー側で計算すべきビジネスロジックであり、API レスポンスに含めることで一貫性を確保
- 別の Response 型を定義する → 却下。既存パターンと乖離し複雑化

---

## 3. 商品詳細ページの add-to-cart API URL

### 決定: `/api/cart` → `/api/cart/items` に修正

**根拠**: 現在の `src/app/(buyer)/catalog/[id]/page.tsx` は `POST /api/cart` を呼んでいるが、POST ハンドラは `/api/cart/items/route.ts` に定義されている。`/api/cart/route.ts` は GET のみ。

**対応**: handleAddToCart 関数の URL を `/api/cart/items` に修正する。

---

## 4. 未ログイン時のリダイレクトパターン

### 決定: クライアントサイドでセッションチェック後リダイレクト

**根拠**: 既存パターン分析の結果。

**調査結果**:
- Buyer レイアウトは `/api/auth/session` を呼んでセッション有無を確認
- API ルートは `getServerSession()` で認証チェックし、未認証時は 401 を返却
- ログインページは `/login` に配置
- リダイレクト元の保持は `returnTo` クエリパラメータで実現

**実装方針**:
- カート操作の API 呼び出しで 401 が返った場合、`/login?returnTo={現在のURL}` にリダイレクト
- ログインページからのリダイレクト復帰は既存の認証フローに依存

---

## 5. 消費税計算ロジック

### 決定: ドメインユースケース層で計算し、API レスポンスに含める

**根拠**: spec.md の要件。

**計算式**:
- `tax = Math.floor(subtotal * 0.1)` （商品合計に対して10%、端数切り捨て）
- `total = subtotal + tax`
- 商品ごとではなく合計金額に対して一括計算

**代替案**: UI 層で計算 → 却下。ビジネスルールはドメイン層に配置すべき。

---

## 6. 確認ダイアログのパターン

### 決定: テンプレートの ConfirmDialog コンポーネントを使用

**根拠**: `src/templates/ui/components/dialog/ConfirmDialog` が存在。憲章原則 IV（共通 UI コンポーネントの利用）に準拠。

---

## 7. カートアイコン件数更新パターン

### 決定: 既存の `cart-updated` カスタムイベントパターンを活用

**根拠**: Buyer レイアウトはすでに `cart-updated` イベントをリスンしてカート件数を再取得する仕組みが実装済み。

**実装方針**: カート操作成功時に `window.dispatchEvent(new Event('cart-updated'))` を発火する。

---

## 8. テスト配置

### 決定: 憲章のテスト配置規約に準拠

| テスト種別 | 配置先 |
|-----------|--------|
| ユースケース単体テスト | `tests/unit/domains/cart/usecase.test.ts` |
| UI コンポーネント単体テスト | `tests/unit/domains/cart/ui.test.tsx` |
| API 統合テスト | `tests/integration/domains/cart/api.test.ts` |
| E2E テスト | `tests/e2e/cart-buyer-flow.spec.ts` |
