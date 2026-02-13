---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: MANDATORY — constitution（原則 VI）は TDD 必須。各ユーザーストーリーは Red → Green → Refactor → 検証 の 4 ステップで実装する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  Each user story phase MUST follow the Red-Green-Refactor-検証 structure:
  - Red: テスト作成（MANDATORY）— 失敗するテストを先に書く
  - Green: 最小実装 — テストをパスさせる最小限のコード
  - Refactor: 改善 — 重複排除・命名改善・責務分離（全テストパスを検証）
  - 検証: E2Eテスト実行 + カバレッジ確認

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Red: テスト作成 (MANDATORY)

> **テスト種別**: 以下の 4 種別を必ず含める。テストは実装前に書き、全て FAIL することを確認する。
> - ユースケース単体テスト: ドメインロジックの正常系・異常系・認可条件
> - UI コンポーネント単体テスト: 表示・インタラクション・アクセシビリティ
> - API 統合テスト: エンドポイントの入力バリデーション・認可・レスポンス形式
> - E2E テスト: ユーザー導線の主要フロー

- [ ] T010 [P] [US1] ユースケース単体テスト作成 in tests/unit/test_[name].py
- [ ] T011 [P] [US1] UI コンポーネント単体テスト作成 in tests/unit/test_[name].tsx
- [ ] T012 [P] [US1] API 統合テスト作成 in tests/integration/test_[name].py
- [ ] T013 [P] [US1] E2E テスト作成 in tests/e2e/test_[name].py

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T014 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T015 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T016 [US1] Implement [Service] in src/services/[service].py (depends on T014, T015)
- [ ] T017 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T018 [US1] Add validation and error handling
- [ ] T019 [US1] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T020 [US1] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> - E2E テスト実行結果を確認し、パス件数 0 件はエラーとする（実行スキップ不可）
> - `pnpm test:unit --coverage` でカバレッジ 80% 以上を確認する
> - 外部 URL を含む場合は HTTP リクエストで 200 応答を確認する（plan 時点では検証予定とし、検証済みとしない）

- [ ] T021 [US1] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [ ] T022 [P] [US2] ユースケース単体テスト作成 in tests/unit/test_[name].py
- [ ] T023 [P] [US2] UI コンポーネント単体テスト作成 in tests/unit/test_[name].tsx
- [ ] T024 [P] [US2] API 統合テスト作成 in tests/integration/test_[name].py
- [ ] T025 [P] [US2] E2E テスト作成 in tests/e2e/test_[name].py

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T026 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US2] Implement [Service] in src/services/[service].py
- [ ] T028 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T029 [US2] Integrate with User Story 1 components (if needed)
- [ ] T030 [US2] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T031 [US2] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [ ] T032 [US2] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Red: テスト作成 (MANDATORY)

> **テスト種別**: ユースケース単体・UI コンポーネント単体・API 統合・E2E

- [ ] T033 [P] [US3] ユースケース単体テスト作成 in tests/unit/test_[name].py
- [ ] T034 [P] [US3] UI コンポーネント単体テスト作成 in tests/unit/test_[name].tsx
- [ ] T035 [P] [US3] API 統合テスト作成 in tests/integration/test_[name].py
- [ ] T036 [P] [US3] E2E テスト作成 in tests/e2e/test_[name].py

### Green: 最小実装

> Red で作成した失敗テストをパスさせる最低限のコードを記述する。
> 実装完了後、必ず全テストを実行しパスすることを検証する（パス件数 0 件はエラー）。

- [ ] T037 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T038 [US3] Implement [Service] in src/services/[service].py
- [ ] T039 [US3] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T040 [US3] 全テスト実行・パス確認（Red テストが全てパスすることを検証）

### Refactor: 改善

> 重複排除・命名改善・責務分離。全テストパスを検証する。

- [ ] T041 [US3] リファクタリングと全テストパス確認

### 検証: E2Eテスト実行 + カバレッジ確認

> E2E 実行証跡 + カバレッジ 80% 以上確認 + 外部 URL 検証

- [ ] T042 [US3] E2E テスト実行（証跡付き）+ カバレッジ確認

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same Red-Green-Refactor-検証 pattern. Green セクションには必ず「全テスト実行・パス確認」タスクを末尾に含めること]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] サンプルテストリグレッション確認（pnpm test:unit:samples && pnpm test:integration:samples）
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- **Red**: テストを先に書き、FAIL することを確認する（MANDATORY）
- **Green**: テストをパスさせる最小限の実装 → 全テスト実行・パス確認（パス件数 0 件はエラー）
- **Refactor**: 重複排除・命名改善・責務分離（全テストパスを検証）
- **検証**: E2E テスト実行（証跡付き）+ カバレッジ 80% 以上確認
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All Red phase tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Red: Launch all tests for User Story 1 together (MANDATORY):
Task: "ユースケース単体テスト作成 in tests/unit/test_[name].py"
Task: "UI コンポーネント単体テスト作成 in tests/unit/test_[name].tsx"
Task: "API 統合テスト作成 in tests/integration/test_[name].py"
Task: "E2E テスト作成 in tests/e2e/test_[name].py"

# Green: Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Red → Green → Refactor → 検証)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
4. Add User Story 3 (Red → Green → Refactor → 検証) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Red → Green → Refactor → 検証)
   - Developer B: User Story 2 (Red → Green → Refactor → 検証)
   - Developer C: User Story 3 (Red → Green → Refactor → 検証)
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
