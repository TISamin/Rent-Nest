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
