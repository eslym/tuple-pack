# AGENTS.md

This repository contains a small TypeScript library for packing/unpacking
typed tuples into compact, versioned envelopes. Follow the conventions below
when making changes.

## Project Layout

- Source: `src/`
- Entry point: `src/index.ts`
- Build output (generated): `dist/`
- Build config: `rollup.config.mjs`
- TypeScript config: `tsconfig.json`, `tsconfig.build.json`
- Formatter config: `.prettierrc`
- Package manager: bun

## Commands (bun)

- Install deps: `bun install`
- Build: `bun run build`
- Prepack: `bun run prepack` (runs build)

### Lint / Format

No lint script is defined. A Prettier config exists, so use these when needed:

- Check formatting: `bunx prettier . --check`
- Format: `bunx prettier . --write`

### Tests

No test framework or test scripts are configured.

- There is no single-test command at the moment.
- If tests are added later, update this file.

## Cursor / Copilot Rules

- No `.cursor/rules/` or `.cursorrules` present.
- No `.github/copilot-instructions.md` present.

## Code Style Guidelines

### Formatting (from `.prettierrc`)

- Use tabs for indentation.
- Tab width: 4 (default).
- JSON/YAML/prettierrc files: tabWidth 2 (override).
- Line endings: LF.
- No trailing commas.

### TypeScript / Module Settings

- ESM package (`"type": "module"`). Use `import`/`export` syntax.
- `strict: true` is enabled.
- `moduleResolution: "bundler"` and `verbatimModuleSyntax: true`.
- `noUncheckedIndexedAccess: true` is on; be explicit about indexing.
- `noEmit: true` in `tsconfig.json` (build uses `tsconfig.build.json`).

### Imports

- Group imports from external modules before local files.
- Keep imports sorted logically (by origin and purpose).
- Use `import type { ... }` for type-only imports.
- Avoid unused imports; keep import lists minimal.

### Naming Conventions

- Functions/variables: `camelCase`.
- Classes/types/interfaces: `PascalCase`.
- Internal helper types often use `$` prefix (e.g. `$tuple`, `$known`).
- Symbol constants use `camelCase` with semantic names (e.g. `isPacker`).

### Types and Generics

- Prefer precise generics and typed overloads for public APIs.
- Use `type` aliases for complex mapped/conditional types.
- Avoid `any` unless required for constrained generic patterns; see `packer.ts`.
- Preserve public type exports and return types for packers.

### Error Handling

- Use `PackerError` as the base error type.
- Throw `PackError` during packing validation.
- Throw `UnpackError` during unpacking validation.
- Always include a `path: (string | number)[]` when possible.
- Keep error messages deterministic and explicit.

### Data Validation

- Validate input types early (null checks, arrays vs objects, length checks).
- Use strict structural checks; do not coerce values.

### Public API Discipline

- Keep exported functions minimal and stable (see `src/index.ts`).
- Avoid breaking changes to exported types without strong justification.
- Update README or API docs if public behavior changes.

## Build Output

- `dist/` is generated. Do not edit it by hand.
- The build produces:
    - `dist/index.js` (ESM)
    - `dist/index.cjs` (CJS)
    - `dist/index.d.ts` (types)

## Dependency Notes

- Build tooling: Rollup + `@rollup/plugin-typescript` + `rollup-plugin-dts`.
- Peer dependency: TypeScript `^5`.

## When Editing

- Read related files before changing shared types or packer semantics.
- Match existing error messages and nullability handling.
- Keep changes tight; avoid reformatting unrelated code.

## Updating This File

- Add test commands when a test runner is introduced.
- Add lint commands if ESLint or other tooling is added.
- Include Cursor or Copilot rules if they appear later.
