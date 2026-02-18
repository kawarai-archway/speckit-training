# タスク: カタログ閲覧機能

**Input**: 設計ドキュメント `/specs/001-catalog-browse/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: MANDATORY — 憲章（原則 III）は TDD 必須。各ユーザーストーリーは Red → Green → Refactor → 検証 の 4 ステップで実装する。

**Organization**: タスクはユーザーストーリー単位でグループ化し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 対象ユーザーストーリー（US1, US2, US3）
- ファイルパスは正確に記載

## パス規約

- ソースコード: `src/` 配下
- 本番テスト: `tests/` 配下
- サンプルテスト: `src/samples/tests/` 配下（変更禁止）

---

## Phase 1: セットアップ

**目的**: contracts 拡張とシードデータ追加。全ユーザーストーリーの前提条件。

- [x] T001 ProductSchema に stock フィールドを追加する `src/contracts/catalog.ts`（`stock: z.number().int().min(0).default(0).optional()` を status の前に追加）
- [x] T002 GetProductsInputSchema に keyword パラメータを追加する `src/contracts/catalog.ts`（`keyword: z.string().max(200).optional()` を追加）
- [x] T003 ProductRepository インターフェースの findAll パラメータに `keyword?: string` を追加し、count メソッドの引数に `keyword?: string` を追加する `src/contracts/catalog.ts`

---

## Phase 2: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーが依存するインフラ拡張。

**⚠️ 重要**: 本フェーズが完了するまでユーザーストーリーの作業を開始できない。

- [x] T004 EXTENSION_PRODUCTS に 20 件の商品シードデータを追加する `src/infrastructure/repositories/product.ts`（Unsplash 画像 URL 使用、在庫切れ 3 件、画像なし 1 件を含む。外部 URL は HTTP リクエストで存在を検証し、失敗した URL は代替 URL に置換する）
- [x] T005 productRepository.findAll に keyword 検索ロジックを追加する `src/infrastructure/repositories/product.ts`（name と description の大文字小文字区別なし部分一致）
- [x] T006 productRepository.count に keyword フィルタ対応を追加する `src/infrastructure/repositories/product.ts`
- [x] T007 サンプルテストリグレッション確認（`pnpm test:unit:samples` && `pnpm test:integration:samples` を実行し、全テストパスを確認する）

**Checkpoint**: 基盤準備完了 — ユーザーストーリーの実装を開始可能

---

## Phase 3: ユーザーストーリー 1 — 商品一覧表示 (優先度: P1) 🎯 MVP

**ゴール**: 購入者がカタログページで公開商品の一覧をカード形式で閲覧できる。12件/ページ、ページネーション付き。在庫切れ表示、空リスト表示、プレースホルダー画像対応。

**独立テスト**: カタログページにアクセスし、商品カード 12 件表示、ページネーションで次ページ遷移、在庫切れ商品に「在庫切れ」ラベル表示、0 件時に「商品がありません」メッセージ表示を確認。

### Red: テスト作成 (MANDATORY)

> **テスト種別**: 以下の 4 種別を必ず含める。テストは実装前に書き、全て FAIL することを確認する。
> - ユースケース単体テスト: getProducts の正常系（ページネーション・ステータスフィルタ）・異常系
> - UI コンポーネント単体テスト: ProductCard（画像・名前・価格・在庫状況表示）、ProductList（グリッド・ページネーション・空表示・ローディング）
> - API 統合テスト: GET /api/catalog/products のパラメータ・レスポンス形式・認証不要確認
> - E2E テスト: カタログページ表示・ページネーション操作・在庫切れ表示

- [x] T008 [P] [US1] ユースケース単体テスト作成 `tests/unit/domains/catalog/usecase.test.ts`（getProducts: published のみ取得、ページネーション計算、ゲスト/buyer は published 固定、stock フィールド返却確認）
- [x] T009 [P] [US1] UI コンポーネント単体テスト作成 `tests/unit/domains/catalog/ui.test.tsx`（ProductCard: 画像・名前・価格・在庫切れラベル・プレースホルダー画像表示。ProductList: カードグリッド表示・ページネーションボタン・空状態メッセージ・ローディング・エラー状態）
- [x] T010 [P] [US1] API 統合テスト作成 `tests/integration/domains/catalog/api.test.ts`（GET /api/catalog/products: 正常レスポンス形式、page/limit パラメータ、認証なしで published のみ取得、stock フィールド含有確認）
- [x] T011 [P] [US1] E2E テスト作成 `tests/e2e/catalog.spec.ts`（カタログページ表示、商品カード 12 件表示、ページネーション操作、在庫切れラベル表示、0 件メッセージ表示）

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T012 [US1] getProducts ユースケースを実装する `src/domains/catalog/api/usecases.ts`（`src/samples/domains/catalog/api/usecases.ts` を参考に、ページネーション・ステータスフィルタ・stock 返却を実装）
- [x] T013 [US1] API エクスポートを本番ユースケースに置換する `src/domains/catalog/api/index.ts`（NotImplementedError スタブ → usecases.ts からの re-export に変更。getProducts, getProductById, createProduct, updateProduct, deleteProduct をエクスポート。createProduct/updateProduct/deleteProduct は NotImplementedError のまま維持）
- [x] T014 [US1] ProductCard コンポーネントを実装する `src/domains/catalog/ui/ProductCard.tsx`（`src/samples/domains/catalog/ui/ProductCard.tsx` を参考に、商品画像・名前・価格表示。stock === 0 で「在庫切れ」ラベル表示。imageUrl なしでプレースホルダー画像表示。`@/templates/ui/components/` の共通コンポーネントを使用）
- [x] T015 [US1] ProductList コンポーネントを実装する `src/domains/catalog/ui/ProductList.tsx`（`src/samples/domains/catalog/ui/ProductList.tsx` を参考に、カードグリッド + ページネーション。Loading/Error/Empty は `@/templates/ui/components/status/` を使用。onPageChange コールバックでページ切り替え。1 ページ 12 件）
- [x] T016 [US1] UI エクスポートを本番コンポーネントに置換する `src/domains/catalog/ui/index.tsx`（「ドメイン未実装」プレースホルダー → ProductList, ProductCard, ProductDetail のエクスポートに変更。ProductDetail は一旦プレースホルダーのまま維持）
- [x] T017 [US1] カタログ一覧ページを実装する `src/app/(buyer)/catalog/page.tsx`（API `/api/catalog/products?limit=12&page=X` からデータフェッチし ProductList に渡すクライアントコンポーネント）
- [x] T018 [US1] 購入者レイアウトの navLinks にカタログリンクを追加する `src/app/(buyer)/layout.tsx`（`{ href: '/catalog', label: '商品一覧' }` のコメントを解除）
- [x] T019 [US1] 全テスト実行・パス確認（`pnpm test:unit` && `pnpm test:integration` を実行し、Red テストが全てパスすることを検証。パス件数・失敗件数を記録）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T020 [US1] リファクタリングと全テストパス確認（当該ストーリーで変更したファイルのみ対象。重複排除・命名改善・責務分離を実施。`pnpm test:unit` && `pnpm test:integration` で全テストパスを検証）

### 検証: E2E テスト実行 + カバレッジ確認

> - E2E テスト実行結果を確認し、パス件数 0 件はエラーとする（実行スキップ不可）
> - カバレッジコマンドでカバレッジ 80% 以上を確認する
> - 外部 URL を含む場合は HTTP リクエストで 200 応答を確認する

- [x] T021 [US1] E2E テスト実行（証跡付き）+ カバレッジ確認（`pnpm test:e2e` を実行し、パス件数・失敗件数を記録。カバレッジ 80% 以上を確認。サンプルテストリグレッション確認: `pnpm test:unit:samples` && `pnpm test:integration:samples`）

**Checkpoint**: ユーザーストーリー 1 が独立して動作・テスト可能であることを確認

---

## Phase 4: ユーザーストーリー 2 — 商品詳細表示 (優先度: P2)

**ゴール**: 購入者が商品詳細画面で商品画像・名前・価格・説明文・在庫数を確認し、「カートに追加」ボタンを操作できる。在庫切れ時はボタン無効化。

**独立テスト**: 商品詳細ページに直接アクセスし、商品情報が正しく表示されること、カート追加ボタンの活性/非活性状態が在庫に応じて切り替わること、存在しない商品 ID でエラー表示されることを確認。

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T022 [P] [US2] ユースケース単体テスト追加 `tests/unit/domains/catalog/usecase.test.ts`（getProductById: 正常取得・NotFoundError・ゲストアクセス・stock フィールド返却確認）
- [x] T023 [P] [US2] UI コンポーネント単体テスト追加 `tests/unit/domains/catalog/ui.test.tsx`（ProductDetail: 画像・名前・価格・説明文・在庫数表示、カート追加ボタン有効/無効、プレースホルダー画像、戻るボタン）
- [x] T024 [P] [US2] API 統合テスト追加 `tests/integration/domains/catalog/api.test.ts`（GET /api/catalog/products/:id: 正常レスポンス、404 エラー、stock フィールド含有確認）
- [x] T025 [P] [US2] E2E テスト追加 `tests/e2e/catalog.spec.ts`（一覧→詳細遷移、詳細画面の情報表示、カート追加ボタン操作、在庫切れ時のボタン無効化、存在しない商品のエラー表示）

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T026 [US2] getProductById ユースケースを実装する `src/domains/catalog/api/usecases.ts`（ID 指定で商品取得、存在しない場合 NotFoundError、buyer/guest は published のみ）
- [x] T027 [US2] ProductDetail コンポーネントを実装する `src/domains/catalog/ui/ProductDetail.tsx`（`src/samples/domains/catalog/ui/ProductDetail.tsx` を参考に、商品画像・名前・価格・説明文・在庫数表示。stock === 0 で「カートに追加」ボタン disabled。imageUrl なしでプレースホルダー画像。onAddToCart コールバックで `/api/cart` に POST。`@/templates/ui/components/` の共通コンポーネントを使用）
- [x] T028 [US2] UI エクスポートの ProductDetail を本番コンポーネントに更新する `src/domains/catalog/ui/index.tsx`（ProductDetail のプレースホルダーを実コンポーネントのエクスポートに変更）
- [x] T029 [US2] 商品詳細ページを実装する `src/app/(buyer)/catalog/[id]/page.tsx`（API `/api/catalog/products/:id` からデータフェッチし ProductDetail に渡すクライアントコンポーネント。URL パラメータから id を取得）
- [x] T030 [US2] 全テスト実行・パス確認（`pnpm test:unit` && `pnpm test:integration` を実行し、Red テストが全てパスすることを検証。パス件数・失敗件数を記録）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T031 [US2] リファクタリングと全テストパス確認（当該ストーリーで変更したファイルのみ対象。`pnpm test:unit` && `pnpm test:integration` で全テストパスを検証）

### 検証: E2E テスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認

- [x] T032 [US2] E2E テスト実行（証跡付き）+ カバレッジ確認（`pnpm test:e2e` を実行し、パス件数・失敗件数を記録。カバレッジ 80% 以上を確認。サンプルテストリグレッション確認: `pnpm test:unit:samples` && `pnpm test:integration:samples`）

**Checkpoint**: ユーザーストーリー 1 と 2 が両方とも独立して動作することを確認

---

## Phase 5: ユーザーストーリー 3 — 商品検索 (優先度: P3)

**ゴール**: 購入者がキーワードで商品名・説明文を検索し、該当商品のみ表示される。該当なしの場合はメッセージ表示。クリアで全商品に戻る。

**独立テスト**: カタログページの検索フィールドにキーワードを入力し、該当商品のみ表示されること、該当なし時にメッセージ表示、クリアで全件表示に戻ることを確認。

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T033 [P] [US3] ユースケース単体テスト追加 `tests/unit/domains/catalog/usecase.test.ts`（getProducts + keyword: 名前部分一致、説明文部分一致、該当なし 0 件、空文字で全件、大文字小文字区別なし）
- [x] T034 [P] [US3] UI コンポーネント単体テスト追加 `tests/unit/domains/catalog/ui.test.tsx`（ProductList 検索フィールド: キーワード入力・検索実行・クリアボタン・「該当する商品がありません」メッセージ表示）
- [x] T035 [P] [US3] API 統合テスト追加 `tests/integration/domains/catalog/api.test.ts`（GET /api/catalog/products?keyword=X: キーワード検索結果、該当なし空配列、ページネーションとの組み合わせ）
- [x] T036 [P] [US3] E2E テスト追加 `tests/e2e/catalog.spec.ts`（検索フィールドにキーワード入力→該当商品表示、該当なしメッセージ、クリアで全件復帰）

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T037 [US3] getProducts ユースケースに keyword 検索ロジックを追加する `src/domains/catalog/api/usecases.ts`（keyword パラメータを repository.findAll に渡す）
- [x] T038 [US3] ProductList コンポーネントに検索フィールドを追加する `src/domains/catalog/ui/ProductList.tsx`（検索入力フィールド + 検索ボタン + クリアボタン。検索時は keyword パラメータ付きで API 呼び出し。「該当する商品がありません」メッセージ対応）
- [x] T039 [US3] カタログ一覧ページに検索パラメータ対応を追加する `src/app/(buyer)/catalog/page.tsx`（keyword クエリパラメータを API リクエストに含める）
- [x] T040 [US3] 全テスト実行・パス確認（`pnpm test:unit` && `pnpm test:integration` を実行し、Red テストが全てパスすることを検証。パス件数・失敗件数を記録）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T041 [US3] リファクタリングと全テストパス確認（当該ストーリーで変更したファイルのみ対象。`pnpm test:unit` && `pnpm test:integration` で全テストパスを検証）

### 検証: E2E テスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認

- [x] T042 [US3] E2E テスト実行（証跡付き）+ カバレッジ確認（`pnpm test:e2e` を実行し、パス件数・失敗件数を記録。カバレッジ 80% 以上を確認。サンプルテストリグレッション確認: `pnpm test:unit:samples` && `pnpm test:integration:samples`）

**Checkpoint**: 全ユーザーストーリーが独立して動作することを確認

---

## Phase 6: ポリッシュ & 横断的関心事

**目的**: 全ストーリーにまたがる改善と最終確認

- [x] T043 [P] サンプルテストリグレッション最終確認（`pnpm test:unit:samples` && `pnpm test:integration:samples` を実行し、全テストパスを確認）
- [x] T044 [P] TypeScript コンパイルエラー 0 件確認（`pnpm build` を実行）
- [x] T045 [P] ESLint エラー 0 件確認（`pnpm lint` を実行）
- [x] T046 quickstart.md 検証（`specs/001-catalog-browse/quickstart.md` の手順に従い動作確認を実施）

---

## 依存関係 & 実行順序

### フェーズ依存関係

- **セットアップ (Phase 1)**: 依存なし — 即座に開始可能
- **基盤 (Phase 2)**: Phase 1 完了に依存 — 全ユーザーストーリーをブロック
- **ユーザーストーリー (Phase 3〜5)**: Phase 2 完了に依存
  - 優先順位順に逐次実行: P1 → P2 → P3
- **ポリッシュ (Phase 6)**: 全ユーザーストーリー完了に依存

### ユーザーストーリー依存関係

- **US1 (P1)**: Phase 2 完了後に開始 — 他ストーリーへの依存なし
- **US2 (P2)**: Phase 2 完了後に開始 — US1 の ProductCard を再利用するが独立テスト可能
- **US3 (P3)**: Phase 2 完了後に開始 — US1 の ProductList を拡張するが独立テスト可能

### 各ユーザーストーリー内の順序

- **Red**: テストを先に書き、FAIL することを確認する（MANDATORY）
- **Green**: テストをパスさせる最小限の実装 → 全テスト実行・パス確認（パス件数 0 件はエラー）
- **Refactor**: 重複排除・命名改善・責務分離（全テストパスを検証）
- **検証**: E2E テスト実行（証跡付き）+ カバレッジ 80% 以上確認
- ユースケース → コンポーネント → ページの順で実装
- ストーリー完了後に次の優先度へ

### 並列実行機会

- Phase 1 の T001〜T003 は同一ファイルのため逐次実行
- Phase 2 の T004〜T006 は同一ファイルのため逐次実行
- Red フェーズのテスト（T008〜T011, T022〜T025, T033〜T036）は [P] マークで並列実行可能
- 異なるユーザーストーリーは独立して並列作業可能（チーム開発時）

---

## 並列実行例: ユーザーストーリー 1

```bash
# Red: US1 の全テストを並列作成（MANDATORY）:
Task: "ユースケース単体テスト作成 in tests/unit/domains/catalog/usecase.test.ts"
Task: "UI コンポーネント単体テスト作成 in tests/unit/domains/catalog/ui.test.tsx"
Task: "API 統合テスト作成 in tests/integration/domains/catalog/api.test.ts"
Task: "E2E テスト作成 in tests/e2e/catalog.spec.ts"

