# DialTunes

A browser recreation of the classic click-wheel iPod that plays music from Spotify.

**Live:** https://dialtunes.vercel.app

## Features
- Drag-to-scroll click wheel with center select, MENU back, and keyboard support
- Now Playing screen that tints to the album art
- Six shell colors and light/dark screen modes
- Paged library loading to handle large Spotify libraries

## Demo and login limits
- **Full login** uses Spotify's PKCE flow, but Spotify's development mode limits login to 5 accounts.
- **Public demo** uses Spotify's embed player and plays 20–30 second previews only. No skipping songs. 

## Tech
HTML, CSS, JavaScript, Spotify Web API, Web Playback SDK, Vercel serverless function.
