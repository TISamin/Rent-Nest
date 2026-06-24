// RentNest Landlord Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  // Initialize data
  initDashboard();
});

// Mock States with LocalStorage Persistence
let leases = JSON.parse(localStorage.getItem('rentnest_dashboard_leases')) || [
  { id: 1, tenant: 'John Doe', property: 'Apartment 4B, Agrabad', start: '2025-01-01', end: '2026-01-01', rent: 1200, status: 'ACTIVE' },
  { id: 2, tenant: 'Jane Smith', property: 'Studio 2A, GEC Circle', start: '2025-03-15', end: '2026-03-15', rent: 850, status: 'ACTIVE' },
  { id: 3, tenant: 'Mike Johnson', property: 'Penthouse 1, Halishahar', start: '2024-05-01', end: '2025-05-01', rent: 2500, status: 'ENDED' },
  { id: 4, tenant: 'Sarah Williams', property: 'Flat 3C, Nasirabad', start: '2025-02-01', end: '2026-02-01', rent: 1100, status: 'OVERDUE' },
  { id: 5, tenant: 'David Brown', property: 'Duplex B, Khulshi', start: '2025-06-01', end: '2026-06-01', rent: 3200, status: 'ACTIVE' }
];

let requests = JSON.parse(localStorage.getItem('rentnest_dashboard_requests')) || [
  { id: 'req-1', title: 'Leaking pipe under kitchen sink', property: 'Apartment 4B, Agrabad', priority: 'HIGH', status: 'open', date: '2026-06-22' },
  { id: 'req-2', title: 'AC compressor not cooling', property: 'Studio 2A, GEC Circle', priority: 'HIGH', status: 'open', date: '2026-06-23' },
  { id: 'req-3', title: 'Broken door handle on balcony', property: 'Flat 3C, Nasirabad', priority: 'MEDIUM', status: 'progress', date: '2026-06-20' },
  { id: 'req-4', title: 'Light fixture replacement', property: 'Duplex B, Khulshi', priority: 'LOW', status: 'resolved', date: '2026-06-18' }
];

let sortColumn = 'tenant';
let sortDirection = 'asc';

function saveState() {
  localStorage.setItem('rentnest_dashboard_leases', JSON.stringify(leases));
  localStorage.setItem('rentnest_dashboard_requests', JSON.stringify(requests));
}

function initDashboard() {
  // Stats updates
  updateStats();

  // Initialize Recharts via React
  initChart();

  // Populate leases table
  renderLeases();

  // Setup lease search listener
  const searchInput = document.getElementById('lease-search');
  if (searchInput) {
    searchInput.addEventListener('input', renderLeases);
  }

  // Populate Kanban
  renderKanban();
}

function updateStats() {
  // Total Rent Earnings Calculator
  const totalRent = leases
    .filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    .reduce((sum, l) => sum + l.rent, 0);
  document.getElementById('stat-earnings').textContent = `$${totalRent + 10450}`; // Offset with mock history

  // Count active tenants
  const activeTenants = leases.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
  document.getElementById('stat-tenants').textContent = activeTenants;

  // Count open maintenance requests
  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'progress').length;
  document.getElementById('stat-maintenance').textContent = openRequests;
}

// React + Recharts CDN integration
function initChart() {
  const container = document.getElementById('rent-chart-root');
  if (!container || typeof Recharts === 'undefined' || typeof React === 'undefined') return;

  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;

  const chartData = [
    { name: 'Jan', Rent: 9800, Fees: 600 },
    { name: 'Feb', Rent: 10400, Fees: 500 },
    { name: 'Mar', Rent: 11200, Fees: 750 },
    { name: 'Apr', Rent: 11500, Fees: 800 },
    { name: 'May', Rent: 12100, Fees: 650 },
    { name: 'Jun', Rent: 12450, Fees: 900 }
  ];

  function RentChart() {
    return React.createElement(
      ResponsiveContainer,
      { width: '100%', height: '100%' },
      React.createElement(
        BarChart,
        { data: chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 } },
        React.createElement(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#F3F4F6' }),
        React.createElement(XAxis, { dataKey: 'name', axisLine: false, tickLine: false, stroke: '#9CA3AF', fontSize: 11 }),
        React.createElement(YAxis, { axisLine: false, tickLine: false, stroke: '#9CA3AF', fontSize: 11, tickFormatter: (v) => `$${v}` }),
        React.createElement(Tooltip, { 
          contentStyle: { background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
          formatter: (v) => [`$${v}`, 'Collected'] 
        }),
        React.createElement(Legend, { iconType: 'circle', wrapperStyle: { fontSize: 11, paddingTop: 10 } }),
        React.createElement(Bar, { dataKey: 'Rent', fill: '#FF385C', radius: [4, 4, 0, 0], barSize: 20 }),
        React.createElement(Bar, { dataKey: 'Fees', fill: '#3B82F6', radius: [4, 4, 0, 0], barSize: 20 })
      )
    );
  }

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(RentChart));
}

