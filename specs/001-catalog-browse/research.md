# リサーチ: カタログ閲覧機能

**Branch**: `001-catalog-browse` | **Date**: 2026-02-13

## 調査事項

### 1. Product エンティティの stock フィールド追加

**決定**: `ProductSchema` に `stock` フィールド（整数、0以上、デフォルト0）を追加する

**根拠**:
- spec.md の FR-004（在庫切れ表示）および FR-006（在庫数表示）が stock フィールドを要求
- 憲章原則 V: 「spec.md が要求するフィールドが contracts にない場合は拡張する」
- 憲章品質基準（サンプルコード保護）: 新規フィールドは `.default()` を付与してサンプル互換性を維持

**検討した代替案**:
- `inventory` という名前 → `stock` がより簡潔でEC業界で一般的
- boolean の `inStock` → 在庫数の表示要件（FR-006）を満たせない

### 2. 検索（keyword）パラメータの追加

**決定**: `GetProductsInputSchema` に `keyword` フィールド（オプション、文字列）を追加し、`ProductRepository.findAll` に `keyword` パラメータを追加する

**根拠**:
- spec.md の FR-010（キーワード検索）が検索機能を要求
- 検索対象: 商品名（name）および説明文（description）の部分一致
- インメモリストアでの実装: `String.includes()` による大文字小文字区別なし検索

**検討した代替案**:
- 全文検索エンジン（Elasticsearch等） → インメモリストアのプロジェクトでは過剰
- 正規表現検索 → 部分一致で十分、ReDoS リスクも回避

### 3. ページネーションのデフォルト件数変更

**決定**: 本番 Catalog ドメインのデフォルト limit を 12 に設定する。contracts の `GetProductsInputSchema` のデフォルト値（20）は変更しない

**根拠**:
- spec.md の FR-002 は 1 ページあたり 12 件を要求
- contracts のデフォルト（20）はサンプルコードが依存しているため変更不可（サンプルコード保護）
- 本番のカタログページ側で `limit=12` を明示的に指定して API を呼び出す

**検討した代替案**:
- contracts のデフォルトを 12 に変更 → サンプルテストが 20 件前提のため破損リスク

### 4. シードデータの画像 URL

**決定**: Unsplash の高品質画像 URL を使用する（`https://images.unsplash.com/photo-{id}?w=400&h=400&fit=crop`）

**根拠**:
- ユーザー指示: 「商品画像には Unsplash の高品質な画像を URL で指定する」
- 憲章品質基準（外部リソース検証）: 実装時に各 URL に HTTP リクエストを送信し存在を確認する。plan 時点では検証予定とし、検証済みとしない
- ベースデータ（BASE_PRODUCTS）の画像 URL は picsum.photos を使用中 → 変更不可（サンプルコード保護）
- 拡張データ（EXTENSION_PRODUCTS）で Unsplash URL を使用する

**検討した代替案**:
- Lorem Picsum（picsum.photos） → ベースデータで使用済み、Unsplash のほうが商品らしい高品質画像
- ローカル画像ファイル → ユーザーが明示的に除外

### 5. テストデータ件数

**決定**: EXTENSION_PRODUCTS に 20 件の本番シードデータを追加する（ベースの published 5 件 + 拡張 20 件 = 計 25 件で2ページ以上）

**根拠**:
- ユーザー指示: 「ページングの確認ができるように十分な数のテストデータを用意する」
- 12 件/ページ × 3 ページ目以降も確認可能な件数
- ベース published 5 件 + 拡張 20 件 = 25 件 → 3 ページ（12 + 12 + 1）
- 在庫切れ商品（stock: 0）を数件含め、画像なし商品も 1 件含める

**検討した代替案**:
- 50 件 → ページング検証には過剰
- 13 件（2 ページ分） → 3 ページ以上で境界値テストが可能な 25 件が適切

### 6. 「カートに追加」ボタンの実装範囲

**決定**: UI にボタンを配置し、Cart ドメインの API（`/api/cart`）を呼び出す処理まで実装する。カート機能自体（カートドメインのユースケース）の実装はスコープ外

**根拠**:
- spec.md の FR-007: 「ボタン押下時は Cart ドメインの API を呼び出す（カート機能自体の実装は本スコープ外）」
- 既存の `src/contracts/cart.ts` に `AddToCartInputSchema` が定義済み
- Cart ドメインが未実装（NotImplementedError）の場合、API は 501 を返す → UI 側でエラーハンドリング

**検討した代替案**:
- ボタン配置のみ（API 呼び出しなし） → spec.md が API 呼び出しを要求
- Cart ドメインも同時実装 → スコープ外として明示的に除外

### 7. 認証不要アクセスの実装

**決定**: 既存の API Routes（`GET /api/catalog/products` および `GET /api/catalog/products/[id]`）は認証チェック不要で動作する仕組みが既に実装済み。session が null の場合は guest として扱い、published 商品のみ返却する

**根拠**:
- 既存 API Route: `const session = await getServerSession();` → session は null 許容
- サンプル usecase: session が null または buyer ロールの場合、status を 'published' に固定
- spec.md の FR-013: 「カタログ閲覧機能は認証不要でアクセス可能」
