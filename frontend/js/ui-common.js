// RentNest Airbnb-Inspired Shared UI Logic
document.addEventListener('DOMContentLoaded', () => {
  // Page load transition
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease-in-out';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 50);

  // Inject YouTube-style progress bar
  const progressBar = document.createElement('div');
  progressBar.id = 'top-progress-bar';
  document.body.prepend(progressBar);
  
  // Animate progress bar on load
  setTimeout(() => {
    progressBar.style.width = '70%';
    setTimeout(() => {
      progressBar.style.width = '100%';
      setTimeout(() => {
        progressBar.style.opacity = '0';
        setTimeout(() => {
          progressBar.style.width = '0%';
          progressBar.style.opacity = '1';
        }, 400);
      }, 200);
    }, 200);
  }, 50);

  // Hook all links to animate the progress bar during navigation
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && link.target !== '_blank') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        progressBar.style.width = '50%';
        progressBar.style.opacity = '1';
        setTimeout(() => {
          progressBar.style.width = '90%';
          window.location.href = href;
        }, 150);
      });
    }
  });

  // Inject/Rebuild navbar dynamically for absolute uniformity
  injectCommonNavbar();

  // Inject mobile bottom nav bar
  injectMobileBottomNav();
});

// Toast system wrapper mapping to custom styled toasts
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    info: '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    warning: '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
  };

  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="text-sm font-medium text-gray-800 flex-1">${message}</span>
    <button class="text-gray-400 hover:text-gray-600 focus:outline-none text-lg line-none">&times;</button>
  `;

  container.appendChild(toast);
  
  // Trigger slide-in
  setTimeout(() => toast.classList.add('show'), 10);

  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('button').addEventListener('click', dismiss);
  setTimeout(dismiss, 3000);
}

// Inject standard top navigation bar
function injectCommonNavbar() {
  const existingNav = document.querySelector('nav');
  if (!existingNav) return;

  const userJson = localStorage.getItem('rentnest_user');
  let user = null;
  if (userJson) {
    try { user = JSON.parse(userJson); } catch(e) {}
  }

  // Determine current active page
  const path = window.location.pathname;
  const isRent = path.includes('browse-rental') || path.includes('listing-detail');
  const isRoommates = path.includes('roommate-finder');
  const isServices = path.includes('services');
  const isMarketplace = path.includes('marketplace');
  const isDashboard = path.includes('dashboard');

  const navHtml = `
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <!-- Left: Logo & Icon -->
      <a href="index.html" class="flex items-center space-x-2 hover:opacity-90 transition-opacity">
        <div class="w-9 h-9 rounded-xl bg-[#1a2e3f] flex items-center justify-center text-white text-lg font-bold">R</div>
        <span class="text-xl font-bold tracking-tight text-[#1a2e3f]">ent<span class="text-[#e67e5a]">Nest</span></span>
      </a>

      <!-- Center: Links (Desktop) -->
      <div class="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-semibold">
        <a href="browse-rental.html" class="nav-hover-link ${isRent ? 'text-[#e67e5a]' : 'text-[#1a2e3f]/60 hover:text-[#1a2e3f]'} transition-colors relative py-1">Rent</a>
        <a href="roommate-finder.html" class="nav-hover-link ${isRoommates ? 'text-[#e67e5a]' : 'text-[#1a2e3f]/60 hover:text-[#1a2e3f]'} transition-colors relative py-1">Roommates</a>
        <a href="services.html" class="nav-hover-link ${isServices ? 'text-[#e67e5a]' : 'text-[#1a2e3f]/60 hover:text-[#1a2e3f]'} transition-colors relative py-1">Services</a>
        <a href="marketplace.html" class="nav-hover-link ${isMarketplace ? 'text-[#e67e5a]' : 'text-[#1a2e3f]/60 hover:text-[#1a2e3f]'} transition-colors relative py-1">Marketplace</a>
        <a href="dashboard.html" class="nav-hover-link ${isDashboard ? 'text-[#e67e5a]' : 'text-[#1a2e3f]/60 hover:text-[#1a2e3f]'} transition-colors relative py-1">Dashboard</a>
      </div>

      <!-- Right: User Profiles / Auth -->
      <div class="flex items-center space-x-3">
        ${user ? `
          <a href="post-listing.html" class="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e67e5a] hover:bg-[#d06d4a] text-white text-sm font-semibold shadow-lg shadow-[#e67e5a]/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Post Listing
          </a>
          <div class="relative">
            <button id="profileDropdownBtn" class="flex items-center space-x-2 focus:outline-none">
              ${user.profilePhotoUrl ? `
                <img src="${user.profilePhotoUrl}" class="w-10 h-10 rounded-full object-cover shadow-lg shadow-[#e67e5a]/20 transition-transform hover:scale-105" alt="Profile">
              ` : `
                <div class="w-10 h-10 rounded-full bg-[#e67e5a] text-white flex items-center justify-center font-bold shadow-lg shadow-[#e67e5a]/20 transition-transform hover:scale-105">
                  ${getUserInitials(user.name || user.email)}
                </div>
              `}
            </button>
            <div id="profileDropdown" class="hidden absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-semibold text-gray-800">${user.name || 'RentNest User'}</p>
                <p class="text-xs text-gray-500 truncate">${user.email}</p>
              </div>
              <a href="profile.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">My Profile</a>
              <a href="wishlist.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">My Wishlist</a>
              <a href="marketplace-activity.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Marketplace Activity</a>
              <a href="post-listing.html" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Post Listing</a>
              <button onclick="handleLogout()" class="w-full text-left block px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">Logout</button>
            </div>
          </div>
        ` : `
          <a href="login.html" class="px-5 py-2.5 rounded-full bg-[#e67e5a] hover:bg-[#d06d4a] text-white text-sm font-semibold shadow-lg shadow-[#e67e5a]/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Log in
          </a>
        `}
        
        <!-- Mobile hamburger menu button -->
        <button id="hamburgerBtn" class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div id="mobileDrawer" class="fixed inset-0 bg-black/50 z-[9999] opacity-0 pointer-events-none transition-opacity duration-300">
      <div class="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-out flex flex-col">
        <div class="h-20 px-6 border-b border-gray-100 flex items-center justify-between">
          <span class="text-xl font-bold text-gray-800">Menu</span>
          <button id="closeDrawerBtn" class="p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="flex-1 px-6 py-6 space-y-5 text-lg font-semibold text-gray-800">
          <a href="browse-rental.html" class="block hover:text-primary transition-colors">Rent</a>
          <a href="roommate-finder.html" class="block hover:text-primary transition-colors">Roommates</a>
          <a href="services.html" class="block hover:text-primary transition-colors">Services</a>
          <a href="marketplace.html" class="block hover:text-primary transition-colors">Marketplace</a>
          <a href="dashboard.html" class="block hover:text-primary transition-colors">Dashboard</a>
          <a href="profile.html" class="block hover:text-primary transition-colors border-t pt-4 border-gray-100">My Profile</a>
          <a href="wishlist.html" class="block hover:text-primary transition-colors">My Wishlist</a>
          <a href="marketplace-activity.html" class="block hover:text-primary transition-colors">Marketplace Activity</a>
          <a href="post-listing.html" class="block hover:text-primary transition-colors">Post Ad</a>
          ${user ? `
            <button onclick="handleLogout()" class="w-full text-left text-red-500 block hover:text-red-600 transition-colors">Logout</button>
          ` : `
            <a href="login.html" class="block text-primary">Log In</a>
          `}
        </div>
      </div>
    </div>
  `;

  existingNav.className = 'sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#1a2e3f]/8 transition-all duration-300 shadow-[0_4px_30px_rgba(26,46,63,0.05)]';
  existingNav.innerHTML = navHtml;

  // Inject nav hover underline animation styles
  if (!document.getElementById('nav-hover-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'nav-hover-styles';
    styleEl.innerHTML = `
      .nav-hover-link { position: relative; }
      .nav-hover-link::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: #e67e5a;
        transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      .nav-hover-link:hover::after { width: 100%; }
    `;
    document.head.appendChild(styleEl);
  }

  // Backdrop filter on scroll check
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      existingNav.classList.add('shadow-sm', 'bg-white/95');
    } else {
      existingNav.classList.remove('shadow-sm', 'bg-white/95');
    }
  });

  // Profile dropdown toggles
  const dropdownBtn = document.getElementById('profileDropdownBtn');
  const dropdown = document.getElementById('profileDropdown');
  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });
  }

  // Hamburger drawer navigation open/close
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerContainer = mobileDrawer ? mobileDrawer.firstElementChild : null;
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  if (hamburgerBtn && mobileDrawer && drawerContainer) {
    hamburgerBtn.addEventListener('click', () => {
      mobileDrawer.classList.remove('pointer-events-none', 'opacity-0');
      drawerContainer.classList.remove('translate-x-full');
    });

    const closeDrawer = () => {
      mobileDrawer.classList.add('pointer-events-none', 'opacity-0');
      drawerContainer.classList.add('translate-x-full');
    };

    closeDrawerBtn.addEventListener('click', closeDrawer);
    mobileDrawer.addEventListener('click', (e) => {
      if (e.target === mobileDrawer) closeDrawer();
    });
  }
}

// Inject Mobile Bottom Navigation Bar
function injectMobileBottomNav() {
  const existingBottomNav = document.getElementById('mobileBottomNav');
  if (existingBottomNav) existingBottomNav.remove();

  const path = window.location.pathname;
  const isRent = path.includes('browse-rental');
  const isRoommates = path.includes('roommate-finder');
  const isAdd = path.includes('post-listing');
  const isServices = path.includes('services');
  const isMarketplace = path.includes('marketplace');
  const isDashboard = path.includes('dashboard');

  const bottomNav = document.createElement('div');
  bottomNav.id = 'mobileBottomNav';
  bottomNav.className = 'md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around py-2 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]';
  
  bottomNav.innerHTML = `
    <a href="browse-rental.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isRent ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
      <span class="text-[9px] mt-0.5">Rent</span>
    </a>
    <a href="roommate-finder.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isRoommates ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      <span class="text-[9px] mt-0.5">Roommates</span>
    </a>
    <a href="post-listing.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isAdd ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <div class="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </div>
      <span class="text-[9px] mt-0.5">Add</span>
    </a>
    <a href="services.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isServices ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z"></path></svg>
      <span class="text-[9px] mt-0.5">Services</span>
    </a>
    <a href="marketplace.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isMarketplace ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
      <span class="text-[9px] mt-0.5">Market</span>
    </a>
    <a href="dashboard.html" class="flex flex-col items-center justify-center min-h-[44px] min-w-[40px] ${isDashboard ? 'text-primary' : 'text-gray-500 hover:text-text-primary'}">
      <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>
      <span class="text-[9px] mt-0.5">Dash</span>
    </a>
  `;
  document.body.appendChild(bottomNav);

  // Add margin bottom to body for mobile views to prevent navigation overlaying content
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (max-width: 768px) {
      body {
        padding-bottom: 70px !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Utility: get initials from name or email
function getUserInitials(name) {
  if (!name) return 'RN';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Logout script hook
function handleLogout() {
  localStorage.removeItem('rentnest_token');
  localStorage.removeItem('rentnest_user');
  showToast("Logged out successfully!", "info");
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Global Image URL Resolver Utility to prevent relative loading failures
window.formatImageUrl = function(url, fallback = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800') {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Strip starting slash to prevent double slash
  const cleanUrl = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
  return `https://rent-nest-wntm.onrender.com/${cleanUrl}`;
};

