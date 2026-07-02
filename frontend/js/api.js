// Auto-detect: use local backend when running locally or opened from local files, Render backend when deployed
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '' || window.location.protocol === 'file:')
  ? 'http://localhost:8080/api'
  : 'https://rent-nest-wntm.onrender.com/api';

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
    
    // Handle 401/403 globally by redirecting to login.html or banned.html
    if (response.status === 401 || response.status === 403) {
      let resultText = "";
      try {
        resultText = await response.text();
      } catch (e) {}

      let isBanned = false;
      let banReason = "No reason provided";

      if (resultText) {
        try {
          const resObj = JSON.parse(resultText);
          if (resObj.message && resObj.message.startsWith("Account banned:")) {
            isBanned = true;
            banReason = resObj.message.replace("Account banned: ", "").trim();
          }
        } catch(e) {}
      }

      if (isBanned) {
        console.warn("Account is banned. Redirecting to banned.html...");
        localStorage.removeItem('rentnest_token');
        localStorage.removeItem('rentnest_user');
        if (!window.location.pathname.endsWith('banned.html')) {
          window.location.href = `banned.html?reason=${encodeURIComponent(banReason)}`;
        }
        throw new Error("Account banned.");
      } else {
        const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('signup.html');
        
        if (!isAuthPage) {
          console.warn("Session expired or unauthorized. Redirecting to login...");
          logout();
          throw new Error("Unauthorized. Redirecting to login...");
        } else {
          // If already on login page, just parse the backend error and throw it so the UI can show a toast
          let errorMsg = "Invalid email or password.";
          if (resultText) {
            try {
              const resObj = JSON.parse(resultText);
              if (resObj.message) errorMsg = resObj.message;
            } catch(e) {}
          }
          throw new Error(errorMsg);
        }
      }
    }

    let text = "";
    try {
      text = await response.text();
    } catch (e) {
      // Ignore text read error
    }

    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Server Error (${response.status}): Could not parse response.`);
      }
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      throw new Error(result.message || `Server Error (${response.status})`);
    }

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
 * Display premium dynamic toast notifications with Tailwind and style.css class styling.
 * @param {string} message 
 * @param {'success'|'error'|'info'|'warning'} type 
 */
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
    <button class="text-gray-400 hover:text-gray-600 focus:outline-none text-lg">&times;</button>
  `;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);

  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('button').addEventListener('click', dismiss);
  setTimeout(dismiss, 3000);
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
        if (userObj) {
          const hasPassword = userObj.passwordSet === true || userObj.isPasswordSet === true;
          if (!hasPassword) {
            window.location.href = 'set-password.html';
          }
        }
      } catch (e) {
        console.error("Error checking password config:", e);
      }
    }
  }
});
