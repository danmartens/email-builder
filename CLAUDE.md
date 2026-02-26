# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript to lib/ and bundle client code with Vite
yarn start          # Run development server with nodemon (ts-node, auto-restarts on changes)
yarn test           # Run Jest tests
yarn test -- --testPathPattern=<pattern>  # Run a specific test file
yarn types:check    # TypeScript type checking (no emit)
```

The `start` command invokes `ts-node src/index.ts develop` via nodemon, watching all `src/**/*` files.

## Architecture

This is a CLI tool and Express server for building and editing responsive HTML emails. It is published as `@ftw/email-builder` and used as a dependency in email projects.

### CLI Entry Point (`src/index.ts`)

Three CLI commands via `commander`:

- `develop` / `d` — starts Express + Vite middleware dev server
- `server` / `s` — starts Express in production mode
- `new <name>` — scaffolds a new email template directory under `emails/<name>/`

### Template Structure

Email templates live in `emails/<name>/` (relative to the consuming project's `cwd`):

- `template.hbs` — Handlebars template for the email body
- `schema.json` — array of field definitions for the variable editor UI
- `head.hbs` (optional) — injected into `<head>`
- `partials/` — Handlebars partials registered automatically
- `assets/` — local images and resources

### Server (`src/server/`)

Express server with routes for:

- Serving the React editor UI
- Rendering email previews (GET/POST `/emails/:name`)
- Image upload (via multer + sharp for resizing)
- Publishing to S3
- Downloading a zip archive

Two modes: `development` (with Vite middleware integrated into Express and WebSocket file watcher at port 8081) and `production`.

### Email Rendering Pipeline (`src/posthtml/`)

`renderEmail.ts` → `processHtml.ts` → PostHTML plugin chain:

1. `syntaxAttribute` — converts shorthand HTML attributes (`padding`, `max-width`, `align`, `background`) to structured data
2. `preprocessStyles` — PostCSS with autoprefixer + custom properties; optionally strips custom fonts
3. `posthtml-inline-css` — inlines all CSS
4. `section` — converts layout attributes into table-based email layout
5. `imageElement` — handles `srcset` → media queries, optional S3 upload
6. `unsubscribeElement` — dev only; renders unsubscribe placeholder
7. `styleElement` — extracts/rewrites `<style>` blocks; optionally strips media queries
8. `removeExtraElements`, `removeClassAttributes`, `moveDataClassAttributes`, `normalizeElements`
9. `posthtml-spaceless` — removes whitespace between tags
10. `development` — dev only; injects device frame styles
11. `minifyStyles` — publish only; minifies CSS via cssnano
12. `uploadImages` — publish only; uploads local images to S3

The outer Handlebars template (`src/templates/email.hbs`) wraps all content in a standard email HTML structure.

### React Client (`src/client/`)

Single-page app bundled by Vite, served at the root. Key components:

- `ValuesEditor` — dynamic form generated from `schema.json`; supports `string`, `text`, `image`, and `list` field types
- `Frame` — renders the email preview inside a device-sized iframe
- `ImageUploader` — handles image uploads to the server
- State managed with Immutable.js (`Map`/`List` with `getIn`/`setIn`)
- WebSocket client listens for file changes and triggers re-renders

### Schema System (`src/server/parseSchema.ts`)

`schema.json` is validated with io-ts. Field types:

- `string` — single-line text input
- `text` — multi-line textarea (supports markdown via `marked`)
- `image` — image upload with URL field
- `list` — repeating group of fields

### Configuration (`src/Configuration.ts`)

Environment variables (loaded via dotenv):

- `HOST` (default: `localhost`)
- `PORT` (default: `4000`)
- `AWS_REGION`, `S3_BUCKET_NAME` — S3 publishing
- `BASIC_AUTH_PASSWORD` — enables basic auth on all routes

### Build (`scripts/build`)

1. `tsc` compiles `src/` → `lib/`
2. Vite bundles `src/client/index.tsx` → `lib/server/public/main.js`
3. Template files from `src/templates/` are copied to `lib/templates/`

### Testing

Jest with Babel transformer. Tests are in `__tests__/` directories colocated with source. The posthtml plugin pipeline has the most test coverage (`src/posthtml/__tests__/`).
