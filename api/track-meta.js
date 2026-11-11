// Returns the artist name for a Spotify track, for demo mode's Now Playing
// screen. Scraped server-side from Spotify's public track page (its
// music:musician_description meta tag) because that page doesn't send
// CORS headers for a browser to read directly, and the oEmbed endpoint
// (used client-side for title + art) has no artist field at all. No
// login, no client secret — just a plain fetch of a public page.
module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9]{22}$/.test(id)) {
    res.status(400).json({ error: 'invalid track id' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch(`https://open.spotify.com/track/${id}`, { signal: controller.signal });
    clearTimeout(timeout);
    const html = await upstream.text();
    const m = html.match(/<meta name="music:musician_description" content="([^"]*)"/);
    const artist = m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : null;
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).json({ artist });
  } catch (e) {
    res.status(200).json({ artist: null });
  }
};
