// Wait for window and all scripts to load
window.onload = function() {
    // Define gtag globally if not already defined
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){dataLayer.push(arguments);};
    
    // Cookie Consent Management
    function checkCookieConsent() {
        const consent = localStorage.getItem('cookieConsent');
        return consent === 'accepted';
    }

    function showCookieBanner() {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            const banner = document.getElementById('cookie-banner');
            setTimeout(() => banner.classList.add('show'), 500);
        }
    }

    // Initialize Google Analytics only if consent given
    function initializeAnalytics() {
        if (checkCookieConsent()) {
            gtag('js', new Date());
            gtag('config', 'G-EXH28WZK3T');
            console.log('Google Analytics initialized');
        }
    }

    // Event tracking helper
    function trackEvent(eventName, eventParams = {}) {
        if (checkCookieConsent()) {
            gtag('event', eventName, eventParams);
            console.log('Event tracked:', eventName, eventParams);
        } else {
            console.log('Event not tracked (no consent):', eventName, eventParams);
        }
    }

    // Update meta tags for specific place (for rich link previews)
    function updateMetaTags(place) {
        // Update title
        document.title = `${place.name} - Sizzle LA`;
        
        // Helper to update or create meta tag
        function updateMetaTag(property, content, useNameAttr = false) {
            const attr = useNameAttr ? 'name' : 'property';
            let element = document.querySelector(`meta[${attr}="${property}"]`);
            
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attr, property);
                document.head.appendChild(element);
            }
            
            element.setAttribute('content', content);
        }
        
        // Create description
        const description = `${place.description} Located in ${place.neighborhood || 'Los Angeles'}.`;
        
        // Update Open Graph tags
        updateMetaTag('og:title', `${place.name} - Sizzle LA`);
        updateMetaTag('og:description', description);
        updateMetaTag('og:url', window.location.href);
        
        // Update Twitter tags
        updateMetaTag('twitter:title', `${place.name} - Sizzle LA`, true);
        updateMetaTag('twitter:description', description, true);
        
        // Update SEO description
        updateMetaTag('description', description, true);
    }

    // Cookie consent handlers
    document.getElementById('accept-cookies').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        document.getElementById('cookie-banner').classList.remove('show');
        initializeAnalytics();
        trackEvent('cookie_consent', { consent_type: 'accepted' });
    });

    document.getElementById('decline-cookies').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        document.getElementById('cookie-banner').classList.remove('show');
        trackEvent('cookie_consent', { consent_type: 'declined' });
    });

    document.getElementById('cookie-settings').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('cookieConsent');
        showCookieBanner();
        trackEvent('cookie_settings_opened');
    });

    // Initialize analytics and show banner
    initializeAnalytics();
    showCookieBanner();

    // Favorites Management
    const favorites = new Set(JSON.parse(localStorage.getItem('sizzleFavorites') || '[]'));

    function saveFavorites() {
        localStorage.setItem('sizzleFavorites', JSON.stringify([...favorites]));
    }

    function toggleFavorite(placeName) {
        if (favorites.has(placeName)) {
            favorites.delete(placeName);
            trackEvent('favorite_removed', { place_name: placeName });
        } else {
            favorites.add(placeName);
            trackEvent('favorite_added', { place_name: placeName });
        }
        saveFavorites();
        return favorites.has(placeName);
    }

    function isFavorite(placeName) {
        return favorites.has(placeName);
    }
    
    // Check URL parameters for shared place
    function checkSharedPlace() {
        // Try multiple ways to get the URL parameter (for cross-browser compatibility)
        const urlParams = new URLSearchParams(window.location.search);
        let placeName = urlParams.get('place');
        
        // Fallback: parse URL manually if URLSearchParams doesn't work
        if (!placeName && window.location.search) {
            const match = window.location.search.match(/[?&]place=([^&]+)/);
            if (match) {
                placeName = decodeURIComponent(match[1]);
            }
        }
        
        console.log('=== SHARED PLACE CHECK ===');
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Place name from URL:', placeName);
        console.log('All places loaded:', allPlaces.length);
        console.log('Markers created:', markers.length);
        
        if (placeName && allPlaces.length > 0) {
            const place = allPlaces.find(p => p.name === placeName);
            console.log('Found place data:', place);
            
            if (place) {
                // Update meta tags for this specific place
                updateMetaTags(place);
                
                console.log('Setting map view to:', place.lat, place.lng);
                
                // Function to open the marker
                const openMarker = () => {
                    console.log('Attempting to open marker, markers available:', markers.length);
                    let markerFound = false;
                    
                    markers.forEach((marker, index) => {
                        if (marker.options.title === place.name) {
                            console.log('✓ Opening marker for:', place.name);
                            
                            // Open popup and keep it open
                            marker.openPopup();
                            
                            // Track the event
                            trackEvent('place_popup_opened', {
                                place_name: place.name,
                                place_type: place.type,
                                cuisine: place.cuisine || '',
                                source: 'shared_link'
                            });
                            
                            markerFound = true;
                        }
                    });
                    
                    if (!markerFound) {
                        console.log('✗ Marker not found in', markers.length, 'markers');
                    }
                    
                    return markerFound;
                };
                
                // Set view with animation disabled
                map.setView([place.lat, place.lng], 17, {
                    animate: false
                });
                
                // Use Leaflet's moveend event - fires when map finishes moving/zooming
                map.once('moveend', function() {
                    console.log('Map moveend event fired, opening marker...');
                    
                    // Try immediately
                    if (!openMarker()) {
                        // If markers not ready, wait a bit
                        setTimeout(() => {
                            if (!openMarker()) {
                                // One more attempt
                                setTimeout(openMarker, 300);
                            }
                        }, 300);
                    }
                });
                
                // Fallback: if moveend doesn't fire, try after delay
                setTimeout(() => {
                    console.log('Fallback timer triggered');
                    openMarker();
                }, 1000);
            } else {
                console.log('✗ Place not found in data:', placeName);
            }
        } else {
            console.log('No shared place in URL or data not loaded yet');
        }
    }
    
    // Initialize map centered on LA
    const map = L.map('map').setView([34.0522, -118.2437], 11);

    // Add tile layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 19
    }).addTo(map);
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '© OpenStreetMap contributors',
    //     maxZoom: 19
    // }).addTo(map);

    // Add LA Neighborhoods Layer from ArcGIS
    const neighborhoodColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8',
        '#5DADE2', '#F1948A', '#85929E', '#82E0AA', '#F8C471'
    ];
    
    let colorIndex = 0;
    const neighborhoodColorMap = new Map();
    
    const neighborhoodsLayer = L.esri.featureLayer({
        url: 'https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_Times_Neighborhoods/FeatureServer/0',
        style: function(feature) {
            const name = feature.properties.name || feature.properties.Name;
            
            // Assign consistent color to each neighborhood
            if (!neighborhoodColorMap.has(name)) {
                neighborhoodColorMap.set(name, neighborhoodColors[colorIndex % neighborhoodColors.length]);
                colorIndex++;
            }
            
            return {
                fillColor: neighborhoodColorMap.get(name),
                fillOpacity: 0.15,
                color: neighborhoodColorMap.get(name),
                weight: 2,
                opacity: 0.4
            };
        }
    }).addTo(map);

    // Store markers and user location
    let markers = [];
    let userMarker = null;
    let allPlaces = [];

    // Custom icons for different place types
    const icons = {
        restaurant: L.divIcon({
            html: '<div style="background: #ff6b6b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🍽️</div>',
            className: '',
            iconSize: [30, 30]
        }),
        cafe: L.divIcon({
            html: '<div style="background: #a0522d; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">☕</div>',
            className: '',
            iconSize: [30, 30]
        }),
        bar: L.divIcon({
            html: '<div style="background: #9b59b6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🍸</div>',
            className: '',
            iconSize: [30, 30]
        }),
        plant: L.divIcon({
            html: '<div style="background: #27ae60; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🌿</div>',
            className: '',
            iconSize: [30, 30]
        }),
        vinyl: L.divIcon({
            html: '<div style="background: #e74c3c; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎵</div>',
            className: '',
            iconSize: [30, 30]
        })
    };

    // Load places from JSON
    async function loadPlaces() {
        try {
            const response = await fetch('data/places.json');
            allPlaces = await response.json();
            
            // Populate cuisine filter
            populateCuisineFilter();
            
            // Display all places initially
            displayPlaces(allPlaces);
            
            // Check if URL has a shared place parameter
            checkSharedPlace();
        } catch (error) {
            console.error('Error loading places:', error);
            alert('Could not load places data. Make sure data/places.json exists.');
        }
    }

    // Populate cuisine dropdown
    function populateCuisineFilter() {
        const cuisines = new Set();
        allPlaces.forEach(place => {
            if (place.type === 'restaurant' && place.cuisine) {
                cuisines.add(place.cuisine);
            }
        });
        
        const select = document.getElementById('cuisine-filter');
        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            select.appendChild(option);
        });
    }

    // // Display places on map
    // function displayPlaces(places) {
    //     // Clear existing markers
    //     markers.forEach(marker => map.removeLayer(marker));
    //     markers = [];

    //     // Add new markers
    //     places.forEach(place => {
    //         // Skip places with missing coordinates
    //         if (!place.lat || !place.lng) {
    //             console.warn('Skipping place with missing coordinates:', place.name);
    //             return;
    //         }
            
    //         const marker = L.marker([place.lat, place.lng], {
    //             icon: icons[place.type],
    //             title: place.name  // Add title so we can find marker later
    //         });

    //         // Function to create popup content
    //         function createPopupContent(neighborhoodName = '') {
    //             const isFav = isFavorite(place.name);
    //             const shareUrl = `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(place.name)}`;
                
    //             return `
    //                 <div class="popup-content">
    //                     <div class="popup-title">${place.name}</div>
    //                     <div class="popup-type">${place.type.toUpperCase()}${place.cuisine ? ' • ' + place.cuisine : ''}</div>
    //                     ${neighborhoodName ? `<div class="popup-neighborhood">📍 ${neighborhoodName}</div>` : ''}
    //                     <div class="popup-description">${place.description}</div>
    //                     <div class="popup-info">
    //                         ${place.phone ? `<div class="popup-info-item">📞 ${place.phone}</div>` : ''}
    //                         ${place.address ? `<div class="popup-info-item">📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}" target="_blank" class="address-link" title="Open in Google Maps">${place.address}</a></div>` : ''}
    //                         ${place.price ? `<div class="popup-info-item">💰 <span class="price-rating">${place.price}</span></div>` : ''}
    //                         ${place.rating ? `<div class="popup-info-item"><span class="star-rating">⭐ ${place.rating}</span> ${place.ratingSource || ''}</div>` : ''}
    //                     </div>
    //                     <div class="popup-actions">
    //                         <div class="popup-actions-left">
    //                             ${place.link ? `<a href="${place.link}" target="_blank" class="popup-link">Website</a>` : ''}
    //                         </div>
    //                         <div class="popup-actions-right">
    //                             <button class="popup-action-btn favorite-btn ${isFav ? 'favorited' : ''}" data-place="${place.name}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
    //                                 ${isFav ? '❤️' : '🤍'}
    //                             </button>
    //                             <button class="popup-action-btn share-btn" data-place="${place.name}" data-url="${shareUrl}" title="Share this place">
    //                                 📤
    //                             </button>
    //                         </div>
    //                     </div>
    //                 </div>
    //             `;
    //         }

    //         // Bind initial popup
    //         marker.bindPopup(createPopupContent());

    //         // Query neighborhood when popup opens
    //         marker.on('popupopen', function() {
    //             console.log('Popup opened for:', place.name);
    //             console.log('Querying at coordinates:', place.lat, place.lng);
                
    //             // Track popup open
    //             trackEvent('place_popup_opened', {
    //                 place_name: place.name,
    //                 place_type: place.type,
    //                 cuisine: place.cuisine || 'N/A'
    //             });
                
    //             // Add event listeners for action buttons
    //             setTimeout(() => {
    //                 const favoriteBtn = document.querySelector('.favorite-btn');
    //                 const shareBtn = document.querySelector('.share-btn');
                    
    //                 if (favoriteBtn) {
    //                     favoriteBtn.addEventListener('click', function() {
    //                         const placeName = this.dataset.place;
    //                         const nowFavorited = toggleFavorite(placeName);
                            
    //                         // Update button appearance
    //                         if (nowFavorited) {
    //                             this.classList.add('favorited');
    //                             this.innerHTML = '❤️';
    //                             this.title = 'Remove from favorites';
    //                         } else {
    //                             this.classList.remove('favorited');
    //                             this.innerHTML = '🤍';
    //                             this.title = 'Add to favorites';
    //                         }
    //                     });
    //                 }
                    
    //                 if (shareBtn) {
    //                     shareBtn.addEventListener('click', async function() {
    //                         const placeName = this.dataset.place;
    //                         const shareUrl = this.dataset.url;
                            
    //                         trackEvent('share_clicked', {
    //                             place_name: placeName,
    //                             place_type: place.type
    //                         });
                            
    //                         // Try Web Share API first
    //                         if (navigator.share) {
    //                             try {
    //                                 await navigator.share({
    //                                     title: `Check out ${placeName} on Sizzle LA`,
    //                                     text: `I found this great place: ${placeName}`,
    //                                     url: shareUrl
    //                                 });
    //                                 trackEvent('share_success', {
    //                                     place_name: placeName,
    //                                     method: 'web_share_api'
    //                                 });
    //                             } catch (err) {
    //                                 if (err.name !== 'AbortError') {
    //                                     console.log('Share failed:', err);
    //                                 }
    //                             }
    //                         } else {
    //                             // Fallback: copy to clipboard
    //                             try {
    //                                 await navigator.clipboard.writeText(shareUrl);
    //                                 alert('Link copied to clipboard!');
    //                                 trackEvent('share_success', {
    //                                     place_name: placeName,
    //                                     method: 'clipboard'
    //                                 });
    //                             } catch (err) {
    //                                 console.error('Failed to copy:', err);
    //                                 alert('Could not copy link. Please copy manually: ' + shareUrl);
    //                             }
    //                         }
    //                     });
    //                 }
    //             }, 100);
                
    //             // Create a proper L.LatLng object for the query
    //             const point = L.latLng(place.lat, place.lng);
                
    //             // Query the neighborhoods layer to find which one contains this point
    //             neighborhoodsLayer.query()
    //                 .contains(point)
    //                 .run(function(error, featureCollection) {
    //                     console.log('Query completed');
    //                     console.log('Error:', error);
    //                     console.log('Features found:', featureCollection);
                        
    //                     if (!error && featureCollection && featureCollection.features && featureCollection.features.length > 0) {
    //                         // Get the first neighborhood found
    //                         const feature = featureCollection.features[0];
    //                         const neighborhoodName = feature.properties.name || feature.properties.Name || '';
                            
    //                         console.log('Neighborhood found:', neighborhoodName);
                            
    //                         if (neighborhoodName) {
    //                             // Update popup content with neighborhood
    //                             marker.setPopupContent(createPopupContent(neighborhoodName));
    //                         }
    //                     } else {
    //                         console.log('No neighborhood found for this location');
    //                     }
    //                 });
    //         });

    //         marker.addTo(map);
    //         markers.push(marker);
    //     });
    // }
