let mapInstance = null;
let currentMarker = null;

/**
 * Initialize a Leaflet.js map on post-listing page with location pickers
 * @param {string} containerId ID of map element
 * @param {number} defaultLat 
 * @param {number} defaultLng 
 */
function initPostListingMap(containerId, defaultLat = 23.8103, defaultLng = 90.4125) {
  if (mapInstance) return;

  // Initialize Map centering Dhaka by default
  mapInstance = L.map(containerId).setView([defaultLat, defaultLng], 12);

  // Add highly readable OSM tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  // Add click handler to select latitude/longitude coordinates
  mapInstance.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng);
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });

  // Set up autocomplete geocoding search
  setupMapAutocomplete('map-search-input', 'map-search-results');

  // Try picking up current position automatically on start
  detectUserLocation();
}

/**
 * Place a single draggable marker on specified coordinate coordinates
 */
function placeMarker(lat, lng) {
  document.getElementById('listing-latitude').value = lat.toFixed(8);
  document.getElementById('listing-longitude').value = lng.toFixed(8);

  if (currentMarker) {
    currentMarker.setLatLng([lat, lng]);
  } else {
    currentMarker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);
    currentMarker.on('dragend', () => {
      const position = currentMarker.getLatLng();
      placeMarker(position.lat, position.lng);
      reverseGeocode(position.lat, position.lng);
    });
  }
  mapInstance.setView([lat, lng], 15);
}

/**
 * Geolocation trigger to detect local browser coordinates
 */
function detectUserLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", "warning");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      placeMarker(lat, lng);
      reverseGeocode(lat, lng);
    },
    (error) => {
      console.warn("Geolocation permission/service failed. Defaulting to center city Dhaka.", error);
    }
  );
}

/**
 * Perform reverse geocoding via OpenStreetMap Nominatim API
 */
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await response.json();
    if (data && data.display_name) {
      document.getElementById('listing-location-text').value = data.display_name;
    }
  } catch (error) {
    console.error("OSM Nominatim Geocode Error:", error);
  }
}

/**
 * Forward Geocoding: Text based address search using Nominatim
 */
async function searchLocationText() {
  const query = document.getElementById('listing-location-text').value.trim();
  if (!query) {
    showToast("Please enter an address first.", "warning");
    return;
  }

  try {
    showToast("Searching location on map...", "info");
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      placeMarker(lat, lng);
    } else {
      showToast("Location not found. Try selecting manually on map.", "warning");
    }
  } catch (error) {
    console.error("Address Search Error:", error);
    showToast("Failed to search location.", "error");
  }
}

/**
 * Autocomplete address input helper querying Nominatim OpenStreetMap API
 */
function setupMapAutocomplete(searchInputId, resultsDivId) {
  const searchInput = document.getElementById(searchInputId);
  const resultsDiv = document.getElementById(resultsDivId);
  if (!searchInput || !resultsDiv) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (query.length < 3) {
      resultsDiv.innerHTML = '';
      resultsDiv.classList.add('hidden');
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const response = await fetch(url, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await response.json();

        resultsDiv.innerHTML = '';
        if (data && data.length > 0) {
          resultsDiv.classList.remove('hidden');
          data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 text-gray-800 transition-colors duration-150';
            row.innerText = item.display_name;
            row.addEventListener('click', () => {
              // Populate search input
              searchInput.value = item.display_name;
              resultsDiv.innerHTML = '';
              resultsDiv.classList.add('hidden');

              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);

              // Update Map and Marker position
              placeMarker(lat, lng);

              // Fill the detailed address field
              const detailLoc = document.getElementById('listing-location-text');
              if (detailLoc) {
                detailLoc.value = item.display_name;
              }
            });
            resultsDiv.appendChild(row);
          });
        } else {
          resultsDiv.classList.add('hidden');
        }
      } catch (err) {
        console.error("Nominatim Autocomplete Error:", err);
      }
    }, 400); // 400ms debounce
  });

  // Close suggestions box if clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.innerHTML = '';
      resultsDiv.classList.add('hidden');
    }
  });
}

// Global Exports
window.initPostListingMap = initPostListingMap;
window.detectUserLocation = detectUserLocation;
window.searchLocationText = searchLocationText;
window.setupMapAutocomplete = setupMapAutocomplete;
