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

  // Helper to upload files directly to Firebase Storage
  async function uploadFileToFirebase(file, pathPrefix) {
    const userJson = localStorage.getItem('rentnest_user');
    const user = userJson ? JSON.parse(userJson) : { id: 'anonymous' };
    const storageRef = storage.ref(`${pathPrefix}/${user.id}/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
  }

  // Bind Cover Image uploads
  setupDropzone('cover-photo-dropzone', 'cover-photo-input', 'cover-photo-preview-container', 'cover-photo-preview', 'cover-photo-url-hidden', 'listings/covers');

  // Bind Owner Image uploads
  setupDropzone('owner-photo-dropzone', 'owner-photo-input', 'owner-photo-preview-container', 'owner-photo-preview', 'owner-photo-url-hidden', 'listings/roommates/owners');

  /**
   * Setup Dropzones and handlers for direct image uploads
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
      dropzone.style.borderColor = 'var(--accent-primary)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--glass-border)';
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--glass-border)';
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
      showToast("Please upload a listing cover image.", "warning");
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
