document.addEventListener('DOMContentLoaded', () => {
  // Parse incoming search parameters from landing search triggers
  const params = new URLSearchParams(window.location.search);
  const initialLoc = params.get('location') || '';
  const initialCategory = params.get('category') || '';

  const locationInput = document.getElementById('search-location');
  const categorySelect = document.getElementById('search-category');
  const radiusSlider = document.getElementById('radius-dropdown');
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

  // Action to widen radius on empty state
  if (widenRadiusBtn) {
    widenRadiusBtn.addEventListener('click', () => {
      const currentVal = parseInt(radiusSlider.value || '15');
      let nextVal = 50;
      if (currentVal < 15) nextVal = 15;
      else if (currentVal < 30) nextVal = 30;
      radiusSlider.value = nextVal.toString();
      fetchListings();
    });
  }

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
          filtered = filtered.filter(item => (item.priceMin || item.price || 0) >= parseFloat(minBudget));
        }
        if (maxBudget) {
          filtered = filtered.filter(item => (item.priceMax || item.priceMin || item.price || Infinity) <= parseFloat(maxBudget));
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
          const mainImage = formatImageUrl(images.length > 0 ? images[0] : '');

          const card = document.createElement('a');
          card.href = `listing-detail.html?id=${item.id}`;
          card.className = 'group cursor-pointer block';
          card.innerHTML = `
            <div class="relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden mb-3">
              <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 ease group-hover:scale-105" loading="lazy">
              <button class="absolute top-3 right-3 p-1.5 text-white hover:scale-110 transition-transform focus:outline-none z-10 drop-shadow-md" onclick="toggleHeart(event, this)">
                <svg class="w-6 h-6 fill-black/30 stroke-white stroke-2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-gray-900 truncate text-[15px]">${item.locationText || 'Location Specified'}</h4>
                <p class="text-[14px] text-gray-500 mt-0.5">${item.category.replace('_', ' ')}</p>
                <p class="text-[14px] text-gray-500">Within ${radiusValue} km</p>
                <div class="mt-1 flex items-baseline gap-1">
                  <span class="text-[15px] font-semibold text-gray-900">${formatPriceRange(item)}</span>
                  <span class="text-[14px] text-gray-500">/ month</span>
                </div>
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
          <p class="text-xs text-primary font-bold mb-1.5">${formatPriceRange(item)}</p>
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
  if (svg.classList.contains('fill-black/30')) {
    svg.classList.remove('fill-black/30', 'stroke-white');
    svg.classList.add('fill-primary', 'stroke-primary');
    showToast("Added to saved spaces!", "success");
  } else {
    svg.classList.remove('fill-primary', 'stroke-primary');
    svg.classList.add('fill-black/30', 'stroke-white');
    showToast("Removed from saved spaces.", "info");
  }
}

