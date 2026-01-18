// Wait for window and all scripts to load
window.onload = function() {
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
            
            const marker = L.marker([place.lat, place.lng], {
                icon: icons[place.type]
            });

            // Function to create popup content
            function createPopupContent(neighborhoodName = '') {
                return `
                    <div class="popup-content">
                        <div class="popup-title">${place.name}</div>
                        <div class="popup-type">${place.type.toUpperCase()}${place.cuisine ? ' • ' + place.cuisine : ''}</div>
                        ${neighborhoodName ? `<div class="popup-neighborhood">📍 ${neighborhoodName}</div>` : ''}
                        <div class="popup-description">${place.description}</div>
                        <div class="popup-info">
                            ${place.phone ? `<div class="popup-info-item">📞 ${place.phone}</div>` : ''}
                            ${place.address ? `<div class="popup-info-item">📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}" target="_blank" class="address-link" title="Open in Google Maps">${place.address}</a></div>` : ''}
                            ${place.price ? `<div class="popup-info-item">💰 <span class="price-rating">${place.price}</span></div>` : ''}
                            ${place.rating ? `<div class="popup-info-item"><span class="star-rating">⭐ ${place.rating}</span> ${place.ratingSource || ''}</div>` : ''}
                        </div>
                        ${place.link ? `<a href="${place.link}" target="_blank" class="popup-link">View More →</a>` : ''}
                    </div>
                `;
            }

            // Bind initial popup
            marker.bindPopup(createPopupContent());

            // Query neighborhood when popup opens
            marker.on('popupopen', function() {
                console.log('Popup opened for:', place.name);
                console.log('Querying at coordinates:', place.lat, place.lng);
                
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

    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterType = e.target.dataset.type;
            console.log('Filter clicked:', filterType); // Debug log
            
            // Enable/disable cuisine filter (always keep section visible)
            const cuisineFilter = document.getElementById('cuisine-filter');
            if (filterType === 'restaurant') {
                cuisineFilter.disabled = false;
                console.log('Cuisine filter enabled'); // Debug log
            } else {
                cuisineFilter.disabled = true;
                cuisineFilter.value = 'all';
                console.log('Cuisine filter disabled'); // Debug log
            }

            // Filter places
            filterPlaces();
        });
    });

    // Cuisine filter
    document.getElementById('cuisine-filter').addEventListener('change', filterPlaces);

    function filterPlaces() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.type;
        const cuisineFilter = document.getElementById('cuisine-filter').value;

        let filtered = allPlaces;

        // Filter by type
        if (activeFilter !== 'all') {
            filtered = filtered.filter(place => place.type === activeFilter);
        }

        // Filter by cuisine if restaurant selected
        if (activeFilter === 'restaurant' && cuisineFilter !== 'all') {
            filtered = filtered.filter(place => place.cuisine === cuisineFilter);
        }

        displayPlaces(filtered);
    }

    // Geolocation
    document.getElementById('locate-btn').addEventListener('click', () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

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
                    alert('Could not get your location. Please enable location services.');
                    console.error('Geolocation error:', error);
                }
            );
        } else {
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
    }

    function closeOffcanvas() {
        offcanvas.classList.remove('active');
        offcanvasOverlay.classList.remove('active');
    }

    infoBtn.addEventListener('click', openOffcanvas);
    closeBtn.addEventListener('click', closeOffcanvas);
    offcanvasOverlay.addEventListener('click', closeOffcanvas);

    // Form Submission
    const form = document.getElementById('suggest-form');
    const formStatus = document.getElementById('form-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
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
            formStatus.textContent = 'Oops! Something went wrong. Please try again.';
            formStatus.className = 'form-status error';
        }
    });

    // Load places on page load
    loadPlaces();
    
}; // End window.onload
