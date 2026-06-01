// ============================================================
// RentNest Email OTP Authentication
// Uses backend OTP generation + EmailJS for delivery
// ============================================================

emailjs.init("Novly2bnLjG0RR2ZE");

let currentOtp = null;
let currentEmail = null;

/**
 * Request an OTP for the given email address.
 * 1. Calls backend to generate OTP
 * 2. Sends it to the user via EmailJS
 */
async function requestOtp(email) {
  try {
    const res = await apiPost('/auth/request-otp', { email });

    if (!res.success) {
      showToast(res.message || "Failed to generate OTP.", "error");
      return false;
    }

    // Store OTP and email for verification
    currentOtp = res.data.otp;
    currentEmail = email;

    // Send OTP to the user's email via EmailJS
    await emailjs.send("service_o9wjmag", "template_xrdy6ao", {
      to_name: email.split('@')[0],
      to_email: email,
      message: `Your RentNest verification code is: ${currentOtp}. This code expires in 5 minutes.`
    });

    showToast("Verification code sent to your email!", "success");
    return true;
  } catch (error) {
    console.error("requestOtp error:", error);
    showToast("Failed to send OTP: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

/**
 * Verify the OTP entered by the user.
 * On success, stores JWT and user data in localStorage and redirects.
 */
async function verifyOtp(email, otp) {
  try {
    const res = await apiPost('/auth/verify-otp', { email, otp });

    if (!res.success) {
      showToast(res.message || "Invalid verification code.", "error");
      return false;
    }

    // Store auth credentials
    localStorage.setItem('rentnest_token', res.data.token);
    localStorage.setItem('rentnest_user', JSON.stringify(res.data.user));

    showToast("Logged in successfully!", "success");

    // Redirect based on profile completion
    const user = res.data.user;
    if (!user.name) {
      showToast("Please complete your profile to continue.", "info");
      setTimeout(() => window.location.href = 'profile.html', 1500);
    } else {
      setTimeout(() => window.location.href = 'index.html', 1500);
    }

    return true;
  } catch (error) {
    console.error("verifyOtp error:", error);
    showToast("Verification failed: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

// Expose globally
window.requestOtp = requestOtp;
window.verifyOtp = verifyOtp;
