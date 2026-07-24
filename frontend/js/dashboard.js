// RentNest Landlord Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize data
  loadDashboardData();
  
  // Setup lease search listener on all search inputs
  document.querySelectorAll('.lease-search-input').forEach(input => {
    input.addEventListener('input', (e) => {
      document.querySelectorAll('.lease-search-input').forEach(other => {
        if (other !== e.target) other.value = e.target.value;
      });
      renderLeasesTable();
    });
  });
});

// Global state variables
let globalStats = {};
let globalProperties = [];
let globalUnits = [];
let globalLeases = [];
let globalMaintenance = [];
let globalExpenditures = [];
let globalAnnouncements = [];
let currentTab = 'overview';

// Wizard local state
let wizardStep = 1;

// Load all dashboard components from backend API
async function loadDashboardData() {
  try {
    // 1. Fetch properties to check first-time experience
    const propRes = await apiGet('/dashboard/properties');
    globalProperties = propRes.data || [];

    if (globalProperties.length === 0) {
      showSetupWizard();
      return;
    } else {
      hideSetupWizard();
    }

    // 2. Fetch the rest of the data in parallel
    const [statsRes, unitsRes, leasesRes, maintRes, expRes, annRes] = await Promise.all([
      apiGet('/dashboard/stats'),
      apiGet('/dashboard/units'),
      apiGet('/dashboard/leases'),
      apiGet('/dashboard/maintenance'),
      apiGet('/dashboard/expenditures'),
      apiGet('/dashboard/announcements')
    ]);

    globalStats = statsRes.data || {};
    globalUnits = unitsRes.data || [];
    globalLeases = leasesRes.data || [];
    globalMaintenance = maintRes.data || [];
    globalExpenditures = expRes.data || [];
    globalAnnouncements = annRes.data || [];

    // 3. Render everything
    renderStats();
    renderChart();
    renderProperties();
    renderLeasesTable();
    renderKanban();
    renderExpenditures();
    renderAnnouncements();
    populateUnitSelects();

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// ─── TAB NAVIGATION ──────────────────────────────────────────

window.switchTab = function(tabId) {
  currentTab = tabId;
  
  // Update Tab buttons styling
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('tab-active');
  });
  const activeBtn = document.getElementById(`tab-${tabId}`);
  if (activeBtn) activeBtn.classList.add('tab-active');

  // Show/Hide sections
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.add('hidden');
  });
  const activeSec = document.getElementById(`section-${tabId}`);
  if (activeSec) activeSec.classList.remove('hidden');
};

// ─── STATS RENDERING ─────────────────────────────────────────

function renderStats() {
  document.getElementById('stat-earnings').textContent = `${globalStats.totalEarnings || 0} BDT`;
  document.getElementById('stat-tenants').textContent = globalStats.activeTenants || 0;
  document.getElementById('stat-units-total').textContent = `${globalStats.totalUnits || 0} units total`;
  document.getElementById('stat-maintenance').textContent = globalStats.openMaintenance || 0;
  document.getElementById('stat-occupancy').textContent = `${globalStats.occupancyRate || 0}%`;
  document.getElementById('stat-occupied-units').textContent = `${globalStats.occupiedUnits || 0} occupied`;
}

// ─── RECHARTS CDN CHART ──────────────────────────────────────

