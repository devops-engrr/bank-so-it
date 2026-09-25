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

  const client = window.bankSoItSupabase;

  async function init() {
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      window.location.replace("auth.html");
      return;
    }

    const user = data.user;
    document.getElementById("user-email").textContent = user.email || "";

    const { data: profile } = await client
      .from("profiles")
      .select("full_name, exam_preference")
      .eq("id", user.id)
      .single();

    document.getElementById("user-name").textContent =
      profile?.full_name || user.user_metadata?.full_name || "Student";

    document.getElementById("user-exam").textContent =
      profile?.exam_preference || "Not set";
  }

  document.getElementById("logout-btn").addEventListener("click", async () => {
    const button = document.getElementById("logout-btn");
    button.disabled = true;
    button.textContent = "Logging out…";
    await client.auth.signOut();
    window.location.replace("auth.html");
  });

  init();
})();
