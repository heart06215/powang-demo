/* 澄明 · 主题切换(日/夜) —— 需在<head>最早引入，避免闪屏 */
(function () {
  const KEY = "powang-theme";
  let saved;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const theme = saved === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);

  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    updateButtons();
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: t } }));
  }

  /** Keep the visible label and accessible name synchronized on every page. @returns {void} */
  function updateButtons() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
      button.title = dark ? "切换浅色模式" : "切换深色模式";
      const label = button.querySelector(".txt");
      if (label) label.textContent = dark ? "浅色" : "深色";
    });
  }

  window.ThemeKit = {
    current: function () { return document.documentElement.getAttribute("data-theme"); },
    toggle: function () { apply(this.current() === "dark" ? "light" : "dark"); },
    chartColors: function () {
      const cs = getComputedStyle(document.documentElement);
      function v(n) { return cs.getPropertyValue(n).trim(); }
      return {
        ink: v("--ink"), paper: v("--paper"), surface: v("--surface"),
        muted: v("--muted"), grid: v("--grid"), line: v("--line"),
        blue: v("--blue"), cyan: v("--cyan"), violet: v("--violet"),
        pink: v("--pink"), yellow: v("--yellow"),
        praise: v("--cat-praise"), blame: v("--cat-blame"),
        shui: v("--cat-shui"), noise: v("--cat-noise"),
        feud: v("--cat-feud"), neutral: v("--cat-neutral")
      };
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    updateButtons();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () { window.ThemeKit.toggle(); });
    });
  });
})();
