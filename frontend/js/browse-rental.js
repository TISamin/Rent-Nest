document.addEventListener('DOMContentLoaded', () => {
  // Parse incoming search parameters from landing search triggers
  const params = new URLSearchParams(window.location.search);
  const initialLoc = params.get('location') || '';
  const initialCategory = params.get('category') || '';

  const locationInput = document.getElementById('search-location');
  const categorySelect = document.getElementById('search-category');
  const radiusSlider = document.getElementById('radius-slider');
  const radiusVal = document.getElementById('radius-val');
  const budgetMin = document.getElementById('budget-min');
  const budgetMax = document.getElementById('budget-max');
  
  const searchForm = document.getElementById('search-filter-form');
  const listingsGrid = document.getElementById('listings-grid');
  const mapToggleBtn = document.getElementById('map-toggle-btn');
  const mapToggleIcon = document.getElementById('map-toggle-icon');
  const mapToggleText = document.getElementById('map-toggle-text');
  const mapContainer = document.getElementById('leaflet-search-map');
  const resultsCountText = document.getElementById('results-count');
  const emptyState = document.getElementById('empty-state');
  const widenRadiusBtn = document.getElementById('widen-radius-btn');

  // Set initial input states
  if (initialLoc) locationInput.value = initialLoc;
  if (initialCategory) categorySelect.value = initialCategory;

  let currentListings = [];
  let isMapView = false;
  let mapInstance = null;
  let markersLayer = null;

  // Sync radius slider label text
  radiusSlider.addEventListener('input', (e) => {
    radiusVal.textContent = `${e.target.value} km`;
  });

  // Action to widen radius on empty state
  widenRadiusBtn.addEventListener('click', () => {
    radiusSlider.value = Math.min(parseInt(radiusSlider.value) + 15, 50);
    radiusVal.textContent = `${radiusSlider.value} km`;
    fetchListings();
  });

  // Toggle between Grid and Map views
  mapToggleBtn.addEventListener('click', () => {
    isMapView = !isMapView;
    if (isMapView) {
      listingsGrid.classList.add('hidden');
      mapContainer.classList.remove('hidden');
      mapToggleText.textContent = 'Grid View';
      mapToggleIcon.textContent = '📱';
      initMap();
    } else {
      listingsGrid.classList.remove('hidden');
      mapContainer.classList.add('hidden');
      mapToggleText.textContent = 'Map View';
      mapToggleIcon.textContent = '🗺️';
    }
  });

  // Initial load
  fetchListings();

  // Search Submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchListings();
  });

  /**
   * Performs REST calls to local Search APIs and displays listings dynamically
   */
  async function fetchListings() {
    // Show skeleton loaders
    listingsGrid.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
    `;
    emptyState.classList.add('hidden');
    resultsCountText.textContent = 'Searching spaces...';

    const locationValue = locationInput.value.trim();
    const categoryValue = categorySelect.value;
    const radiusValue = radiusSlider.value;
    const minBudget = budgetMin.value;
    const maxBudget = budgetMax.value;

    try {
      // Build API query parameters
      let queryParams = [];
      if (locationValue) queryParams.push(`location=${encodeURIComponent(locationValue)}`);
      if (categoryValue) queryParams.push(`category=${encodeURIComponent(categoryValue)}`);
      
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiGet(`/search/rental${queryStr}`);
      
      listingsGrid.innerHTML = '';
      currentListings = [];

      if (res.success && res.data && res.data.length > 0) {
        // Filter results locally for custom filters (budget range)
        let filtered = res.data;
        if (minBudget) {
          filtered = filtered.filter(item => item.price >= parseFloat(minBudget));
        }
        if (maxBudget) {
          filtered = filtered.filter(item => item.price <= parseFloat(maxBudget));
        }

        currentListings = filtered;

        // Render Results Count text
        const typeLabel = categoryValue ? `${categoryValue.toLowerCase()}s` : 'spaces';
        const localityText = locationValue ? `near ${locationValue}` : 'globally';
        resultsCountText.textContent = `${currentListings.length} ${typeLabel} found ${localityText}`;

        if (currentListings.length === 0) {
          showEmptyState();
          return;
        }

        currentListings.forEach(item => {
          const images = item.imageUrl ? item.imageUrl.split(',') : [];
          const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

          const card = document.createElement('div');
          card.className = 'relative bg-white rounded-xl shadow-card hover:shadow-hover border border-gray-200 overflow-hidden transform hover:-translate-y-1 transition-all duration-200 group cursor-pointer flex flex-col h-full';
          card.innerHTML = `
            <div class="relative aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
              <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 ease group-hover:scale-[1.03]" loading="lazy">
              <button class="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-600 hover:text-primary transition-colors focus:outline-none z-10" onclick="toggleHeart(event, this)">
                <svg class="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
            <div class="p-4 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">${item.category.replace('_', ' ')}</span>
                  <span class="text-xs font-bold text-gray-800">${item.price ? item.price + ' BDT' : 'Negotiable'}</span>
                </div>
                <h4 class="font-bold text-gray-900 truncate mb-1 text-sm">${item.locationText || 'Location Specified'}</h4>
                <p class="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-3">${item.description || 'No description provided.'}</p>
              </div>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span class="text-[11px] text-gray-500 font-medium">Within ${radiusValue} km</span>
                </div>
                <a href="listing-detail.html?id=${item.id}" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white shadow-sm transition-all transform active:scale-95">
                  Details
                </a>
              </div>
            </div>
          `;
          listingsGrid.appendChild(card);
        });

        // Sync Map view markers if it is active
        if (isMapView && mapInstance) {
          updateMapMarkers();
        }
      } else {
        showEmptyState();
      }
    } catch (error) {
      console.error("Listing Search failure:", error);
      resultsCountText.textContent = 'Search failed';
      listingsGrid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10 font-medium">Failed to fetch stay listings.</div>`;
    }
  }

  function showEmptyState() {
    resultsCountText.textContent = '0 spaces found';
    listingsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
  }

  /**
   * Initialize Leaflet map if map view is selected
   */
  function initMap() {
    if (mapInstance) {
      // Re-invalidate size to avoid Leaflet rendering bugs on hidden divs
      setTimeout(() => mapInstance.invalidateSize(), 50);
      updateMapMarkers();
      return;
    }

    // Default view dhaka
    mapInstance = L.map('leaflet-search-map').setView([23.8103, 90.4125], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);
    updateMapMarkers();
  }

  /**
   * Render custom red pin markers for searched listings on map
   */
  function updateMapMarkers() {
    if (!mapInstance || !markersLayer) return;

    markersLayer.clearLayers();

    if (currentListings.length === 0) return;

    const bounds = [];

    // Custom Red Pin Marker Icon SVG
    const customRedIcon = L.divIcon({
      html: `
        <svg class="w-8 h-8 text-primary filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `,
      className: 'bg-transparent border-0',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    currentListings.forEach(item => {
      // Pick coordinates (fallback to default random offset to avoid stacking if coordinates aren't defined)
      const lat = item.latitude || (23.8103 + (Math.random() - 0.5) * 0.08);
      const lng = item.longitude || (90.4125 + (Math.random() - 0.5) * 0.08);

      bounds.push([lat, lng]);

      const images = item.imageUrl ? item.imageUrl.split(',') : [];
      const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

      const popupContent = `
        <div class="w-48 text-[#222222]">
          <img src="${mainImage}" class="w-full h-24 object-cover rounded-md mb-2">
          <p class="font-bold text-sm truncate mb-0.5">${item.title}</p>
          <p class="text-xs text-primary font-bold mb-1.5">${item.price ? item.price + ' BDT' : 'Negotiable'}</p>
          <a href="listing-detail.html?id=${item.id}" class="block text-center bg-primary text-white py-1 rounded text-xs font-bold hover:bg-primary-dark">View Details</a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customRedIcon })
        .bindPopup(popupContent);
      
      markersLayer.addLayer(marker);
    });

    if (bounds.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }
  }
});

// Toggle heart icon favorite status
function toggleHeart(event, element) {
  event.preventDefault();
  event.stopPropagation();
  const svg = element.querySelector('svg');
  if (svg.classList.contains('fill-none')) {
    svg.classList.remove('fill-none', 'text-gray-600');
    svg.classList.add('fill-current', 'text-primary');
    showToast("Added to saved spaces!", "success");
  } else {
    svg.classList.remove('fill-current', 'text-primary');
    svg.classList.add('fill-none', 'text-gray-600');
    showToast("Removed from saved spaces.", "info");
  }
}

