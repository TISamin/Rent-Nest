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
          const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800';
          const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

          const card = document.createElement('div');
          card.className = 'card glass-panel listing-item-card animate-fade-in';
          card.innerHTML = `
            <div class="card-image-wrapper">
              <img src="${mainImage}" alt="${item.title}">
              <span class="card-category-badge">MARKETPLACE</span>
              ${item.price ? `<span class="card-price-tag">${item.price} BDT</span>` : '<span class="card-price-tag">Free / Contact</span>'}
            </div>
            <div class="card-body-content">
              <h3 class="card-title-text">${item.title}</h3>
              <div class="card-location-text">📍 ${item.locationText || 'Location Specified on Map'}</div>
              ${listingDate ? `<div class="text-xs text-gray-500 mb-2">🗓️ ${listingDate}</div>` : ''}
              <p class="card-description-text">${item.description ? item.description.substring(0, 100) + '...' : 'No description provided.'}</p>
              
              <div class="card-footer-info">
                <div class="card-author-profile">
                  <img src="${item.userPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Seller Profile">
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
