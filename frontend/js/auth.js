let recaptchaVerifier = null;
let confirmationResult = null;

/**
 * Sets up the Firebase reCAPTCHA verifier widget.
 */
function setupRecaptcha() {
  if (recaptchaVerifier) return;
  
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved - will allow OTP send
      console.log("reCAPTCHA solved successfully.");
    },
    'expired-callback': () => {
      showToast("reCAPTCHA expired. Please try again.", "warning");
    }
  });
}

/**
 * Trigger sending SMS OTP using Firebase Authentication.
 */
async function sendOTP(phoneNumber) {
  try {
    setupRecaptcha();
    const appVerifier = recaptchaVerifier;
    
    // Trigger OTP sending
    confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
    showToast("OTP sent successfully to your phone!", "success");
    return true;
  } catch (error) {
    console.error("Error sending SMS OTP:", error);
    showToast("Failed to send OTP: " + error.message, "error");
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    throw error;
  }
}

/**
 * Confirm OTP token and log the user in on success.
 */
async function verifyOTP(code) {
  if (!confirmationResult) {
    showToast("No active OTP request found. Please send OTP first.", "error");
    return;
  }

  try {
    const result = await confirmationResult.confirm(code);
    const firebaseUser = result.user;
    
    // Obtain Firebase ID Token
    const firebaseIdToken = await firebaseUser.getIdToken();
    
    // Exchange for RentNest JWT App token
    await exchangeToken(firebaseIdToken);
    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    showToast("Invalid OTP code. Please try again.", "error");
    throw error;
  }
}

/**
 * Exchange Firebase ID token with local backend server for custom JWT
 */
async function exchangeToken(firebaseIdToken) {
  try {
    const res = await apiPost('/auth/verify-token', { idToken: firebaseIdToken });
    
    if (res.success && res.data) {
      localStorage.setItem('rentnest_token', res.data.token);
      localStorage.setItem('rentnest_user', JSON.stringify(res.data.user));
      
      showToast(res.message || "Logged in successfully!", "success");
      
      // Redirect based on whether profile is completed
      const user = res.data.user;
      if (!user.name || !user.email) {
        showToast("Please complete your profile to continue", "info");
        setTimeout(() => window.location.href = 'profile.html', 1500);
      } else {
        setTimeout(() => window.location.href = 'index.html', 1500);
      }
    } else {
      throw new Error(res.message || "Token exchange failed");
    }
  } catch (error) {
    console.error("Token exchange failed:", error);
    showToast("Authentication with local backend failed: " + error.message, "error");
    throw error;
  }
}

// Global exposure
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.exchangeToken = exchangeToken;
