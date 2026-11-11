# DialTunes — session notes (for picking this back up later)

Working folder: `~/Desktop/DialTune Deploy` (this is the live/canonical copy —
see "Folder situation" below). Deployed at https://dialtunes.vercel.app/.

See `CONTEXT.md` in this same folder for *why* demo mode exists and the
constraints/bugs behind how it's built — this file is just "where things
stand and what to do next," not a repeat of that.

## How to pick this back up

- **Edit the file:** it's just `index.html` in this folder, plus
  `api/track-meta.js` (a small serverless function) and four sticker SVGs.
  Open in any editor, or reopen a Claude Code session from this folder.
- **Test locally:** `cd ~/Desktop/"DialTune Deploy"` then
  `python3 -m http.server 8080`, open `http://127.0.0.1:8080/` in Chrome.
  (This won't execute `api/track-meta.js` — that needs `npx vercel dev`
  instead, if you're testing the demo's artist-name lookup specifically.)
- **Deploy:** `cd ~/Desktop/"DialTune Deploy"` then `npx vercel --prod`.
  Already linked to the `dialtunes` Vercel project — no relinking needed.
  (By established practice this session, I don't run this command myself —
  you run it yourself once you're happy with changes.)

## Folder situation

Two folders exist on this Mac:
- `~/Desktop/DialTune Deploy` — **this one**. Live, canonical, tied to
  Vercel. All current/future work happens here.
- `~/Desktop/ipod` — frozen on purpose, as a landmark of the first working
  signed-in-only version. Not synced, not touched. Has its own `CLAUDE.md`
  that describes *that* folder, not this one.

## Spotify config (reference, not secret)

- `CLIENT_ID` (public, no secret used — PKCE): `736d289012154fada2f461c62adef786`
- Registered redirect URIs: `https://dialtunes.vercel.app/` and `http://127.0.0.1:8080/`
- App is in Spotify **Development Mode**: only 5 allowlisted accounts can
  log in. This is the reason demo mode exists at all.

## What got done this session (after CONTEXT.md was written)

1. **Verified and fixed the four demo-mode issues** from the original
   briefing: windowed Liked Songs playback to 100 tracks (undocumented but
   real Spotify limit); got real track titles via oEmbed; confirmed
   next/prev is a genuine platform limitation (embed iFrame API has no skip
   method — not fixable); confirmed the duration-jump quirk is an upstream
   Spotify thing, mitigated by ignoring duration while buffering; deleted
   `embed-test.html`.
2. **Built the actual demo-mode UI** (wasn't in `index.html` at all before
   this session — only existed as an unintegrated test file): "Try the
   Demo" menu entry, demo Playlists screen, Settings swap (Exit Demo /
   Connect Spotify, hides Shuffle/Repeat).
3. **Fixed two real bugs** found via testing: the embed widget leaking
   on-screen and clashing with the shell swatches (Spotify's
   `createController` clobbers whatever container style you give it — fixed
   with an outer wrapper div it never touches), and playback silently never
   starting once genuinely hidden (native `loading="lazy"` on the generated
   iframe never fires for an off-screen element — fixed by stripping that
   attribute).
4. **Added `api/track-meta.js`** — a small Vercel serverless function that
   gets the artist name (missing from oEmbed) by scraping it server-side
   from Spotify's public track page. No secret, no auth. This is the one
   architectural change: the project is no longer strictly single-file.
5. **Demo catalog**: removed RapCaviar, added 11 new playlists/albums
   (titles resolved via Spotify's oEmbed). Current order in
   `DEMO_PLAYLISTS` (in `index.html`):
   1. Today's Top Hits
   2. Purple Rain *(album, not playlist)*
   3. This Is The Strokes
   4. autumn vintage jazz
   5. This Is Rihanna
   6. The Lord of the Rings Full Soundtrack
   7. This Is Frank Ocean
   8. This Is beabadoobee
   9. Spider-Verse: The Official Playlist
   10. This Is Michael Jackson
   11. Early 2010s Nostalgia
   12. This is: TDE
6. **First-visit acknowledgement modal** (`#demoNotice`): explains only the
   developer's Spotify account can log in, lists demo limits, single
   "Continue" button (no "Try the Demo" shortcut button — removed per
   request) styled with `var(--sel)` so it always matches the iPod's own
   selection-highlight blue. Remembered via `localStorage` key
   `ipod.demoNoticeAcked` so it only shows once per browser.
7. **Demo-mode hint text**: the on-screen instructions line now appends
   "Spotify disables skipping forward or backward for this demo" only while
   `demoMode` is true (`updateHint()`).
8. **Mobile emoji bug fixed**: the click-wheel's prev/next/play glyphs
   (`⏮ ⏭ ▶ ⏸`) default to colorful emoji presentation on phones. Fixed by
   appending the Unicode text-presentation selector (`U+FE0E`) after each.
9. **Shark sticker (`megalodon-sticker.svg`) fixed**: it looked low-res on
   mobile — not actually a raster issue, but the hand-drawn "wobble" SVG
   filter rasterizing at too low a resolution for its fine detail (teeth,
   gill lines). Fixed by re-authoring the whole file at 4x its internal
   coordinate scale (viewBox `312×312` instead of `78×78`) while keeping the
   same on-screen size, so the filter has much more resolution to work with.
10. **Desktop centering bug fixed**: the iPod sat too close to the top of
    the window. Two stacked causes — the shell-color swatches were
    deliberately kept out of the centered flex flow (so adding them
    wouldn't shift the iPod), which meant the browser only ever centered
    iPod+footer and let the swatches hang below "for free"; and, underneath
    that, `body`'s `min-height: 100%` never actually resolved to full
    viewport height at all (a real CSS quirk, predates this session) so the
    whole page was just shrink-wrapped and top-aligned regardless. Fixed by
    grouping footer+swatches into one centered `.footer-group`, and
    switching `html, body` to `min-height: 100vh`.

## Open / deferred

- **"Classic" UI theme** (mimics the 2004 click-wheel iPod): discussed,
  not started. Recommended approach when picked back up: add it as a third
  option in Settings → Display (alongside Light/Dark Mode), reusing the
  existing `THEMES` array + `applyTheme()` + CSS custom-property mechanism
  — just a new monochrome blue-tinted LCD color set, maybe a pixel font.
  Explicitly *not* meant to touch the physical shell/chassis (that's a
  bigger, separate project that would touch the frozen layout math in
  `CLAUDE.md`'s Layout rules — out of scope unless asked for specifically).
- No other known bugs as of the end of this session.
