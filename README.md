# Backend Fieldnotes

Interactive Thai learning material for Unity developers learning backend from zero: 21 chapters, 63 exercises, and local simulations for Auth, RLS, transactions, and game systems.

## Run locally

Open `index.html` directly, or serve the folder over HTTP if your browser restricts storage or Web Workers on `file://`:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/BackendAcademy/` from the parent folder, or serve this folder and open `/`.

## Edit and build

Course content and UI behavior are authored in TypeScript under `source/`. `course.ts` defines the typed chapter and exercise model; `app.ts` implements routing, progress, exercise grading, and simulations. The build bundles these sources into a single offline-capable `index.html`.

```sh
npm ci
npm run typecheck
npm run build
npm run verify
```

The build writes `index.html` and `dist/index.html`. `dist/` is the GitHub Pages artifact. To deploy, push this folder to a GitHub repository, then select **Settings → Pages → Build and deployment → GitHub Actions**. The workflow in `.github/workflows/pages.yml` checks the TypeScript, builds the static site, and deploys `dist/` on pushes to `main`.

## Learning and privacy notes

- The SQL lab runs SQLite in a browser worker through sql.js 1.13.0; it is not a live PostgreSQL or Supabase connection.
- Auth, RLS, row locking, and game systems are clearly labeled local simulations.
- Answers, notes, and progress stay in this browser's localStorage; export/import JSON to move them.
- The page does not send data to an external service. External documentation opens only when a learner follows a link.
- C# examples depend on installed package versions; snippets labeled fragments or pseudocode are not complete production systems.

## Credits

Lesson design is informed by public guidance from Material for MkDocs, The Carpentries, and MDN. The bundled sql.js license is retained in the course. See the “แหล่งอ้างอิงและที่มา” page for source links.