// Global Price Range Formatter
window.formatPriceRange = function(item) {
  const min = item.priceMin || item.price;
  const max = item.priceMax;
  
  let unit = '';
  if (item.category !== 'MARKETPLACE' && item.priceUnit) {
    unit = ` / ${item.priceUnit}`;
  }
  
  if (min && max && min !== max) {
    return `${min} - ${max} BDT${unit}`;
  } else if (min) {
    return `${min} BDT${unit}`;
  } else {
    return 'Negotiable';
  }
};

// Global Report System
window.openReportModal = function(targetType, targetId) {
  if (!isAuthenticated()) {
    showToast("Please log in to report this content.", "warning");
    window.location.href = 'login.html';
    return;
  }
  
  let modal = document.getElementById('reportModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reportModal';
    modal.className = 'fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-95 transition-transform duration-200" id="reportModalContent">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            Report Content
          </h3>
          <button onclick="closeReportModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-6">
          <input type="hidden" id="reportTargetType">
          <input type="hidden" id="reportTargetId">
          
          <label class="block text-sm font-medium text-gray-700 mb-2">Select a reason:</label>
          <select id="reportReason" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 focus:ring-2 focus:ring-red-500 outline-none appearance-none bg-gray-50 text-gray-800">
            <!-- Populated dynamically -->
          </select>
          
          <label class="block text-sm font-medium text-gray-700 mb-2">Additional Note (Optional):</label>
          <textarea id="reportNote" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 outline-none text-gray-800 placeholder-gray-400" placeholder="Provide more context..."></textarea>
          
          <button onclick="submitReport()" class="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm">Submit Report</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const reasonSelect = document.getElementById('reportReason');
  reasonSelect.innerHTML = '';
  
  const reasonsMap = {
    'LISTING': ['Fake', 'Misleading', 'Spam', 'Inappropriate'],
    'REVIEW': ['Abusive', 'Fake', 'Irrelevant'],
    'USER': ['Scam', 'Harassment', 'Impersonation']
  };

  const reasons = reasonsMap[targetType] || ['Other'];
  reasons.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    reasonSelect.appendChild(opt);
  });

  document.getElementById('reportTargetType').value = targetType;
  document.getElementById('reportTargetId').value = targetId;
  document.getElementById('reportNote').value = '';

  modal.classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('reportModalContent').classList.remove('scale-95');
    document.getElementById('reportModalContent').classList.add('scale-100');
  }, 10);
};

window.closeReportModal = function() {
  const modal = document.getElementById('reportModal');
  if (modal) {
    document.getElementById('reportModalContent').classList.remove('scale-100');
    document.getElementById('reportModalContent').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
  }
};

window.submitReport = async function() {
  const targetType = document.getElementById('reportTargetType').value;
  const targetId = document.getElementById('reportTargetId').value;
  const reason = document.getElementById('reportReason').value;
  const note = document.getElementById('reportNote').value.trim();

  try {
    await apiPost('/reports', { targetType, targetId, reason, note });
    showToast("Thank you for your report. We will look into it.", "success");
    closeReportModal();
  } catch(e) {
    // API client shows error toast
  }
};
