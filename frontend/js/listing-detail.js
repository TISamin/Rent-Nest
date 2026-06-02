document.addEventListener('DOMContentLoaded', () => {
  // Get listing ID from URL queries
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showToast("No Listing ID provided.", "error");
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  // Load single listing details
  loadListingDetail(id);

  async function loadListingDetail(listingId) {
    try {
      const res = await apiGet(`/listings/${listingId}`);
      
      if (res.success && res.data) {
        const item = res.data;
        
        // Render Cover Image & Gallery
        const images = item.imageUrl ? item.imageUrl.split(',') : [];
        const mainImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';
        document.getElementById('detail-image').src = mainImage;
        
        const galleryRow = document.getElementById('detail-gallery-row');
        if (galleryRow) {
          galleryRow.innerHTML = '';
          if (images.length > 1) {
            images.forEach((imgUrl, index) => {
              const thumb = document.createElement('img');
              thumb.src = imgUrl;
              thumb.className = `w-24 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all duration-200 ${index === 0 ? 'border-emerald-500 opacity-100 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`;
              thumb.addEventListener('click', () => {
                // Change active main image
                document.getElementById('detail-image').src = imgUrl;
                // Reset styling for all thumbnails, then highlight active one
                const children = galleryRow.children;
                for (let i = 0; i < children.length; i++) {
                  children[i].className = 'w-24 h-16 object-cover rounded-lg cursor-pointer border-2 border-transparent opacity-60 hover:opacity-100 transition-all duration-200';
                }
                thumb.className = 'w-24 h-16 object-cover rounded-lg cursor-pointer border-2 border-emerald-500 opacity-100 scale-95 transition-all duration-200';
              });
              galleryRow.appendChild(thumb);
            });
          } else {
            galleryRow.classList.add('hidden');
          }
        }
        
        // Render Category Badge
        const categoryBadge = document.getElementById('detail-category-badge');
        categoryBadge.innerText = item.category.replace('_', ' ');
        
        // Render Title & Address
        document.getElementById('detail-title').innerText = item.title;
        document.getElementById('detail-location-text').innerText = `📍 ${item.locationText || 'Location Specified on Map'}`;
        
        // Render Description
        document.getElementById('detail-description').innerText = item.description || 'No description provided.';
        
        // Render Pricing Side-Panel details
        const priceText = document.getElementById('detail-price-text');
        priceText.innerText = item.price ? `${item.price} BDT` : 'Contact / Negotiable';
        
        // Render listing date
        const listingDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const dateEl = document.getElementById('detail-listing-date');
        if (dateEl) {
          dateEl.innerText = listingDate ? `🗓️ Posted on: ${listingDate}` : '';
        }

        // Render Author details
        document.getElementById('detail-owner-name').innerText = item.userName || 'Anonymous Owner';
        if (item.userPhotoUrl) {
          document.getElementById('detail-owner-avatar').src = item.userPhotoUrl;
        }

        // Contact Button setup
        const contactBtn = document.getElementById('detail-contact-btn');
        if (item.contactPhone) {
          contactBtn.href = `tel:${item.contactPhone}`;
          contactBtn.innerHTML = `📞 Contact Owner (${item.contactPhone})`;
        } else {
          contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast("No contact phone provided for this listing.", "warning");
          });
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
              card.className = 'member-form-card animate-fade-in';
              card.innerHTML = `
                <div class="member-header">Present Roommate #${idx + 1}</div>
                <div style="display: flex; gap: 15px; align-items: center; margin-top: 10px;">
                  <img src="${m.memberPhotoUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="Member photo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 1px solid var(--glass-border);">
                  <p style="font-size: 0.95rem; line-height: 1.4; color: var(--text-secondary);">${m.memberDescription || 'No description provided.'}</p>
                </div>
              `;
              membersCardsContainer.appendChild(card);
            });
          } else {
            membersCardsContainer.innerHTML = `<p class="text-secondary">No members details loaded.</p>`;
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
});
