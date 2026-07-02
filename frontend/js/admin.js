let currentReportTab = 'PENDING';
let allReports = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initial load
    loadStats();
});

function switchTab(tabId) {
    // UI update
    document.querySelectorAll('.admin-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-btn').forEach(el => {
        el.classList.remove('bg-[#e67e5a]', 'text-white');
        el.classList.add('text-gray-300', 'hover:bg-gray-800', 'hover:text-white');
    });

    document.getElementById(`view-${tabId}`).classList.remove('hidden');
    
    const activeBtn = document.getElementById(`tab-${tabId}`);
    activeBtn.classList.remove('text-gray-300', 'hover:bg-gray-800', 'hover:text-white');
    activeBtn.classList.add('bg-[#e67e5a]', 'text-white');

    // Fetch data
    if (tabId === 'stats') loadStats();
    if (tabId === 'reports') loadReports();
    if (tabId === 'users') searchUsers();
    if (tabId === 'escrow') loadEscrows();
}

async function loadStats() {
    try {
        const response = await apiGet('/admin/stats');
        const data = response.data;
        
        const container = document.getElementById('stats-container');
        container.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span class="text-sm font-medium text-gray-500 mb-1">Total Users</span>
                <span class="text-3xl font-bold text-gray-900">${data.totalUsers}</span>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span class="text-sm font-medium text-gray-500 mb-1">Total Listings</span>
                <span class="text-3xl font-bold text-gray-900">${data.totalListings}</span>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span class="text-sm font-medium text-gray-500 mb-1">Total Reviews</span>
                <span class="text-3xl font-bold text-gray-900">${data.totalReviews}</span>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span class="text-sm font-medium text-gray-500 mb-1">Pending Reports</span>
                <span class="text-3xl font-bold text-yellow-600">${data.pendingReports}</span>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <span class="text-sm font-medium text-gray-500 mb-1">Resolved Reports</span>
                <span class="text-3xl font-bold text-emerald-600">${data.resolvedReports}</span>
            </div>
        `;
    } catch (e) {
        // Error already shown by api.js
    }
}

async function loadReports() {
    try {
        const response = await apiGet('/admin/reports');
        allReports = response.data || [];
        renderReports();
    } catch(e) {}
}

function setReportTab(status) {
    currentReportTab = status;
    
    // Update tabs UI
    ['PENDING', 'ESCALATED', 'RESOLVED'].forEach(s => {
        const el = document.getElementById(`rep-tab-${s}`);
        if (s === status) {
            el.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            el.classList.add('border-[#e67e5a]', 'text-[#e67e5a]');
        } else {
            el.classList.remove('border-[#e67e5a]', 'text-[#e67e5a]');
            el.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
    });

    renderReports();
}

function renderReports() {
    const tbody = document.getElementById('reports-table-body');
    const filtered = allReports.filter(r => r.status === currentReportTab);
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No ${currentReportTab.toLowerCase()} reports found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(r.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${r.targetType}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${r.reason}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-xs font-mono">${r.targetId}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${r.note || ''}">${r.note || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                ${currentReportTab === 'PENDING' ? `<button onclick="updateReportStatus('${r.id}', 'RESOLVED')" class="text-emerald-600 hover:text-emerald-900">Resolve</button>` : ''}
                ${currentReportTab === 'PENDING' ? `<button onclick="updateReportStatus('${r.id}', 'ESCALATED')" class="text-orange-600 hover:text-orange-900">Escalate</button>` : ''}
                ${currentReportTab === 'ESCALATED' ? `<button onclick="updateReportStatus('${r.id}', 'RESOLVED')" class="text-emerald-600 hover:text-emerald-900">Resolve</button>` : ''}
                ${currentReportTab === 'RESOLVED' ? `<span class="text-gray-400">Done</span>` : ''}
            </td>
        </tr>
    `).join('');
}

async function updateReportStatus(reportId, status) {
    try {
        await apiPut(`/admin/reports/${reportId}/status`, { status });
        showToast(`Report marked as ${status}`, 'success');
        loadReports();
        loadStats();
    } catch(e) {}
}

async function searchUsers() {
    const query = document.getElementById('user-search-input').value.trim();

    try {
        const response = await apiGet(`/admin/users/search?query=${encodeURIComponent(query)}`);
        const users = response.data || [];
        const tbody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        ${u.profilePhotoUrl ? `<img class="h-10 w-10 rounded-full object-cover mr-3" src="${u.profilePhotoUrl}">` : `<div class="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500 font-bold">${(u.name || '?').charAt(0).toUpperCase()}</div>`}
                        <div>
                            <div class="text-sm font-medium text-gray-900">${u.name || 'Unknown'}</div>
                            <div class="text-sm text-gray-500">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">${u.role}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${u.banned ? 
                        `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 cursor-help" title="${u.banReason}">Banned</span>` : 
                        `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>`}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onclick="toggleBan('${u.id}', ${!!u.banned})" class="${u.banned ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}">${u.banned ? 'Unban' : 'Ban'}</button>
                    <button onclick="deleteUser('${u.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch(e) {}
}

