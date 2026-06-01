const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Perform an HTTP fetch request against the RentNest backend API.
 * Automatically injects the JWT auth header if it exists.
 */
async function apiRequest(method, path, body = null) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized globally by redirecting to login.html
    if (response.status === 401) {
      console.warn("Session expired or unauthorized. Redirecting to login...");
      logout();
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'login.html';
      }
      throw new Error("Unauthorized. Redirecting to login...");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API Error (${method} ${path}):`, error);
    showToast(error.message || "A network error occurred. Please try again.", "error");
    throw error;
  }
}

function apiGet(path) {
  return apiRequest('GET', path);
}

function apiPost(path, body) {
  return apiRequest('POST', path, body);
}

function apiPut(path, body) {
  return apiRequest('PUT', path, body);
}

function apiDelete(path) {
  return apiRequest('DELETE', path);
}

function getAuthHeaders() {
  const token = localStorage.getItem('rentnest_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

function isAuthenticated() {
  const token = localStorage.getItem('rentnest_token');
  return !!token;
}

function logout() {
  localStorage.removeItem('rentnest_token');
  localStorage.removeItem('rentnest_user');
  if (!window.location.pathname.endsWith('index.html')) {
    window.location.href = 'index.html';
  } else {
    window.location.reload();
  }
}

/**
 * Display premium dynamic toast notifications.
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
function showToast(message, type = 'info') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-up`;
  
  // Custom SVG Icons for each type
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
  }

  toast.innerHTML = `
    <span class="toast-icon">${iconSvg}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close-btn">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Close event listener
  toast.querySelector('.toast-close-btn').addEventListener('click', () => {
    toast.remove();
  });

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}
