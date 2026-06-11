# Rust SQLite CRUD Backend Design

## Purpose

Swar Notebook currently has React/Tauri screens for Raags, Sargams, Bandishes, and Taans, but the data layer is still mostly placeholder logic. The dashboard starts with hardcoded Raags, TypeScript services return mock values, and the Tauri backend has no commands.

This design replaces the Prisma runtime path with a Rust-native SQLite backend while preserving the current app behavior. Data must persist after the app closes and reopens.

## Scope

This spec covers:

- Replacing placeholder services with Tauri command calls.
- Implementing Rust SQLite CRUD for Raag, Sargam, Bandish, and Taan.
- Persisting data in a local SQLite database.
- Finishing missing edit/update flows for Sargam, Bandish, and Taan.
- Removing duplicate Taal storage from Taan.
- Keeping Zustand as a frontend cache, not the source of truth.

This spec does not cover:

- `.swar` import/export.
- PDF export.
- Advanced notation editing.
- Final release packaging.

## Backend Architecture

The app will use `rusqlite` in the Tauri Rust backend. React services will call Tauri commands using `invoke`, and Rust will read/write SQLite directly.

On startup, the backend will initialize a SQLite database in the Tauri app data directory. The database file remains on disk, so user data persists across app restarts.

The backend will run a simple migration function that creates the required tables if they do not already exist. This keeps V1 easy to reason about without adding a migration framework.

Prisma will no longer be used as the runtime data access layer. The existing Prisma schema can remain temporarily as reference during migration, but the Rust SQLite schema becomes the source of truth for persisted data.

## Data Model

The SQLite schema will preserve the current entity structure while removing duplicate data from Taan.

Raag fields:

- `id`
- `name`
- `thaat`
- `aaroh`
- `avroh`
- `pakad`
- `notes`
- `created_at`
- `updated_at`

Sargam fields:

- `id`
- `raag_id`
- `title`
- `taal`
- `notation`
- `notes`
- `created_at`
- `updated_at`

Bandish fields:

- `id`
- `raag_id`
- `title`
- `taal`
- `laya`
- `composer`
- `lyrics`
- `notation`
- `notes`
- `created_at`
- `updated_at`

Taan fields:

- `id`
- `sargam_id`
- `bandish_id`
- `title`
- `notation`
- `notes`
- `order`
- `created_at`
- `updated_at`

Taan will not store `taal`. A Taan uses its parent Sargam or Bandish Taal. If the parent Taal changes, the Taan displays the updated value automatically.

IDs will stay string-based UUIDs so the frontend data shape remains stable.

Foreign keys will cascade deletes:

- Deleting a Raag deletes its Sargams and Bandishes.
- Deleting a Sargam deletes its child Taans.
- Deleting a Bandish deletes its child Taans.

Each Taan must belong to exactly one parent: either a Sargam or a Bandish.

## Tauri Commands

The backend will expose commands for each entity.

Raag commands:

- `list_raags`
- `get_raag`
- `create_raag`
- `update_raag`
- `delete_raag`

Sargam commands:

- `list_sargams_by_raag`
- `get_sargam`
- `create_sargam`
- `update_sargam`
- `delete_sargam`

Bandish commands:

- `list_bandishes_by_raag`
- `get_bandish`
- `create_bandish`
- `update_bandish`
- `delete_bandish`

Taan commands:

- `list_taans_by_sargam`
- `list_taans_by_bandish`
- `get_taan`
- `create_taan`
- `update_taan`
- `delete_taan`

The Rust command layer will validate parent relationships before writes. Creating a Sargam or Bandish requires an existing Raag. Creating a Taan requires exactly one existing parent.

## Frontend Services And State

The TypeScript services will stop returning placeholders and will call Tauri commands through `invoke`.

Service methods will preserve the current frontend-facing method names where reasonable, so page changes stay small. Returned rows from Rust will be mapped into the existing TypeScript interfaces.

Zustand will remain as an in-memory UI cache:

- The database is the source of truth.
- On app load, pages fetch from SQLite through services.
- After create/update/delete, services return saved data or completion, and pages update the Zustand cache.
- Pages should recover from direct navigation or refresh by fetching needed records instead of assuming they are already present in Zustand.

The dashboard will remove hardcoded mock Raags and load Raags from SQLite.

## CRUD UI Behavior

The current screen structure will be preserved:

- Dashboard lists Raags and supports search, create, edit, delete, and view.
- Raag detail shows metadata plus Sargam and Bandish tabs.
- Sargam detail shows notation and child Taans.
- Bandish detail shows lyrics, notation, and child Taans.
- Forms stay simple and textarea-based.

Required CRUD fixes:

- Raag create, update, and delete persist to SQLite.
- Sargam create, update, and delete persist to SQLite.
- Bandish create, update, and delete persist to SQLite.
- Taan create, update, and delete persist to SQLite.
- Sargam and Bandish edit flows are added using the existing forms.
- Taan edit submits to `taanService.updateTaan` and updates state.
- Taan forms remove the Taal field.
- Taan display reads Taal from the parent Sargam or Bandish where useful.

## Validation And Errors

Frontend validation remains simple:

- Raag requires `name`.
- Sargam requires `title`.
- Bandish requires `title`.
- Taan requires `title` and a numeric `order`.

Backend validation enforces persisted data integrity:

- Parent records must exist before creating children.
- Taan must have exactly one parent.
- Missing records return clear command errors.
- Database failures return clear command errors.

Optional text fields will be stored as `NULL` in SQLite when blank. The TypeScript service layer will map `NULL` to `undefined`-compatible optional fields for existing UI components.

Frontend error handling can start modestly:

- Log detailed errors to the console.
- Show a user-facing error message near the affected page or form.

## Verification

Implementation is complete when these checks pass:

- `npx tsc --noEmit`
- Rust/Tauri build or check command for backend compilation.
- Manual smoke test for create, edit, and delete of Raag, Sargam, Bandish, and Taan.
- Close and reopen the app, then confirm saved data remains.
- Edit a Sargam or Bandish Taal and confirm child Taans display the updated parent Taal.

## Follow-Up Work

After this backend and CRUD foundation is complete, the next specs should address:

- `.swar` import/export.
- PDF export.
- Unit and integration test expansion.
- Tauri desktop packaging for release.
