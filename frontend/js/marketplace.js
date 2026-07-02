document.addEventListener('DOMContentLoaded', () => {
  // Parse incoming query params if redirecting from elsewhere
  const params = new URLSearchParams(window.location.search);
  const initialItem = params.get('item') || '';

  const itemInput = document.getElementById('search-item');
  const searchForm = document.getElementById('marketplace-search-form');
  const listingsGrid = document.getElementById('marketplace-listings-grid');

  if (initialItem) itemInput.value = initialItem;

  // Initial Fetch
  fetchMarketplaceListings();

  // Search handler
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchMarketplaceListings();
  });

  /**
   * Fetch marketplace items via Search API
   */
  async function fetchMarketplaceListings() {
    listingsGrid.innerHTML = `
      <div class="card glass-panel skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
      </div>
    `;

    const keyword = itemInput.value.trim();
    
    try {
      const queryStr = keyword ? `?item=${encodeURIComponent(keyword)}` : '';
      const res = await apiGet(`/search/marketplace${queryStr}`);
      
      listingsGrid.innerHTML = '';
      
      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach(item => {
          const images = item.imageUrl ? item.imageUrl.split(',') : [];
          const mainImage = formatImageUrl(images.length > 0 ? images[0] : '', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800');
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

          let ratingHtml = '';
          if (item.reviewCount > 0) {
            ratingHtml = `<div class="flex items-center gap-1 text-[10px] font-semibold text-gray-700 mt-0.5 mb-1"><svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>${(item.averageRating || 0).toFixed(1)} (${item.reviewCount})</div>`;
          }

          const card = document.createElement('div');
          card.className = 'listing-card flex flex-col h-full bg-white relative';
          card.innerHTML = `
            <div class="relative aspect-[3/2] overflow-hidden bg-gray-100 flex-shrink-0 rounded-t-2xl">
              <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 ease group-hover:scale-110" loading="lazy">
              <button class="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-600 hover:text-[#e67e5a] transition-colors focus:outline-none z-10" data-wishlist-btn data-listing-id="${item.id}" onclick="toggleWishlist(event, '${item.id}', this)">
                <svg class="w-5 h-5 fill-black/30 stroke-white stroke-2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
            <div class="p-5 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e67e5a]/10 text-[#e67e5a] uppercase tracking-wider">MARKETPLACE</span>
                  <span class="text-sm font-bold text-[#1a2e3f]">${formatPriceRange(item)}</span>
                </div>
                <div class="relative w-full">
                  <h4 class="font-bold text-[#1a2e3f] truncate text-base pr-6 ${ratingHtml ? '' : 'mb-1'}">${item.title}</h4>
                  <button onclick="event.preventDefault(); openReportModal('LISTING', '${item.id}')" class="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition-colors focus:outline-none" title="Report Listing">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                  </button>
                  ${ratingHtml}
                </div>
                <p class="text-sm text-[#2d4a5e]/60 mt-1.5 flex items-center gap-1">
                  <span>📍</span> <span class="truncate">${item.locationText || 'Location Specified'}</span>
                </p>
                <p class="text-sm text-[#2d4a5e]/60 line-clamp-2 min-h-[40px] mb-3 mt-3">${item.description || 'No description provided.'}</p>
              </div>
              
              <div class="flex items-center justify-between mt-2 pt-3 border-t border-[#e8d5c4]/60">
                <div class="flex items-center gap-2">
                  <img class="w-7 h-7 rounded-full object-cover border border-gray-100" src="${formatImageUrl(item.userPhotoUrl, 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')}" alt="Seller">
                  <span class="text-xs text-[#2d4a5e] font-medium truncate max-w-[90px]">${item.userName || 'Anonymous'}</span>
                </div>
                <a href="listing-detail.html?id=${item.id}" class="px-4 py-2 text-xs font-semibold rounded-xl bg-[#e67e5a] hover:bg-[#d06d4a] text-white shadow-sm transition-all transform active:scale-95">
                  Details
                </a>
              </div>
            </div>
          `;

          listingsGrid.appendChild(card);
        });
        syncHeartStates();
      } else {
        listingsGrid.innerHTML = `
          <div class="no-listings-fallback text-center w-full mt-3">
            <span class="fallback-icon" style="font-size: 3rem;">🛍️</span>
            <h3 class="mt-1">No Items Available</h3>
            <p class="text-secondary mt-1">Be the first to list an item in the marketplace!</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Marketplace fetch failure:", error);
      listingsGrid.innerHTML = `<div class="text-center w-full error-text">Failed to fetch marketplace items.</div>`;
    }
  }
});
