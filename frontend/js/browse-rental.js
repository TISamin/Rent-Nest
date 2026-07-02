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
  if (initialCategory) {
    categorySelect.value = initialCategory;
    const categoryLabels = {
      'FLAT': 'Flat',
      'HOTEL': 'Hotel',
      'HOUSE': 'House',
      'CONVENTION_HALL': 'Convention Hall'
    };
    const initialLabel = categoryLabels[initialCategory] || 'Any type';
    const labelElem = document.getElementById('selectedCategoryLabel');
    if (labelElem) {
      labelElem.textContent = initialLabel;
    }
  }

  // Create suggestions container dynamically
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'location-suggestions';
  suggestionsContainer.className = 'absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 hidden max-h-60 overflow-y-auto py-1';
  locationInput.parentNode.appendChild(suggestionsContainer);

  // Debounce helper to prevent database spamming
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Fetch location suggestions as the user types
  locationInput.addEventListener('input', debounce(async (e) => {
    const val = e.target.value.trim();
    if (val.length < 1) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.add('hidden');
      return;
    }

    try {
      const res = await apiGet(`/search/locations?query=${encodeURIComponent(val)}`);
      if (res.success && res.data && res.data.length > 0) {
        suggestionsContainer.innerHTML = '';
        res.data.forEach(loc => {
          const item = document.createElement('div');
          item.className = 'px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 font-medium transition-colors duration-150 border-b border-gray-100 last:border-b-0';
          item.textContent = loc;
          item.addEventListener('click', () => {
            locationInput.value = loc;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.add('hidden');
          });
          suggestionsContainer.appendChild(item);
        });
        suggestionsContainer.classList.remove('hidden');
      } else {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.add('hidden');
      }
    } catch (err) {
      console.error("Failed to fetch location suggestions:", err);
    }
  }, 250));

  // Hide suggestions dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!locationInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.add('hidden');
    }
  });

  // Custom Category Dropdown Logic
  const categoryDropdownBtn = document.getElementById('categoryDropdownBtn');
  const categoryDropdownList = document.getElementById('categoryDropdownList');
  const selectedCategoryLabel = document.getElementById('selectedCategoryLabel');
  const categoryDropdownArrow = document.getElementById('categoryDropdownArrow');

  if (categoryDropdownBtn && categoryDropdownList) {
    categoryDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeRadiusDropdown();
      const isHidden = categoryDropdownList.classList.contains('hidden');
      if (isHidden) {
        categoryDropdownList.classList.remove('hidden');
        setTimeout(() => {
          categoryDropdownList.classList.remove('opacity-0', 'scale-95');
          categoryDropdownList.classList.add('opacity-100', 'scale-100');
        }, 10);
        categoryDropdownArrow.classList.add('rotate-180');
      } else {
        closeCategoryDropdown();
      }
    });

    categoryDropdownList.querySelectorAll('[data-value]').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        const text = item.textContent;
        categorySelect.value = val;
        selectedCategoryLabel.textContent = text;
        closeCategoryDropdown();
      });
    });
  }

  function closeCategoryDropdown() {
    if (categoryDropdownList && !categoryDropdownList.classList.contains('hidden')) {
      categoryDropdownList.classList.remove('opacity-100', 'scale-100');
      categoryDropdownList.classList.add('opacity-0', 'scale-95');
      categoryDropdownArrow.classList.remove('rotate-180');
      setTimeout(() => {
        categoryDropdownList.classList.add('hidden');
      }, 150);
    }
  }

  // Custom Radius Dropdown Logic
  const radiusDropdownBtn = document.getElementById('radiusDropdownBtn');
  const radiusDropdownList = document.getElementById('radiusDropdownList');
  const selectedRadiusLabel = document.getElementById('selectedRadiusLabel');
  const radiusDropdownArrow = document.getElementById('radiusDropdownArrow');

  if (radiusDropdownBtn && radiusDropdownList) {
    radiusDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCategoryDropdown();
      const isHidden = radiusDropdownList.classList.contains('hidden');
      if (isHidden) {
        radiusDropdownList.classList.remove('hidden');
        setTimeout(() => {
          radiusDropdownList.classList.remove('opacity-0', 'scale-95');
          radiusDropdownList.classList.add('opacity-100', 'scale-100');
        }, 10);
        radiusDropdownArrow.classList.add('rotate-180');
      } else {
        closeRadiusDropdown();
      }
    });

    radiusDropdownList.querySelectorAll('[data-value]').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        const text = item.textContent;
        radiusSlider.value = val;
        selectedRadiusLabel.textContent = text;
        closeRadiusDropdown();
        radiusSlider.dispatchEvent(new Event('change'));
      });
    });
  }

  function closeRadiusDropdown() {
    if (radiusDropdownList && !radiusDropdownList.classList.contains('hidden')) {
      radiusDropdownList.classList.remove('opacity-100', 'scale-100');
      radiusDropdownList.classList.add('opacity-0', 'scale-95');
      radiusDropdownArrow.classList.remove('rotate-180');
      setTimeout(() => {
        radiusDropdownList.classList.add('hidden');
      }, 150);
    }
  }

  // Dismiss dropdowns on outside document click
  document.addEventListener('click', () => {
    closeCategoryDropdown();
    closeRadiusDropdown();
  });

  let allFetchedListings = [];
  let currentListings = [];
  let searchedCoords = null; // { lat, lng }
  let isMapView = false;
  let mapInstance = null;
  let markersLayer = null;
  const markerMap = {};

  // Action to widen radius on empty state
  if (widenRadiusBtn) {
    widenRadiusBtn.addEventListener('click', () => {
      const currentVal = parseInt(radiusSlider.value || '15');
      let nextVal = 50;
      if (currentVal < 15) nextVal = 15;
      else if (currentVal < 30) nextVal = 30;
      radiusSlider.value = nextVal.toString();
      if (selectedRadiusLabel) {
        selectedRadiusLabel.textContent = `Within ${nextVal} km`;
      }
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

  // Re-filter and re-render client-side when radius dropdown changes
  radiusSlider.addEventListener('change', () => {
    renderListings();
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
    const minBudgetVal = budgetMin.value;
    const maxBudgetVal = budgetMax.value;

    try {
      // 1. Geocode location if provided
      searchedCoords = null;
      let lat = null;
      let lng = null;
      if (locationValue) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationValue)}&format=json&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
            searchedCoords = { lat, lng };
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
        }
      }

      // 2. Build API query parameters
      let queryParams = [];
      if (locationValue) queryParams.push(`location=${encodeURIComponent(locationValue)}`);
      if (categoryValue) queryParams.push(`category=${encodeURIComponent(categoryValue)}`);
      if (lat !== null && lng !== null && radiusValue) {
        queryParams.push(`lat=${lat}`);
        queryParams.push(`lng=${lng}`);
        queryParams.push(`radius=${parseInt(radiusValue) * 1000}`); // convert km to metres
      }
      if (minBudgetVal) queryParams.push(`minBudget=${encodeURIComponent(minBudgetVal)}`);
      if (maxBudgetVal) queryParams.push(`maxBudget=${encodeURIComponent(maxBudgetVal)}`);
      
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiGet(`/search/rental${queryStr}`);
      
      allFetchedListings = [];
      if (res.success && res.data && res.data.length > 0) {
        allFetchedListings = res.data;
      }
      
      renderListings();
    } catch (error) {
      console.error("Listing Search failure:", error);
      resultsCountText.textContent = 'Search failed';
      listingsGrid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10 font-medium">Failed to fetch stay listings.</div>`;
    }
  }

  /**
   * Process filters client-side and render listing cards & map pins
   */
  function renderListings() {
    listingsGrid.innerHTML = '';
    
    const minBudget = budgetMin.value;
    const maxBudget = budgetMax.value;
    const categoryValue = categorySelect.value;
    const locationValue = locationInput.value.trim();
    const radiusValue = parseInt(radiusSlider.value || '15');
    const radiusMetres = radiusValue * 1000;

    // Filter results locally
    let filtered = allFetchedListings;

    // Budget filtering is now handled by the backend API.

    // Client-side radius filter (for real-time slider/dropdown changes)
    if (searchedCoords) {
      filtered = filtered.filter(item => {
        if (item.distanceMetres === undefined || item.distanceMetres === null) return true;
        return item.distanceMetres <= radiusMetres;
      });
    }

    currentListings = filtered;

    // Render Results Count text
    const typeLabel = categoryValue ? `${categoryValue.toLowerCase()}s` : 'spaces';
    const localityText = locationValue ? `near ${locationValue}` : 'globally';
    resultsCountText.textContent = `${currentListings.length} ${typeLabel} found ${localityText}`;

    if (currentListings.length === 0) {
      showEmptyState();
      // Even if list is empty, update map to show circle/searched center
      if (isMapView && mapInstance) {
        updateMapMarkers();
      }
      return;
    }

    // Render listing cards
    currentListings.forEach(item => {
      const images = item.imageUrl ? item.imageUrl.split(',') : [];
      const mainImage = formatImageUrl(images.length > 0 ? images[0] : '');

      // Prepare distance badge if distance is present
      let distanceHtml = '';
      if (item.distanceMetres !== undefined && item.distanceMetres !== null) {
        const distKm = item.distanceMetres / 1000;
        const distText = distKm.toFixed(1) + ' km away';
        
        let badgeColorClass = 'bg-red-50 text-red-700 border-red-200';
        if (item.distanceMetres < radiusMetres * 0.33) {
          badgeColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (item.distanceMetres < radiusMetres * 0.66) {
          badgeColorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        }
        
        distanceHtml = `
          <div class="mt-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColorClass}">
              ${distText}
            </span>
          </div>
        `;
      }

      let ratingHtml = '';
      if (item.reviewCount > 0) {
        ratingHtml = `<div class="flex items-center gap-1 text-xs font-semibold text-gray-700 mt-0.5"><svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>${(item.averageRating || 0).toFixed(1)} (${item.reviewCount})</div>`;
      }

      const card = document.createElement('a');
      card.href = `listing-detail.html?id=${item.id}`;
      card.className = 'listing-card p-3 group block';
      card.setAttribute('data-id', item.id);
      card.innerHTML = `
        <div class="relative aspect-[3/2] rounded-2xl overflow-hidden mb-4">
          <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 ease group-hover:scale-110" loading="lazy">
          <button class="absolute top-3 right-3 p-1.5 text-white hover:scale-110 transition-transform focus:outline-none z-10 drop-shadow-md" data-wishlist-btn data-listing-id="${item.id}" onclick="toggleWishlist(event, '${item.id}', this)">
            <svg class="w-6 h-6 fill-black/30 stroke-white stroke-2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>
        <div class="px-1 flex justify-between items-start">
          <div class="w-full relative">
            <h4 class="font-semibold text-[#1a2e3f] truncate text-base pr-6">${item.title}</h4>
            <button onclick="event.preventDefault(); openReportModal('LISTING', '${item.id}')" class="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors focus:outline-none" title="Report Listing">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            </button>
            ${ratingHtml}
            <p class="text-sm text-[#2d4a5e]/70 mt-1 truncate">${item.locationText || item.category.replace('_', ' ')}</p>
            ${distanceHtml}
            <p class="text-sm text-[#2d4a5e]/50 mt-0.5">${item.category.replace('_', ' ')}</p>
            <div class="mt-2 flex items-baseline gap-1">
              <span class="text-base font-bold text-[#1a2e3f]">${formatPriceRange(item)}</span>
            </div>
          </div>
        </div>
      `;

      // Dual-hover sync: card hover highlights marker
      card.addEventListener('mouseenter', () => highlightMarker(item.id));
      card.addEventListener('mouseleave', () => unhighlightMarker(item.id));

      listingsGrid.appendChild(card);
    });

    // Sync wishlist states
    syncHeartStates();

    // Render map markers if map view is active
    if (isMapView && mapInstance) {
      updateMapMarkers();
    }
  }

  function showEmptyState() {
    listingsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
  }

  /**
   * Initialize Leaflet map if map view is selected
   */
  function initMap() {
    if (mapInstance) {
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
   * Render custom red pin markers, blue center, dashed circle and lines on map
   */
  function updateMapMarkers() {
    if (!mapInstance || !markersLayer) return;

    markersLayer.clearLayers();

    // Clear previous dynamic layers
    if (window.mapCircle) {
      mapInstance.removeLayer(window.mapCircle);
      window.mapCircle = null;
    }
    if (window.mapLines) {
      window.mapLines.forEach(line => mapInstance.removeLayer(line));
      window.mapLines = [];
    }
    if (window.centerMarker) {
      mapInstance.removeLayer(window.centerMarker);
      window.centerMarker = null;
    }

    window.mapLines = [];

    const bounds = [];

    // 1. Draw dashed circle and blue center pin if geocoded
    if (searchedCoords) {
      const radiusValue = parseInt(radiusSlider.value || '15');
      const radiusMetres = radiusValue * 1000;

      window.mapCircle = L.circle([searchedCoords.lat, searchedCoords.lng], {
        radius: radiusMetres,
        dashArray: '6 4',
        fillOpacity: 0.08,
        color: '#4285F4'
      }).addTo(mapInstance);

      const blueIcon = L.divIcon({
        html: `
          <svg class="w-8 h-8 text-blue-500 filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      window.centerMarker = L.marker([searchedCoords.lat, searchedCoords.lng], { icon: blueIcon })
        .bindPopup(`<div class="font-bold text-center text-gray-800 p-1">Searched Center</div>`)
        .addTo(mapInstance);

      bounds.push([searchedCoords.lat, searchedCoords.lng]);
    }

    // 2. Draw listing markers and connection lines
    currentListings.forEach(item => {
      const lat = item.latitude || (23.8103 + (Math.random() - 0.5) * 0.08);
      const lng = item.longitude || (90.4125 + (Math.random() - 0.5) * 0.08);

      bounds.push([lat, lng]);

      const images = item.imageUrl ? item.imageUrl.split(',') : [];
      const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

      let distanceText = '';
      if (item.distanceMetres !== undefined && item.distanceMetres !== null) {
        distanceText = `<p class="text-xs font-semibold text-emerald-600 mb-1">${(item.distanceMetres / 1000).toFixed(1)} km away</p>`;
      }

      const popupContent = `
        <div class="w-48 text-[#222222]">
          <img src="${mainImage}" class="w-full h-24 object-cover rounded-md mb-2">
          <p class="font-bold text-sm truncate mb-0.5">${item.title}</p>
          ${distanceText}
          <p class="text-xs text-primary font-bold mb-1.5">${formatPriceRange(item)}</p>
          <a href="listing-detail.html?id=${item.id}" class="block text-center bg-primary text-white py-1 rounded text-xs font-bold hover:bg-primary-dark">View Details</a>
        </div>
      `;

      // Custom Red Pin Icon
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

      const marker = L.marker([lat, lng], { icon: customRedIcon })
        .bindPopup(popupContent);

      // Bind distance tooltip permanent label if distance present
      if (item.distanceMetres !== undefined && item.distanceMetres !== null) {
        const tooltipText = `${(item.distanceMetres / 1000).toFixed(1)} km`;
        marker.bindTooltip(tooltipText, {
          permanent: true,
          direction: 'top',
          className: 'bg-white border border-gray-300 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm drop-shadow-sm',
          offset: [0, -10]
        });
      }

      // Dual-hover sync: marker hover highlights card
      marker.on('mouseover', () => {
        highlightCard(item.id);
        highlightMarker(item.id);
      });
      marker.on('mouseout', () => {
        unhighlightCard(item.id);
        unhighlightMarker(item.id);
      });

      markersLayer.addLayer(marker);
      markerMap[item.id] = marker;

      // 3. Draw dashed line from center to listing
      if (searchedCoords) {
        const polyline = L.polyline([[searchedCoords.lat, searchedCoords.lng], [lat, lng]], {
          color: '#4285F4',
          weight: 1.5,
          dashArray: '5 5',
          opacity: 0.6
        }).addTo(mapInstance);
        window.mapLines.push(polyline);
      }
    });

    if (bounds.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  // Hover Highlight helpers
  function highlightMarker(id) {
    const marker = markerMap[id];
    if (marker) {
      const highlightIcon = L.divIcon({
        html: `
          <div class="scale-125 transition-transform duration-200">
            <svg class="w-8 h-8 text-red-600 filter drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
      marker.setIcon(highlightIcon);
      marker.setZIndexOffset(1000);
    }
  }

  function unhighlightMarker(id) {
    const marker = markerMap[id];
    if (marker) {
      const defaultIcon = L.divIcon({
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
      marker.setIcon(defaultIcon);
      marker.setZIndexOffset(0);
    }
  }

  function highlightCard(id) {
    const card = document.querySelector(`a[data-id="${id}"]`);
    if (card) {
      card.classList.add('bg-gray-100', 'ring-2', 'ring-primary/20', 'scale-[1.01]', 'shadow-sm');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function unhighlightCard(id) {
    const card = document.querySelector(`a[data-id="${id}"]`);
    if (card) {
      card.classList.remove('bg-gray-100', 'ring-2', 'ring-primary/20', 'scale-[1.01]', 'shadow-sm');
    }
  }
});
