// ============================================================
// RentNest Authentication Helper Module
// Supports password login, OTP signup, OTP password resets
// ============================================================

emailjs.init("Novly2bnLjG0RR2ZE");

let currentOtp = null;
let currentEmail = null;

/**
 * Standard Email and Password Login.
 */
async function loginWithPassword(email, password) {
  try {
    const res = await apiPost('/auth/login', { email, password });

    if (!res.success) {
      showToast(res.message || "Invalid credentials.", "error");
      return false;
    }

    localStorage.setItem('rentnest_token', res.data.token);
    localStorage.setItem('rentnest_user', JSON.stringify(res.data.user));

    showToast("Logged in successfully!", "success");

    // Redirect based on onboarding
    const user = res.data.user;
    if (!user.passwordSet) {
      setTimeout(() => window.location.href = 'set-password.html', 1000);
    } else if (!user.name) {
      showToast("Please complete your profile to continue.", "info");
      setTimeout(() => window.location.href = 'profile.html', 1500);
    } else {
      setTimeout(() => window.location.href = 'index.html', 1000);
    }
    return true;
  } catch (error) {
    console.error("loginWithPassword error:", error);
    showToast(error.message || "Login failed.", "error");
    return false;
  }
}

/**
 * Request OTP for Signup.
 */
async function requestSignupOtp(email) {
  try {
    const res = await apiPost('/auth/signup/request-otp', { email });

    if (!res.success) {
      showToast(res.message || "Failed to request signup OTP.", "error");
      return false;
    }

    currentOtp = res.data.otp;
    currentEmail = email;

    // Send OTP to the user's email via EmailJS
    await emailjs.send("service_o9wjmag", "template_xrdy6ao", {
      to_name: email.split('@')[0],
      to_email: email,
      message: `Your RentNest registration code is: ${currentOtp}. This code expires in 5 minutes.`
    });

    showToast("Verification code sent to your email!", "success");
    return true;
  } catch (error) {
    console.error("requestSignupOtp error:", error);
    showToast("Failed to request OTP: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

/**
 * Verify OTP for Signup and log in.
 */
async function verifySignupOtp(email, otp) {
  try {
    const res = await apiPost('/auth/signup/verify-otp', { email, otp });

    if (!res.success) {
      showToast(res.message || "Verification failed.", "error");
      return false;
    }

    localStorage.setItem('rentnest_token', res.data.token);
    localStorage.setItem('rentnest_user', JSON.stringify(res.data.user));

    showToast("Email verified successfully! Please set your password now.", "success");
    setTimeout(() => window.location.href = 'set-password.html', 1500);
    return true;
  } catch (error) {
    console.error("verifySignupOtp error:", error);
    showToast("Verification failed: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

/**
 * Request OTP for Forgot Password.
 */
async function requestForgotPasswordOtp(email) {
  try {
    const res = await apiPost('/auth/forgot-password/request-otp', { email });

    if (!res.success) {
      showToast(res.message || "No account found with this email.", "error");
      return false;
    }

    currentOtp = res.data.otp;
    currentEmail = email;

    // Send OTP to the user's email via EmailJS
    await emailjs.send("service_o9wjmag", "template_xrdy6ao", {
      to_name: email.split('@')[0],
      to_email: email,
      message: `Your RentNest password reset code is: ${currentOtp}. This code expires in 5 minutes.`
    });

    showToast("Verification code sent to your email!", "success");
    return true;
  } catch (error) {
    console.error("requestForgotPasswordOtp error:", error);
    showToast("Failed to request OTP: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

/**
 * Reset Forgot Password.
 */
async function resetForgotPassword(email, otp, password) {
  try {
    const res = await apiPost('/auth/forgot-password/reset', { email, otp, password });

    if (!res.success) {
      showToast(res.message || "Failed to reset password.", "error");
      return false;
    }

    showToast("Password reset successfully! You can now log in.", "success");
    setTimeout(() => window.location.href = 'login.html', 1500);
    return true;
  } catch (error) {
    console.error("resetForgotPassword error:", error);
    showToast("Password reset failed: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

/**
 * Set password for the currently logged-in user.
 */
async function setPassword(password) {
  try {
    const res = await apiPost('/auth/set-password', { password });

    if (!res.success) {
      showToast(res.message || "Failed to set password.", "error");
      return false;
    }

    // Update locally stored user data to reflect password has been set
    const localUser = localStorage.getItem('rentnest_user');
    if (localUser) {
      const user = JSON.parse(localUser);
      user.passwordSet = true;
      localStorage.setItem('rentnest_user', JSON.stringify(user));
    }

    showToast("Password configured successfully!", "success");

    // Redirect to profile setup if profile name is missing
    const user = res.data;
    if (user && !user.name) {
      showToast("Please complete your profile details.", "info");
      setTimeout(() => window.location.href = 'profile.html', 1500);
    } else {
      setTimeout(() => window.location.href = 'index.html', 1500);
    }
    return true;
  } catch (error) {
    console.error("setPassword error:", error);
    showToast("Failed to configure password: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

// Expose globally
window.loginWithPassword = loginWithPassword;
window.requestSignupOtp = requestSignupOtp;
window.verifySignupOtp = verifySignupOtp;
window.requestForgotPasswordOtp = requestForgotPasswordOtp;
window.resetForgotPassword = resetForgotPassword;
window.setPassword = setPassword;
