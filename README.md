# 🔥 Sizzle Map - Your LA Food & Fun Guide

A mobile-friendly web application for exploring curated LA locations including restaurants, cafes, bars, plant shops, and vinyl record stores.

## Project Structure

```
sizzlela/
├── index.html              # Main HTML file
├── data/
│   └── places.json         # Curated list of LA places
├── static/
│   ├── css/
│   │   └── style.css       # All styling (Sizzle LA brand colors)
│   ├── js/
│   │   └── sizzle_map.js   # Map logic and interactivity
│   └── img/
│       ├── logo.png        # Sizzle LA logo
│       └── banner.png      # Banner image
└── README.md
```

## Features

- 📍 **Geolocation** - Find your current location on the map
- 🗺️ **Interactive Leaflet.js Map** - Smooth, mobile-optimized mapping
- 🎨 **Thick Rounded Border** - Styled with Sizzle LA brand colors (orange/blue gradient)
- 🎯 **Smart Filtering** - Toggle between place types (restaurants, cafes, bars, plants, vinyl)
- 🍜 **Cuisine Filter** - Filter restaurants by cuisine type
- 🎨 **Custom Markers** - Color-coded emoji icons for each place type
- 💬 **Rich Popups** - Detailed info with ratings, pricing, and links
- 📱 **Mobile Optimized** - Perfect for exploring LA on your phone

## How to Run

### Option 1: Simple Local Server (Python)

```bash
# Navigate to the project directory
cd /Users/knts/projects/sizzlela

# Start a local server (Python 3)
python3 -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Option 2: VS Code Live Server
1. Open the project folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` and select "Open with Live Server"

### Option 3: Direct File Access
Simply open `index.html` in your browser. However, you may encounter CORS issues when loading `places.json`. Use one of the server options above for best results.

## Customizing Your Places

Edit `data/places.json` to add your own favorite LA spots. Structure:

```json
{
  "name": "Place Name",
  "type": "restaurant",      // restaurant, cafe, bar, plant, or vinyl
  "cuisine": "Italian",       // Only for restaurants (optional)
  "lat": 34.0522,            // Latitude
  "lng": -118.2437,          // Longitude
  "description": "Why you love this place",
  "address": "123 Main St",   // Optional
  "phone": "(123) 456-7890",  // Optional
  "price": "$$$",             // $, $$, $$$, or $$$$
  "rating": "4.5",            // Optional
  "ratingSource": "Google",   // Optional
  "link": "https://..."       // Optional (OpenTable, website, etc.)
}
```

### Getting Coordinates

**Right-click in Google Maps:**
1. Right-click on any location
2. Click the coordinates at the top to copy
3. First number = latitude, second = longitude

## Design Theme

Based on the Sizzle LA logo with:
- **Orange/Yellow Gradient**: Headers, active buttons, popups (`#FF6B35` to `#F7931E`)
- **Blue Accents**: Location button, map border details (`#2BC0E4` to `#1a3a52`)
- **Clean White Background**: Modern, fresh look
- **Thick Rounded Border**: 8px orange border with 30px border-radius on map

## Technologies

- **Leaflet.js** - Interactive mapping library
- **OpenStreetMap** - Map tile provider
- **Vanilla JavaScript** - No frameworks required
- **CSS3** - Modern styling with gradients and animations

## Browser Support

Works best in modern browsers:
- Chrome/Edge (recommended)
- Safari
- Firefox
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Mobile Deployment

### For iPhone/iPad:
1. Host on GitHub Pages, Netlify, or Vercel (free)
2. Open in Safari on your device
3. Tap the Share button → "Add to Home Screen"
4. Access like a native app!

### For Android:
1. Host the site online
2. Open in Chrome
3. Tap the menu → "Add to Home Screen"

## File Details

### index.html
- Minimal inline JavaScript (only for loading scripts)
- Semantic HTML structure
- Links to external CSS and JS files

### static/css/style.css
- All styling organized by sections
- Responsive design with mobile breakpoints
- Custom Leaflet popup styling
- Thick rounded border for map container

### static/js/sizzle_map.js
- Leaflet map initialization
- Custom marker icons for each place type
- Filter logic (type and cuisine)
- Geolocation functionality
- Popup content generation
- JSON data loading

### data/places.json
- Structured data for 20+ curated LA locations
- Easily extensible for more places


## Tips & Tricks

1. **Keep descriptions concise** - They display in mobile popups
2. **Use OpenTable links** for easy restaurant reservations
3. **Start with favorites** - Add 10-15 places you visit regularly
4. **Update as you discover** - Easy to add new places to JSON
5. **Include insider tips** - "Cash only", "Reservations required", etc.

## Troubleshooting

**Map not loading?**
- Ensure you're running a local server (not file://)
- Check browser console for errors
- Verify internet connection (map tiles load from CDN)

**Places not showing?**
- Check `data/places.json` syntax at jsonlint.com
- Ensure lat/lng are numbers, not strings
- Verify file path is correct

**Geolocation not working?**
- Grant location permissions when prompted
- Works best over HTTPS (use a hosting service for mobile)

**Filters not working?**
- Check browser console for JavaScript errors
- Ensure `sizzle_map.js` loaded successfully

## Future Enhancements

Ideas for extending the app:
- Search functionality
- Distance calculations from current location
- Favorites system with localStorage
- User notes/ratings
- Photo galleries
- Dark mode
- Export to Google Maps

---

Made with ❤️ for exploring LA 🔥🌴🌮
