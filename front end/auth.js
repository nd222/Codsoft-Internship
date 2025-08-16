document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const navButtons = document.querySelector(".nav-buttons");

  // ✅ Check login state on every page
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser && navButtons) {
    navButtons.innerHTML = `
      <span class="welcome-user">👋 ${loggedInUser}</span>
      <button id="logoutBtn" class="btn-logout">Logout</button>
    `;

    // Attach logout event
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "index.html"; // Reload to reset UI
    });
  }

  // ✅ Handle Signup
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

      if (!username || !password) {
        alert("Please fill all fields.");
        return;
      }

      if (localStorage.getItem(username)) {
        alert("Username already exists!");
      } else {
        localStorage.setItem(username, password);
        alert("Signup successful! Please login.");
        window.location.href = "login.html";
      }
    });
  }

  // ✅ Handle Login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      const storedPassword = localStorage.getItem(username);
      if (storedPassword && storedPassword === password) {
        localStorage.setItem("loggedInUser", username); // Save login state
        alert("Login successful!");
        window.location.href = "index.html";
      } else {
        alert("Invalid username or password.");
      }
    });
  }
});