// Leases rendering & sorting
window.sortLeases = function(col) {
  if (sortColumn === col) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = col;
    sortDirection = 'asc';
  }

  // Update visual indicators
  ['tenant', 'property', 'rent', 'status'].forEach(c => {
    const icon = document.getElementById(`sort-icon-${c}`);
    if (icon) icon.textContent = '';
  });

  const activeIcon = document.getElementById(`sort-icon-${col}`);
  if (activeIcon) {
    activeIcon.textContent = sortDirection === 'asc' ? '↑' : '↓';
  }

  renderLeases();
};

function renderLeases() {
  const tbody = document.getElementById('lease-table-body');
  const searchVal = (document.getElementById('lease-search')?.value || '').toLowerCase();
  
  if (!tbody) return;

  // Filter
  let filtered = leases.filter(l => 
    l.tenant.toLowerCase().includes(searchVal) || 
    l.property.toLowerCase().includes(searchVal)
  );

  // Sort
  filtered.sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (sortColumn === 'rent') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = filtered.map(l => {
    const statusClasses = {
      ACTIVE: 'bg-emerald-50 text-emerald-600',
      OVERDUE: 'bg-rose-50 text-primary font-semibold',
      ENDED: 'bg-gray-100 text-gray-500'
    };

    return `
      <tr class="hover:bg-gray-50/50 transition-colors">
        <td class="p-4 font-semibold text-gray-800">${l.tenant}</td>
        <td class="p-4 text-gray-600">${l.property}</td>
        <td class="p-4 text-gray-500">${l.start}</td>
        <td class="p-4 text-gray-500">${l.end}</td>
        <td class="p-4 font-bold text-gray-900">$${l.rent}</td>
        <td class="p-4">
          <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[l.status] || ''}">
            ${l.status}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// Kanban drag-and-drop implementation
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

window.handleDrop = function(ev, status) {
  ev.preventDefault();
  const col = ev.target.closest('[ondrop]');
  if (col) col.classList.remove('kanban-col-active');

  const id = ev.dataTransfer.getData("text/plain");
  const requestItem = requests.find(r => r.id === id);
  
  if (requestItem && requestItem.status !== status) {
    requestItem.status = status;
    saveState();
    updateStats();
    renderKanban();
    showToast(`Request marked as ${status.replace('-', ' ')}`, 'success');
  }
};

function renderKanban() {
  const columns = {
    open: document.getElementById('col-open'),
    progress: document.getElementById('col-progress'),
    resolved: document.getElementById('col-resolved')
  };

  const countElements = {
    open: document.getElementById('count-open'),
    progress: document.getElementById('count-progress'),
    resolved: document.getElementById('count-resolved')
  };

  // Clear columns
  Object.values(columns).forEach(col => {
    if (col) col.innerHTML = '';
  });

  const priorityClasses = {
    HIGH: 'bg-rose-50 text-primary border-rose-100',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  const counts = { open: 0, progress: 0, resolved: 0 };

  requests.forEach(req => {
    const colEl = columns[req.status];
    if (!colEl) return;

    counts[req.status]++;

    const card = document.createElement('div');
    card.id = req.id;
    card.className = 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm kanban-card flex flex-col justify-between hover:shadow-md transition-shadow';
    card.draggable = true;
    card.setAttribute('ondragstart', 'drag(event)');
    card.setAttribute('ondragend', 'dragEnd(event)');

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border rounded ${priorityClasses[req.priority] || ''}">
            ${req.priority}
          </span>
          <span class="text-[10px] text-gray-400 font-medium">${req.date}</span>
        </div>
        <h4 class="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">${req.title}</h4>
        <p class="text-xs text-gray-400 flex items-center">
          <span class="mr-1">📍</span> ${req.property}
        </p>
      </div>
    `;

    colEl.appendChild(card);
  });

  // Update column counters
  Object.keys(countElements).forEach(key => {
    if (countElements[key]) {
      countElements[key].textContent = counts[key];
    }
  });
}
