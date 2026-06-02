const API_BASE_URL = 'https://rent-nest-wntm.onrender.com/api';

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
 * Display premium dynamic toast notifications with Tailwind styling.
 * @param {string} message 
 * @param {'success'|'error'|'info'|'warning'} type 
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const colors = {
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500 bg-red-500/10 text-red-300',
    info: 'border-cyan-500 bg-cyan-500/10 text-cyan-300',
    warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
  };
  const toast = document.createElement('div');
  toast.className = `px-5 py-3 rounded-lg border backdrop-blur-xl shadow-lg flex items-center gap-3 animate-fade-in-up ${colors[type] || colors.info}`;
  toast.innerHTML = `<span class="flex-1">${message}</span><button class="opacity-60 hover:opacity-100 text-lg">&times;</button>`;
  container.appendChild(toast);
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  setTimeout(() => { if (toast.parentNode) { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); } }, 4000);
}

// Redirect logged-in users who have not set their password to set-password.html
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.includes('login') || 
                     path.includes('signup') || 
                     path.includes('forgot-password') || 
                     path.includes('set-password');
                     
  if (!isAuthPage && isAuthenticated()) {
    const localUser = localStorage.getItem('rentnest_user');
    if (localUser) {
      try {
        const userObj = JSON.parse(localUser);
        if (userObj && !userObj.passwordSet) {
          window.location.href = 'set-password.html';
        }
      } catch (e) {
        console.error("Error checking password config:", e);
      }
    }
  }
});