async function toggleBan(userId, currentlyBanned) {
    let reason = null;
    if (!currentlyBanned) {
        reason = prompt("Enter a reason for banning this user:");
        if (reason === null) return; // Cancelled
    }

    try {
        await apiPut(`/admin/users/${userId}/ban`, { reason });
        showToast(currentlyBanned ? "User unbanned" : "User banned", "success");
        searchUsers(); // Refresh
        loadStats();
    } catch(e) {}
}

async function deleteUser(userId) {
    if (!confirm("Are you absolutely sure? This will delete the user entirely.")) return;

    try {
        await apiDelete(`/admin/users/${userId}`);
        showToast("User deleted successfully", "success");
        searchUsers(); // Refresh
        loadStats();
    } catch(e) {}
}

async function deleteListing() {
    const id = document.getElementById('listing-delete-id').value.trim();
    if (!id) {
        showToast("Please enter a Listing ID", "warning");
        return;
    }
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
        await apiDelete(`/admin/listings/${id}`);
        showToast("Listing deleted successfully", "success");
        document.getElementById('listing-delete-id').value = '';
    } catch(e) {}
}

async function loadEscrows() {
    try {
        const response = await apiGet('/admin/marketplace-escrow');
        const escrows = response.data || [];
        const tbody = document.getElementById('escrows-table-body');
        
        if (escrows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No escrow transactions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = escrows.map(e => {
            const reqDate = new Date(e.createdAt).toLocaleDateString();
            
            // Render payment detail
            let payDetail = '-';
            if (e.transactionReference) {
                payDetail = `
                    <div class="text-xs">
                        <span class="font-bold text-gray-700">${e.paymentMethod}</span><br>
                        <span class="font-mono text-gray-400">TrxID: ${e.transactionReference}</span><br>
                        ${e.adminNotes === 'CONFIRMED' ? '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-bold text-[9px]">Verified</span>' : '<span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 font-bold text-[9px]">Awaiting Confirm</span>'}
                    </div>
                `;
            }

            // Actions mapping
            let actions = '';
            if (e.status === 'PAID') {
                if (e.adminNotes !== 'CONFIRMED') {
                    actions += `
                        <button onclick="escrowAction('${e.id}', 'CONFIRM')" class="text-green-600 hover:text-green-950 font-bold mr-3">Confirm Pay</button>
                        <button onclick="escrowAction('${e.id}', 'REJECT')" class="text-red-500 hover:text-red-800 font-bold mr-3">Reject Pay</button>
                    `;
                }
            }
            if (e.status === 'SHIPPED' || e.status === 'DISPUTED' || (e.status === 'PAID' && e.adminNotes === 'CONFIRMED')) {
                actions += `
                    <button onclick="escrowAction('${e.id}', 'COMPLETE')" class="text-emerald-600 hover:text-emerald-900 font-bold mr-3" title="Release funds with 15% manual fee deducted">Complete (Release)</button>
                    <button onclick="escrowAction('${e.id}', 'REFUND')" class="text-orange-600 hover:text-orange-900 font-bold mr-3">Refund</button>
                `;
            }
            actions += `<a href="listing-detail.html?id=${e.listing.id}" class="text-xs text-primary font-bold hover:underline" target="_blank">View Item</a>`;

            let statusClasses = 'bg-gray-100 text-gray-600';
            if (e.status === 'ACCEPTED') statusClasses = 'bg-blue-50 text-blue-600 border border-blue-100';
            else if (e.status === 'PAID') statusClasses = 'bg-amber-50 text-amber-600 border border-amber-100';
            else if (e.status === 'SHIPPED') statusClasses = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
            else if (e.status === 'COMPLETED') statusClasses = 'bg-green-50 text-green-600 border border-green-100';
            else if (e.status === 'DISPUTED') statusClasses = 'bg-red-50 text-red-600 border border-red-100';
            else if (e.status === 'REFUNDED') statusClasses = 'bg-orange-50 text-orange-600 border border-orange-100';
            else if (e.status === 'DECLINED') statusClasses = 'bg-gray-100 text-gray-400';

            const statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses}">${e.status}</span>`;

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-gray-900">${e.listing.title}</div>
                        <div class="text-xs text-gray-500">${e.listing.priceMin || e.listing.price} BDT</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-gray-800">${e.buyer ? e.buyer.name : 'Buyer'}</div>
                        <div class="text-xs text-gray-400">${e.buyer ? e.buyer.email : ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-gray-800">${e.listing.userName || 'Seller'}</div>
                        <div class="text-xs text-gray-400">${e.listing.contactPhone || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${payDetail}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right font-medium text-xs">${actions}</td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        console.error("Failed to load escrows:", e);
    }
}

async function escrowAction(escrowId, action) {
    if (action === 'COMPLETE' && !confirm("Confirming this releases BDT to the seller minus a 15% manual charge. Make sure you made the manual bKash/Nagad transfer. Proceed?")) return;
    if (action === 'REFUND' && !confirm("Refund the buyer directly. Make sure you sent the bKash/Nagad transfer. Proceed?")) return;
    if (action === 'REJECT' && !confirm("Reject payment and decline buy request?")) return;

    try {
        const response = await apiPost(`/admin/marketplace-escrow/${escrowId}/action`, { action });
        if (response.success) {
            showToast(`Escrow action [${action}] succeeded!`, 'success');
            loadEscrows();
        } else {
            showToast(response.message || "Action failed.", 'error');
        }
    } catch(e) {}
}
