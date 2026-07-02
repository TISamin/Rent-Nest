document.addEventListener('DOMContentLoaded', () => {
  // Parse incoming query params if redirected from landing search
  const params = new URLSearchParams(window.location.search);
  const initialArea = params.get('area') || '';

  const areaInput = document.getElementById('search-area');
  const searchForm = document.getElementById('roommate-search-form');
  const listingsGrid = document.getElementById('roommate-listings-grid');

  if (initialArea) areaInput.value = initialArea;

  // Initial Fetch
  fetchRoommateListings();

  // Search trigger
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchRoommateListings();
  });

  /**
   * Fetch roommate listings via Search API
   */
  async function fetchRoommateListings() {
    listingsGrid.innerHTML = `
      <div class="card glass-panel skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
      </div>
    `;

    const area = areaInput.value.trim();
    
    try {
      const queryStr = area ? `?area=${encodeURIComponent(area)}` : '';
      const res = await apiGet(`/search/roommate${queryStr}`);
      
      listingsGrid.innerHTML = '';
      
      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach(item => {
          const roommate = item.roommateInfo || {};
          const wantedCount = roommate.totalRoommatesWanted || 0;
          const haveCount = roommate.roommatesAlreadyHave || 0;
          const membersList = roommate.members || [];
          
          const images = item.imageUrl ? item.imageUrl.split(',') : [];
          const mainImage = formatImageUrl(images.length > 0 ? images[0] : '', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800');
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

          const card = document.createElement('div');
          card.className = 'listing-card flex flex-col h-full bg-white relative';
          card.innerHTML = `
            <div class="relative aspect-[3/2] overflow-hidden bg-gray-100 flex-shrink-0 rounded-t-2xl">
              <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 ease group-hover:scale-110" loading="lazy">
              <button class="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 backdrop-blur-sm text-gray-600 hover:text-[#e67e5a] transition-colors focus:outline-none z-10" onclick="toggleHeart(event, this)">
                <svg class="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
            <div class="p-5 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e67e5a]/10 text-[#e67e5a] uppercase tracking-wider">ROOMMATES</span>
                  <span class="text-sm font-bold text-[#1a2e3f]">${item.priceMin || item.price ? formatPriceRange(item) + '/mo' : 'Split Rent'}</span>
                </div>
                <h4 class="font-bold text-[#1a2e3f] truncate mb-1.5 text-base">${item.title}</h4>
                <p class="text-sm text-[#2d4a5e]/60 mt-1 flex items-center gap-1">
                  <span>📍</span> <span class="truncate">${item.locationText || 'Location Specified'}</span>
                </p>
                
                <!-- Roommate Wanted Status Row -->
                <div class="flex gap-3 my-4">
                  <div class="flex-1 bg-[#e67e5a]/5 border border-[#e67e5a]/20 rounded-xl py-2 px-3 text-center">
                    <span class="block text-base font-bold text-[#e67e5a]">${wantedCount}</span>
                    <span class="block text-[9px] text-[#2d4a5e]/50 uppercase font-semibold tracking-wide">Wanted</span>
                  </div>
                  <div class="flex-1 bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-center">
                    <span class="block text-base font-bold text-[#1a2e3f]">${haveCount}</span>
                    <span class="block text-[9px] text-[#2d4a5e]/50 uppercase font-semibold tracking-wide">Have</span>
                  </div>
                </div>

                <!-- Members avatars list -->
                ${membersList.length > 0 ? `
                  <div class="flex items-center gap-2 my-3">
                    <span class="text-[9px] text-[#2d4a5e]/50 font-semibold uppercase tracking-wider">Present:</span>
                    <div class="flex -space-x-1.5 overflow-hidden">
                      ${membersList.map(m => `<img class="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="${formatImageUrl(m.memberPhotoUrl, 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')}" alt="Member avatar" title="${m.memberDescription}">`).join('')}
                    </div>
                  </div>
                ` : ''}

                <p class="text-sm text-[#2d4a5e]/60 line-clamp-2 min-h-[40px] mb-3 mt-2">${item.description || 'No description provided.'}</p>
              </div>
              
              <div class="flex items-center justify-between mt-2 pt-3 border-t border-[#e8d5c4]/60">
                <div class="flex items-center gap-2">
                  <img class="w-7 h-7 rounded-full object-cover border border-gray-100" src="${formatImageUrl(roommate.ownerPhotoUrl, 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')}" alt="Owner">
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
      } else {
        listingsGrid.innerHTML = `
          <div class="no-listings-fallback text-center w-full mt-3">
            <span class="fallback-icon" style="font-size: 3rem;">🤝</span>
            <h3 class="mt-1">No Roommate Listings</h3>
            <p class="text-secondary mt-1">Be the first to list roommate requirements!</p>
          </div>
        `;
      }
    } catch (error) {
      console.error("Roommate fetch failure:", error);
      listingsGrid.innerHTML = `<div class="text-center w-full error-text">Failed to fetch roommate listings.</div>`;
    }
  }
});
