# DialTunes demo mode — context

This folder (`DialTune Deploy`) is the live project, deployed to
`https://dialtunes.vercel.app/` via `npx vercel --prod`. It started as a copy
of the working, signed-in-only iPod built in a separate `ipod` folder (left
alone on purpose, as a landmark of that milestone — not kept in sync).
Everything below is what changed on top of that copy, and why.

## The constraint that started all of this

The Spotify app (`CLIENT_ID` in `index.html`) is registered in **Development
Mode**, which caps it at 5 allowlisted Spotify accounts. Anyone else who opens
the site can't log in at all — they'd just hit a wall. "Demo mode" exists so
a visitor who isn't on that list can still see the iPod actually play music,
without needing Spotify login.

## Why demo mode is a different code path, not a fallback inside the real one

The signed-in iPod plays music via the **Web Playback SDK** (`sdk.scdn.co`),
which requires an OAuth access token — there's no version of that SDK that
works without login. So demo mode instead uses Spotify's **embed iFrame
API** (`open.spotify.com/embed/iframe-api/v1`), a completely separate
mechanism meant for playing a track/playlist widget on any page without
authentication. It's hardcoded to two public playlists (Today's Top Hits,
RapCaviar) since there's no logged-in user to have a personal library for.

This is why demo mode has its own state (`demoMode`, `demoController`, etc.),
its own menu branches, and its own playback functions (`playDemoUri`,
`demoCall`) instead of reusing `playSpec`/`playerCall` — the two playback
engines don't share an interface.

## Limitations that are the platform's, not bugs in this app

These came up while building demo mode and are **not fixable** from our
side — they're what the embed iFrame API actually allows (confirmed against
its own docs, not assumed):

- **No skip forward/back.** The embed controller's full method list is
  `loadUri / play / pause / resume / togglePlay / restart / seek / destroy`.
  There's no "next track" or "previous track" call. The Now Playing screen's
  prev/next buttons still click (so the click wheel doesn't feel broken) but
  are otherwise no-ops in demo mode.
- **Preview-length playback, not full songs.** Anonymous/logged-out embed
  playback gives ~20-30 second clips per track, confirmed by watching actual
  `playback_update` events (e.g. a track reporting a 23s or 28s duration,
  then auto-advancing to the next track in the playlist on its own — the
  embed widget keeps moving through the playlist by itself, just in short
  clips). The signed-in path, with real OAuth + Premium, gets full tracks.
- **No Artists / Songs / Shuffle / Repeat.** None of these exist without a
  logged-in library. Rather than a dead "Not in the demo" stub, Artists and
  Songs now fall through to the same "Connect Spotify" prompt a logged-out
  user already sees elsewhere, and Shuffle/Repeat are hidden from Settings
  entirely in demo mode (the embed API has no equivalent calls to make them
  do anything).

## Bugs that were real and got fixed

- **The embed widget briefly showed up on-screen, clashing with the shell
  swatches, and pushed the footer/instructions down.** Root cause: Spotify's
  `createController()` takes over the size/style of whatever container
  element you hand it once it initializes — any hiding styles set directly
  on that element don't survive. Fixed by wrapping it in an outer
  `#demo-embed-wrap` div that Spotify's code never touches, and putting the
  `position:fixed; left:-9999px` hiding there instead.
- **Playback then silently never started at all.** Once that wrapper
  correctly moved the widget fully off-screen, Spotify's auto-generated
  iframe (which has `loading="lazy"` baked in) never actually loaded —
  native lazy-loading only fires near the viewport, and `-9999px` never
  qualifies. Fixed by stripping the `loading` attribute right after the
  controller is created.
- **Now Playing showed no artist name.** The embed API's `playback_update`
  event gives position/duration/paused but never track metadata. Title and
  album art come from Spotify's public oEmbed endpoint (CORS-friendly, meant
  for exactly this), but oEmbed's response has no artist field at all —
  confirmed by querying it directly. The artist *is* on Spotify's public
  track page (a `music:musician_description` meta tag), but that page sends
  no CORS headers, so a browser can't read it directly. Fixed with a new
  file, `api/track-meta.js` — a small Vercel serverless function that
  fetches that page server-side (no CORS issue there) and returns just the
  artist name. No secret, no auth; it's a plain public-page fetch. This is
  the one architectural change: the project goes from strictly one file to
  `index.html` + one API route. Deploying is unaffected — `vercel --prod`
  picks up `/api` with zero config.
- **Liked Songs could send an unbounded request.** `cache.trackUris` is a
  single array that keeps growing as more pages lazy-load, and every track's
  "play" spec held a live reference to the *whole* array plus an offset. For
  a large library, tapping a song could send hundreds or thousands of URIs
  to `/me/player/play`. Spotify doesn't document a hard cap, but real-world
  reports confirm the practical limit is well under that. Fixed by windowing
  to 100 tracks starting at the tapped one before sending the request
  (signed-in path only — demo mode doesn't have Liked Songs).

## Files added

- `api/track-meta.js` — see above. Scrapes one meta tag from a public
  Spotify page; 5s timeout; validates the track ID shape before fetching
  anything, so it can't be used as an open proxy for arbitrary URLs.