// Display places on map
function displayPlaces(places) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add new markers
    places.forEach(place => {
        // Skip places with missing coordinates
        if (!place.lat || !place.lng) {
            console.warn('Skipping place with missing coordinates:', place.name);
            return;
        }
        
        // Get event/deal status classes
        const statusClasses = getEventClasses(place);
        
        // Create custom icon with event status wrapper
        const typeEmojis = {
            restaurant: '🍽️',
            cafe: '☕',
            bar: '🍸',
            plant: '🌿',
            vinyl: '🎵'
        };
        
        const emoji = typeEmojis[place.type] || '📍';
        
        // Create icon HTML with event wrapper - with sponsored ring support
       
        const iconHtml = `
            <div class="event-marker-wrapper ${statusClasses}">
                ${place.is_sponsored && statusClasses.includes('deal-active') ? '<div class="sponsored-ring"></div>' : ''}
                <div class="marker-icon" style="background: ${getTypeColor(place.type)}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
                    ${emoji}
                </div>
            </div>
        `;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15],  // Center anchor
            popupAnchor: [0, -15]  // Popup appears above
        });
        
        const marker = L.marker([place.lat, place.lng], {
            icon: customIcon,
            title: place.name
        });

        // Function to create popup content
       // Function to create popup content
function createPopupContent(neighborhoodName = '') {
    const isFav = isFavorite(place.name);
    const shareUrl = `${window.location.origin}${window.location.pathname}?place=${encodeURIComponent(place.name)}`;
    
    // Build event section if active
    let eventSection = '';
    if (place.event_start && place.event_end) {
        const eventStatus = getEventStatus(place.event_start, place.event_end);
        if (eventStatus) {
            const eventTime = formatEventTime(place.event_start, place.event_end);
            const eventColors = {
                'starting-soon': { bg: '#FFF9E6', border: '#FFC107', text: '#8B7000' },
                'live-now': { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
                'ending-soon': { bg: '#FFEBEE', border: '#f44336', text: '#C62828' }
            };
            const colors = eventColors[eventStatus];
            
            eventSection = `
                <div style="background: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 8px 10px; margin: 10px 0; border-radius: 6px;">
                    <div style="font-size: 11px; font-weight: 700; color: ${colors.text}; text-transform: uppercase; margin-bottom: 3px;">
                        ${eventStatus === 'starting-soon' ? '🟡 Event Starting Soon' : eventStatus === 'live-now' ? '🟢 Event Live Now' : '🔴 Event Ending Soon'}
                    </div>
                    ${place.event_name ? `<div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 2px;">${place.event_name}</div>` : ''}
                    <div style="font-size: 11px; color: #666;">${eventTime}</div>
                    ${place.event_description ? `<div style="font-size: 11px; color: #555; margin-top: 3px;">${place.event_description}</div>` : ''}
                </div>
            `;
        }
    }
    
    // Build deal section - show if deal exists and not expired
    let dealSection = '';
    if (place.deal_title || place.deal_description) {
        // Check if deal has ended (if deal_end exists)
        let dealExpired = false;
        if (place.deal_end) {
            const now = new Date();
            const dealEnd = new Date(place.deal_end);
            dealExpired = now > dealEnd;
        }
        
        // Show deal if not expired (or no end date = always active)
        if (!dealExpired) {
            let dealTimeText = '';
            
            // Show time range if both start and end exist
            if (place.deal_start && place.deal_end) {
                dealTimeText = formatEventTime(place.deal_start, place.deal_end);
            } 
            // Show "starts at" if only start exists
            else if (place.deal_start) {
                const start = new Date(place.deal_start);
                dealTimeText = `Starts ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
            }
            // No time = ongoing deal
            else {
                dealTimeText = 'Ongoing';
            }
            
            dealSection = `
                <div style="background: linear-gradient(135deg, #E3F2FD 0%, #B3E5FC 100%); border-left: 4px solid #2BC0E4; padding: 8px 10px; margin: 10px 0 8px 0; border-radius: 6px;">
                    <div style="font-size: 11px; font-weight: 700; color: #0277BD; text-transform: uppercase; margin-bottom: 3px;">
                        💰 ${place.deal_title || 'Special Deal'}
                    </div>
                    ${place.deal_description ? `<div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 2px;">${place.deal_description}</div>` : ''}
                    <div style="font-size: 11px; color: #666;">${dealTimeText}</div>
                    ${place.deal_recurring ? `<div style="font-size: 10px; color: #0288D1; margin-top: 3px; font-style: italic;">♻️ Recurring ${place.deal_recurrence_pattern ? place.deal_recurrence_pattern.replace('weekly_', '').replace('_', ' ') : ''}</div>` : ''}
                </div>
            `;
        }
    }
    
    return `
        <div class="popup-content">
            <div class="popup-title">${place.name}</div>
            <div class="popup-type">${place.type.toUpperCase()}${place.cuisine ? ' • ' + place.cuisine : ''}</div>
            ${place.is_sponsored ? '<div class="popup-type" style="background: #FF6B35; margin-top: 4px;">⭐ SPONSORED</div>' : ''}
            ${neighborhoodName ? `<div class="popup-neighborhood">📍 ${neighborhoodName}</div>` : ''}
            <div class="popup-description" style="margin-bottom: 8px;">${place.description}</div>
            
            ${eventSection}
            ${dealSection}
            
            <div class="popup-info" style="margin-top: 8px;">
                ${place.phone ? `<div class="popup-info-item">📞 ${place.phone}</div>` : ''}
                ${place.address ? `<div class="popup-info-item">📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}" target="_blank" class="address-link" title="Open in Google Maps">${place.address}</a></div>` : ''}
                ${place.price ? `<div class="popup-info-item">💰 <span class="price-rating">${place.price}</span></div>` : ''}
                ${place.rating ? `<div class="popup-info-item"><span class="star-rating">⭐ ${place.rating}</span> ${place.ratingSource || ''}</div>` : ''}
            </div>
            <div class="popup-actions">
                <div class="popup-actions-left">
                    ${place.link ? `<a href="${place.link}" target="_blank" class="popup-link">Website</a>` : ''}
                </div>
                <div class="popup-actions-right">
                    <button class="popup-action-btn favorite-btn ${isFav ? 'favorited' : ''}" data-place="${place.name}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                    <button class="popup-action-btn share-btn" data-place="${place.name}" data-url="${shareUrl}" title="Share this place">
                        📤
                    </button>
                </div>
            </div>
        </div>
    `;
}
        // Bind initial popup
        marker.bindPopup(createPopupContent());

       // Query neighborhood when popup opens
marker.on('popupopen', function() {
    console.log('Popup opened for:', place.name);
    console.log('Querying at coordinates:', place.lat, place.lng);
    
    // Track popup open
    trackEvent('place_popup_opened', {
        place_name: place.name,
        place_type: place.type,
        cuisine: place.cuisine || 'N/A',
        source: 'map_click'
    });
    
    // Add event listeners for action buttons
    setTimeout(() => {
        const favoriteBtn = document.querySelector('.favorite-btn');
        const shareBtn = document.querySelector('.share-btn');
        
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', function() {
                const placeName = this.dataset.place;
                const nowFavorited = toggleFavorite(placeName);
                
                // Update button appearance
                if (nowFavorited) {
                    this.classList.add('favorited');
                    this.innerHTML = '❤️';
                    this.title = 'Remove from favorites';
                } else {
                    this.classList.remove('favorited');
                    this.innerHTML = '🤍';
                    this.title = 'Add to favorites';
                }
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', async function() {
                const placeName = this.dataset.place;
                const shareUrl = this.dataset.url;
                
                trackEvent('share_clicked', {
                    place_name: placeName,
                    place_type: place.type
                });
                
                // Try Web Share API first
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `Check out ${placeName} on Sizzle LA`,
                            text: `I found this great place: ${placeName}`,
                            url: shareUrl
                        });
                        trackEvent('share_success', {
                            place_name: placeName,
                            method: 'web_share_api'
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.log('Share failed:', err);
                        }
                    }
                } else {
                    // Fallback: copy to clipboard
                    try {
                        await navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                        trackEvent('share_success', {
                            place_name: placeName,
                            method: 'clipboard'
                        });
                    } catch (err) {
                        console.error('Failed to copy:', err);
                        alert('Could not copy link. Please copy manually: ' + shareUrl);
                    }
                }
            });
        }
    }, 100);
    
    // Create a proper L.LatLng object for the query
    const point = L.latLng(place.lat, place.lng);
    
    // Query the neighborhoods layer to find which one contains this point
    neighborhoodsLayer.query()
        .contains(point)
        .run(function(error, featureCollection) {
            console.log('Query completed');
            console.log('Error:', error);
            console.log('Features found:', featureCollection);
            
            if (!error && featureCollection && featureCollection.features && featureCollection.features.length > 0) {
                // Get the first neighborhood found
                const feature = featureCollection.features[0];
                const neighborhoodName = feature.properties.name || feature.properties.Name || '';
                
                console.log('Neighborhood found:', neighborhoodName);
                
                if (neighborhoodName) {
                    // Update popup content with neighborhood
                    marker.setPopupContent(createPopupContent(neighborhoodName));
                }
            } else {
                console.log('No neighborhood found for this location');
            }
        });
});
        
        marker.addTo(map);
        markers.push(marker);
    });
}

// Helper function to get type colors
function getTypeColor(type) {
    const colors = {
        restaurant: '#ff6b6b',
        cafe: '#a0522d',
        bar: '#9b59b6',
        plant: '#27ae60',
        vinyl: '#e74c3c'
    };
    return colors[type] || '#666';
}

// Helper function to format event/deal times
function formatEventTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const startStr = start.toLocaleTimeString('en-US', timeOptions);
    const endStr = end.toLocaleTimeString('en-US', timeOptions);
    
    return `${startStr} - ${endStr}`;
}
    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterType = e.target.dataset.type;
            console.log('Filter clicked:', filterType); // Debug log
            
            // Track filter usage
            trackEvent('filter_clicked', {
                filter_type: filterType
            });
            
            // Show/hide cuisine filter section
            const cuisineSection = document.getElementById('cuisine-section');
            const cuisineFilter = document.getElementById('cuisine-filter');
            
            if (filterType === 'restaurant') {
                cuisineSection.classList.add('show');
                console.log('Cuisine filter shown'); // Debug log
            } else {
                cuisineSection.classList.remove('show');
                cuisineFilter.value = 'all';
                console.log('Cuisine filter hidden'); // Debug log
            }

            // Filter places
            filterPlaces();
        });
    });

    // Cuisine filter
    document.getElementById('cuisine-filter').addEventListener('change', function() {
        trackEvent('cuisine_filter_changed', {
            cuisine: this.value
        });
        filterPlaces();
    });

    function filterPlaces() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.type;
        const cuisineFilter = document.getElementById('cuisine-filter').value;

        let filtered = allPlaces;

        // Filter by favorites
        if (activeFilter === 'favorites') {
            filtered = filtered.filter(place => isFavorite(place.name));
            if (filtered.length === 0) {
                console.log('No favorites yet!');
            }
        }
        // Filter by type
        else if (activeFilter !== 'all') {
            filtered = filtered.filter(place => place.type === activeFilter);
        }

        // Filter by cuisine if restaurant selected
        if (activeFilter === 'restaurant' && cuisineFilter !== 'all') {
            filtered = filtered.filter(place => place.cuisine === cuisineFilter);
        }

        displayPlaces(filtered);
    };

// Helper function to determine event/deal status
function getEventStatus(eventStart, eventEnd) {
    const now = new Date();
    const start = new Date(eventStart);
    const end = new Date(eventEnd);
    
    const timeUntilStart = (start - now) / 1000 / 60; // minutes
    const timeUntilEnd = (end - now) / 1000 / 60; // minutes
    
    if (now >= start && now <= end) {
        // Event is live
        if (timeUntilEnd <= 30) {
            return 'ending-soon';
        }
        return 'live-now';
    } else if (timeUntilStart > 0 && timeUntilStart <= 120) {  // Changed from 30 to 120 (2 hours)
        return 'starting-soon';
    }
    
    return null;
}

// When creating markers, wrap them with status classes
function createEventMarker(venue) {
    const iconHtml = `<div class="event-marker-wrapper ${getEventClasses(venue)}">
        ${venue.emoji || '📍'}
    </div>`;
    
    // ... rest of marker creation
}

function getEventClasses(venue) {
    const classes = [];
    
    // Check event status
    if (venue.event_start && venue.event_end) {
        const status = getEventStatus(venue.event_start, venue.event_end);
        if (status) classes.push(status);
    }
    
    // Check deal status
    if (venue.deal_start && venue.deal_end) {
        const dealStatus = getEventStatus(venue.deal_start, venue.deal_end);
        if (dealStatus === 'live-now') classes.push('deal-active');
    }
    
    // Check sponsored status
    if (venue.is_sponsored) classes.push('sponsored');
    
    return classes.join(' ');
}


    // Geolocation
    document.getElementById('locate-btn').addEventListener('click', () => {
        trackEvent('locate_button_clicked');
        
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    trackEvent('geolocation_success', {
                        accuracy: position.coords.accuracy
                    });

                    // Remove old user marker
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }

                    // Add new user marker
                    userMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: '<div style="background: #3498db; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 4px solid white; box-shadow: 0 3px 12px rgba(0,0,0,0.4); animation: pulse 2s infinite;">📍</div>',
                            className: '',
                            iconSize: [40, 40]
                        })
                    }).addTo(map);

                    userMarker.bindPopup('<b>You are here!</b>').openPopup();
                    map.setView([lat, lng], 13);
                },
                (error) => {
                    trackEvent('geolocation_error', {
                        error_code: error.code,
                        error_message: error.message
                    });
                    alert('Could not get your location. Please enable location services.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            trackEvent('geolocation_not_supported');
            alert('Geolocation is not supported by your browser.');
        }
    });

    // Offcanvas Panel Functionality
    const infoBtn = document.getElementById('info-btn');
    const closeBtn = document.getElementById('close-btn');
    const offcanvas = document.getElementById('offcanvas');
    const offcanvasOverlay = document.getElementById('offcanvas-overlay');

    function openOffcanvas() {
        offcanvas.classList.add('active');
        offcanvasOverlay.classList.add('active');
        trackEvent('info_panel_opened');
    }

    function closeOffcanvas() {
        offcanvas.classList.remove('active');
        offcanvasOverlay.classList.remove('active');
        trackEvent('info_panel_closed');
    }

    infoBtn.addEventListener('click', openOffcanvas);
    closeBtn.addEventListener('click', closeOffcanvas);
    offcanvasOverlay.addEventListener('click', closeOffcanvas);

    // Form Submission
    const form = document.getElementById('suggest-form');
    const formStatus = document.getElementById('form-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Track form submission attempt
        const placeType = document.getElementById('place-type').value;
        trackEvent('form_submission_started', {
            place_type: placeType
        });
        
        // Show loading state
        formStatus.textContent = 'Sending...';
        formStatus.className = 'form-status';
        formStatus.style.display = 'block';
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                trackEvent('form_submission_success', {
                    place_type: placeType
                });
                
                formStatus.textContent = 'Thanks for the suggestion! We\'ll check it out. 🎉';
                formStatus.className = 'form-status success';
                form.reset();
                
                // Auto-close after 3 seconds
                setTimeout(() => {
                    closeOffcanvas();
                    setTimeout(() => {
                        formStatus.style.display = 'none';
                    }, 300);
                }, 3000);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            trackEvent('form_submission_error', {
                error_message: error.message
            });
            
            formStatus.textContent = 'Oops! Something went wrong. Please try again.';
            formStatus.className = 'form-status error';
        }
    });

    
    // Load places on page load
    loadPlaces();
    
    // Use Leaflet events instead of arbitrary delays
    // This runs after map tiles have loaded
    map.on('load', function() {
        console.log('Map load event fired');
        checkSharedPlace();
    });
    
}; // End window.onload
