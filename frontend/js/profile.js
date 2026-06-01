document.addEventListener('DOMContentLoaded', () => {
  // Initialize EmailJS
  emailjs.init("Novly2bnLjG0RR2ZE");

  loadProfile();

  const profileForm = document.getElementById('profile-form');
  const photoInput = document.getElementById('photo-input');
  const saveBtn = document.getElementById('save-profile-btn');

  // Photo Upload to Firebase Storage
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

      // Upload to Firebase Storage
      try {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Uploading photo...';
        showToast("Uploading profile photo...", "info");

        const userJson = localStorage.getItem('rentnest_user');
        const user = userJson ? JSON.parse(userJson) : { id: 'anonymous' };
        const storageRef = storage.ref(`users/${user.id}/${Date.now()}_${file.name}`);
        
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        
        document.getElementById('photo-url-hidden').value = downloadUrl;
        showToast("Photo uploaded successfully!", "success");
      } catch (error) {
        console.error("Firebase Storage Upload Error:", error);
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
