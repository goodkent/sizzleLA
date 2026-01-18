// Wait for window and all scripts to load
window.onload = function() {
    // Initialize map centered on LA
    const map = L.map('map').setView([34.0522, -118.2437], 11);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
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
            const marker = L.marker([place.lat, place.lng], {
                icon: icons[place.type]
            });

            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <div class="popup-title">${place.name}</div>
                    <div class="popup-type">${place.type.toUpperCase()}${place.cuisine ? ' • ' + place.cuisine : ''}</div>
                    <div class="popup-description">${place.description}</div>
                    <div class="popup-info">
                        ${place.phone ? `<div class="popup-info-item">📞 ${place.phone}</div>` : ''}
                        ${place.address ? `<div class="popup-info-item">📍 ${place.address}</div>` : ''}
                        ${place.price ? `<div class="popup-info-item">💰 <span class="price-rating">${place.price}</span></div>` : ''}
                        ${place.rating ? `<div class="popup-info-item"><span class="star-rating">⭐ ${place.rating}</span> ${place.ratingSource || ''}</div>` : ''}
                    </div>
                    ${place.link ? `<a href="${place.link}" target="_blank" class="popup-link">View More →</a>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
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

    // Load places on page load
    loadPlaces();
    
}; // End window.onload
