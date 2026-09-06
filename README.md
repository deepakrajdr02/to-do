# Tide — a bluish to-do list

A small, self-contained to-do app: add, edit ("replace"), delete, and mark
tasks complete, with a calm blue theme and custom checkboxes.

## Files

- `index.html` — page structure
- `style.css` — all styling (bluish theme, checkboxes, layout)
- `script.js` — app logic: add / delete / edit / complete, plus the data layer

## How the "backend" works here

This is a static site, so there's no server. Instead, `script.js` has a small
`TaskStore` object that acts as the data-access layer — it reads and writes
tasks as JSON to the browser's `localStorage`. Every task survives a page
refresh or closing the tab, but it lives only in that one browser.

The UI code never touches `localStorage` directly — it only calls
`TaskStore.add()`, `TaskStore.update()`, `TaskStore.remove()`, etc. That means
if you later want a real multi-device backend (e.g. a small Node/Express +
database API), you can swap the inside of `TaskStore` for `fetch()` calls
without changing any of the rendering or event-handling code.

## Running it locally

No build step needed. Either:

- Double-click `index.html` to open it directly in a browser, or
- Serve it locally, e.g. `python3 -m http.server 8000` from this folder,
  then visit `http://localhost:8000`.

## Putting it on GitHub and making it live

1. Create a new repository on GitHub (e.g. `tide-todo`), without a README
   (you already have one here).
2. From this folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Tide to-do app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. On GitHub, go to your repo → **Settings** → **Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   pick branch `main` and folder `/ (root)`, then **Save**.
5. Wait a minute, then your live URL will appear at the top of that Pages
   settings screen — usually:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```

Any time you `git push` new changes to `main`, GitHub Pages redeploys
automatically within a minute or two.
