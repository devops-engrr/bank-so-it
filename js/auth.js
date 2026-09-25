(() => {
  "use strict";

  /* Bank SO IT theme */
  const initTheme = () => {
    const saved = localStorage.getItem("bankSoItTheme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved === "dark" || saved === "light" ? saved : system;
    document.documentElement.dataset.theme = initial;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "auth-theme-toggle";
    button.setAttribute("aria-label", "Switch theme");
    document.body.appendChild(button);

    const update = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      button.textContent = dark ? "☀ Light" : "🌙 Dark";
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    };

    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("bankSoItTheme", next);
      update();
    });

    update();
  };

  initTheme();

  const $ = (selector) => document.querySelector(selector);
  const client = () => window.bankSoItSupabase;

  const loginForm = $("#login-form");
  const signupForm = $("#signup-form");
  const verificationView = $("#verification-view");
  const resetView = $("#reset-view");
  const message = $("#global-message");

  const allowedExams = ["IBPS SO IT", "RRB SO IT", "SBI SO", "Other Bank SO"];

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
  }

  function clearMessage() {
    message.textContent = "";
    message.className = "message hidden";
  }

  function setError(id, text = "") {
    const el = document.querySelector(`[data-error-for="${id}"]`);
    if (el) el.textContent = text;
    const input = document.getElementById(id);
    if (input) input.classList.toggle("invalid", Boolean(text));
  }

  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach((el) => el.textContent = "");
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    const termsError = $("#terms-error");
    if (termsError) termsError.textContent = "";
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validName(name) {
    return /^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(name);
  }

  function passwordChecks(password) {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    };
  }

  function strongPassword(password) {
    const c = passwordChecks(password);
    return Object.values(c).every(Boolean);
  }

  function switchMode(mode) {
    clearMessage();
    clearErrors(loginForm);
    clearErrors(signupForm);
    verificationView.classList.add("hidden");
    resetView.classList.add("hidden");

    const login = mode === "login";
    loginForm.classList.toggle("hidden", !login);
    signupForm.classList.toggle("hidden", login);
    $("#login-tab").classList.toggle("active", login);
    $("#signup-tab").classList.toggle("active", !login);
    $("#login-tab").setAttribute("aria-selected", String(login));
    $("#signup-tab").setAttribute("aria-selected", String(!login));
  }

  function setLoading(button, loading, label) {
    button.disabled = loading;
    button.querySelector(".btn-label").textContent = loading ? "Please wait…" : label;
    button.querySelector(".spinner").classList.toggle("hidden", !loading);
  }

  function updateStrength() {
    const password = $("#signup-password").value;
    const c = passwordChecks(password);
    const score = Object.values(c).filter(Boolean).length;
    const bar = $("#strength-bar");
    const label = $("#strength-label");
    bar.style.width = `${score * 20}%`;
    label.textContent =
      !password ? "Use 8+ characters" :
      score < 3 ? "Weak password" :
      score < 5 ? "Almost there" : "Strong password";
  }

  async function ensureNotAlreadyLoggedIn() {
    const { data } = await client().auth.getSession();
    if (data.session) window.location.replace("dashboard.html");
  }

  $("#login-tab").addEventListener("click", () => switchMode("login"));
  $("#signup-tab").addEventListener("click", () => switchMode("signup"));

  // Open the requested authentication mode from links such as auth.html?mode=signup.
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  if (requestedMode === "signup" || requestedMode === "login") {
    switchMode(requestedMode);
  }
  $("#signup-password").addEventListener("input", updateStrength);

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    clearErrors(loginForm);

    const email = normalizeEmail($("#login-email").value);
    const password = $("#login-password").value;
    let valid = true;

    if (!email) { setError("login-email", "Email is required."); valid = false; }
    else if (!validEmail(email)) { setError("login-email", "Enter a valid email address."); valid = false; }

    if (!password) { setError("login-password", "Password is required."); valid = false; }

    if (!valid) return;

    const button = $("#login-submit");
    setLoading(button, true, "Login");

    try {
      const { data, error } = await client().auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("Login completed but no active session was created.");
      window.location.replace("dashboard.html");
    } catch (error) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        showMessage("Please verify your email before logging in. Check your inbox for the verification email from Supabase. If you do not see it, check your spam or junk folder.", "error");
      } else if (msg.includes("invalid login credentials")) {
        showMessage("Email or password is incorrect.", "error");
      } else {
        showMessage("We couldn't sign you in right now. Please try again.", "error");
        console.error(error);
      }
    } finally {
      setLoading(button, false, "Login");
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    clearErrors(signupForm);

    const name = $("#signup-name").value.trim().replace(/\s+/g, " ");
    const email = normalizeEmail($("#signup-email").value);
    const exam = $("#signup-exam").value;
    const password = $("#signup-password").value;
    const confirm = $("#signup-confirm").value;
    let valid = true;

    if (!name) { setError("signup-name", "Full name is required."); valid = false; }
    else if (!validName(name)) { setError("signup-name", "Enter a valid name (2–80 characters)."); valid = false; }

    if (!email) { setError("signup-email", "Email is required."); valid = false; }
    else if (!validEmail(email)) { setError("signup-email", "Enter a valid email address."); valid = false; }

    if (exam && !allowedExams.includes(exam)) {
      showMessage("Please select a valid exam preference.", "error");
      valid = false;
    }

    if (!password) { setError("signup-password", "Password is required."); valid = false; }
    else if (!strongPassword(password)) {
      setError("signup-password", "Use 8+ characters with uppercase, lowercase, number and symbol.");
      valid = false;
    }

    if (!confirm) { setError("signup-confirm", "Please confirm your password."); valid = false; }
    else if (password !== confirm) { setError("signup-confirm", "Passwords do not match."); valid = false; }

    if (!$("#terms").checked) {
      $("#terms-error").textContent = "Please accept this before creating an account.";
      valid = false;
    }

    if (!valid) return;

    const button = $("#signup-submit");
    setLoading(button, true, "Create account");

    try {
      const { data, error } = await client().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth.html`,
          data: {
            full_name: name,
            exam_preference: exam || null
          }
        }
      });

      if (error) throw error;

      // Supabase may return no session when email confirmation is required.
      if (data.session) {
        window.location.replace("dashboard.html");
        return;
      }

      $("#verification-email").textContent = email;
      loginForm.classList.add("hidden");
      signupForm.classList.add("hidden");
      verificationView.classList.remove("hidden");
      showMessage("Account created successfully. We sent a verification email from Supabase to your inbox. Please verify your email before logging in. If you do not see it, check your spam or junk folder.", "success");
    } catch (error) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        showMessage("This email is already registered. Please log in instead.", "error");
      } else if (msg.includes("rate limit")) {
        showMessage("Too many attempts. Please wait a while and try again.", "error");
      } else {
        showMessage("We couldn't create your account. Please check your details and try again.", "error");
        console.error(error);
      }
    } finally {
      setLoading(button, false, "Create account");
    }
  });

  $("#forgot-btn").addEventListener("click", () => {
    clearMessage();
    clearErrors(loginForm);
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    resetView.classList.remove("hidden");
    $("#reset-email").value = $("#login-email").value.trim();
    $("#reset-email").focus();
  });

  $("#reset-back").addEventListener("click", () => switchMode("login"));

  $("#reset-submit").addEventListener("click", async () => {
    const input = $("#reset-email");
    const email = normalizeEmail(input.value);
    setError("reset-email", "");

    if (!email) { setError("reset-email", "Email is required."); return; }
    if (!validEmail(email)) { setError("reset-email", "Enter a valid email address."); return; }

    const button = $("#reset-submit");
    setLoading(button, true, "Send reset link");

    try {
      const { error } = await client().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth.html?reset=1`
      });
      if (error) throw error;
      showMessage("If an account exists for that email, a password-reset link has been sent.", "success");
    } catch (error) {
      showMessage("We couldn't send the reset email right now. Please try again.", "error");
      console.error(error);
    } finally {
      setLoading(button, false, "Send reset link");
    }
  });

  $("#back-to-login").addEventListener("click", () => switchMode("login"));

  client().auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      window.location.replace("dashboard.html");
    }
  });

  ensureNotAlreadyLoggedIn();
})();