let chartRoot = null;
async function renderChart() {
  const container = document.getElementById('rent-chart-root');
  if (!container || typeof Recharts === 'undefined' || typeof React === 'undefined') return;

  try {
    const res = await apiGet('/dashboard/chart');
    const points = res.data || [];

    if (points.length === 0) {
      container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">No financial history logs available yet. Mark rent as paid or add expenses to view performance charts.</div>`;
      return;
    }

    // Format data for Recharts
    const chartData = points.map(p => ({
      name: p.month,
      Rent: Number(p.rent),
      Fees: Number(p.fees),
      Net: Number(p.net)
    }));

    const { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;

    function FinancialChart() {
      return React.createElement(
        ResponsiveContainer,
        { width: '100%', height: '100%' },
        React.createElement(
          ComposedChart,
          { data: chartData, margin: { top: 10, right: 10, left: -10, bottom: 0 } },
          React.createElement(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#F3F4F6' }),
          React.createElement(XAxis, { dataKey: 'name', axisLine: false, tickLine: false, stroke: '#9CA3AF', fontSize: 11 }),
          React.createElement(YAxis, { axisLine: false, tickLine: false, stroke: '#9CA3AF', fontSize: 11, tickFormatter: (v) => `${v}` }),
          React.createElement(Tooltip, { 
            contentStyle: { background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
            formatter: (v, name) => [`${v} BDT`, name] 
          }),
          React.createElement(Legend, { iconType: 'circle', wrapperStyle: { fontSize: 11, paddingTop: 10 } }),
          React.createElement(Bar, { dataKey: 'Rent', fill: '#4ADE80', name: 'Rent Collected', radius: [4, 4, 0, 0], barSize: 20 }),
          React.createElement(Bar, { dataKey: 'Fees', fill: '#F87171', name: 'Fees & Expenses', radius: [4, 4, 0, 0], barSize: 20 }),
          React.createElement(Line, { type: 'monotone', dataKey: 'Net', stroke: '#FF385C', name: 'Net Profit', strokeWidth: 2, dot: true })
        )
      );
    }

    if (!chartRoot) {
      chartRoot = ReactDOM.createRoot(container);
    }
    chartRoot.render(React.createElement(FinancialChart));

  } catch (error) {
    console.error("Error loading chart data:", error);
  }
}

// ─── PROPERTIES & UNITS RENDERING ───────────────────────────

function renderProperties() {
  const container = document.getElementById('properties-grid');
  if (!container) return;

  if (globalProperties.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-gray-500 text-sm">No properties added yet.</div>`;
    return;
  }

  container.innerHTML = globalProperties.map(prop => {
    const units = globalUnits.filter(u => u.propertyId === prop.id || (u.property && u.property.id === prop.id));
    
    const unitsListHtml = units.map(unit => {
      const isVacant = unit.isVacant;
      return `
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-all text-xs">
          <div>
            <p class="font-bold text-gray-800">${unit.name}</p>
            <p class="text-gray-400 text-[10px]">${unit.rentAmount} BDT / ${unit.rentPeriod.toLowerCase()}</p>
          </div>
          <div class="flex items-center space-x-2">
            ${isVacant 
              ? `<button onclick="openAssignTenantModal('${unit.id}')" class="px-2 py-1 bg-primary text-white rounded font-semibold text-[10px]">Assign Tenant</button>` 
              : `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">Occupied</span>`
            }
            <button onclick="openEditUnitModal('${unit.id}', '${prop.id}')" class="text-gray-400 hover:text-gray-600" title="Edit Unit">✏️</button>
            <button onclick="deleteUnit('${unit.id}')" class="text-gray-400 hover:text-red-500" title="Delete Unit">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div>
          <div class="flex justify-between items-start mb-2 cursor-pointer select-none" onclick="toggleUnitsSection('${prop.id}')">
            <div class="flex items-center space-x-2">
              <span id="chevron-${prop.id}" class="text-xs text-gray-400 transition-transform duration-200">▼</span>
              <h4 class="font-bold text-gray-800 text-base">${prop.name}</h4>
            </div>
            <div class="flex space-x-1.5" onclick="event.stopPropagation()">
              <button onclick="openEditPropertyModal('${prop.id}')" class="text-xs text-gray-400 hover:text-gray-700">Edit</button>
              <span class="text-gray-300">|</span>
              <button onclick="deleteProperty('${prop.id}')" class="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          </div>
          <p class="text-xs text-gray-400 mb-4 cursor-pointer select-none" onclick="toggleUnitsSection('${prop.id}')">📍 ${prop.location || 'No location info'} • <span class="italic">${prop.type || 'Standard'}</span></p>
          
          <div id="units-section-${prop.id}" class="space-y-2 mt-2 transition-all">
            <p class="text-xs font-bold text-gray-700">Units (${units.length})</p>
            ${unitsListHtml || '<p class="text-[10px] text-gray-400 italic">No units in this property.</p>'}
          </div>
        </div>
        <div class="mt-5 pt-4 border-t border-gray-50">
          <button onclick="openAddUnitModal('${prop.id}')" class="w-full text-center py-2 border border-dashed border-gray-200 rounded-lg hover:border-primary/30 hover:bg-rose-50/10 text-xs font-bold text-gray-600 hover:text-primary transition-all">
            + Add Unit
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleUnitsSection = function(propId) {
  const section = document.getElementById(`units-section-${propId}`);
  const chevron = document.getElementById(`chevron-${propId}`);
  if (section) {
    section.classList.toggle('hidden');
    if (chevron) {
      if (section.classList.contains('hidden')) {
        chevron.style.transform = 'rotate(-90deg)';
      } else {
        chevron.style.transform = 'rotate(0deg)';
      }
    }
  }
};

// ─── LEASES TABLE ────────────────────────────────────────────

function renderLeasesTable() {
  const tbodies = document.querySelectorAll('.lease-table-body-target');
  const searchInput = document.querySelector('.lease-search-input');
  const searchVal = (searchInput?.value || '').toLowerCase();
  if (tbodies.length === 0) return;

  const filtered = globalLeases.filter(l => 
    l.tenantName.toLowerCase().includes(searchVal) ||
    l.propertyName.toLowerCase().includes(searchVal) ||
    l.unitName.toLowerCase().includes(searchVal)
  );

  let html = '';
  if (filtered.length === 0) {
    html = `<tr><td colspan="6" class="p-6 text-center text-gray-500 text-sm">No active leases found.</td></tr>`;
  } else {
    html = filtered.map(l => {
      const isDue = l.monthsDue > 0;
      const statusClass = isDue 
        ? 'bg-rose-50 text-primary font-bold border border-rose-100' 
        : 'bg-emerald-50 text-emerald-600 font-bold border border-emerald-100';

      return `
        <tr class="hover:bg-gray-50/50 transition-colors">
          <td class="p-4 font-semibold text-gray-800">
            <div class="flex items-center space-x-2">
              <span>${l.tenantName}</span>
              ${l.whatsappNumber 
                ? `<a href="https://wa.me/${l.whatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" class="p-1 hover:bg-emerald-50 rounded text-emerald-500" title="Chat on WhatsApp">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2C6.5 2 2.012 6.5 2.012 12c0 2.088.638 4.025 1.737 5.625L2.025 23l5.525-1.787A9.927 9.927 0 0 0 12.013 22c5.513 0 10-4.5 10-10s-4.5-10-10-10zm5.675 13.913c-.225.625-1.312 1.2-1.8 1.262-.438.063-.988.088-2.938-.687-2.5-1-4.075-3.575-4.2-3.738-.125-.162-1.013-1.375-1.013-2.613 0-1.238.625-1.85 1.013-2.225.3-.287.675-.425.962-.425.263 0 .525.013.725.025.237.013.563-.087.875.688.325.8 1.1 2.725 1.2 2.925.1.2.175.438.038.713-.138.287-.275.413-.438.613-.162.2-.338.4-.488.575-.162.187-.337.387-.137.737.2.35.887 1.488 1.9 2.4 1.3 1.163 2.4 1.525 2.738 1.7.35.175.563.15.775-.088.225-.262.975-1.125 1.238-1.513.262-.387.525-.325.875-.187.35.137 2.225 1.05 2.613 1.238.387.187.637.287.725.438.1.15.1.862-.125 1.487z"/></svg>
                   </a>`
                : ''
              }
            </div>
          </td>
          <td class="p-4 text-gray-600">
            <p class="font-medium">${l.propertyName}</p>
            <p class="text-xs text-gray-400">${l.unitName}</p>
          </td>
          <td class="p-4 text-gray-500">${l.startDate}</td>
          <td class="p-4">
            <p class="font-bold text-gray-900">${l.rentAmount} BDT</p>
            <p class="text-xs text-gray-400">Day ${l.collectionDay} • ${l.rentPeriod}</p>
          </td>
          <td class="p-4">
            <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}">
              ${l.rentStatus}
            </span>
          </td>
          <td class="p-4 text-right space-x-2">
            ${isDue 
              ? `<button onclick="payRent('${l.dueRecords[0].id}')" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold">Collect Rent</button>` 
              : ''
            }
            <button onclick="openAddRentRecordModal('${l.id}', '${l.rentAmount}')" class="px-2.5 py-1 border border-gray-200 hover:border-primary text-gray-700 hover:text-primary rounded text-xs font-semibold" title="Issue Due rent manually">Issue DUE</button>
            <button onclick="openEditLeaseModal('${l.id}')" class="text-gray-400 hover:text-gray-600">✏️</button>
            <button onclick="deleteLease('${l.id}')" class="text-gray-400 hover:text-red-500">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  tbodies.forEach(tb => {
    tb.innerHTML = html;
  });
}

// ─── KANBAN BOARD ────────────────────────────────────────────

window.allowDrop = function(ev) {
  ev.preventDefault();
};

window.drag = function(ev) {
  ev.dataTransfer.setData("text/plain", ev.target.id);
  ev.target.classList.add('opacity-50');
};

window.dragEnd = function(ev) {
  ev.target.classList.remove('opacity-50');
};

window.dragEnter = function(ev) {
  const col = ev.target.closest('[ondrop]');
  if (col) col.classList.add('kanban-col-active');
};

window.dragLeave = function(ev) {
  const col = ev.target.closest('[ondrop]');
  if (col) col.classList.remove('kanban-col-active');
};

window.handleDrop = async function(ev, targetStatus) {
  ev.preventDefault();
  const col = ev.target.closest('[ondrop]');
  if (col) col.classList.remove('kanban-col-active');

  const id = ev.dataTransfer.getData("text/plain");
  const requestItem = globalMaintenance.find(r => r.id === id);

  if (requestItem && requestItem.status !== targetStatus) {
    try {
      await apiPut(`/dashboard/maintenance/${id}/status`, { status: targetStatus });
      showToast(`Request updated to ${targetStatus.replace('_', ' ')}`, 'success');
      loadDashboardData();
    } catch (err) {
      console.error("Drop update failed:", err);
    }
  }
};

function renderKanban() {
  const targetOpenCols = document.querySelectorAll('.col-open-target');
  const targetProgressCols = document.querySelectorAll('.col-progress-target');
  const targetResolvedCols = document.querySelectorAll('.col-resolved-target');

  const countOpenEls = document.querySelectorAll('.count-open-target');
  const countProgressEls = document.querySelectorAll('.count-progress-target');
  const countResolvedEls = document.querySelectorAll('.count-resolved-target');

  // Clear Columns
  [targetOpenCols, targetProgressCols, targetResolvedCols].forEach(colList => {
    colList.forEach(col => { if (col) col.innerHTML = ''; });
  });

  const priorityClasses = {
    HIGH: 'bg-rose-50 text-primary border-rose-100',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };

  const colTargetMap = {
    OPEN: targetOpenCols,
    IN_PROGRESS: targetProgressCols,
    RESOLVED: targetResolvedCols
  };

  globalMaintenance.forEach(req => {
    const colsList = colTargetMap[req.status];
    if (!colsList || colsList.length === 0) return;

    counts[req.status]++;

    const dateLabel = req.createdAt ? req.createdAt.substring(0, 10) : '';

    colsList.forEach((colEl, idx) => {
      const card = document.createElement('div');
      card.id = idx === 0 ? req.id : `${req.id}-copy-${idx}`;
      card.dataset.reqId = req.id;
      card.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm kanban-card flex flex-col justify-between hover:shadow-md transition-all cursor-grab';
      card.draggable = true;
      card.setAttribute('ondragstart', 'drag(event)');
      card.setAttribute('ondragend', 'dragEnd(event)');

      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border rounded ${priorityClasses[req.priority] || ''}">
              ${req.priority}
            </span>
            <span class="text-[10px] text-gray-400 font-medium">${dateLabel}</span>
          </div>
          <h4 class="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">${req.title}</h4>
          <p class="text-xs text-gray-500 mb-2">${req.description || 'No description provided'}</p>
          <p class="text-xs text-gray-400 flex items-center">
            <span class="mr-1">📍</span> ${req.propertyName || 'General Property'} ${req.unitName ? `• ${req.unitName}` : ''}
          </p>
          ${req.cost ? `<p class="text-xs font-bold text-gray-700 mt-2">Cost: ${req.cost} BDT</p>` : ''}
        </div>
        <div class="mt-4 pt-3 border-t border-gray-50 flex justify-end space-x-2">
          <button onclick="openEditMaintenanceModal('${req.id}')" class="text-xs text-gray-400 hover:text-gray-600">Edit</button>
          <span class="text-gray-300">|</span>
          <button onclick="deleteMaintenance('${req.id}')" class="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      `;

      colEl.appendChild(card);
    });
  });

  // Update counters
  countOpenEls.forEach(el => el.textContent = counts.OPEN);
  countProgressEls.forEach(el => el.textContent = counts.IN_PROGRESS);
  countResolvedEls.forEach(el => el.textContent = counts.RESOLVED);
}

// ─── EXPENDITURES RENDERING ──────────────────────────────────

function renderExpenditures() {
  const tbody = document.getElementById('expenditure-table-body');
  if (!tbody) return;

  if (globalExpenditures.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 text-sm">No logged expenditures.</td></tr>`;
    return;
  }

  tbody.innerHTML = globalExpenditures.map(e => {
    const dateLabel = e.createdAt ? e.createdAt.substring(0, 10) : '';
    return `
      <tr class="hover:bg-gray-50/50 transition-colors">
        <td class="p-4 font-semibold text-gray-800">${e.name}</td>
        <td class="p-4 font-bold text-red-500">${e.cost} BDT</td>
        <td class="p-4 text-gray-500">${dateLabel}</td>
        <td class="p-4 text-right space-x-2">
          <button onclick="openEditExpenditureModal('${e.id}')" class="text-gray-400 hover:text-gray-600">✏️</button>
          <button onclick="deleteExpenditure('${e.id}')" class="text-gray-400 hover:text-red-500">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── ANNOUNCEMENTS RENDERING ──────────────────────────────────

function renderAnnouncements() {
  const container = document.getElementById('announcements-list');
  if (!container) return;

  if (globalAnnouncements.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-gray-500 text-sm">No notes or reminders logged yet.</div>`;
    return;
  }

  container.innerHTML = globalAnnouncements.map(a => {
    const dateLabel = a.createdAt ? a.createdAt.substring(0, 10) : '';
    return `
      <div class="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p class="text-sm text-gray-800 whitespace-pre-wrap mb-4 font-medium leading-relaxed">${a.text}</p>
        <div class="flex items-center justify-between pt-3 border-t border-amber-100/30 text-xs">
          <span class="text-gray-400">${dateLabel}</span>
          <button onclick="deleteAnnouncement('${a.id}')" class="text-red-400 hover:text-red-600 font-bold">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Populate Unit dropdown list in Maintenance modal
function populateUnitSelects() {
  const maintSelect = document.getElementById('maint-unit-id');
  if (!maintSelect) return;

  maintSelect.innerHTML = `<option value="">General Property Cost (No Unit)</option>` + 
    globalUnits.map(u => `<option value="${u.id}">${u.property ? u.property.name : ''} - ${u.name}</option>`).join('');
}

// ─── ACTIONS & API CALLS ─────────────────────────────────────

// Properties CRUD
window.openAddPropertyModal = function() {
  document.getElementById('prop-id').value = '';
  document.getElementById('prop-name').value = '';
  document.getElementById('prop-location').value = '';
  document.getElementById('prop-type').value = 'Apartment';
  document.getElementById('prop-modal-title').textContent = 'Add Property';
  openModal('modal-property');
};

window.openEditPropertyModal = function(id) {
  const p = globalProperties.find(item => item.id === id);
  if (!p) return;
  document.getElementById('prop-id').value = p.id;
  document.getElementById('prop-name').value = p.name;
  document.getElementById('prop-location').value = p.location || '';
  document.getElementById('prop-type').value = p.type || 'Apartment';
  document.getElementById('prop-modal-title').textContent = 'Edit Property';
  openModal('modal-property');
};

window.saveProperty = async function(e) {
  e.preventDefault();
  const id = document.getElementById('prop-id').value;
  const body = {
    name: document.getElementById('prop-name').value,
    location: document.getElementById('prop-location').value,
    type: document.getElementById('prop-type').value
  };

  try {
    if (id) {
      await apiPut(`/dashboard/properties/${id}`, body);
      showToast('Property updated successfully', 'success');
    } else {
      await apiPost('/dashboard/properties', body);
      showToast('Property added successfully', 'success');
    }
    closeModal('modal-property');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteProperty = async function(id) {
  if (!confirm("Are you sure you want to delete this property? This will cascade delete all units, leases, and payment histories!")) return;
  try {
    await apiDelete(`/dashboard/properties/${id}`);
    showToast('Property deleted successfully', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Units CRUD
window.openAddUnitModal = function(propId) {
  document.getElementById('unit-id').value = '';
  document.getElementById('unit-property-id').value = propId;
  document.getElementById('unit-name').value = '';
  document.getElementById('unit-rent-amount').value = '';
  document.getElementById('unit-rent-period').value = 'MONTHLY';
  document.getElementById('unit-collection-day').value = 1;
  document.getElementById('unit-modal-title').textContent = 'Add Unit';
  openModal('modal-unit');
};

window.openEditUnitModal = function(id, propId) {
  const u = globalUnits.find(item => item.id === id);
  if (!u) return;
  document.getElementById('unit-id').value = u.id;
  document.getElementById('unit-property-id').value = propId;
  document.getElementById('unit-name').value = u.name;
  document.getElementById('unit-rent-amount').value = u.rentAmount;
  document.getElementById('unit-rent-period').value = u.rentPeriod;
  document.getElementById('unit-collection-day').value = u.collectionDay;
  document.getElementById('unit-modal-title').textContent = 'Edit Unit';
  openModal('modal-unit');
};

window.saveUnit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('unit-id').value;
  const propId = document.getElementById('unit-property-id').value;
  const body = {
    propertyId: propId,
    name: document.getElementById('unit-name').value,
    rentAmount: Number(document.getElementById('unit-rent-amount').value),
    rentPeriod: document.getElementById('unit-rent-period').value,
    collectionDay: Number(document.getElementById('unit-collection-day').value)
  };

  try {
    if (id) {
      await apiPut(`/dashboard/units/${id}`, body);
      showToast('Unit updated successfully', 'success');
    } else {
      await apiPost('/dashboard/units', body);
      showToast('Unit added successfully', 'success');
    }
    closeModal('modal-unit');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteUnit = async function(id) {
  if (!confirm("Are you sure you want to delete this unit? This will delete corresponding tenancy leases!")) return;
  try {
    await apiDelete(`/dashboard/units/${id}`);
    showToast('Unit deleted', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Leases & Tenants CRUD
window.openAssignTenantModal = function(unitId) {
  document.getElementById('lease-id').value = '';
  document.getElementById('lease-unit-id').value = unitId;
  document.getElementById('lease-tenant-name').value = '';
  document.getElementById('lease-whatsapp').value = '';
  document.getElementById('lease-start-date').value = new Date().toISOString().substring(0, 10);
  document.getElementById('lease-modal-title').textContent = 'Assign Tenant';
  openModal('modal-lease');
};

window.openEditLeaseModal = function(id) {
  const l = globalLeases.find(item => item.id === id);
  if (!l) return;
  document.getElementById('lease-id').value = l.id;
  document.getElementById('lease-unit-id').value = l.unitId;
  document.getElementById('lease-tenant-name').value = l.tenantName;
  document.getElementById('lease-whatsapp').value = l.whatsappNumber || '';
  document.getElementById('lease-start-date').value = l.startDate;
  document.getElementById('lease-modal-title').textContent = 'Edit Lease';
  openModal('modal-lease');
};

window.saveLease = async function(e) {
  e.preventDefault();
  const id = document.getElementById('lease-id').value;
  const unitId = document.getElementById('lease-unit-id').value;
  const body = {
    unitId: unitId,
    tenantName: document.getElementById('lease-tenant-name').value,
    whatsappNumber: document.getElementById('lease-whatsapp').value,
    startDate: document.getElementById('lease-start-date').value
  };

  try {
    if (id) {
      await apiPut(`/dashboard/leases/${id}`, body);
      showToast('Lease updated successfully', 'success');
    } else {
      const savedLeaseRes = await apiPost('/dashboard/leases', body);
      // Auto-issue first billing period as DUE upon initial creation
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonthLabel = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
      await apiPost('/dashboard/rent-records', {
        leaseId: savedLeaseRes.data.id,
        periodLabel: currentMonthLabel,
        amount: Number(globalUnits.find(u => u.id === unitId).rentAmount)
      });
      showToast('Tenant assigned successfully and first month DUE issue created.', 'success');
    }
    closeModal('modal-lease');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteLease = async function(id) {
  if (!confirm("Are you sure you want to end this lease? This will set unit to vacant and delete payment records!")) return;
  try {
    await apiDelete(`/dashboard/leases/${id}`);
    showToast('Lease terminated successfully', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Rent Collections
window.payRent = async function(recordId) {
  try {
    await apiPost(`/dashboard/rent-records/${recordId}/pay`, {});
    showToast('Rent collection logged successfully!', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.openAddRentRecordModal = function(leaseId, amount) {
  document.getElementById('rr-lease-id').value = leaseId;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthLabel = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
  document.getElementById('rr-period-label').value = currentMonthLabel;
  document.getElementById('rr-amount').value = amount;
  openModal('modal-rent-record');
};

window.generateRentRecord = async function(e) {
  e.preventDefault();
  const body = {
    leaseId: document.getElementById('rr-lease-id').value,
    periodLabel: document.getElementById('rr-period-label').value,
    amount: Number(document.getElementById('rr-amount').value)
  };

  try {
    await apiPost('/dashboard/rent-records', body);
    showToast('DUE Rent record issued successfully', 'success');
    closeModal('modal-rent-record');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Maintenance CRUD
window.openAddMaintenanceModal = function() {
  document.getElementById('maint-id').value = '';
  document.getElementById('maint-title').value = '';
  document.getElementById('maint-desc').value = '';
  document.getElementById('maint-unit-id').value = '';
  document.getElementById('maint-priority').value = 'MEDIUM';
  document.getElementById('maint-cost').value = '';
  document.getElementById('maint-modal-title').textContent = 'Request Maintenance';
  openModal('modal-maintenance');
};

window.openEditMaintenanceModal = function(id) {
  const req = globalMaintenance.find(item => item.id === id);
  if (!req) return;
  document.getElementById('maint-id').value = req.id;
  document.getElementById('maint-title').value = req.title;
  document.getElementById('maint-desc').value = req.description || '';
  document.getElementById('maint-unit-id').value = req.unitId || '';
  document.getElementById('maint-priority').value = req.priority;
  document.getElementById('maint-cost').value = req.cost || '';
  document.getElementById('maint-modal-title').textContent = 'Edit Maintenance Request';
  openModal('modal-maintenance');
};

window.saveMaintenance = async function(e) {
  e.preventDefault();
  const id = document.getElementById('maint-id').value;
  const unitIdVal = document.getElementById('maint-unit-id').value;
  const costVal = document.getElementById('maint-cost').value;
  const body = {
    title: document.getElementById('maint-title').value,
    description: document.getElementById('maint-desc').value,
    unitId: unitIdVal ? unitIdVal : null,
    priority: document.getElementById('maint-priority').value,
    cost: costVal ? Number(costVal) : null
  };

  try {
    if (id) {
      await apiPut(`/dashboard/maintenance/${id}`, body);
      showToast('Maintenance request updated', 'success');
    } else {
      await apiPost('/dashboard/maintenance', body);
      showToast('Maintenance request logged', 'success');
    }
    closeModal('modal-maintenance');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteMaintenance = async function(id) {
  if (!confirm("Are you sure you want to delete this request?")) return;
  try {
    await apiDelete(`/dashboard/maintenance/${id}`);
    showToast('Request deleted', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Expenditures CRUD
window.openAddExpenditureModal = function() {
  document.getElementById('exp-id').value = '';
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-cost').value = '';
  document.getElementById('exp-modal-title').textContent = 'Log Expenditure';
  openModal('modal-expenditure');
};

window.openEditExpenditureModal = function(id) {
  const e = globalExpenditures.find(item => item.id === id);
  if (!e) return;
  document.getElementById('exp-id').value = e.id;
  document.getElementById('exp-name').value = e.name;
  document.getElementById('exp-cost').value = e.cost;
  document.getElementById('exp-modal-title').textContent = 'Edit Expenditure';
  openModal('modal-expenditure');
};

window.saveExpenditure = async function(e) {
  e.preventDefault();
  const id = document.getElementById('exp-id').value;
  const body = {
    name: document.getElementById('exp-name').value,
    cost: Number(document.getElementById('exp-cost').value)
  };

  try {
    if (id) {
      await apiPut(`/dashboard/expenditures/${id}`, body);
      showToast('Expenditure updated', 'success');
    } else {
      await apiPost('/dashboard/expenditures', body);
      showToast('Expenditure logged successfully', 'success');
    }
    closeModal('modal-expenditure');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteExpenditure = async function(id) {
  if (!confirm("Are you sure you want to delete this log?")) return;
  try {
    await apiDelete(`/dashboard/expenditures/${id}`);
    showToast('Expenditure log deleted', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// Announcements Notepad CRUD
window.openAddAnnouncementModal = function() {
  document.getElementById('ann-text').value = '';
  openModal('modal-announcement');
};

window.saveAnnouncement = async function(e) {
  e.preventDefault();
  const body = {
    text: document.getElementById('ann-text').value
  };

  try {
    await apiPost('/dashboard/announcements', body);
    showToast('Reminder added', 'success');
    closeModal('modal-announcement');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

window.deleteAnnouncement = async function(id) {
  if (!confirm("Are you sure you want to delete this reminder note?")) return;
  try {
    await apiDelete(`/dashboard/announcements/${id}`);
    showToast('Reminder deleted', 'success');
    loadDashboardData();
  } catch (err) {
    console.error(err);
  }
};

// ─── SETUP WIZARD (FIRST TIME EXPERIENCE) ───────────────────

function showSetupWizard() {
  const wizard = document.getElementById('setup-wizard-overlay');
  if (wizard) {
    wizard.classList.remove('hidden');
    goToWizardStep(1);
  }
}

function hideSetupWizard() {
  const wizard = document.getElementById('setup-wizard-overlay');
  if (wizard) {
    wizard.classList.add('hidden');
  }
}

window.goToWizardStep = function(step) {
  wizardStep = step;
  
  // Update step indicators styling
  document.getElementById('indicator-step1').className = step === 1 ? 'text-primary border-b-2 border-primary pb-2 font-bold' : 'pb-2 font-bold text-gray-400';
  document.getElementById('indicator-step2').className = step === 2 ? 'text-primary border-b-2 border-primary pb-2 font-bold' : 'pb-2 font-bold text-gray-400';
  document.getElementById('indicator-step3').className = step === 3 ? 'text-primary border-b-2 border-primary pb-2 font-bold' : 'pb-2 font-bold text-gray-400';

  // Toggle visible step container
  document.getElementById('wizard-step1').classList.toggle('hidden', step !== 1);
  document.getElementById('wizard-step2').classList.toggle('hidden', step !== 2);
  document.getElementById('wizard-step3').classList.toggle('hidden', step !== 3);

  if (step === 2) {
    generateWizardUnitsForm();
  } else if (step === 3) {
    generateWizardTenantsForm();
  }
};

function generateWizardUnitsForm() {
  const container = document.getElementById('wizard-units-list');
  const count = parseInt(document.getElementById('wizard-units-count').value) || 1;
  let html = '';

  for (let i = 1; i <= count; i++) {
    html += `
      <div class="pt-4 first:pt-0">
        <h4 class="font-bold text-sm text-gray-800 mb-2">Unit #${i}</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">Unit Name *</label>
            <input type="text" id="wiz-unit-name-${i}" placeholder="e.g. Apt 1A" required class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">Rent Amount (BDT) *</label>
            <input type="number" id="wiz-unit-rent-${i}" required class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">Rent Period</label>
            <select id="wiz-unit-period-${i}" class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
              <option value="DAILY">Daily</option>
              <option value="MONTHLY" selected>Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">Collection Day</label>
            <input type="number" id="wiz-unit-collection-${i}" min="1" max="31" value="1" class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
          </div>
        </div>
        <div class="mt-2 flex items-center">
          <input type="checkbox" id="wiz-unit-occupied-${i}" class="mr-2 rounded text-primary focus:ring-primary">
          <label for="wiz-unit-occupied-${i}" class="text-xs text-gray-600 font-semibold">Has tenant assigned immediately?</label>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function generateWizardTenantsForm() {
  const container = document.getElementById('wizard-tenants-list');
  const count = parseInt(document.getElementById('wizard-units-count').value) || 1;
  let html = '';
  let occupiedCount = 0;

  for (let i = 1; i <= count; i++) {
    const isOccupied = document.getElementById(`wiz-unit-occupied-${i}`).checked;
    if (isOccupied) {
      occupiedCount++;
      const unitName = document.getElementById(`wiz-unit-name-${i}`).value || `Unit #${i}`;
      html += `
        <div class="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <h4 class="font-bold text-sm text-gray-800 mb-3">Tenant Details for ${unitName}</h4>
          <input type="hidden" id="wiz-tenant-unit-idx-${occupiedCount}" value="${i}">
          <div class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-gray-500 mb-1">Tenant Name *</label>
              <input type="text" id="wiz-tenant-name-${occupiedCount}" required placeholder="e.g. John Doe" class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 mb-1">WhatsApp Number *</label>
              <input type="text" id="wiz-tenant-whatsapp-${occupiedCount}" required placeholder="e.g. +88017..." class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-gray-500 mb-1">Tenancy Start Date *</label>
              <input type="date" id="wiz-tenant-start-${occupiedCount}" required class="w-full px-3 py-1.5 border rounded-lg focus:border-primary text-xs outline-none">
            </div>
          </div>
        </div>
      `;
    }
  }

  if (occupiedCount === 0) {
    container.innerHTML = `<div class="text-center py-6 text-gray-500 text-sm">All units are marked as vacant. Click finish to save configuration.</div>`;
  } else {
    container.innerHTML = html;
  }
}

window.handleWizardSubmit = async function(e) {
  e.preventDefault();
  
  try {
    // 1. Create Property
    const propName = document.getElementById('wizard-prop-name').value;
    const propLoc = document.getElementById('wizard-prop-location').value;
    const propType = document.getElementById('wizard-prop-type').value;

    const propRes = await apiPost('/dashboard/properties', {
      name: propName,
      location: propLoc,
      type: propType
    });

    const propertyId = propRes.data.id;
    const totalUnitsCount = parseInt(document.getElementById('wizard-units-count').value) || 1;
    
    // Step indicator & progress toast
    showToast("Creating units and tenancy leases...", "info");

    let tenantFormIndex = 1;

    for (let i = 1; i <= totalUnitsCount; i++) {
      const uName = document.getElementById(`wiz-unit-name-${i}`).value;
      const uRent = Number(document.getElementById(`wiz-unit-rent-${i}`).value);
      const uPeriod = document.getElementById(`wiz-unit-period-${i}`).value;
      const uCollection = Number(document.getElementById(`wiz-unit-collection-${i}`).value);
      const isOccupied = document.getElementById(`wiz-unit-occupied-${i}`).checked;

      // 2. Create Unit
      const unitRes = await apiPost('/dashboard/units', {
        propertyId: propertyId,
        name: uName,
        rentAmount: uRent,
        rentPeriod: uPeriod,
        collectionDay: uCollection
      });

      const unitId = unitRes.data.id;

      // 3. Create Lease if Occupied
      if (isOccupied) {
        const tName = document.getElementById(`wiz-tenant-name-${tenantFormIndex}`).value;
        const tWhatsapp = document.getElementById(`wiz-tenant-whatsapp-${tenantFormIndex}`).value;
        const tStart = document.getElementById(`wiz-tenant-start-${tenantFormIndex}`).value;

        const leaseRes = await apiPost('/dashboard/leases', {
          unitId: unitId,
          tenantName: tName,
          whatsappNumber: tWhatsapp,
          startDate: tStart
        });

        // Issue initial month DUE record
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthLabel = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
        await apiPost('/dashboard/rent-records', {
          leaseId: leaseRes.data.id,
          periodLabel: currentMonthLabel,
          amount: uRent
        });

        tenantFormIndex++;
      }
    }

    showToast("Property setup completed successfully!", "success");
    hideSetupWizard();
    loadDashboardData();

  } catch (err) {
    console.error("Wizard setup failed:", err);
    showToast("An error occurred during wizard setup. Please check details and try again.", "error");
  }
};

// ─── GENERAL UI MODAL HELPERS ───────────────────────────────

window.openModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.remove('hidden');
    // For accessibility
    el.setAttribute('aria-hidden', 'false');
  }
};

window.closeModal = function(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }
};
