document.addEventListener('DOMContentLoaded', () => {
  // Get listing ID from URL queries
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showToast("No Listing ID provided.", "error");
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  // let galleryImages = [];
  // let currentImageIndex = 0;
  // let currentReviewRating = 0;
  let galleryImages = [];
  let currentImageIndex = 0;
  let currentReviewRating = 0;
  const localUser = localStorage.getItem('rentnest_user');
  const currentUserId = localUser ? JSON.parse(localUser).id : null;

  // Load single listing details
  loadListingDetail(id);

  async function loadListingDetail(listingId) {
    try {
      const res = await apiGet(`/listings/${listingId}`);
      
      if (res.success && res.data) {
        const item = res.data;
        
        // Populate breadcrumbs
        const categoryLabel = item.category.replace('_', ' ');
        document.getElementById('breadcrumb-category').innerText = categoryLabel;
        document.getElementById('breadcrumb-title').innerText = item.title;

        // Aggregate all images (Cover + Room photos)
        galleryImages = item.imageUrl ? item.imageUrl.split(',').map(url => formatImageUrl(url)) : [];
        if (item.rooms) {
          item.rooms.forEach(room => {
            if (room.imageUrls && room.imageUrls.length > 0) {
              room.imageUrls.forEach(url => galleryImages.push(formatImageUrl(url)));
            }
          });
        }
        
        // Remove duplicates just in case
        galleryImages = [...new Set(galleryImages)];

        if (galleryImages.length === 0) {
          galleryImages = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']; // Only fallback if absolutely no images exist
        }

        const mainImage = galleryImages[0];
        document.getElementById('detail-image').src = mainImage;

        const thumbnailsGrid = document.getElementById('detail-thumbnails-grid');
        if (thumbnailsGrid) {
          thumbnailsGrid.innerHTML = '';
          const gridImages = [...galleryImages.slice(1, 5)];

          gridImages.forEach((imgUrl, index) => {
            const thumbCol = document.createElement('div');
            thumbCol.className = 'thumbnail-grid-item rounded-lg border border-gray-200';
            thumbCol.innerHTML = `<img src="${imgUrl}" alt="Gallery thumbnail ${index + 1}">`;
            
            // Add click callback to open lightbox on that image
            thumbCol.addEventListener('click', () => {
              const galleryIdx = galleryImages.indexOf(imgUrl);
              openLightbox(galleryIdx >= 0 ? galleryIdx : 0);
            });
            thumbnailsGrid.appendChild(thumbCol);
          });
        }

        // Add click listener to main cover image to open lightbox
        document.getElementById('primary-gallery-img').addEventListener('click', () => {
          openLightbox(0);
        });

        // Render Category Badge
        const categoryBadge = document.getElementById('detail-category-badge');
        categoryBadge.innerText = categoryLabel;

        // Report Listing Button
        const reportBtn = document.getElementById('report-listing-btn');
        if (reportBtn) {
          reportBtn.addEventListener('click', () => openReportModal('LISTING', item.id));
        }

        // Ratings UI
        // const localUser = localStorage.getItem('rentnest_user');
        // const localUser = localStorage.getItem('rentnest_user');
        // const currentUserId = localUser ? JSON.parse(localUser).id : null;
        if (['FLAT', 'HOTEL', 'HOUSE', 'CONVENTION_HALL', 'SHIFTING_SERVICE', 'CATERING_SERVICE'].includes(item.category)) {
          document.getElementById('detail-rating-container').classList.remove('hidden');
          const avg = (item.averageRating || 0).toFixed(1);
          document.getElementById('detail-rating-score').innerText = avg;
          document.getElementById('detail-review-count').innerText = item.reviewCount || 0;

          document.getElementById('detail-reviews-title-score').innerText = avg;
          document.getElementById('detail-reviews-title-count').innerText = item.reviewCount || 0;
          
          document.getElementById('detail-reviews-panel').classList.remove('hidden');
          
          if (isAuthenticated() && (!localUser || JSON.parse(localUser).id !== item.userId)) {
            document.getElementById('write-review-btn').classList.remove('hidden');
          }
          
          loadReviews(item.id);
        }
        
        // Render Title & Address
        document.getElementById('detail-title').innerText = item.title;
        document.getElementById('detail-location-text').innerHTML = `
          <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span>${item.locationText || 'Location Specified on Map'}</span>
        `;
        
        // Render Description
        document.getElementById('detail-description').innerText = item.description || 'No description provided.';
        
        // Render Pricing Side-Panel details
        const priceText = document.getElementById('detail-price-text');
        priceText.innerText = (item.priceMin || item.price) ? formatPriceRange(item) : 'Contact Owner';
        
        // Render listing date
        const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const dateEl = document.getElementById('detail-listing-date');
        if (dateEl) {
          dateEl.innerText = listingDate ? `🗓️ Posted on: ${listingDate}` : '🗓️ Posted Today';
        }

        // Render Amenities
        if (item.amenities && item.amenities.length > 0) {
          document.getElementById('detail-amenities-panel').classList.remove('hidden');
          const amContainer = document.getElementById('detail-amenities');
          amContainer.innerHTML = item.amenities.map(a => `<span class="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">${a}</span>`).join('');
        }

        // Render Residential Info
        if (item.residentialInfo) {
          document.getElementById('detail-residential-panel').classList.remove('hidden');
          document.getElementById('detail-beds').innerText = item.residentialInfo.bedroomCount || 0;
          document.getElementById('detail-baths').innerText = item.residentialInfo.bathroomCount || 0;
          document.getElementById('detail-other').innerText = item.residentialInfo.otherRoomsCount || 0;
        }

        // Render Rooms
        if (item.rooms && item.rooms.length > 0) {
          document.getElementById('detail-rooms-panel').classList.remove('hidden');
          const roomsContainer = document.getElementById('detail-rooms-container');
          roomsContainer.innerHTML = item.rooms.map((room, idx) => {
            const images = room.imageUrls ? room.imageUrls.map(u => formatImageUrl(u)) : [];
            const imageHtml = images.map(img => `<img src="${img}" class="w-32 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer" onclick="window.open('${img}', '_blank')">`).join('');
            return `
              <div class="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full uppercase">${room.roomType}</span>
                  <span class="text-sm font-semibold text-gray-800">${room.description || `Room ${idx + 1}`}</span>
                </div>
                ${images.length > 0 ? `<div class="flex gap-2 overflow-x-auto pb-2">${imageHtml}</div>` : `<p class="text-xs text-gray-400">No photos</p>`}
              </div>
            `;
          }).join('');
        }

        // Render Convention Info
        if (item.conventionInfo) {
          document.getElementById('detail-convention-panel').classList.remove('hidden');
          document.getElementById('detail-capacity').innerText = item.conventionInfo.capacity || '-';
          document.getElementById('detail-halls').innerText = item.conventionInfo.hallCount || '-';
        }

        // Render Service Offerings
        if (item.offerings && item.offerings.length > 0) {
          document.getElementById('detail-offerings-panel').classList.remove('hidden');
          const offContainer = document.getElementById('detail-offerings-container');
          offContainer.innerHTML = item.offerings.map(off => `
            <div class="flex justify-between items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div>
                <h4 class="font-bold text-gray-900 text-sm">${off.offeringName}</h4>
                ${off.description ? `<p class="text-xs text-gray-500 mt-1">${off.description}</p>` : ''}
              </div>
              <div class="text-right">
                <span class="font-bold text-primary text-sm">${formatPriceRange(off)}</span>
              </div>
            </div>
          `).join('');
        }

        // Render Author details
        document.getElementById('detail-owner-name').innerText = item.userName || 'Anonymous Owner';
        if (item.userPhotoUrl) {
          document.getElementById('detail-owner-avatar').src = item.userPhotoUrl;
        }

        // Setup sticky contact card Show Number click listener
        const showNumberBtn = document.getElementById('show-number-btn');
        const contactBtn = document.getElementById('detail-contact-btn');
        if (showNumberBtn && contactBtn) {
          if (item.contactPhone) {
            contactBtn.href = `tel:${item.contactPhone}`;
            contactBtn.innerHTML = `📞 Call Owner (${item.contactPhone})`;
            
            showNumberBtn.addEventListener('click', () => {
              showNumberBtn.classList.add('hidden');
              contactBtn.classList.remove('hidden');
              showToast("Phone number revealed!", "success");
            });
          } else {
            showNumberBtn.addEventListener('click', () => {
              showToast("No contact phone provided for this listing.", "warning");
            });
          }
        }

        // Show delete button if the logged-in user is the owner
        if (localUser && isAuthenticated()) {
          try {
            const userObj = JSON.parse(localUser);
            if (userObj && userObj.id === item.userId) {
              const deleteBtn = document.getElementById('detail-delete-btn');
              if (deleteBtn) {
                deleteBtn.classList.remove('hidden');
                deleteBtn.addEventListener('click', async () => {
                  if (confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
                    deleteBtn.disabled = true;
                    deleteBtn.innerText = "Deleting...";
                    try {
                      const delRes = await apiDelete(`/listings/${item.id}`);
                      if (delRes.success) {
                        showToast("Listing deleted successfully.", "success");
                        // Redirect back depending on the category
                        let targetPage = 'browse-rental.html';
                        if (item.category === 'MARKETPLACE') {
                          targetPage = 'marketplace.html';
                        } else if (item.category === 'ROOMMATE_FINDER') {
                          targetPage = 'roommate-finder.html';
                        } else if (['SHIFTING_SERVICE', 'EVENT_PLANNING', 'DECORATION_SERVICE', 'MAINTENANCE_SERVICE', 'CLEANING_SERVICE', 'CATERING_SERVICE'].includes(item.category)) {
                          targetPage = 'services.html';
                        }
                        setTimeout(() => {
                          window.location.href = targetPage;
                        }, 1500);
                      } else {
                        showToast(delRes.message || "Failed to delete listing.", "error");
                        deleteBtn.disabled = false;
                        deleteBtn.innerHTML = "🗑️ Delete Listing";
                      }
                    } catch (err) {
                      console.error("Delete request failed:", err);
                      showToast("Error deleting listing.", "error");
                      deleteBtn.disabled = false;
                      deleteBtn.innerHTML = "🗑️ Delete Listing";
                    }
                  }
                });
              }
            }
          } catch (e) {
            console.error("Failed to parse local user or setup delete button", e);
          }
        }

        // Setup Wishlist Heart Button
        const heartBtn = document.getElementById('detail-heart-btn');
        if (heartBtn) {
          heartBtn.setAttribute('data-listing-id', item.id);
          heartBtn.setAttribute('data-wishlist-btn', '');
          heartBtn.addEventListener('click', (e) => {
            toggleWishlist(e, item.id, heartBtn);
          });
          
          if (isAuthenticated()) {
            apiPost('/wishlist/check', [item.id]).then(resCheck => {
              if (resCheck.success && resCheck.data && resCheck.data.includes(item.id)) {
                const svg = heartBtn.querySelector('svg');
                svg.classList.remove('fill-black/30', 'stroke-white');
                svg.classList.add('fill-primary', 'stroke-primary');
              }
            }).catch(err => console.error("Error syncing detail heart:", err));
          }
        }

        // Setup Leaflet map coordinate highlights
        const lat = item.latitude || 23.8103;
        const lng = item.longitude || 90.4125;
        
        const map = L.map('leaflet-detail-map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        
        L.marker([lat, lng]).addTo(map)
          .bindPopup(`<b>${item.title}</b><br>${item.locationText || ''}`)
          .openPopup();
        
        // Ensure map tiles render fully
        setTimeout(() => map.invalidateSize(), 200);

        // Render Roommates specs dynamically if category is ROOMMATE_FINDER
        if (item.category === 'ROOMMATE_FINDER' && item.roommateInfo) {
          const roommate = item.roommateInfo;
          document.getElementById('detail-roommates-panel').classList.remove('hidden');
          
          document.getElementById('detail-wanted-count').innerText = roommate.totalRoommatesWanted || 0;
          document.getElementById('detail-have-count').innerText = roommate.roommatesAlreadyHave || 0;
          
          const membersCardsContainer = document.getElementById('detail-members-cards');
          membersCardsContainer.innerHTML = '';
          
          if (roommate.members && roommate.members.length > 0) {
            roommate.members.forEach((m, idx) => {
              const card = document.createElement('div');
              card.className = 'p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col sm:flex-row gap-4 items-center animate-fade-in';
              card.innerHTML = `
                <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                  M${idx + 1}
                </div>
                <div class="flex-1 text-center sm:text-left">
                  <h4 class="font-bold text-gray-900 text-sm mb-1">Roommate #${idx + 1}</h4>
                  <p class="text-xs text-gray-500">${m.memberDescription || 'No description provided.'}</p>
                </div>
              `;
              membersCardsContainer.appendChild(card);
            });
          } else {
            membersCardsContainer.innerHTML = `<p class="text-xs text-gray-400">No members details loaded.</p>`;
          }
        }
      } else {
        showToast(res.message || "Failed to load listing details.", "error");
      }
    } catch (error) {
      console.error("Listing loading failed:", error);
      showToast("Failed to connect to local server APIs.", "error");
    }
  }

  // Reviews Logic
  // async function loadReviews(listingId) {
  //   try {
  //     const res = await apiGet(`/reviews/listing/${listingId}?page=0&size=50`);
  //     if (res.success && res.data && res.data.content) {
  //       const reviews = res.data.content;
  //       const listContainer = document.getElementById('detail-reviews-list');
        
  //       if (reviews.length === 0) {
  //         listContainer.innerHTML = '<p class="text-sm text-gray-500">No reviews yet.</p>';
  //         return;
  //       }

  //       listContainer.innerHTML = reviews.map(r => `
  //         <div class="border border-gray-100 rounded-xl p-4 bg-gray-50">
  //           <div class="flex items-center justify-between mb-3">
  //             <div class="flex items-center gap-3">
  //               <img src="${r.userPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" class="w-10 h-10 rounded-full object-cover">
  //               <div>
  //                 <h4 class="text-sm font-bold text-gray-900">${r.userName}</h4>
  //                 <p class="text-xs text-gray-500">${new Date(r.createdAt).toLocaleDateString()}</p>
  //               </div>
  //             </div>
  //             <button onclick="openReportModal('REVIEW', '${r.id}')" class="text-gray-400 hover:text-red-500" title="Report Review"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg></button>
  //           </div>
  //           <div class="flex items-center gap-1 mb-2">
  //             ${Array(5).fill(0).map((_, i) => `<svg class="w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`).join('')}
  //           </div>
  //           <p class="text-sm text-gray-700">${r.comment || ''}</p>
  //         </div>
  //       `).join('');
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  async function loadReviews(listingId) {
  try {
    const res = await apiGet(`/reviews/listing/${listingId}?page=0&size=50`);
    if (res.success && res.data && res.data.content) {
      const reviews = res.data.content;
      const listContainer = document.getElementById('detail-reviews-list');

      if (reviews.length === 0) {
        listContainer.innerHTML = '<p class="text-sm text-gray-500">No reviews yet.</p>';
        return;
      }

      listContainer.innerHTML = reviews.map(r => {
        const isOwner = currentUserId && r.reviewerId === currentUserId;
        return `
          <div class="border border-gray-100 rounded-xl p-4 bg-gray-50" id="review-card-${r.id}">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <img src="${r.userPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" class="w-10 h-10 rounded-full object-cover">
                <div>
                  <h4 class="text-sm font-bold text-gray-900">${r.userName}</h4>
                  <p class="text-xs text-gray-500">${new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                ${isOwner ? `
                  <button onclick="editReview('${r.id}', ${r.rating}, '${(r.comment || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n')}')" class="text-gray-400 hover:text-blue-500" title="Edit Review">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onclick="deleteReview('${r.id}')" class="text-gray-400 hover:text-red-500" title="Delete Review">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                ` : `
                  <button onclick="openReportModal('REVIEW', '${r.id}')" class="text-gray-400 hover:text-red-500" title="Report Review">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                  </button>
                `}
              </div>
            </div>
            <div class="flex items-center gap-1 mb-2" id="review-stars-${r.id}">
              ${Array(5).fill(0).map((_, i) => `<svg class="w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`).join('')}
            </div>
            <p class="text-sm text-gray-700" id="review-comment-${r.id}">${r.comment || ''}</p>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error(err);
  }
}

  window.openReviewModal = function() {
    currentReviewRating = 0;
    setReviewRating(0);
    document.getElementById('review-comment').value = '';
    document.getElementById('reviewModal').classList.remove('hidden');
  };

  window.closeReviewModal = function() {
    document.getElementById('reviewModal').classList.add('hidden');
  };

  window.setReviewRating = function(rating) {
    currentReviewRating = rating;
    const svgs = document.getElementById('review-stars-input').querySelectorAll('svg');
    svgs.forEach((svg, idx) => {
      if (idx < rating) {
        svg.classList.remove('text-gray-300');
        svg.classList.add('text-yellow-400');
      } else {
        svg.classList.remove('text-yellow-400');
        svg.classList.add('text-gray-300');
      }
    });
  };

  window.submitReview = async function() {
    if (currentReviewRating === 0) {
      showToast("Please select a rating", "warning");
      return;
    }
    const comment = document.getElementById('review-comment').value.trim();
    try {
      await apiPost('/reviews', { listingId: id, rating: currentReviewRating, comment });
      showToast("Review submitted!", "success");
      closeReviewModal();
      loadListingDetail(id); // Reload to update stats and list
    } catch(e) {}
  };

  // Lightbox Modal functions
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('closeLightbox');
  const prevBtn = document.getElementById('prevLightbox');
  const nextBtn = document.getElementById('nextLightbox');

  function openLightbox(index) {
    if (galleryImages.length === 0) return;
    currentImageIndex = index;
    lightboxImg.src = galleryImages[currentImageIndex];
    lightbox.classList.remove('hidden');
  }

  closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden');
  });

  prevBtn.addEventListener('click', () => {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImageIndex];
  });

  nextBtn.addEventListener('click', () => {
    if (galleryImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[currentImageIndex];
  });

  // Close lightbox on click outside the image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.add('hidden');
    }
  });
  let editReviewRating = 0;

window.editReview = function(reviewId, currentRating, currentComment) {
  editReviewRating = currentRating;
  const card = document.getElementById(`review-card-${reviewId}`);
  card.innerHTML = `
    <div class="flex flex-col gap-3">
      <p class="text-sm font-semibold text-gray-700">Edit your review</p>
      <div class="flex items-center gap-1" id="edit-stars-${reviewId}">
        ${Array(5).fill(0).map((_, i) => `
          <svg onclick="setEditRating('${reviewId}', ${i + 1})"
            class="w-6 h-6 cursor-pointer ${i < currentRating ? 'text-yellow-400' : 'text-gray-300'}"
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>`).join('')}
      </div>
      <textarea id="edit-comment-${reviewId}" rows="3"
        class="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
      >${currentComment}</textarea>
      <div class="flex gap-2">
        <button onclick="submitEditReview('${reviewId}')"
          class="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">Save</button>
        <button onclick="loadReviews('${id}')"
          class="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </div>
  `;
};

window.setEditRating = function(reviewId, rating) {
  editReviewRating = rating;
  const stars = document.querySelectorAll(`#edit-stars-${reviewId} svg`);
  stars.forEach((svg, i) => {
    svg.classList.toggle('text-yellow-400', i < rating);
    svg.classList.toggle('text-gray-300', i >= rating);
  });
};

window.submitEditReview = async function(reviewId) {
  if (editReviewRating === 0) {
    showToast("Please select a rating", "warning");
    return;
  }
  const comment = document.getElementById(`edit-comment-${reviewId}`).value.trim();
  try {
    const res = await apiPut(`/reviews/${reviewId}`, { rating: editReviewRating, comment });
    if (res.success) {
      showToast("Review updated!", "success");
      refreshRatingDisplay();
      loadReviews(id);
    } else {
      showToast(res.message || "Failed to update review", "error");
    }
  } catch(e) {
    showToast("Error updating review", "error");
  }
};

window.deleteReview = async function(reviewId) {
  if (!confirm("Delete your review? This cannot be undone.")) return;
  try {
    const res = await apiDelete(`/reviews/${reviewId}`);
    if (res.success) {
      showToast("Review deleted", "success");
      document.getElementById(`review-card-${reviewId}`).remove();
      refreshRatingDisplay();
    } else {
      showToast(res.message || "Failed to delete review", "error");
    }
  } catch(e) {
    showToast("Error deleting review", "error");
  }
};

async function refreshRatingDisplay() {
  try {
    const res = await apiGet(`/listings/${id}`);
    if (res.success && res.data) {
      const avg = (res.data.averageRating || 0).toFixed(1);
      document.getElementById('detail-rating-score').innerText = avg;
      document.getElementById('detail-review-count').innerText = res.data.reviewCount || 0;
      document.getElementById('detail-reviews-title-score').innerText = avg;
      document.getElementById('detail-reviews-title-count').innerText = res.data.reviewCount || 0;
    }
  } catch(e) {}
}

  // Support Arrow navigation keyboard events in Lightbox
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      lightbox.classList.add('hidden');
    } else if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
    }
  });
});
