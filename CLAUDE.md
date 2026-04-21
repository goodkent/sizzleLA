# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

No build process. This is a static HTML/CSS/JS site — serve it locally with:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. There are no npm packages, no bundler, and no CI pipeline. GitHub Pages deploys automatically on push to `main`.

## Architecture

**Sizzle LA** is a frontend-only single-page app for exploring curated LA locations. No backend.

### Data flow

1. `index.html` loads on page init
2. `static/js/sizzle_map.js` fetches `data/places.json`
3. Places are parsed → cuisine filter populated → Leaflet markers rendered
4. User interactions (filter, geolocation, favorites, share) update map state in place

### Key files

| File | Role |
|------|------|
| `index.html` | Main shell — imports CDN libs, inline GA snippet, cookie consent script |
| `static/js/sizzle_map.js` | All app logic (~1,050 lines) — map init, filtering, popups, sharing, analytics |
| `static/css/style.css` | All styling — mobile-first, responsive |
| `data/places.json` | Source of truth for every location |

### State

- **Favorites**: a `Set` persisted to `localStorage` as JSON (`key: "sizzleFavorites"`)
- **Cookie consent**: `localStorage` flag (`key: "cookieConsent"`) — Google Analytics events only fire when consent is `"accepted"`
- No global state object; state lives in module-level variables in `sizzle_map.js`

### Mapping stack

- **Leaflet.js** (v1.9.4) — interactive map centered on LA (`34.0522, -118.2437`, zoom 11)
- **Esri Leaflet** (v3.0.12) — queries LA Times Neighborhoods ArcGIS feature layer for neighborhood boundary overlays and point-in-polygon lookups
- Tile layer: ArcGIS World Topo Map

### Key subsystems in `sizzle_map.js`

- **Filtering**: type buttons (All / Restaurants / Cafés / Bars / Plants / Vinyl / Favorites) + conditional cuisine dropdown; filter state drives `map.eachLayer`
- **Popups**: dynamically built HTML per place — includes event/deal status, favorite toggle, share button
- **Event/Deal system**: `getEventStatus()` returns `starting-soon | live-now | ending-soon | null` based on current time; sponsored places get an animated ring marker
- **Geolocation**: browser Geolocation API → places a circle marker; handled in `locateUser()`
- **Sharing**: URL query param (`?place=Name`) for deep-linking; meta OG/Twitter tags updated dynamically for rich previews; Web Share API with clipboard fallback
- **Analytics**: `trackEvent(category, action, label)` wraps `gtag` — silently no-ops if consent not given

### Adding a new place

Add an entry to `data/places.json`. The shape used by existing entries is the schema — no migration or rebuild needed.

### `claude/` directory

Internal implementation notes (not committed to the public repo per `.gitignore`). Contains ~20 markdown files documenting specific features (GA setup, Safari viewport fixes, rich link previews, etc.). Useful reference when modifying those subsystems.
