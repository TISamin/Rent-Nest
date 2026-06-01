document.addEventListener('DOMContentLoaded', () => {
  // Parse incoming search parameters from landing search triggers
  const params = new URLSearchParams(window.location.search);
  const initialLoc = params.get('location') || '';
  const initialCategory = params.get('category') || '';

  const locationInput = document.getElementById('search-location');
  const searchForm = document.getElementById('search-filter-form');
  const tabs = document.querySelectorAll('.tab-btn');
  const listingsGrid = document.getElementById('listings-grid');

  if (initialLoc) locationInput.value = initialLoc;

  // Active Category state variable
  let activeCategory = initialCategory;

  // Set initial active tab
  tabs.forEach(tab => {
    if (tab.getAttribute('data-category') === activeCategory) {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    }
  });

  // Load Initial Listings
  fetchListings();

  // Search Submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchListings();
  });

  // Tab Filtering Handlers
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      fetchListings();
    });
  });

  /**
   * Performs REST calls to local Search APIs and displays listings dynamically
   */
  async function fetchListings() {
    listingsGrid.innerHTML = `
      <div class="card glass-panel skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
      </div>
      <div class="card glass-panel skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
      </div>
    `;

    const locationValue = locationInput.value.trim();
    
    try {
      // Build API query parameters
      let queryParams = [];
      if (locationValue) queryParams.push(`location=${encodeURIComponent(locationValue)}`);
      if (activeCategory) queryParams.push(`category=${encodeURIComponent(activeCategory)}`);
      
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiGet(`/search/rental${queryStr}`);
      
      listingsGrid.innerHTML = '';
      
      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach(item => {
          const card = document.createElement('div');
          card.className = 'card glass-panel listing-item-card animate-fade-in';
          card.innerHTML = `
            <div class="card-image-wrapper">
              <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}" alt="${item.title}">
              <span class="card-category-badge">${item.category.replace('_', ' ')}</span>
              ${item.price ? `<span class="card-price-tag">${item.price} BDT</span>` : ''}
            </div>
            <div class="card-body-content">
              <h3 class="card-title-text">${item.title}</h3>
              <div class="card-location-text">📍 ${item.locationText || 'Location Specified on Map'}</div>
              <p class="card-description-text">${item.description ? item.description.substring(0, 100) + '...' : 'No description provided.'}</p>
              
              <div class="card-footer-info">
                <div class="card-author-profile">
                  <img src="${item.userPhoto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Owner Profile">
                  <span class="card-author-name">${item.userName || 'Anonymous'}</span>
                </div>
                <a href="listing-detail.html?id=${item.id}" class="btn btn-ghost btn-sm">Details</a>
              </div>
            </div>
          `;
          listingsGrid.appendChild(card);
        });
      } else {
        listingsGrid.innerHTML = `
          <div class="no-listings-fallback text-center w-full mt-3">
            <span class="fallback-icon" style="font-size: 3rem;">🔍</span>
            <h3 class="mt-1">No Listings Found</h3>
            <p class="text-secondary mt-1">Try tweaking your search filters or locations.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Listing Search failure:", error);
      listingsGrid.innerHTML = `<div class="text-center w-full error-text">Failed to fetch stay listings.</div>`;
    }
  }
});
