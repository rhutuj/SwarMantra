# Next Steps for Swar Notebook

## Next steps based on `PROJECT_SPEC.md` and `AGENT_RULES.md`

### 1. Database Schema
From `PROJECT_SPEC.md`:
- Implement the Prisma/SQLite schema for Raag, Sargam, Bandish, and Taan.
- Make sure relationships are properly defined and no duplicate data is stored.

Why:
- This is the foundation for all CRUD work.
- It matches the approved stack: Prisma + SQLite.

### 2. Dashboard
From `PROJECT_SPEC.md`:
- Build the Dashboard screen next.
- It should list Raags, allow search, create, and delete.

Why:
- The Dashboard is the main entry point for the app.
- It should come before deeper entity detail screens.

### 3. Raag CRUD
From `PROJECT_SPEC.md`:
- Add Raag create/read/update/delete flows.
- Include Raag detail metadata: name, thaat, aaroh, avroh, pakad, notes.

Why:
- Raags are the parent entity for Sargams, Bandishes, and Taans.

### 4. Sargam CRUD
From `PROJECT_SPEC.md`:
- Add Sargam detail screens and creation flow.
- Sargams belong to Raags and can contain Taans.

### 5. Bandish CRUD
From `PROJECT_SPEC.md`:
- Add Bandish detail screens and creation flow.
- Bandishes belong to Raags and can contain Taans.

### 6. Taan CRUD
From `PROJECT_SPEC.md`:
- Add Taan create/edit/delete.
- A Taan can belong to either a Sargam or a Bandish.

### 7. Notation Editor
From `PROJECT_SPEC.md`:
- Implement the shared notation editor for Sargam/Bandish/Taan.
- Keep V1 textarea-based.

### 8. SWAR import/export
From `PROJECT_SPEC.md`:
- Implement `.swar` import and export for Raag/Sargam/Bandish.
- This is the editable exchange format.

### 9. PDF export
From `PROJECT_SPEC.md`:
- Add PDF export for Raag, Sargam, Bandish.
- Use `pdf-lib` only.

### 10. Testing and Packaging
From `AGENT_RULES.md`:
- After features, add tests.
- Then package for desktop.

---

## Important constraints from `AGENT_RULES.md`

- Stay inside approved stack: React + TypeScript + Tauri + SQLite + Prisma + Zustand + Tailwind + pdf-lib.
- Do not introduce Redux, Next.js, Express, Docker, Electron, etc.
- Keep the UI minimal and clean.
- Use strict TypeScript and avoid `any`.
- Separate UI from data access.
- Do not over-engineer the notation editor in V1.

---

## Recommended immediate action
Since your app already runs:
1. Finalize `prisma/schema.prisma`
2. Create the first Raag data model and CRUD service
3. Build the Dashboard screen to show Raags

That follows the exact development order in `PROJECT_SPEC.md`.
