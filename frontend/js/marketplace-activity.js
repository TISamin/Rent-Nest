document.addEventListener('DOMContentLoaded', () => {
  // Check if authenticated
  if (!isAuthenticated()) {
    showToast("Please log in to view marketplace activity.", "warning");
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1500);
    return;
  }

  // Load user data
  const localUser = localStorage.getItem('rentnest_user');
  const currentUserId = localUser ? JSON.parse(localUser).id : null;

  // Fetch Escrow Activity
  loadEscrowActivity();

  async function loadEscrowActivity() {
    try {
      const res = await apiGet('/marketplace-escrow/activity');
      if (res.success && res.data) {
        const { sent, received } = res.data;
        renderSentRequests(sent);
        renderReceivedRequests(received);
      } else {
        showToast(res.message || "Failed to load activity data.", "error");
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      showToast("Error connecting to server.", "error");
    }
  }

  function renderSentRequests(sent) {
    const tbody = document.getElementById('sent-requests-body');
    const emptyState = document.getElementById('sent-empty-state');
    tbody.innerHTML = '';

    if (!sent || sent.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    sent.forEach(req => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0';
      
      const statusBadge = getStatusBadgeHtml(req.status);
      const reqDate = new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      let actionButtons = '';
      if (req.status === 'PENDING' || req.status === 'ACCEPTED') {
        actionButtons += `<button onclick="withdrawRequestActivity('${req.id}')" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded transition-all mr-2">Withdraw</button>`;
      }
      if (req.status === 'ACCEPTED') {
        actionButtons += `<a href="listing-detail.html?id=${req.listing.id}" class="px-3 py-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded transition-all">Pay</a>`;
      } else if (req.status === 'SHIPPED') {
        actionButtons += `<a href="listing-detail.html?id=${req.listing.id}" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded transition-all">Confirm Receipt</a>`;
      } else {
        actionButtons += `<a href="listing-detail.html?id=${req.listing.id}" class="text-xs text-primary font-bold hover:underline">View Detail</a>`;
      }

      tr.innerHTML = `
        <td class="py-4 font-semibold text-gray-900"><a href="listing-detail.html?id=${req.listing.id}" class="hover:text-primary transition-colors">${req.listing.title}</a></td>
        <td class="py-4 text-gray-700">${req.listing.priceMin || req.listing.price} BDT</td>
        <td class="py-4 text-gray-500">${req.listing.userName || 'Owner'}</td>
        <td class="py-4">${statusBadge}</td>
        <td class="py-4 text-gray-400 font-mono text-xs">${reqDate}</td>
        <td class="py-4 text-right">${actionButtons}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderReceivedRequests(received) {
    const tbody = document.getElementById('received-requests-body');
    const emptyState = document.getElementById('received-empty-state');
    tbody.innerHTML = '';

    if (!received || received.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    received.forEach(req => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0';
      
      const statusBadge = getStatusBadgeHtml(req.status);
      const reqDate = new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      // Payment details info
      let payInfo = '<span class="text-gray-400">-</span>';
      if (req.transactionReference) {
        payInfo = `
          <div class="text-xs">
            <p class="font-semibold text-gray-700">${req.paymentMethod}</p>
            <p class="text-gray-400 font-mono">TrxID: ${req.transactionReference}</p>
            ${req.adminNotes === 'CONFIRMED' ? '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold text-[9px]">Verified</span>' : '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-bold text-[9px]">Awaiting Admin</span>'}
          </div>
        `;
      }

      let actionButtons = '';
      if (req.status === 'PENDING') {
        const listingActive = received.some(other => 
          other.listing.id === req.listing.id && 
          ['ACCEPTED', 'PAID', 'SHIPPED', 'COMPLETED', 'DISPUTED'].includes(other.status)
        );
        if (listingActive) {
          actionButtons += `
            <button disabled class="px-3 py-1 bg-gray-100 text-gray-400 font-bold text-xs rounded cursor-not-allowed mr-2" title="Another request is currently accepted for this listing">Accept</button>
            <button onclick="declineRequestActivity('${req.id}')" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded transition-all">Decline</button>
          `;
        } else {
          actionButtons += `
            <button onclick="acceptRequestActivity('${req.id}')" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded transition-all mr-2">Accept</button>
            <button onclick="declineRequestActivity('${req.id}')" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded transition-all">Decline</button>
          `;
        }
      } else if (req.status === 'PAID' && req.adminNotes === 'CONFIRMED') {
        actionButtons += `<button onclick="shipItemActivity('${req.id}')" class="px-3 py-1 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded transition-all">Mark as Shipped</button>`;
      } else {
        actionButtons += `<a href="listing-detail.html?id=${req.listing.id}" class="text-xs text-primary font-bold hover:underline">View Detail</a>`;
      }

      tr.innerHTML = `
        <td class="py-4 font-semibold text-gray-900"><a href="listing-detail.html?id=${req.listing.id}" class="hover:text-primary transition-colors">${req.listing.title}</a></td>
        <td class="py-4">
          <p class="font-semibold text-gray-800 text-xs">${req.buyer ? req.buyer.name : 'Buyer'}</p>
          <p class="text-[10px] text-gray-400">${req.buyer ? req.buyer.email : ''}</p>
        </td>
        <td class="py-4">${statusBadge}</td>
        <td class="py-4">${payInfo}</td>
        <td class="py-4 text-gray-400 font-mono text-xs">${reqDate}</td>
        <td class="py-4 text-right">${actionButtons}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function getStatusBadgeHtml(status) {
    let classes = 'bg-gray-100 text-gray-600';
    if (status === 'ACCEPTED') classes = 'bg-blue-50 text-blue-600 border-blue-100 border';
    else if (status === 'PAID') classes = 'bg-amber-50 text-amber-600 border-amber-100 border';
    else if (status === 'SHIPPED') classes = 'bg-indigo-50 text-indigo-600 border-indigo-100 border';
    else if (status === 'COMPLETED') classes = 'bg-emerald-50 text-emerald-600 border-emerald-100 border';
    else if (status === 'DISPUTED') classes = 'bg-red-50 text-red-600 border-red-100 border';
    else if (status === 'REFUNDED') classes = 'bg-orange-50 text-orange-600 border-orange-100 border';
    else if (status === 'DECLINED') classes = 'bg-gray-100 text-gray-400';

    return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${classes}">${status}</span>`;
  }

  // Switch tabs
  window.switchActivityTab = function(type) {
    const tabSent = document.getElementById('tab-sent');
    const tabReceived = document.getElementById('tab-received');
    const panelSent = document.getElementById('panel-sent');
    const panelReceived = document.getElementById('panel-received');

    if (type === 'sent') {
      tabSent.className = 'flex-1 py-4 px-6 text-center font-bold text-sm border-b-2 border-primary text-primary transition-all focus:outline-none';
      tabReceived.className = 'flex-1 py-4 px-6 text-center font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 transition-all focus:outline-none';
      panelSent.classList.replace('hidden', 'block');
      panelReceived.classList.replace('block', 'hidden');
    } else {
      tabReceived.className = 'flex-1 py-4 px-6 text-center font-bold text-sm border-b-2 border-primary text-primary transition-all focus:outline-none';
      tabSent.className = 'flex-1 py-4 px-6 text-center font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 transition-all focus:outline-none';
      panelReceived.classList.replace('hidden', 'block');
      panelSent.classList.replace('block', 'hidden');
    }
  };

  // Activity Actions
  window.withdrawRequestActivity = async function(escrowId) {
    if (!confirm("Are you sure you want to withdraw this request?")) return;
    try {
      const res = await apiPost(`/marketplace-escrow/withdraw/${escrowId}`);
      if (res.success) {
        showToast("Request withdrawn.", "info");
        loadEscrowActivity();
      } else {
        showToast(res.message || "Failed to withdraw.", "error");
      }
    } catch(e) {}
  };

  window.acceptRequestActivity = async function(escrowId) {
    try {
      const res = await apiPost(`/marketplace-escrow/accept-request/${escrowId}`);
      if (res.success) {
        showToast("Buy request accepted!", "success");
        loadEscrowActivity();
      } else {
        showToast(res.message || "Failed to accept.", "error");
      }
    } catch(e) {}
  };

  window.declineRequestActivity = async function(escrowId) {
    try {
      const res = await apiPost(`/marketplace-escrow/decline-request/${escrowId}`);
      if (res.success) {
        showToast("Request declined.", "info");
        loadEscrowActivity();
      } else {
        showToast(res.message || "Failed to decline.", "error");
      }
    } catch(e) {}
  };

  window.shipItemActivity = async function(escrowId) {
    try {
      const res = await apiPost(`/marketplace-escrow/ship/${escrowId}`);
      if (res.success) {
        showToast("Item marked as shipped!", "success");
        loadEscrowActivity();
      } else {
        showToast(res.message || "Failed to ship.", "error");
      }
    } catch(e) {}
  };
});
