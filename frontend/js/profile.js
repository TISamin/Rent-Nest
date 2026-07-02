document.addEventListener('DOMContentLoaded', () => {
  // Initialize EmailJS
  // ============================================================
  // EmailJS Security Notice — see auth.js for full details.
  // Allowed Origins and reCAPTCHA MUST be configured in the
  // EmailJS dashboard to prevent public key abuse.
  // ============================================================
  emailjs.init("Novly2bnLjG0RR2ZE");


  loadProfile();

  const profileForm = document.getElementById('profile-form');
  const photoInput = document.getElementById('photo-input');
  const saveBtn = document.getElementById('save-profile-btn');

  // Photo Upload to Cloudinary
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('avatar-preview').src = event.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Uploading photo...';
        showToast("Uploading profile photo...", "info");

        const cloudName = "du711ught";
        const uploadPreset = "bwuqyeyc";

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        // Timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Upload timed out (15s limit). Check your internet connection.")), 15000);
        });

        const uploadPromise = fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        })
        .then(async res => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Failed to upload to Cloudinary");
          }
          const data = await res.json();
          return data.secure_url;
        });
        
        const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
        
        document.getElementById('photo-url-hidden').value = downloadUrl;
        showToast("Photo uploaded successfully!", "success");
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        showToast("Failed to upload photo: " + error.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Profile';
      }
    });
  }

  // Handle Form Submission
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('profile-name').value.trim();
      const email = document.getElementById('profile-email').value.trim();
      const address = document.getElementById('profile-address').value.trim();
      const profilePhotoUrl = document.getElementById('photo-url-hidden').value;

      if (!name) {
        showToast("Name is required.", "warning");
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

        const payload = { name, email, address, profilePhotoUrl };
        const res = await apiPut('/users/profile', payload);

        if (res.success) {
          localStorage.setItem('rentnest_user', JSON.stringify(res.data));
          showToast("Profile updated successfully!", "success");

          // Send welcome / confirmation email using EmailJS
          try {
            await emailjs.send("service_o9wjmag", "template_xrdy6ao", {
              to_name: name,
              to_email: email,
              message: "Welcome to RentNest! Your profile details have been successfully configured and secured on our platform."
            });
            console.log("Welcome Email sent successfully.");
          } catch (emailError) {
            console.error("EmailJS sending error:", emailError);
          }

          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1500);
        } else {
          showToast(res.message || "Failed to update profile", "error");
        }
      } catch (error) {
        showToast("Error saving profile: " + error.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Profile';
      }
    });
  }
});

/**
 * Load profile details from API
 */
async function loadProfile() {
  if (!isAuthenticated()) {
    showToast("Please log in first.", "warning");
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await apiGet('/auth/me');
    if (res.success && res.data) {
      const user = res.data;

      // Set the readonly email display field
      const emailDisplay = document.getElementById('profile-email-display');
      if (emailDisplay) emailDisplay.value = user.email || '';

      if (user.name) document.getElementById('profile-name').value = user.name;
      if (user.email) document.getElementById('profile-email').value = user.email;
      if (user.address) document.getElementById('profile-address').value = user.address;
      
      if (user.profilePhotoUrl) {
        document.getElementById('avatar-preview').src = user.profilePhotoUrl;
        document.getElementById('photo-url-hidden').value = user.profilePhotoUrl;
      }
    }
  } catch (err) {
    console.error("Failed to load profile", err);
  }
}