# Green: ユースケース → コンポーネント → ページの順で逐次実装:
Task: "getProducts ユースケース実装 in src/domains/catalog/api/usecases.ts"
Task: "API エクスポート置換 in src/domains/catalog/api/index.ts"
Task: "ProductCard 実装 in src/domains/catalog/ui/ProductCard.tsx"
Task: "ProductList 実装 in src/domains/catalog/ui/ProductList.tsx"
Task: "UI エクスポート置換 in src/domains/catalog/ui/index.tsx"
Task: "カタログページ実装 in src/app/(buyer)/catalog/page.tsx"
```

---

## 実装戦略

### MVP ファースト（ユーザーストーリー 1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤完了（重要 — 全ストーリーをブロック）
3. Phase 3: ユーザーストーリー 1（Red → Green → Refactor → 検証）
4. **停止して検証**: ユーザーストーリー 1 を独立テスト
5. デプロイ/デモ準備完了

### インクリメンタルデリバリー

1. セットアップ + 基盤完了 → 基盤準備完了
2. ユーザーストーリー 1 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ（MVP!）
3. ユーザーストーリー 2 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ
4. ユーザーストーリー 3 追加（Red → Green → Refactor → 検証）→ 独立テスト → デプロイ/デモ
5. 各ストーリーが前のストーリーを壊さずに価値を追加

---

## 備考

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルはタスクとユーザーストーリーの追跡用
- 各ユーザーストーリーは Red-Green-Refactor-検証 構造に従う
- Red フェーズのテストは Green 実装前に FAIL すること
- 検証フェーズ: E2E テスト実行証跡義務（パス件数 0 件はエラー）、カバレッジ 80% 以上確認
- 各タスクまたは論理グループ後にコミット
- チェックポイントで各ストーリーを独立検証可能
- 回避: 曖昧なタスク、同一ファイルの競合、独立性を損なうストーリー間依存
