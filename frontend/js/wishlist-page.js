document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    showToast("Please log in to view your wishlist.", "warning");
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  const wishlistGrid = document.getElementById('wishlist-grid');
  const emptyState = document.getElementById('empty-state');
  const compareBtn = document.getElementById('compare-btn');
  const mobileCompareBtn = document.getElementById('mobile-compare-btn');
  const compareActionBar = document.getElementById('compare-action-bar');
  const mobileCompareBar = document.getElementById('mobile-compare-bar');
  const compareCountText = document.getElementById('compare-count-text');
  const mobileCompareCountText = document.getElementById('mobile-compare-count');
  
  const compareModal = document.getElementById('compare-modal');
  const closeCompareBtn = document.getElementById('close-compare-modal');

  let savedListings = [];
  let selectedIds = [];

  // Initial load
  loadWishlist();

  async function loadWishlist() {
    wishlistGrid.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden skeleton-pulse h-80"></div>
    `;
    emptyState.classList.add('hidden');
    compareActionBar.classList.add('hidden');
    mobileCompareBar.classList.add('hidden');

    try {
      const res = await apiGet('/wishlist');
      if (res.success && res.data) {
        savedListings = res.data;
        renderWishlist();
      } else {
        showToast(res.message || "Failed to load wishlist.", "error");
      }
    } catch (err) {
      console.error(err);
      wishlistGrid.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">Failed to connect to backend APIs.</div>`;
    }
  }

  function renderWishlist() {
    wishlistGrid.innerHTML = '';
    selectedIds = [];
    updateCompareButtons();

    if (savedListings.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    compareActionBar.classList.remove('hidden');
    
    savedListings.forEach(item => {
      const images = item.imageUrl ? item.imageUrl.split(',') : [];
      const mainImage = formatImageUrl(images.length > 0 ? images[0] : '');

      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'listing-card p-3 group relative';
      cardWrapper.setAttribute('data-card-id', item.id);

      cardWrapper.innerHTML = `
        <div class="relative aspect-[3/2] rounded-2xl overflow-hidden mb-4 bg-gray-100">
          <img src="${mainImage}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 ease group-hover:scale-110" loading="lazy">
          
          <!-- Heart Button (Remove from wishlist) -->
          <button class="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur rounded-full hover:scale-110 shadow-sm transition-transform focus:outline-none z-10" title="Remove from saved spaces" onclick="handleRemoveClick(event, '${item.id}', this)">
            <svg class="w-5 h-5 fill-[#e67e5a] stroke-[#e67e5a] stroke-2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          <!-- Compare Selection Checkbox -->
          <div class="absolute bottom-3 left-3 z-10">
            <label class="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer shadow-sm text-xs font-bold text-gray-700">
              <input type="checkbox" value="${item.id}" class="compare-checkbox w-4 h-4 rounded border-gray-300 text-[#e67e5a] focus:ring-[#e67e5a]">
              Compare
            </label>
          </div>
        </div>

        <a href="listing-detail.html?id=${item.id}" class="block px-1">
          <h4 class="font-bold text-[#1a2e3f] truncate text-base">${item.title}</h4>
          <p class="text-sm text-[#2d4a5e]/70 mt-1 truncate">${item.locationText || item.category.replace('_', ' ')}</p>
          <p class="text-sm text-[#2d4a5e]/50 mt-0.5 capitalize">${item.category.toLowerCase().replace('_', ' ')}</p>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-base font-bold text-[#e67e5a]">${formatPriceRange(item)}</span>
          </div>
        </a>
      `;

      // Setup Compare Selection Change Events
      const checkbox = cardWrapper.querySelector('.compare-checkbox');
      checkbox.addEventListener('change', () => handleCompareSelection(item, checkbox));

      wishlistGrid.appendChild(cardWrapper);
    });

    // Make mobile compare bar visible if items exist
    mobileCompareBar.classList.remove('hidden');
    mobileCompareBar.classList.add('flex');
  }

  // Handle direct heart clicks on this page to remove instantly from UI
  async function handleRemoveClick(event, listingId, btn) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const res = await apiPost(`/wishlist/toggle/${listingId}`);
      if (res.success) {
        showToast("Removed from wishlist.", "info");
        // Remove from list & re-render
        savedListings = savedListings.filter(item => item.id !== listingId);
        renderWishlist();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove item.", "error");
    }
  }

  // Handle checking and unchecking compare checkboxes
  function handleCompareSelection(item, checkbox) {
    if (checkbox.checked) {
      // Rule 1: Category consistency check
      if (selectedIds.length > 0) {
        const firstItem = savedListings.find(l => l.id === selectedIds[0]);
        if (firstItem && firstItem.category !== item.category) {
          checkbox.checked = false;
          showToast(`Cannot compare different categories. Please select only ${firstItem.category.replace('_', ' ')} listings.`, "warning");
          return;
        }
      }

      // Rule 2: Limit comparison count to 4
      if (selectedIds.length >= 4) {
        checkbox.checked = false;
        showToast("You can compare up to 4 listings at a time.", "warning");
        return;
      }

      selectedIds.push(item.id);
    } else {
      selectedIds = selectedIds.filter(id => id !== item.id);
    }

    updateCompareButtons();
  }

  // Update Compare Bar states
  function updateCompareButtons() {
    const count = selectedIds.length;
    
    // Enable compare buttons only when 2 to 4 same-category listings are checked
    const isEnable = count >= 2 && count <= 4;
    
    compareBtn.disabled = !isEnable;
    mobileCompareBtn.disabled = !isEnable;

    compareCountText.textContent = `${count} selected`;
    mobileCompareCountText.textContent = `${count} selected`;
  }

  // Hook Compare Button Click Events
  compareBtn.addEventListener('click', openCompareModal);
  mobileCompareBtn.addEventListener('click', openCompareModal);
  closeCompareBtn.addEventListener('click', () => compareModal.classList.add('hidden'));

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      compareModal.classList.add('hidden');
    }
  });

  // Render Side-by-Side Comparison
  function openCompareModal() {
    const listToCompare = savedListings.filter(l => selectedIds.includes(l.id));
    if (listToCompare.length === 0) return;

    const headersContainer = document.getElementById('compare-table-headers');
    const bodyContainer = document.getElementById('compare-table-body');

    // 1. Render Table Headers
    headersContainer.innerHTML = `<th class="p-3 font-semibold text-gray-500 w-1/5 text-sm uppercase tracking-wider">Features</th>`;
    listToCompare.forEach(item => {
      const images = item.imageUrl ? item.imageUrl.split(',') : [];
      const mainImage = formatImageUrl(images.length > 0 ? images[0] : '');

      headersContainer.innerHTML += `
        <th class="p-4 w-1/5 min-w-[150px] align-top text-center">
          <div class="relative rounded-xl overflow-hidden aspect-[4/3] mb-2 bg-gray-50 border border-gray-100 shadow-sm">
            <img src="${mainImage}" class="w-full h-full object-cover">
          </div>
          <a href="listing-detail.html?id=${item.id}" target="_blank" class="block font-bold text-gray-900 text-sm hover:text-primary transition-colors hover:underline line-clamp-2">${item.title}</a>
        </th>
      `;
    });

    // Pad remaining space to align columns if less than 4
    for (let i = listToCompare.length; i < 4; i++) {
      headersContainer.innerHTML += `<th class="w-1/5 min-w-[150px]"></th>`;
    }

    // 2. Prepare Features List to Compare
    const commonRows = [
      { label: "Category", key: "category", formatter: (val) => val.replace('_', ' ') },
      { label: "Location", key: "locationText", formatter: (val) => val || 'Not specified' },
      { label: "Price / Budget", key: "price", formatter: (val, item) => formatPriceRange(item) }
    ];

    // Category specific details rows
    const firstCategory = listToCompare[0].category;
    if (['FLAT', 'HOUSE', 'HOTEL'].includes(firstCategory)) {
      commonRows.push(
        { label: "Bedrooms", key: "bedrooms", extractor: (item) => item.residentialInfo ? item.residentialInfo.bedroomCount : 0 },
        { label: "Bathrooms", key: "bathrooms", extractor: (item) => item.residentialInfo ? item.residentialInfo.bathroomCount : 0 },
        { label: "Other Rooms", key: "otherRooms", extractor: (item) => item.residentialInfo ? item.residentialInfo.otherRoomsCount : 0 }
      );
    } else if (firstCategory === 'CONVENTION_HALL') {
      commonRows.push(
        { label: "Max Capacity", key: "capacity", extractor: (item) => item.conventionInfo ? item.conventionInfo.capacity : '-' },
        { label: "Halls Available", key: "halls", extractor: (item) => item.conventionInfo ? item.conventionInfo.hallCount : '-' }
      );
    } else if (firstCategory === 'ROOMMATE_FINDER') {
      commonRows.push(
        { label: "Roommates Wanted", key: "wanted", extractor: (item) => item.roommateInfo ? item.roommateInfo.totalRoommatesWanted : 0 },
        { label: "Current Members", key: "have", extractor: (item) => item.roommateInfo ? item.roommateInfo.roommatesAlreadyHave : 0 }
      );
    } else if (['SHIFTING_SERVICE', 'EVENT_PLANNING', 'DECORATION_SERVICE', 'MAINTENANCE_SERVICE', 'CLEANING_SERVICE', 'CATERING_SERVICE'].includes(firstCategory)) {
      commonRows.push({
        label: "Offerings",
        key: "offerings",
        extractor: (item) => item.offerings && item.offerings.length > 0
          ? item.offerings.map(o => `<div class="text-xs mb-1"><b>${o.offeringName}</b>: ${formatPriceRange(o)}</div>`).join('')
          : '<span class="text-gray-400 text-xs">-</span>'
      });
    }

    // Add description for all
    commonRows.push({
      label: "Description",
      key: "description",
      formatter: (val) => `<div class="line-clamp-3 text-xs" title="${val || ''}">${val || '-'}</div>`
    });

    // Add Amenities comparison
    commonRows.push({
      label: "Amenities",
      key: "amenities",
      extractor: (item) => item.amenities && item.amenities.length > 0 
        ? item.amenities.map(a => `<span class="inline-block text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-1 mb-1">${a}</span>`).join('') 
        : '<span class="text-gray-400 text-xs">-</span>'
    });

    // 3. Render Table Rows
    bodyContainer.innerHTML = '';
    
    commonRows.forEach(row => {
      let rowHtml = `<td class="p-3.5 font-semibold text-gray-900 bg-gray-50/50 text-xs uppercase w-1/5">${row.label}</td>`;
      
      const values = listToCompare.map(item => {
        if (row.extractor) return row.extractor(item);
        return item[row.key];
      });

      // Highlight row if values differ (to aid comparison)
      const uniqueValues = new Set(values.map(v => typeof v === 'string' ? v.trim() : v));
      const hasDifferences = uniqueValues.size > 1;
      const rowBgClass = hasDifferences ? 'bg-amber-50/30' : '';

      listToCompare.forEach(item => {
        let displayVal = '';
        if (row.extractor) {
          displayVal = row.extractor(item);
        } else {
          const rawVal = item[row.key];
          displayVal = row.formatter ? row.formatter(rawVal, item) : (rawVal || '-');
        }
        rowHtml += `<td class="p-3.5 w-1/5 text-center text-sm font-medium ${rowBgClass}">${displayVal}</td>`;
      });

      for (let i = listToCompare.length; i < 4; i++) {
        rowHtml += `<td class="w-1/5 ${rowBgClass}"></td>`;
      }

      const tableRow = document.createElement('tr');
      tableRow.innerHTML = rowHtml;
      bodyContainer.appendChild(tableRow);
    });

    compareModal.classList.remove('hidden');
    compareModal.classList.add('flex');
  }
});
