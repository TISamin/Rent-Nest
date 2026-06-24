document.addEventListener('DOMContentLoaded', () => {
  // Get listing ID from URL queries
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showToast("No Listing ID provided.", "error");
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  let galleryImages = [];
  let currentImageIndex = 0;

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

        // Render Cover Image & Gallery
        galleryImages = item.imageUrl ? item.imageUrl.split(',') : [];
        if (galleryImages.length === 0) {
          galleryImages = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];
        }

        const mainImage = galleryImages[0];
        document.getElementById('detail-image').src = mainImage;

        const thumbnailsGrid = document.getElementById('detail-thumbnails-grid');
        if (thumbnailsGrid) {
          thumbnailsGrid.innerHTML = '';
          // Airbnb style requires 4 thumbnails for the 2x2 right grid
          // If less, we duplicate or fill with placeholder images
          const placeholderImages = [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
          ];

          const gridImages = [...galleryImages.slice(1, 5)];
          while (gridImages.length < 4) {
            gridImages.push(placeholderImages[gridImages.length]);
          }

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
        priceText.innerText = item.price ? `${item.price} BDT` : 'Contact Owner';
        
        // Render listing date
        const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const dateEl = document.getElementById('detail-listing-date');
        if (dateEl) {
          dateEl.innerText = listingDate ? `🗓️ Posted on: ${listingDate}` : '🗓️ Posted Today';
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
        const localUser = localStorage.getItem('rentnest_user');
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
r");
    }
  }
});
