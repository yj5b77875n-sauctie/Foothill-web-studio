# Foothill Web Studio — foothillwebstudios.com

Website source for Foothill Web Studio (Lincoln, CA). Static site, deployed on Netlify.

## Source
Exported from the live Netlify production deployment `6ad420ba8b780e88f5b15cea`, published 2026-10-18. The six site files are byte-for-byte identical to the deployed source (SHA-256 verified on export, 2026-11-11). Nothing was edited in this import.

## Files
- `index.html`, `style.css`, `base.css`, `app.js` — public homepage
- `studio/` — owner-only Studio ops dashboard (`index.html`, `billing.js`). It talks to the existing Supabase backend; the client files alone do not include any backend, database, or credentials.

## Deploy
Serve the repo root as a static site (Netlify: publish directory = repo root). Do not deploy until Austin approves — this repo is the working copy, the live site is untouched until then.

## Status
Working copy for the redesign: interactive tools (Motion.dev, React Bits, componentry.dev, design.md, Realtime Colors, unslop) are being wired in here, preview-only, before any live change.
