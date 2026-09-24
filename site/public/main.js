// Theme toggle. The initial class is set inline in <head>.
document.getElementById("theme").addEventListener("click", () => {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {}
});

// Package manager tabs swap the install command.
const cmd = document.querySelector("[data-cmd-text]");
const tabs = document.querySelectorAll("[data-cmd]");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    cmd.textContent = tab.dataset.cmd;
  });
});

document.querySelector("[data-copy]").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(cmd.textContent);
    btn.textContent = "Copied";
  } catch {
    btn.textContent = "Select to copy";
  }
  setTimeout(() => (btn.textContent = "Copy"), 1600);
});

// Latest published version from npm; the static value stays if this fails.
fetch("https://registry.npmjs.org/@anturno/branch/latest")
  .then((r) => (r.ok ? r.json() : null))
  .then((pkg) => {
    if (pkg?.version) document.getElementById("version").textContent = `v${pkg.version}`;
  })
  .catch(() => {});
