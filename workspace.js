/* One navigation and mobile keyboard contract for every research page. */
(() => {
  "use strict";
  const home = document.body.dataset.researchPage === "home";
  const page = home ? "overview" : document.body.dataset.researchPage || "insight";
  const pageNames = { overview: "治理总览", workbench: "数据与复核", comments: "评论证据库", label: "人工标注与复核", insight: "社区深度洞察" };
  const icons = {
    overview: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    economy: '<path d="M4 3v17h17M8 14l4-5 4 2 5-7"/>',
    efficiency: '<rect x="4" y="3" width="16" height="18"/><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2"/>',
    news: '<path d="M4 3h16v18H4ZM8 7h8M8 11h8M8 15h8"/>',
    ambiguity: '<path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 18h.01"/><circle cx="12" cy="12" r="10"/>',
    governance: '<path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6Z"/><path d="m8 11 3 3 5-6"/>',
    policy: '<path d="M12 5v16M3 4c4-1 6-1 9 1 3-2 5-2 9-1v15c-4-1-6-1-9 1-3-2-5-2-9-1Z"/>',
    assistant: '<path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0Z"/><path d="M7 9h10M7 13h6"/>',
    insight: '<path d="M4 4v16h17M8 16v-5m5 5V7m5 9v-8"/>',
    graph: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>',
    comments: '<path d="M4 4h16v13H9l-5 4Z"/><path d="M8 8h8M8 12h6"/>',
    label: '<rect x="4" y="3" width="16" height="18"/><path d="m8 11 3 3 5-6"/>'
  };
  icons.evaluation = icons.insight;
  icons.workbench = icons.overview;
  const research = [
    ["overview", "治理总览", home ? "#overview" : "/"],
    ["ambiguity", "圈层黑话难判", home ? "#ambiguity" : "/#ambiguity"],
    ["policy", "立法与取证难点", home ? "#policy" : "/#policy"],
    ["efficiency", "标注成本与方案", home ? "#efficiency" : "/#efficiency"],
    ["governance", "分类结果与复核", home ? "#governance" : "/#governance"],
    ["economy", "数字经济规模", home ? "#economy" : "/#economy"],
    ["news", "典型事件与项目作用", home ? "#news" : "/#news"],
    ["assistant", "查询圈层语境", home ? "#assistant" : "/#assistant"]
  ];
  const tools = [
    ["workbench", "数据与复核总览", "/workbench"],
    ["insight", "社区深度洞察", "/insight"],
    ["graph", "评论关系图谱", "/insight#graphFull"],
    ["evaluation", "模型测试与微调报告", "/insight#evaluation"],
    ["comments", "评论证据库", "/comments"],
    ["label", "人工标注与复核", "/label"]
  ];
  /** @param {string} key @returns {string} */
  function icon(key) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]}</svg>`; }
  /** @param {string[][]} items @returns {string} */
  function links(items) {
    return items.map(([key, label, href]) => `<a href="${href}" data-nav-key="${key}">${icon(key)}<span>${label}</span><span class="nav-dot" aria-hidden="true"></span></a>`).join("");
  }
  const navigation = document.getElementById("workspaceNav");
  const topbar = document.getElementById("workspaceTopbar");
  if (!navigation || !topbar) return;
  navigation.innerHTML = `<aside class="app-sidebar" id="sidebar" aria-label="工作空间导航">
    <div class="sidebar-brand-row"><a class="app-brand" href="/powang-demo/index.html" aria-label="澄明，治理总览"><img src="/powang-demo/mark.svg" alt="" width="38" height="38"><span><strong>澄明</strong><small>网络生态治理研究平台</small></span></a><button class="sidebar-close" id="sidebarClose" type="button" aria-label="关闭导航">×</button></div>
    <div class="sidebar-label">研究工作空间 <span>RESEARCH</span></div><nav class="side-nav" aria-label="研究导航">${links(research)}</nav>
    <details class="workbench-navigation" id="workbenchNavigation" ${home ? "" : "open"}><summary class="sidebar-label">数据与复核 <span>WORKBENCH</span><span class="nav-chevron" aria-hidden="true">⌄</span></summary><nav class="side-nav" aria-label="数据与复核">${links(tools)}</nav></details>
    <div class="sidebar-foot"><span class="status-dot"></span><span>让治理有据可依</span><span class="mono">V3.0</span></div>
  </aside><button class="sidebar-scrim" id="sidebarScrim" aria-label="关闭导航" type="button" tabindex="-1" hidden></button>`;
  topbar.innerHTML = `<div class="topbar-location"><button class="icon-button menu-button" id="menuToggle" type="button" aria-label="打开导航" aria-controls="sidebar" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><span>澄明工作台</span><span class="breadcrumb-sep">/</span><strong>${pageNames[page]}</strong></div><div class="topbar-actions"><span class="connection-state" ${home ? 'id="connectionState" role="status"' : ""}><span class="status-dot"></span>${home ? "正在连接数据" : "本地研究模式"}</span><button class="theme-toggle" data-theme-toggle type="button"><span class="ico"></span><span class="txt">深色</span></button></div>`;

  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menuToggle");
  const scrim = document.getElementById("sidebarScrim");
  const mobile = window.matchMedia("(max-width: 767px)");
  /** @param {string} key @returns {void} */
  function markActive(key) {
    sidebar.querySelectorAll("[data-nav-key]").forEach((link) => {
      const active = link.dataset.navKey === key;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", home ? "location" : "page");
      else link.removeAttribute("aria-current");
    });
  }
  /** @param {boolean} open @returns {void} */
  function setMenu(open) {
    const expanded = mobile.matches && open;
    sidebar.classList.toggle("is-open", expanded);
    sidebar.inert = mobile.matches && !expanded;
    scrim.hidden = !expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
    document.querySelector(".app-workspace").inert = expanded;
    document.body.style.overflow = expanded ? "hidden" : "";
    if (expanded) document.getElementById("sidebarClose").focus();
    else if (mobile.matches) toggle.focus();
  }
  markActive(!home && location.hash === "#graphFull" ? "graph" : !home && location.hash === "#evaluation" ? "evaluation" : page);
  sidebar.inert = mobile.matches;
  toggle.addEventListener("click", () => setMenu(true));
  scrim.addEventListener("click", () => setMenu(false));
  document.getElementById("sidebarClose").addEventListener("click", () => setMenu(false));
  sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", (event) => {
    if (mobile.matches && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      // Closing the drawer makes this link inert; explicitly complete its navigation.
      event.preventDefault();
      const destination = link.href;
      setMenu(false);
      location.assign(destination);
    }
    if (home && link.hash) markActive(link.dataset.navKey);
  }));
  document.addEventListener("keydown", (event) => {
    if (!sidebar.classList.contains("is-open")) return;
    if (event.key === "Escape") { event.preventDefault(); setMenu(false); }
    if (event.key === "Tab") {
      const controls = [...sidebar.querySelectorAll("a,button,summary")].filter((control) => control.getClientRects().length);
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
  });
  mobile.addEventListener("change", () => setMenu(false));
  window.addEventListener("hashchange", () => { if (!home && page === "insight") markActive(location.hash === "#graphFull" ? "graph" : location.hash === "#evaluation" ? "evaluation" : "insight"); });
  if (home) {
    const sections = research.map(([id]) => document.getElementById(id));
    let scheduled = false;
    /** @returns {void} */
    function trackSection() {
      const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const current = atPageEnd ? sections.at(-1) : [...sections].reverse().find((section) => section.getBoundingClientRect().top <= 150) || sections[0];
      markActive(current.id); scheduled = false;
    }
    window.addEventListener("scroll", () => { if (!scheduled) { scheduled = true; requestAnimationFrame(trackSection); } }, { passive: true });
    trackSection();
  }
})();
