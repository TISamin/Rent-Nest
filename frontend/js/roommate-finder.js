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
          const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800';
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

          const card = document.createElement('div');
          card.className = 'card glass-panel listing-item-card roommate-finder-card animate-fade-in';
          card.innerHTML = `
            <div class="card-image-wrapper">
              <img src="${mainImage}" alt="${item.title}">
              <span class="card-category-badge">ROOMMATES</span>
              ${item.price ? `<span class="card-price-tag">${item.price} BDT/mo</span>` : ''}
            </div>
            <div class="card-body-content">
              <h3 class="card-title-text">${item.title}</h3>
              <div class="card-location-text">📍 ${item.locationText || 'Location Specified on Map'}</div>
              ${listingDate ? `<div class="text-xs text-gray-500 mb-2">🗓️ ${listingDate}</div>` : ''}
              
              <!-- Roommate Wanted Status Row -->
              <div class="roommate-stats-row">
                <div class="roommate-stat-badge">
                  <span class="roommate-stat-num">${wantedCount}</span>
                  <span class="roommate-stat-lbl">Wanted</span>
                </div>
                <div class="roommate-stat-badge">
                  <span class="roommate-stat-num">${haveCount}</span>
                  <span class="roommate-stat-lbl">Already Have</span>
                </div>
              </div>

              <!-- Members avatars list -->
              ${membersList.length > 0 ? `
                <div class="member-avatar-list-wrapper mt-1 mb-1">
                  <span class="form-help-text">Roommates present:</span>
                  <div class="member-avatar-list mt-xs">
                    ${membersList.map(m => `<img src="${m.memberPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Member avatar" title="${m.memberDescription}">`).join('')}
                  </div>
                </div>
              ` : ''}

              <p class="card-description-text mt-1">${item.description ? item.description.substring(0, 100) + '...' : 'No description provided.'}</p>
              
              <div class="card-footer-info">
                <div class="card-author-profile">
                  <img src="${roommate.ownerPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Owner Profile">
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
