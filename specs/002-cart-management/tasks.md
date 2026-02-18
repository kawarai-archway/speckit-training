# Tasks: カート管理機能

**Input**: Design documents from `/specs/002-cart-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: MANDATORY — constitution（原則 VI）は TDD 必須。各ユーザーストーリーは Red → Green → Refactor → 検証 の 4 ステップで実装する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Extend CartSchema with tax and total fields in src/contracts/cart.ts
- [x] T002 [P] Add stock field to ProductFetcher interface in src/contracts/cart.ts
- [x] T003 [P] Add quantity max constraint (99) to cart input schemas in src/contracts/cart.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create cart usecases implementation in src/domains/cart/api/usecases.ts
- [x] T005 [P] Create CartView component in src/domains/cart/ui/CartView.tsx
- [x] T006 Update cart domain API exports in src/domains/cart/api/index.ts
- [x] T007 Update cart domain UI exports in src/domains/cart/ui/index.tsx
- [x] T008 [P] Update buyer layout to enable cart link in src/app/(buyer)/layout.tsx
- [x] T009 Update cart page with data fetching and event handling in src/app/(buyer)/cart/page.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - カートに商品を追加する (Priority: P1) 🎯 MVP

**Goal**: 購入者がログインして商品詳細ページから商品をカートに追加でき、成功フィードバックとカート件数更新が表示される

**Independent Test**: 商品詳細ページから「カートに追加」ボタンを押し、成功フィードバックが表示され、カートアイコンの件数が増えることを確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: 以下の 4 種別を必ず含める。テストは実装前に書き、全て FAIL することを確認する。
> - ユースケース単体テスト: ドメインロジックの正常系・異常系・認可条件
> - UI コンポーネント単体テスト: 表示・インタラクション・アクセシビリティ
> - API 統合テスト: エンドポイントの入力バリデーション・認可・レスポンス形式
> - E2E テスト: ユーザー導線の主要フロー

- [x] T010 [P] [US1] Create add to cart usecase unit test in tests/unit/domains/cart/usecase.test.ts
- [x] T011 [P] [US1] Create product detail page UI unit test in tests/unit/domains/cart/ui.test.tsx
- [x] T012 [P] [US1] Create cart API integration test in tests/integration/domains/cart/api.test.ts
- [x] T013 [P] [US1] Create add to cart E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T014 [P] [US1] Implement addToCart usecase with stock validation in src/domains/cart/api/usecases.ts
- [x] T015 [P] [US1] Implement duplicate prevention logic in addToCart usecase in src/domains/cart/api/usecases.ts
- [x] T016 [US1] Update product detail page API URL and add feedback in src/app/(buyer)/catalog/[id]/page.tsx
- [x] T017 [US1] Add loading state and error handling to add-to-cart button in src/app/(buyer)/catalog/[id]/page.tsx
- [x] T018 [US1] Implement cart-updated event dispatch in src/app/(buyer)/catalog/[id]/page.tsx
- [x] T019 [US1] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T020 [US1] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> - E2E テスト実行結果を確認し、パス件数 0 件はエラーとする（実行スキップ不可）
> - `npm run test:coverage` でカバレッジ 80% 以上を確認する
> - 外部 URL を含む場合は HTTP リクエストで 200 応答を確認する（plan 時点では検証予定とし、検証済みとしない）

- [x] T021 [US1] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - カート内容を確認する (Priority: P1)

**Goal**: 購入者がカートページを開いて商品一覧と合計金額（商品合計・消費税・総合計）を確認できる

**Independent Test**: カートに商品を追加した後、カートページを開いて商品情報と合計金額が正しく表示されることを確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T022 [P] [US2] Create cart display usecase unit test in tests/unit/domains/cart/usecase.test.ts
- [x] T023 [P] [US2] Create CartView component unit test in tests/unit/domains/cart/ui.test.tsx
- [x] T024 [P] [US2] Create cart GET API integration test in tests/integration/domains/cart/api.test.ts
- [x] T025 [P] [US2] Create cart view E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T026 [P] [US2] Implement getCart usecase with tax calculation in src/domains/cart/api/usecases.ts
- [x] T027 [P] [US2] Implement CartView component with product list display in src/domains/cart/ui/CartView.tsx
- [x] T028 [P] [US2] Implement empty cart state in CartView component in src/domains/cart/ui/CartView.tsx
- [x] T029 [US2] Add tax calculation logic (10%, floor) to cart usecases in src/domains/cart/api/usecases.ts
- [x] T030 [US2] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T031 [US2] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [x] T032 [US2] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - カート内の数量を変更する (Priority: P2)

**Goal**: 購入者がカートページで商品の数量を変更すると、小計と合計金額が即時に更新される

**Independent Test**: カートページで商品の数量を変更し、小計・合計が即時に正しく再計算されることを確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [ ] T033 [P] [US3] Create update quantity usecase unit test in tests/unit/domains/cart/usecase.test.ts
- [ ] T034 [P] [US3] Create quantity input component unit test in tests/unit/domains/cart/ui.test.tsx
- [ ] T035 [P] [US3] Create cart item update API integration test in tests/integration/domains/cart/api.test.ts
- [ ] T036 [P] [US3] Create quantity change E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T037 [P] [US3] Implement updateCartItemQuantity usecase with stock validation in src/domains/cart/api/usecases.ts
- [ ] T038 [P] [US3] Add quantity input controls to CartView component in src/domains/cart/ui/CartView.tsx
- [ ] T039 [US3] Implement instant recalculation on quantity change in src/domains/cart/ui/CartView.tsx
- [ ] T040 [US3] Add quantity validation (1-99, stock limit) with error display in src/domains/cart/ui/CartView.tsx
- [ ] T041 [US3] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T042 [US3] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [ ] T043 [US3] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: User Stories 1, 2, and 3 should all work independently

---

## Phase 6: User Story 4 - カートから商品を削除する (Priority: P2)

**Goal**: 購入者がカートページで不要な商品を削除できる。削除前に確認ダイアログで意図を確認する

**Independent Test**: カートページで商品の削除ボタンを押し、確認ダイアログで「はい」を選択すると商品がカートから削除されることを確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [x] T044 [P] [US4] Create remove cart item usecase unit test in tests/unit/domains/cart/usecase.test.ts
- [x] T045 [P] [US4] Create delete confirmation dialog unit test in tests/unit/domains/cart/ui.test.tsx
- [x] T046 [P] [US4] Create cart item delete API integration test in tests/integration/domains/cart/api.test.ts
- [x] T047 [P] [US4] Create item deletion E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [x] T048 [P] [US4] Implement removeCartItem usecase in src/domains/cart/api/usecases.ts
- [x] T049 [P] [US4] Add delete buttons to CartView component in src/domains/cart/ui/CartView.tsx
- [x] T050 [US4] Integrate ConfirmDialog from templates for delete confirmation in src/domains/cart/ui/CartView.tsx
- [x] T051 [US4] Handle empty cart state after last item deletion in src/domains/cart/ui/CartView.tsx
- [x] T052 [US4] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [x] T053 [US4] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [x] T054 [US4] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - 未ログイン時のカート追加リダイレクト (Priority: P2)

**Goal**: 未ログインのユーザーが「カートに追加」ボタンを押すと、ログインページにリダイレクトされ、ログイン完了後に元の商品詳細ページに戻る

**Independent Test**: 未ログイン状態で「カートに追加」を試み、ログインページへの遷移とログイン後の復帰を確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [ ] T055 [P] [US5] Create authentication redirect logic unit test in tests/unit/domains/cart/usecase.test.ts
- [ ] T056 [P] [US5] Create unauthenticated state handling unit test in tests/unit/domains/cart/ui.test.tsx
- [ ] T057 [P] [US5] Create 401 response handling integration test in tests/integration/domains/cart/api.test.ts
- [ ] T058 [P] [US5] Create login redirect E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T059 [P] [US5] Add 401 error handling to cart usecases in src/domains/cart/api/usecases.ts
- [ ] T060 [US5] Implement login redirect with returnTo parameter in src/app/(buyer)/catalog/[id]/page.tsx
- [ ] T061 [US5] Add authentication check before cart operations in src/app/(buyer)/catalog/[id]/page.tsx
- [ ] T062 [US5] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T063 [US5] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [ ] T064 [US5] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - カート内容の永続化 (Priority: P3)

**Goal**: カートに追加した商品はページ遷移やブラウザリロード後も保持される

**Independent Test**: カートに商品を追加した後、ページ遷移やブラウザリロードを行い、カート内容が保持されていることを確認する

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [ ] T065 [P] [US6] Create cart persistence usecase unit test in tests/unit/domains/cart/usecase.test.ts
- [ ] T066 [P] [US6] Create cart state restoration unit test in tests/unit/domains/cart/ui.test.tsx
- [ ] T067 [P] [US6] Create session persistence integration test in tests/integration/domains/cart/api.test.ts
- [ ] T068 [P] [US6] Create persistence across navigation E2E test in tests/e2e/cart-buyer-flow.spec.ts

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T069 [P] [US6] Verify in-memory store persistence works with existing implementation in src/infrastructure/repositories/cart.ts
- [ ] T070 [P] [US6] Add cart state restoration on page load in src/domains/cart/ui/CartView.tsx
- [ ] T071 [US6] Test persistence across browser sessions and page navigation in src/app/(buyer)/cart/page.tsx
- [ ] T072 [US6] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T073 [US6] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [ ] T074 [US6] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T075 [P] Update navigation links and cartUrl in buyer layout in src/app/(buyer)/layout.tsx
- [x] T076 [P] Add comprehensive error boundaries and loading states across cart components
- [x] T077 [P] Optimize performance for cart operations (debouncing, optimistic updates)
- [x] T078 [P] サンプルテストリグレッション確認（npm run test:samples）
- [x] T079 [P] Run quickstart.md validation with updated cart functionality
- [x] T080 Ensure all cart operations follow security best practices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Should work with all previous stories independently

### Within Each User Story

- **Red**: テストを先に書き、FAIL することを確認する（MANDATORY）
- **Green**: テストをパスさせる最小限の実装 → 全テスト実行・パス確認（パス件数 0 件はエラー）
- **Refactor**: 重複排除・命名改善・責務分離（全テストパスを検証）
- **検証**: E2E テスト実行（証跡付き）+ カバレッジ 80% 以上確認
- Usecases before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All Red phase tests for a user story marked [P] can run in parallel
- Green phase tasks within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Red: Launch all tests for User Story 1 together (MANDATORY):
Task: "Create add to cart usecase unit test in tests/unit/domains/cart/usecase.test.ts"
Task: "Create product detail page UI unit test in tests/unit/domains/cart/ui.test.tsx"
Task: "Create cart API integration test in tests/integration/domains/cart/api.test.ts"
Task: "Create add to cart E2E test in tests/e2e/cart-buyer-flow.spec.ts"

# Green: Launch parallel implementation tasks for User Story 1:
Task: "Implement addToCart usecase with stock validation in src/domains/cart/api/usecases.ts"
Task: "Implement duplicate prevention logic in addToCart usecase in src/domains/cart/api/usecases.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Red → Green → Refactor → 検証)
4. Complete Phase 4: User Story 2 (Red → Green → Refactor → 検証)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Red → Green → Refactor → 検証) → Test independently
3. Add User Story 2 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
5. Add User Story 4 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
6. Add User Story 5 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
7. Add User Story 6 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 & 2 (Red → Green → Refactor → 検証)
   - Developer B: User Story 3 & 4 (Red → Green → Refactor → 検証)
   - Developer C: User Story 5 & 6 (Red → Green → Refactor → 検証)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story MUST follow Red-Green-Refactor-検証 structure
- Red phase tests MUST fail before Green implementation
- 検証 phase: E2E テスト実行証跡義務（パス件数 0 件はエラー）、カバレッジ 80% 以上確認
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
