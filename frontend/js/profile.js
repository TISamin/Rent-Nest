document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadMyPostings();

  const profileForm = document.getElementById('profile-form');
  const photoInput = document.getElementById('photo-input');
  const saveBtn = document.getElementById('save-profile-btn');

  // Photo Upload to Cloudinary
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('avatar-preview').src = event.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Uploading photo...';
        showToast("Uploading profile photo...", "info");

        const cloudName = "du711ught";
        const uploadPreset = "bwuqyeyc";

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        // Timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Upload timed out (30s limit). Check your internet connection.")), 30000);
        });

        const uploadPromise = fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        })
        .then(async res => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Failed to upload to Cloudinary");
          }
          const data = await res.json();
          return data.secure_url;
        });
        
        const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
        
        document.getElementById('photo-url-hidden').value = downloadUrl;
        showToast("Photo uploaded successfully!", "success");
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        showToast("Failed to upload photo: " + error.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Profile';
      }
    });
  }

  // Handle Form Submission
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('profile-name').value.trim();
      const email = document.getElementById('profile-email').value.trim();
      const phoneNumber = document.getElementById('profile-phone').value.trim();
      const address = document.getElementById('profile-address').value.trim();
      const profilePhotoUrl = document.getElementById('photo-url-hidden').value;

      if (!name) {
        showToast("Name is required.", "warning");
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

        const payload = { name, email, phoneNumber, address, profilePhotoUrl };
        const res = await apiPut('/users/profile', payload);

        if (res.success) {
          localStorage.setItem('rentnest_user', JSON.stringify(res.data));
          showToast("Profile updated successfully!", "success");

          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showToast(res.message || "Failed to update profile", "error");
        }
      } catch (error) {
        showToast("Error saving profile: " + error.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Profile';
      }
    });
  }
});

/**
 * Load profile details from API
 */
async function loadProfile() {
  if (!isAuthenticated()) {
    showToast("Please log in first.", "warning");
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await apiGet('/auth/me');
    if (res.success && res.data) {
      const user = res.data;

      // Set the readonly email display field
      const emailDisplay = document.getElementById('profile-email-display');
      if (emailDisplay) {
        emailDisplay.value = user.email || '';
        emailDisplay.dispatchEvent(new Event('input'));
      }

      const setField = (id, val) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el) { el.value = val; el.dispatchEvent(new Event('input')); }
      };

      setField('profile-name', user.name);
      setField('profile-email', user.email);
      setField('profile-phone', user.phoneNumber);
      setField('profile-address', user.address);
      
      if (user.profilePhotoUrl) {
        document.getElementById('avatar-preview').src = user.profilePhotoUrl;
        document.getElementById('photo-url-hidden').value = user.profilePhotoUrl;
      }
    }
  } catch (err) {
    console.error("Failed to load profile", err);
  }
}

/**
 * Load user's postings from API
 */
async function loadMyPostings() {
  const container = document.getElementById('my-postings-container');
  if (!container) return;

  try {
    const res = await apiGet('/listings/my');
    if (res.success && res.data && res.data.length > 0) {
      let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
      res.data.forEach(item => {
        const imgUrl = (item.imageUrl && item.imageUrl.split(',')[0]) 
            ? formatImageUrl(item.imageUrl.split(',')[0]) 
            : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';
            
        const price = formatPriceRange(item);
        const categoryLabel = item.category ? item.category.replace('_', ' ') : 'Listing';
        
        html += `
          <a href="listing-detail.html?id=${item.id}" class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all">
            <img src="${imgUrl}" class="w-16 h-16 rounded-lg object-cover" alt="Thumb">
            <div class="flex-1 min-w-0">
              <span class="text-[10px] uppercase font-bold text-primary tracking-wider">${categoryLabel}</span>
              <h4 class="font-bold text-gray-900 text-sm truncate">${item.title}</h4>
              <p class="text-xs text-gray-500 font-medium">${price}</p>
            </div>
          </a>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p class="text-sm text-gray-500 mt-4">You haven\'t posted anything yet.</p>';
    }
  } catch (err) {
    console.error("Failed to load postings:", err);
    container.innerHTML = '<p class="text-sm text-red-500 mt-4">Failed to load postings.</p>';
  }
}
