document.addEventListener('DOMContentLoaded', () => {
  // Ensure user is logged in
  if (!isAuthenticated()) {
    showToast("Please log in to create a listing.", "warning");
    window.location.href = 'login.html';
    return;
  }

  // Pre-fill user profile info if present
  const localUser = localStorage.getItem('rentnest_user');
  if (localUser) {
    const userObj = JSON.parse(localUser);
    document.getElementById('listing-contact-phone').value = userObj.phoneNumber || '';
    if (userObj.profilePhotoUrl) {
      document.getElementById('navbar-avatar').src = userObj.profilePhotoUrl;
    }
  }

  // Initialize Leaflet Interactive map
  initPostListingMap('leaflet-post-map');

  // Interactive Dom Handlers
  const categorySelect = document.getElementById('listing-category');
  const roommateSection = document.getElementById('roommate-fields-section');
  const currentMembersInput = document.getElementById('roommates-already-have');
  const membersListContainer = document.getElementById('members-list-cards');

  // Toggle Roommate finder specific input panels dynamically
  categorySelect.addEventListener('change', (e) => {
    if (e.target.value === 'ROOMMATE_FINDER') {
      roommateSection.classList.remove('hidden');
      renderMemberCards();
    } else {
      roommateSection.classList.add('hidden');
    }
  });

  // Re-render roommate member cards on count modification
  currentMembersInput.addEventListener('input', () => {
    renderMemberCards();
  });

  // Helper to upload files directly to Cloudinary with a timeout
  async function uploadFileToFirebase(file, pathPrefix) {
    const cloudName = "du711ught";
    const uploadPreset = "bwuqyeyc";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Create a timeout promise (15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out (15s limit). Please check your internet connection.")), 15000);
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

    // Race upload execution against the timeout
    return Promise.race([uploadPromise, timeoutPromise]);
  }

  // Bind Cover Image uploads (Multiple)
  let uploadedImages = [];
  let activeUploadsCount = 0;

  setupMultiPhotoDropzone('cover-photo-dropzone', 'cover-photo-input', 'photos-preview-grid', 'cover-photo-url-hidden', 'listings/covers');

  // Bind Owner Image uploads (Single)
  setupDropzone('owner-photo-dropzone', 'owner-photo-input', 'owner-photo-preview-container', 'owner-photo-preview', 'owner-photo-url-hidden', 'listings/roommates/owners');

  /**
   * Setup Dropzone for multiple photos upload
   */
  function setupMultiPhotoDropzone(dropzoneId, inputId, previewGridId, hiddenUrlId, pathPrefix) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const previewGrid = document.getElementById(previewGridId);
    const hiddenUrl = document.getElementById(hiddenUrlId);

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#10b981';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(255,255,255,0.15)';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(255,255,255,0.15)';
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleImageFiles(files);
      }
    });

    input.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleImageFiles(files);
      }
    });

    async function handleImageFiles(files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniqueId = 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        
        // Create preview card container
        const previewCard = document.createElement('div');
        previewCard.id = `preview-${uniqueId}`;
        previewCard.className = "relative border border-white/10 rounded-xl overflow-hidden bg-white/5 h-36 flex items-center justify-center";
        previewCard.innerHTML = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <span class="text-xs text-white font-medium animate-pulse">Uploading...</span>
          </div>
        `;
        previewGrid.appendChild(previewCard);

        // Immediate local thumbnail preview
        const reader = new FileReader();
        reader.onload = (event) => {
          previewCard.innerHTML = `
            <img src="${event.target.result}" class="w-full h-full object-cover opacity-50">
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <span class="text-xs text-white font-medium animate-pulse">Uploading...</span>
            </div>
          `;
        };
        reader.readAsDataURL(file);

        // Start upload
        activeUploadsCount++;
        updateSubmitButtonState();

        try {
          const downloadUrl = await uploadFileToFirebase(file, pathPrefix);
          uploadedImages.push(downloadUrl);
          hiddenUrl.value = uploadedImages.join(',');

          // Show uploaded image with a remove button
          previewCard.innerHTML = `
            <img src="${downloadUrl}" class="w-full h-full object-cover">
            <button type="button" class="absolute top-2 right-2 bg-red-500/95 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors remove-photo-btn">&times;</button>
          `;

          previewCard.querySelector('.remove-photo-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedImages = uploadedImages.filter(url => url !== downloadUrl);
            hiddenUrl.value = uploadedImages.join(',');
            previewCard.remove();
          });

          showToast(`Image "${file.name}" uploaded successfully!`, "success");
        } catch (err) {
          console.error("Upload failed for file: " + file.name, err);
          showToast(`Failed to upload "${file.name}": ` + err.message, "error");
          previewCard.remove();
        } finally {
          activeUploadsCount--;
          updateSubmitButtonState();
        }
      }
      input.value = ''; // Reset file input so same file can be re-selected if removed
    }
  }

  function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submit-listing-btn');
    if (!submitBtn) return;
    if (activeUploadsCount > 0) {
      submitBtn.disabled = true;
      submitBtn.innerText = `⏳ Uploading Images (${activeUploadsCount})...`;
      submitBtn.className = "w-full py-4 rounded-xl bg-gray-700 text-gray-400 font-bold text-lg cursor-not-allowed transition-all duration-300";
    } else {
      submitBtn.disabled = false;
      submitBtn.innerText = "🚀 Publish Listing";
      submitBtn.className = "w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-[1.02]";
    }
  }

  /**
   * Setup Dropzones and handlers for single direct image uploads
   */
  function setupDropzone(dropzoneId, inputId, previewContainerId, previewImgId, hiddenUrlId, pathPrefix) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImg = document.getElementById(previewImgId);
    const hiddenUrl = document.getElementById(hiddenUrlId);
    const removeBtn = document.getElementById(`remove-${dropzoneId.replace('-dropzone', '')}-btn`);

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#10b981';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(255,255,255,0.1)';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(255,255,255,0.1)';
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    });

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) handleImageFile(file);
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        hiddenUrl.value = '';
        previewContainer.classList.add('hidden');
        dropzone.classList.remove('hidden');
      });
    }

    async function handleImageFile(file) {
      // Local preview instantly
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        previewContainer.classList.remove('hidden');
        dropzone.classList.add('hidden');
      };
      reader.readAsDataURL(file);

      // Upload to storage
      try {
        showToast("Uploading image...", "info");
        const downloadUrl = await uploadFileToFirebase(file, pathPrefix);
        hiddenUrl.value = downloadUrl;
        showToast("Image uploaded successfully!", "success");
      } catch (err) {
        showToast("Upload failed: " + err.message, "error");
        previewContainer.classList.add('hidden');
        dropzone.classList.remove('hidden');
        hiddenUrl.value = '';
      }
    }
  }

  /**
   * Dynamically generate input cards for each existing roommate member
   */
  function renderMemberCards() {
    membersListContainer.innerHTML = '';
    const memberCount = parseInt(currentMembersInput.value) || 0;
    
    for (let i = 1; i <= memberCount; i++) {
      const card = document.createElement('div');
      card.className = 'member-form-card animate-fade-in';
      card.innerHTML = `
        <div class="member-header">Roommate Member #${i}</div>
        
        <div class="form-group">
          <label class="form-label">Member Photo</label>
          <div class="image-upload-dropzone" id="member-${i}-photo-dropzone">
            <span class="upload-icon">👤</span>
            <span class="upload-text">Upload Photo</span>
          </div>
          <input type="file" id="member-${i}-photo-input" accept="image/*" class="hidden">
          <input type="hidden" id="member-${i}-photo-url-hidden" class="member-photo-hidden">
          
          <div class="preview-thumbnail-container hidden" id="member-${i}-photo-preview-container">
            <img src="" alt="Member ${i} Preview" class="preview-thumbnail" id="member-${i}-photo-preview">
            <button type="button" class="remove-preview-btn" id="remove-member-${i}-photo-btn">&times;</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Short Description</label>
          <input type="text" class="form-input member-description-input" placeholder="e.g. 23 years old, Software Engineer, non-smoker" required>
        </div>
      `;
      membersListContainer.appendChild(card);

      // Setup dropzone for this dynamic member card
      setupDropzone(
        `member-${i}-photo-dropzone`,
        `member-${i}-photo-input`,
        `member-${i}-photo-preview-container`,
        `member-${i}-photo-preview`,
        `member-${i}-photo-url-hidden`,
        `listings/roommates/members`
      );
    }
  }

  // Handle Form Submission
  const postForm = document.getElementById('post-listing-form');
  const submitBtn = document.getElementById('submit-listing-btn');

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = categorySelect.value;
    const title = document.getElementById('listing-title').value.trim();
    const description = document.getElementById('listing-description').value.trim();
    const price = parseFloat(document.getElementById('listing-price').value) || null;
    const contactPhone = document.getElementById('listing-contact-phone').value.trim();
    const imageUrl = document.getElementById('cover-photo-url-hidden').value;
    const locationText = document.getElementById('listing-location-text').value.trim();
    const latitude = parseFloat(document.getElementById('listing-latitude').value) || null;
    const longitude = parseFloat(document.getElementById('listing-longitude').value) || null;

    if (!category) {
      showToast("Please select a listing category.", "warning");
      return;
    }
    if (!imageUrl) {
      showToast("Please upload at least one listing photo.", "warning");
      return;
    }

    // Base request payload
    const payload = {
      category,
      title,
      description,
      price,
      imageUrl,
      locationText,
      latitude,
      longitude,
      contactPhone
    };

    // If ROOMMATE_FINDER category, parse roommate structures
    if (category === 'ROOMMATE_FINDER') {
      const ownerPhotoUrl = document.getElementById('owner-photo-url-hidden').value;
      const totalRoommatesWanted = parseInt(document.getElementById('total-roommates-wanted').value) || 1;
      const roommatesAlreadyHave = parseInt(currentMembersInput.value) || 0;

      const members = [];
      const descriptions = document.querySelectorAll('.member-description-input');
      const photoUrls = document.querySelectorAll('.member-photo-hidden');

      for (let i = 0; i < roommatesAlreadyHave; i++) {
        members.push({
          memberDescription: descriptions[i].value.trim(),
          memberPhotoUrl: photoUrls[i].value || null
        });
      }

      payload.roommateInfo = {
        ownerPhotoUrl,
        totalRoommatesWanted,
        roommatesAlreadyHave,
        members
      };
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Publishing Listing...';
      
      const res = await apiPost('/listings', payload);
      
      if (res.success) {
        showToast("Listing published successfully!", "success");
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        showToast(res.message || "Failed to publish listing.", "error");
      }
    } catch (error) {
      showToast("An error occurred during submission: " + error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Publish Listing';
    }
  });
});
