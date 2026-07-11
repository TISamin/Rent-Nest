document.addEventListener('DOMContentLoaded', () => {
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

  let mapInitialized = false;

  // DOM Elements
  const categorySelect = document.getElementById('listing-category');
  const step2Basic = document.getElementById('step-2-basic');
  const step2Residential = document.getElementById('step-2-residential');
  const step2Convention = document.getElementById('step-2-convention');
  const step2Services = document.getElementById('step-2-services');
  const step2Roommate = document.getElementById('step-2-roommate');
  
  const step3PhotosBase = document.getElementById('step-3-photos-base');
  const step3PhotosResidential = document.getElementById('step-3-photos-residential');
  
  const step4Location = document.getElementById('step-4-location');
  const submitBtn = document.getElementById('submit-listing-btn');
  const basePriceSection = document.getElementById('base-price-section');

  // --- Category Toggle Logic ---
  categorySelect.addEventListener('change', (e) => {
    const cat = e.target.value;
    
    // Reset visibility
    step2Basic.classList.remove('hidden');
    step2Residential.classList.add('hidden');
    step2Convention.classList.add('hidden');
    step2Services.classList.add('hidden');
    step2Roommate.classList.add('hidden');
    step3PhotosBase.classList.add('hidden');
    step3PhotosResidential.classList.add('hidden');
    step4Location.classList.remove('hidden');
    submitBtn.classList.remove('hidden');
    basePriceSection.classList.remove('hidden');

    // Initialize map after location section is visible
    if (!mapInitialized) {
      setTimeout(() => { initPostListingMap('leaflet-post-map'); mapInitialized = true; }, 100);
    } else if (typeof mapInstance !== 'undefined' && mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 100);
    }

    if (['FLAT', 'HOUSE', 'HOTEL'].includes(cat)) {
      step2Residential.classList.remove('hidden');
      step3PhotosBase.classList.remove('hidden');
      step3PhotosResidential.classList.remove('hidden');
      generateRoomSlots(); // Initial slots
    } else if (cat === 'CONVENTION_HALL') {
      step2Convention.classList.remove('hidden');
      step3PhotosBase.classList.remove('hidden');
    } else if (['SHIFTING_SERVICE', 'CATERING_SERVICE', 'MAINTENANCE_SERVICE', 'CLEANING_SERVICE', 'DECORATION_SERVICE', 'EVENT_PLANNING'].includes(cat)) {
      step2Services.classList.remove('hidden');
      step3PhotosBase.classList.remove('hidden');
      basePriceSection.classList.add('hidden'); // Services use offerings table for price
      if (document.getElementById('service-offerings-container').children.length === 0) {
        addServiceOfferingRow(cat);
      }
    } else if (cat === 'ROOMMATE_FINDER') {
      step2Roommate.classList.remove('hidden');
      step3PhotosBase.classList.remove('hidden');
    } else {
      // Marketplace
      step3PhotosBase.classList.remove('hidden');
    }

    const priceUnitContainer = document.getElementById('price-unit-container');
    if (priceUnitContainer) {
      if (cat === 'MARKETPLACE') {
        priceUnitContainer.classList.add('hidden');
      } else {
        priceUnitContainer.classList.remove('hidden');
      }
    }

    // AI Button Enable/Disable
    const aiBtn = document.getElementById('ai-generate-desc-btn');
    const aiHint = document.getElementById('ai-desc-hint');
    if (aiBtn && aiHint) {
      if (cat && cat.trim() !== '') {
        aiBtn.disabled = false;
        aiHint.textContent = "Ready to generate listing description.";
      } else {
        aiBtn.disabled = true;
        aiHint.textContent = "Select a category first to enable AI.";
      }
    }
  });

  // --- Stepper Logic ---
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-target');
      const val = parseInt(e.target.getAttribute('data-val'));
      const input = document.getElementById(targetId);
      let current = parseInt(input.value) || 0;
      current += val;
      if (current < 0) current = 0;
      input.value = current;
      
      // Auto-generate room slots if residential counts change
      if (targetId.startsWith('residential-')) {
        generateRoomSlots();
      }
    });
  });

  // --- Amenities Tag Logic ---
  document.querySelectorAll('.add-amenity-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.previousElementSibling;
      const container = e.target.closest('.mt-4').querySelector('.amenities-container');
      const val = input.value.trim();
      if (val) {
        const span = document.createElement('span');
        span.className = 'amenity-pill selected';
        span.textContent = val;
        span.onclick = function() { this.classList.toggle('selected'); };
        container.appendChild(span);
        input.value = '';
      }
    });
  });
  document.querySelectorAll('.custom-amenity-input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.nextElementSibling.click();
      }
    });
  });

  // --- Dynamic Room Slots (Residential) ---
  const roomsContainer = document.getElementById('residential-rooms-container');
  let roomIndex = 0;

  function generateRoomSlots() {
    const beds = parseInt(document.getElementById('residential-beds').value) || 0;
    const baths = parseInt(document.getElementById('residential-baths').value) || 0;
    const others = parseInt(document.getElementById('residential-other').value) || 0;
    
    roomsContainer.innerHTML = ''; // Reset
    roomIndex = 0;

    for (let i = 0; i < beds; i++) addRoomSlot('BEDROOM', `Bedroom ${i + 1}`);
    for (let i = 0; i < baths; i++) addRoomSlot('BATHROOM', `Bathroom ${i + 1}`);
    for (let i = 0; i < others; i++) addRoomSlot('OTHER', `Other Room ${i + 1}`);
    
    if (beds + baths + others === 0) {
      roomsContainer.innerHTML = '<p class="text-sm text-gray-500 italic">Increase room counts above to auto-generate photo upload slots.</p>';
    }
  }

  function addRoomSlot(type, defaultDesc = '') {
    const idx = roomIndex++;
    const div = document.createElement('div');
    div.className = 'border border-gray-200 rounded-xl p-4 bg-gray-50 room-slot-card';
    div.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <select class="form-input py-1.5 text-sm w-auto font-semibold bg-white room-type-select">
          <option value="BEDROOM" ${type === 'BEDROOM' ? 'selected' : ''}>Bedroom</option>
          <option value="BATHROOM" ${type === 'BATHROOM' ? 'selected' : ''}>Bathroom</option>
          <option value="KITCHEN" ${type === 'KITCHEN' ? 'selected' : ''}>Kitchen</option>
          <option value="LIVING_ROOM" ${type === 'LIVING_ROOM' ? 'selected' : ''}>Living Room</option>
          <option value="OTHER" ${type === 'OTHER' ? 'selected' : ''}>Other</option>
        </select>
        <button type="button" class="text-red-500 text-sm hover:underline delete-room-btn">Remove</button>
      </div>
      <input type="text" placeholder="Description (e.g. Master bedroom with balcony)" value="${defaultDesc}" class="form-input mb-3 room-desc-input">
      <div id="room-dropzone-${idx}" class="image-upload-dropzone py-6">
        <p class="text-gray-500 text-xs font-medium">Click to upload images for this room</p>
      </div>
      <input type="file" id="room-file-${idx}" accept="image/*" multiple class="hidden">
      <input type="hidden" class="room-hidden-urls" id="room-urls-${idx}">
      <div id="room-preview-${idx}" class="grid grid-cols-3 gap-2 mt-3"></div>
    `;
    roomsContainer.appendChild(div);

    div.querySelector('.delete-room-btn').addEventListener('click', () => div.remove());
    setupMultiPhotoDropzone(`room-dropzone-${idx}`, `room-file-${idx}`, `room-preview-${idx}`, `room-urls-${idx}`, 'listings/rooms');
  }

  document.getElementById('add-room-btn').addEventListener('click', () => {
    if (roomsContainer.innerHTML.includes('Increase room counts')) roomsContainer.innerHTML = '';
    addRoomSlot('OTHER', '');
  });


  // --- Dynamic Roommate Member Slots ---
  const membersContainer = document.getElementById('roommate-members-container');
  const membersEmpty = document.getElementById('roommate-members-empty');
  let memberIndex = 0;

  function addMemberSlot() {
    if (membersEmpty) membersEmpty.style.display = 'none';
    const idx = memberIndex++;
    const card = document.createElement('div');
    card.className = 'member-slot-card border border-gray-200 rounded-xl p-4 bg-gray-50 flex gap-4 items-start';
    card.innerHTML = `
      <div class="flex-shrink-0">
        <div id="member-avatar-preview-${idx}" class="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#e67e5a] transition-colors" title="Click to upload photo">
          <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <input type="file" id="member-photo-input-${idx}" accept="image/*" class="hidden">
        <input type="hidden" id="member-photo-url-${idx}" class="member-photo-url-hidden">
        <p class="text-center text-xs text-gray-400 mt-1">Click to upload</p>
      </div>
      <div class="flex-1">
        <label class="form-label">Roommate ${idx + 1}</label>
        <input type="text" class="form-input text-sm member-desc-input" placeholder="Short bio (e.g. 25, software engineer, non-smoker)">
        <p class="text-xs text-gray-400 mt-1.5">Helps potential roommates learn about existing members.</p>
      </div>
      <button type="button" class="delete-member-btn text-red-400 hover:text-red-600 transition text-xl leading-none mt-0.5 flex-shrink-0" title="Remove">&times;</button>
    `;
    membersContainer.appendChild(card);

    const avatarPreview = card.querySelector(`#member-avatar-preview-${idx}`);
    const photoInput = card.querySelector(`#member-photo-input-${idx}`);
    const photoUrlHidden = card.querySelector(`#member-photo-url-${idx}`);

    avatarPreview.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      activeUploadsCount++;
      updateSubmitBtn();
      avatarPreview.innerHTML = `<span class="text-xs text-gray-400 animate-pulse px-1 text-center">Uploading...</span>`;
      try {
        const url = await uploadFileToCloudinary(file, 'listings/roommate-members');
        photoUrlHidden.value = url;
        avatarPreview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
      } catch (err) {
        avatarPreview.innerHTML = `<svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/></svg>`;
        showToast('Member photo upload failed.', 'error');
      } finally {
        activeUploadsCount--;
        updateSubmitBtn();
      }
      photoInput.value = '';
    });

    card.querySelector('.delete-member-btn').addEventListener('click', () => {
      card.remove();
      if (membersContainer.querySelectorAll('.member-slot-card').length === 0 && membersEmpty) {
        membersEmpty.style.display = '';
      }
    });
  }

  document.getElementById('add-member-btn').addEventListener('click', () => addMemberSlot());

  // Auto-populate member slots when the "Already Have" count is changed
  document.getElementById('roommate-have').addEventListener('input', () => {
    const count = parseInt(document.getElementById('roommate-have').value) || 0;
    const current = membersContainer.querySelectorAll('.member-slot-card').length;
    if (count > current) {
      for (let i = current; i < count; i++) addMemberSlot();
    }
  });


  // --- Dynamic Service Offerings ---
  const servicesContainer = document.getElementById('service-offerings-container');
  
  function addServiceOfferingRow(cat, defaultName = '') {
    const div = document.createElement('div');
    div.className = 'border border-gray-200 rounded-xl p-4 bg-gray-50 offering-row';
    
    // Pre-populate logic
    let name = defaultName;
    if (!name) {
      if (cat === 'SHIFTING_SERVICE') name = 'Full home shifting';
      if (cat === 'CATERING_SERVICE') name = 'Lunch package (per person)';
    }

    div.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="md:col-span-3">
            <input type="text" placeholder="Offering Name (e.g. Plumbing Repair)" value="${name}" class="form-input font-semibold offering-name" required>
          </div>
          <div class="md:col-span-3">
            <input type="text" placeholder="Short description..." class="form-input text-sm offering-desc">
          </div>
          <div>
            <input type="number" placeholder="Min Price" class="form-input text-sm offering-min" required>
          </div>
          <div>
            <input type="number" placeholder="Max Price" class="form-input text-sm offering-max">
          </div>
        </div>
        <button type="button" class="text-gray-400 hover:text-red-500 delete-offering-btn p-2">&times;</button>
      </div>
    `;
    servicesContainer.appendChild(div);
    div.querySelector('.delete-offering-btn').addEventListener('click', () => div.remove());
  }

  document.getElementById('add-offering-btn').addEventListener('click', () => {
    addServiceOfferingRow(categorySelect.value);
  });


  // --- Helper to upload files to Cloudinary ---
  async function uploadFileToCloudinary(file, pathPrefix) {
    const cloudName = "du711ught";
    const uploadPreset = "bwuqyeyc";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out (120s).")), 120000);
    });

    const uploadPromise = fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })
    .then(async res => {
      if (!res.ok) throw new Error("Failed to upload");
      const data = await res.json();
      return data.secure_url;
    });

    return Promise.race([uploadPromise, timeoutPromise]);
  }

  // Bind Base Photos Dropzone
  let activeUploadsCount = 0;
  setupMultiPhotoDropzone('cover-photo-dropzone', 'cover-photo-input', 'photos-preview-grid', 'cover-photo-url-hidden', 'listings/covers');

  function setupMultiPhotoDropzone(dropzoneId, inputId, previewGridId, hiddenUrlId, pathPrefix) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const previewGrid = document.getElementById(previewGridId);
    const hiddenUrl = document.getElementById(hiddenUrlId);

    if (!dropzone) return;

    let uploadedUrls = [];

    dropzone.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        activeUploadsCount++;
        updateSubmitBtn();
        
        const previewDiv = document.createElement('div');
        previewDiv.className = "relative border border-gray-200 rounded-lg overflow-hidden h-24 bg-gray-100 flex items-center justify-center";
        previewDiv.innerHTML = `<span class="text-xs text-gray-500 animate-pulse">Uploading...</span>`;
        previewGrid.appendChild(previewDiv);

        try {
          const url = await uploadFileToCloudinary(file, pathPrefix);
          uploadedUrls.push(url);
          hiddenUrl.value = uploadedUrls.join(',');
          
          previewDiv.innerHTML = `
            <img src="${url}" class="w-full h-full object-cover">
            <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs remove-photo-btn">&times;</button>
          `;
          previewDiv.querySelector('.remove-photo-btn').addEventListener('click', () => {
            uploadedUrls = uploadedUrls.filter(u => u !== url);
            hiddenUrl.value = uploadedUrls.join(',');
            previewDiv.remove();
          });
        } catch (e) {
          previewDiv.remove();
          showToast("Image upload failed.", "error");
        } finally {
          activeUploadsCount--;
          updateSubmitBtn();
        }
      }
      input.value = '';
    });
  }

  function updateSubmitBtn() {
    if (activeUploadsCount > 0) {
      submitBtn.disabled = true;
      submitBtn.innerText = `Uploading Images (${activeUploadsCount})...`;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Publish Listing';
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // --- Form Submission ---
  document.getElementById('post-listing-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cat = categorySelect.value;
    const title = document.getElementById('listing-title').value.trim();
    const desc = document.getElementById('listing-description').value.trim();
    const phone = document.getElementById('listing-contact-phone').value.trim();
    
    let priceMin = null;
    let priceMax = null;
    let priceUnit = null;

    const parsePrice = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const val = parseFloat(el.value);
      return isNaN(val) ? null : val;
    };

    if (!['SHIFTING_SERVICE', 'CATERING_SERVICE', 'MAINTENANCE_SERVICE', 'CLEANING_SERVICE', 'DECORATION_SERVICE', 'EVENT_PLANNING'].includes(cat)) {
      priceMin = parsePrice('listing-price-min');
      priceMax = parsePrice('listing-price-max');
      priceUnit = document.getElementById('listing-price-unit') ? document.getElementById('listing-price-unit').value : null;
    }

    const locText = document.getElementById('listing-location-text').value.trim();
    const lat = parseFloat(document.getElementById('listing-latitude').value) || null;
    const lng = parseFloat(document.getElementById('listing-longitude').value) || null;

    const payload = {
      category: cat,
      title: title,
      description: desc,
      contactPhone: phone,
      locationText: locText,
      latitude: lat,
      longitude: lng,
      priceMin: priceMin,
      priceMax: priceMax,
      priceUnit: priceUnit,
    };

    // Extract Amenities
    let activeAmenitiesContainer = null;
    if (['FLAT','HOUSE','HOTEL'].includes(cat)) activeAmenitiesContainer = step2Residential;
    else if (cat === 'CONVENTION_HALL') activeAmenitiesContainer = step2Convention;
    else if (cat === 'ROOMMATE_FINDER') activeAmenitiesContainer = step2Roommate;

    if (activeAmenitiesContainer) {
      const selected = Array.from(activeAmenitiesContainer.querySelectorAll('.amenity-pill.selected')).map(p => p.textContent);
      if (selected.length > 0) payload.amenities = selected;
    }

    // Extract Category Specifics
    if (['FLAT', 'HOUSE', 'HOTEL'].includes(cat)) {
      payload.bedroomCount = parseInt(document.getElementById('residential-beds').value) || 0;
      payload.bathroomCount = parseInt(document.getElementById('residential-baths').value) || 0;
      payload.otherRoomsCount = parseInt(document.getElementById('residential-other').value) || 0;
      
      const rooms = [];
      document.querySelectorAll('.room-slot-card').forEach(card => {
        const type = card.querySelector('.room-type-select').value;
        const rdesc = card.querySelector('.room-desc-input').value;
        const urlsStr = card.querySelector('.room-hidden-urls').value;
        const urls = urlsStr ? urlsStr.split(',') : [];
        rooms.push({ roomType: type, description: rdesc, imageUrls: urls });
      });
      payload.rooms = rooms;
      
      // Use base cover photo (building picture) as cover image
      const baseCoverUrl = document.getElementById('cover-photo-url-hidden').value;
      if (baseCoverUrl) {
        payload.imageUrl = baseCoverUrl;
      } else if (rooms.length > 0 && rooms[0].imageUrls.length > 0) {
        // Fallback: use first image of first room if no building photo provided
        payload.imageUrl = rooms[0].imageUrls[0];
      }

    } else if (cat === 'CONVENTION_HALL') {
      payload.capacity = parseInt(document.getElementById('convention-capacity').value) || null;
      payload.hallCount = parseInt(document.getElementById('convention-halls').value) || 1;
      payload.imageUrl = document.getElementById('cover-photo-url-hidden').value;

    } else if (['SHIFTING_SERVICE', 'CATERING_SERVICE', 'MAINTENANCE_SERVICE', 'CLEANING_SERVICE', 'DECORATION_SERVICE', 'EVENT_PLANNING'].includes(cat)) {
      payload.imageUrl = document.getElementById('cover-photo-url-hidden').value;
      const offerings = [];
      document.querySelectorAll('.offering-row').forEach(row => {
        const n = row.querySelector('.offering-name').value;
        const d = row.querySelector('.offering-desc').value;
        const pMin = parseFloat(row.querySelector('.offering-min').value) || null;
        const pMax = parseFloat(row.querySelector('.offering-max').value) || null;
        if (n) offerings.push({ offeringName: n, description: d, priceMin: pMin, priceMax: pMax });
      });
      payload.offerings = offerings;

    } else if (cat === 'ROOMMATE_FINDER') {
      payload.imageUrl = document.getElementById('cover-photo-url-hidden').value;
      const memberCards = document.querySelectorAll('.member-slot-card');
      const members = [];
      memberCards.forEach(card => {
        const desc = card.querySelector('.member-desc-input').value.trim();
        const photoUrl = card.querySelector('.member-photo-url-hidden').value;
        if (desc || photoUrl) {
          members.push({ memberDescription: desc || null, memberPhotoUrl: photoUrl || null });
        }
      });
      payload.roommateInfo = {
        totalRoommatesWanted: parseInt(document.getElementById('roommate-wanted').value) || 1,
        roommatesAlreadyHave: parseInt(document.getElementById('roommate-have').value) || 0,
        members: members.length > 0 ? members : [],
      };
    } else {
      // General (Marketplace)
      payload.imageUrl = document.getElementById('cover-photo-url-hidden').value;
    }

    if (!payload.imageUrl && (!payload.rooms || payload.rooms.length === 0 || payload.rooms[0].imageUrls.length === 0)) {
      showToast("Please upload at least one image.", "warning");
      return;
    }

    // Open T&C modal — actual publish happens only after acceptance
    openTncModal(payload);
  });


  // --- Terms & Conditions Modal Controller ---
  const tncOverlay   = document.getElementById('tnc-overlay');
  const tncAcceptRad = document.getElementById('tnc-accept');
  const tncRejectRad = document.getElementById('tnc-reject');
  const tncLabelAccept = document.getElementById('tnc-label-accept');
  const tncLabelReject = document.getElementById('tnc-label-reject');
  const tncConfirmBtn  = document.getElementById('tnc-confirm-btn');
  const tncCloseX      = document.getElementById('tnc-close-x');

  let pendingPayload = null;

  function openTncModal(payload) {
    pendingPayload = payload;
    // Reset state
    tncAcceptRad.checked = false;
    tncRejectRad.checked = false;
    tncLabelAccept.classList.remove('selected-accept');
    tncLabelReject.classList.remove('selected-reject');
    tncConfirmBtn.className = '';
    tncConfirmBtn.disabled = true;
    tncConfirmBtn.textContent = 'Select an option above to continue';
    tncOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeTncModal() {
    tncOverlay.classList.remove('active');
    document.body.style.overflow = '';
    pendingPayload = null;
  }

  // Radio change handlers
  tncAcceptRad.addEventListener('change', () => {
    tncLabelAccept.classList.add('selected-accept');
    tncLabelReject.classList.remove('selected-reject');
    tncConfirmBtn.className = 'ready-accept';
    tncConfirmBtn.disabled = false;
    tncConfirmBtn.textContent = '✅ Confirm & Publish Listing';
  });

  tncRejectRad.addEventListener('change', () => {
    tncLabelReject.classList.add('selected-reject');
    tncLabelAccept.classList.remove('selected-accept');
    tncConfirmBtn.className = 'ready-reject';
    tncConfirmBtn.disabled = false;
    tncConfirmBtn.textContent = '❌ Reject & Go Back to Editing';
  });

  // Confirm button
  tncConfirmBtn.addEventListener('click', async () => {
    const choice = document.querySelector('input[name="tnc-choice"]:checked');
    if (!choice) return;

    if (choice.value === 'reject') {
      closeTncModal();
      showToast('You rejected the Terms & Conditions. Your listing was not published.', 'warning');
      return;
    }

    // // Accepted — publish
    // closeTncModal();
    // await publishListing(pendingPayload || {});
    // Accepted — publish
  const payloadToSubmit = pendingPayload || {};
  closeTncModal();
  await publishListing(payloadToSubmit);
  });

  // Close via X or overlay click
  tncCloseX.addEventListener('click', closeTncModal);
  tncOverlay.addEventListener('click', (e) => {
    if (e.target === tncOverlay) closeTncModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tncOverlay.classList.contains('active')) closeTncModal();
  });


  // --- Actual API publish call ---
  async function publishListing(payload) {
    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Publishing...';
      const res = await apiPost('/listings', payload);
      if (res.success) {
        showToast("Listing published!", "success");
        setTimeout(() => window.location.href = 'index.html', 1500);
      } else {
        showToast(res.message || "Failed to publish.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Publish Listing';
    }
  }

  // AI Listing Description Generator
  const aiBtn = document.getElementById('ai-generate-desc-btn');
  if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
      const cat = categorySelect.value;
      if (!cat) {
        showToast("Please select a category first.", "warning");
        return;
      }

      // Collect structured fields filled so far
      const fields = {
        category: cat,
        title: document.getElementById('listing-title').value.trim(),
        priceMin: document.getElementById('listing-price-min').value,
        priceMax: document.getElementById('listing-price-max').value,
        priceUnit: document.getElementById('listing-price-unit') ? document.getElementById('listing-price-unit').value : 'month',
        contactPhone: document.getElementById('listing-contact-phone').value.trim(),
        locationText: document.getElementById('location-text') ? document.getElementById('location-text').value.trim() : ''
      };

      // Category-specific details
      if (['FLAT', 'HOUSE', 'HOTEL'].includes(cat)) {
        fields.bedroomCount = document.getElementById('residential-beds').value;
        fields.bathroomCount = document.getElementById('residential-baths').value;
        fields.otherRoomsCount = document.getElementById('residential-other').value;
      } else if (cat === 'CONVENTION_HALL') {
        fields.capacity = document.getElementById('convention-capacity') ? document.getElementById('convention-capacity').value : '';
        fields.hallCount = document.getElementById('convention-halls') ? document.getElementById('convention-halls').value : '';
      }

      // Add checked amenities
      const checkedAmenities = [];
      document.querySelectorAll('.amenities-container .amenity-pill.selected').forEach(pill => {
        checkedAmenities.push(pill.textContent.trim());
      });
      if (checkedAmenities.length > 0) {
        fields.amenities = checkedAmenities;
      }

      const spinner = aiBtn.querySelector('.ai-btn-spinner');
      const icon = aiBtn.querySelector('.ai-btn-icon');
      const textSpan = aiBtn.querySelector('.ai-btn-text');

      try {
        aiBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (icon) icon.classList.add('hidden');
        if (textSpan) textSpan.textContent = 'Generating...';

        const res = await apiPost('/ai/generate-description', fields);
        if (res.success && res.data && res.data.description) {
          const descArea = document.getElementById('listing-description');
          if (descArea) {
            descArea.value = res.data.description;
            // Trigger input/change event for other listeners if any
            descArea.dispatchEvent(new Event('input'));
          }
          showToast("AI description populated successfully!", "success");
        } else {
          showToast(res.message || "Failed to generate description with AI.", "error");
        }
      } catch (err) {
        showToast(err.message || "A network error occurred during AI generation.", "error");
      } finally {
        if (spinner) spinner.classList.add('hidden');
        if (icon) icon.classList.remove('hidden');
        if (textSpan) textSpan.textContent = 'Cooldown (5s)...';

        // 5-second Cooldown
        setTimeout(() => {
          aiBtn.disabled = false;
          if (textSpan) textSpan.textContent = 'Generate description with AI';
        }, 5000);
      }
    });
  }
});
