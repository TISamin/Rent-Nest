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
          const mainImage = formatImageUrl(images.length > 0 ? images[0] : '', 'https://images.unsplash.com/photo-1521791136368-1a8b2752f495?w=800');
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

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
                <h4 class="font-bold text-gray-900 truncate mb-1 text-sm">${item.title}</h4>
                <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span>📍</span> <span class="truncate">${item.locationText || 'Location Specified'}</span>
                </p>
                <p class="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-3 mt-3">${item.description || 'No description provided.'}</p>
              </div>
              
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div class="flex items-center gap-1.5">
                  <img class="w-6 h-6 rounded-full object-cover border border-gray-100" src="${formatImageUrl(item.userPhotoUrl, 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')}" alt="Owner">
                  <span class="text-[10px] text-gray-600 font-medium truncate max-w-[80px]">${item.userName || 'Anonymous'}</span>
                </div>
                <a href="listing-detail.html?id=${item.id}" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white shadow-sm transition-all transform active:scale-95">
                  Details
                </a>
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
