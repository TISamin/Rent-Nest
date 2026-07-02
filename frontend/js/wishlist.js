/**
 * Shared Wishlist (Favourites) Utilities for RentNest listing cards.
 */

// Toggle wishlist status of a listing
async function toggleWishlist(event, listingId, heartBtn) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isAuthenticated()) {
    showToast("Log in to save spaces!", "warning");
    return;
  }

  const svg = heartBtn.querySelector('svg');
  const isCurrentlySaved = svg.classList.contains('fill-primary');

  try {
    const res = await apiPost(`/wishlist/toggle/${listingId}`);
    if (res.success && res.data) {
      const added = res.data.added;
      if (added) {
        svg.classList.remove('fill-black/30', 'stroke-white');
        svg.classList.add('fill-primary', 'stroke-primary');
        showToast("Added to saved spaces!", "success");
      } else {
        svg.classList.remove('fill-primary', 'stroke-primary');
        svg.classList.add('fill-black/30', 'stroke-white');
        showToast("Removed from saved spaces.", "info");
      }
      
      // Dispatch a custom event in case other components need to know
      window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { listingId, added } }));
    }
  } catch (err) {
    console.error("Failed to toggle wishlist:", err);
    showToast("Failed to update wishlist.", "error");
  }
}

// Sync heart icon states on page load or after new listings render
async function syncHeartStates() {
  if (!isAuthenticated()) return;

  const heartButtons = document.querySelectorAll('[data-wishlist-btn]');
  if (heartButtons.length === 0) return;

  const ids = Array.from(heartButtons).map(btn => btn.getAttribute('data-listing-id'));
  if (ids.length === 0) return;

  try {
    const res = await apiPost('/wishlist/check', ids);
    if (res.success && res.data) {
      const wishlistedIds = res.data;
      heartButtons.forEach(btn => {
        const listingId = btn.getAttribute('data-listing-id');
        const svg = btn.querySelector('svg');
        if (wishlistedIds.includes(listingId)) {
          svg.classList.remove('fill-black/30', 'stroke-white');
          svg.classList.add('fill-primary', 'stroke-primary');
        } else {
          svg.classList.remove('fill-primary', 'stroke-primary');
          svg.classList.add('fill-black/30', 'stroke-white');
        }
      });
    }
  } catch (err) {
    console.error("Failed to sync heart states:", err);
  }
}
