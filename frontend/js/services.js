document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const initialLoc = params.get('location') || '';
  const initialCategory = params.get('category') || '';

  const locationInput = document.getElementById('search-location');
  const searchForm = document.getElementById('search-filter-form');
  const tabs = document.querySelectorAll('.tab-btn');
  const listingsGrid = document.getElementById('listings-grid');

  if (initialLoc) locationInput.value = initialLoc;

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

  async function fetchListings() {
    listingsGrid.innerHTML = `
      <div class="card glass-panel skeleton-card animate-pulse">
        <div class="skeleton-image bg-white/5 h-[200px]"></div>
        <div class="skeleton-title bg-white/5 h-5 m-4 w-[70%] rounded"></div>
        <div class="skeleton-text bg-white/5 h-4 mx-4 mb-4 w-[50%] rounded"></div>
      </div>
      <div class="card glass-panel skeleton-card animate-pulse">
        <div class="skeleton-image bg-white/5 h-[200px]"></div>
        <div class="skeleton-title bg-white/5 h-5 m-4 w-[70%] rounded"></div>
        <div class="skeleton-text bg-white/5 h-4 mx-4 mb-4 w-[50%] rounded"></div>
      </div>
    `;

    const locationValue = locationInput.value.trim();
    
    try {
      let queryParams = [];
      if (locationValue) queryParams.push(`location=${encodeURIComponent(locationValue)}`);
      if (activeCategory) queryParams.push(`category=${encodeURIComponent(activeCategory)}`);
      
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiGet(`/search/services${queryStr}`);
      
      listingsGrid.innerHTML = '';
      
      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach(item => {
          const images = item.imageUrl ? item.imageUrl.split(',') : [];
          const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1521791136368-1a8b2752f495?w=800';
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

          const card = document.createElement('div');
          card.className = 'card glass-panel listing-item-card animate-fade-in';
          card.innerHTML = `
            <div class="card-image-wrapper">
              <img src="${mainImage}" alt="${item.title}">
              <span class="card-category-badge">${item.category.replace('_', ' ')}</span>
              ${item.price ? `<span class="card-price-tag">${item.price} BDT</span>` : '<span class="card-price-tag">Negotiable / Contact</span>'}
            </div>
            <div class="card-body-content">
              <h3 class="card-title-text font-heading">${item.title}</h3>
              <div class="card-location-text">📍 ${item.locationText || 'Location Specified on Map'}</div>
              ${listingDate ? `<div class="text-xs text-gray-500 mb-2">🗓️ ${listingDate}</div>` : ''}
              <p class="card-description-text">${item.description ? item.description.substring(0, 100) + '...' : 'No description provided.'}</p>
              
              <div class="card-footer-info">
                <div class="card-author-profile">
                  <img src="${item.userPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Owner Profile">
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
          <div class="no-listings-fallback text-center w-full mt-3 col-span-full">
            <span class="fallback-icon" style="font-size: 3rem;">🔍</span>
            <h3 class="mt-1 text-lg font-semibold">No Services Found</h3>
            <p class="text-secondary mt-1">Try tweaking your search filters or categories.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Services Search failure:", error);
      listingsGrid.innerHTML = `<div class="text-center w-full error-text col-span-full">Failed to fetch service listings.</div>`;
    }
  }
});
