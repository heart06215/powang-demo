/* Local, dependency-free cursor choreography for the competition homepage. */
(() => {
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  if (!motion.matches || !("IntersectionObserver" in window)) return;

  const compact = window.matchMedia("(max-width: 767px)");
  const overlay = document.createElement("div");
  overlay.className = "swarm-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.append(overlay);

  const cursor = document.createElement("span");
  cursor.className = "swarm-pointer";
  cursor.innerHTML = '<svg viewBox="0 0 28 32"><path d="M3 2 24 19 14 20 10 29Z"/></svg>';

  const colors = ["blue", "pink", "cyan", "yellow"];
  const sectionColor = new Map();
  const tasks = new Set();
  const queue = [];
  const entering = new Map();
  const timers = new Set();
  let frame = 0;
  let colorSeed = 0;
  const maxTasks = compact.matches ? 2 : 5;

  /** @param {Element} element @returns {Element} */
  function sectionOf(element) {
    return element.closest("section") || document.body;
  }

  /** @param {Element} element @returns {string} */
  function colorFor(element) {
    const section = sectionOf(element);
    if (!sectionColor.has(section)) {
      sectionColor.set(section, `var(--${colors[colorSeed % colors.length]})`);
      colorSeed += 1;
    }
    return sectionColor.get(section);
  }

  /** @param {HTMLElement} element @returns {void} */
  function finish(element) {
    element.classList.remove("swarm-build");
    element.style.removeProperty("--swarm-progress");
    element.style.removeProperty("--swarm-remainder");
    entering.delete(element);
  }

  /** @returns {void} */
  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    queue.length = 0;
    for (const task of [...tasks]) drop(task);
    tasks.clear();
    overlay.replaceChildren();
    for (const element of entering.keys()) finish(element);
  }

  /** @param {object} task @returns {void} */
  function drop(task) {
    task.outline.remove();
    task.scan.remove();
    task.pointers.forEach((pointer) => pointer.remove());
    tasks.delete(task);
  }

  /** @param {object} task @returns {void} */
  function retire(task) {
    drop(task);
    pump();
  }

  /** @returns {void} */
  function pump() {
    while (tasks.size < maxTasks && queue.length) {
      const next = queue.shift();
      begin(next.element, next.start);
    }
  }

  /** @param {number} time @param {number} start @returns {number} */
  function progressAt(time, start) {
    const elapsed = Math.max(0, Math.min((time - start) / 620, 1));
    return 1 - Math.pow(1 - elapsed, 3);
  }

  /** @param {HTMLElement} element @param {number} start @returns {void} */
  function begin(element, start) {
    if (!element.isConnected) return;
    const rect = element.getBoundingClientRect();
    const outline = document.createElement("span");
    outline.className = "swarm-outline";
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;
    const color = colorFor(element);
    outline.style.setProperty("--swarm-color", color);
    const scan = document.createElement("span");
    scan.className = "swarm-scan";
    scan.style.setProperty("--swarm-color", color);
    outline.append(scan);
    const pointers = Array.from({ length: 1 }, () => {
      const pointer = cursor.cloneNode(true);
      pointer.style.setProperty("--swarm-color", color);
      return pointer;
    });
    overlay.append(outline, ...pointers);
    tasks.add({ element, outline, scan, pointers, start });
    if (!frame) frame = requestAnimationFrame(draw);
  }

  /** @param {number} time @returns {void} */
  function draw(time) {
    for (const [element, start] of entering) {
      const progress = progressAt(time, start);
      element.style.setProperty("--swarm-progress", String(progress));
      element.style.setProperty("--swarm-remainder", ((1 - progress) * 100) + "%");
      if (progress === 1) finish(element);
    }
    for (const task of tasks) {
      const elapsed = time - task.start;
      if (elapsed < 0) continue;
      const rect = task.element.getBoundingClientRect();
      if (elapsed > 1120 || rect.bottom < 68 || rect.top > window.innerHeight || !task.element.isConnected) {
        retire(task);
        continue;
      }
      const progress = progressAt(time, task.start);
      const arrival = Math.min(elapsed / 220, 1);
      const opacity = Math.min(elapsed / 100, 1) * Math.min((1120 - elapsed) / 180, 1);
      const drift = Math.sin(elapsed / 130) * 4;
      task.outline.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${progress})`;
      task.outline.style.opacity = String(opacity);
      task.scan.style.left = `${(progress * 100).toFixed(2)}%`;
      task.scan.style.opacity = String(opacity * 0.85);
      task.pointers.forEach((pointer) => {
        const x = rect.left + rect.width * progress + 32 * (1 - arrival) + drift;
        const y = rect.top + rect.height * progress - 24 * (1 - arrival) + drift;
        pointer.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${drift}deg)`;
        pointer.style.opacity = String(opacity);
      });
    }
    frame = tasks.size || entering.size ? requestAnimationFrame(draw) : 0;
  }

  /** @param {HTMLElement} element @param {number} start @returns {void} */
  function reveal(element, start) {
    if (element.contains(document.activeElement)) return;
    // Long lists would otherwise hide hundreds of cards before the queue reaches them.
    if (tasks.size + entering.size >= maxTasks) return;
    element.classList.add("swarm-build");
    entering.set(element, start);
    if (!frame) frame = requestAnimationFrame(draw);
    queue.push({ element, start });
    pump();
    const timer = setTimeout(() => { finish(element); timers.delete(timer); }, 1100);
    timers.add(timer);
  }

  const observer = new IntersectionObserver((entries) => {
    const hits = entries.filter((entry) => entry.isIntersecting);
    if (!hits.length) return;
    // 同一批进入视口的元素共用一个起跑时间，同一板块内再按行序微调，
    // 这样整块内容的描边和光标是同时推进的，不会各跑各的。
    const base = performance.now() + 40;
    const bySection = new Map();
    hits.forEach((entry) => observer.unobserve(entry.target));
    hits.forEach((entry) => {
      const key = sectionOf(entry.target);
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(entry.target);
    });
    let order = 0;
    for (const group of bySection.values()) {
      group.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      group.forEach((target, index) => {
        if (!motion.matches || document.hidden) return;
        reveal(target, base + order * 110 + Math.min(index, 4) * 55);
      });
      order += 1;
    }
  });

  // Observe individual pieces so tall chapters reveal as the reader reaches them.
  const selectors = {
    home: [
      "[data-swarm-heading] h2",
      "[data-swarm-content] > *",
      ".page-heading",
      ".mission-banner",
      ".cost-baseline",
      ".online-video-scale",
      ".metric-grid > article",
      ".evidence-heading",
      ".hard-examples-intro",
      ".ambiguity-mechanisms > article",
      ".talent-levels > article",
      ".talent-bottleneck h3",
      ".official-gap-evidence",
      ".legal-grounding > div",
      ".policy-library",
      ".gap-heading",
      ".rule-gaps > article",
      ".research-output",
      ".cost-boundary-notice",
      ".annotation-calculator",
      ".method-heading",
      ".model-learning-path > article",
      ".economy-grid > *",
      ".economy-comparison",
      ".statistical-note",
      ".project-impact",
      ".rag-contrast > article",
      ".assistant-intro",
      ".assistant-panel",
      ".platform-portability",
      ".source-details"
    ],
    comments: [
      "main .kicker",
      "main h1.display",
      "main > p.muted",
      ".research-route",
      ".tool-section-title",
      ".filter-bar",
      ".comment-distribution",
      ".list-bar",
      ".c-grid > *"
    ],
    label: [
      "main .kicker",
      "main h1.display",
      "main > p.muted",
      ".research-route",
      ".tool-section-title",
      ".card.accent",
      ".mode-tabs",
      "#modeLabel .grid-2 > div",
      ".tool-review-intro",
      "#revBox"
    ],
    insight: [
      "main .kicker",
      "main h1.display",
      ".tool-intro",
      ".research-route",
      ".sec-head",
      ".tabs",
      "#summary",
      ".stat-grid > article",
      ".chart-card",
      ".cmp-head",
      ".cmp-cols > *",
      ".evaluation-heading",
      ".evaluation-cards > *",
      ".evaluation-method",
      ".evaluation-details-grid > *",
      ".evaluation-scope",
      ".evaluation-boundary",
      ".finetune-panel",
      ".pipeline-panel",
      ".pipeline-branches > *",
      ".report-facts",
      ".research-export",
      ".gf-col",
      ".chat-layout > *",
      ".grid-4 > .card"
    ]
  };
  const page = location.pathname.startsWith("/comments") ? "comments"
    : location.pathname.startsWith("/label") ? "label"
    : location.pathname === "/" ? "home" : "insight";
  const selector = selectors[page].join(",");
  const seen = new WeakSet();
  document.querySelectorAll(selector).forEach((target) => {
    seen.add(target);
    if (target.getBoundingClientRect().top >= window.innerHeight) observer.observe(target);
  });

  // Tool pages render their tables and reports after the first paint.
  const pending = new Set();
  let scanFrame = 0;
  /** @returns {void} */
  function flushPending() {
    scanFrame = 0;
    const start = performance.now() + 60;
    for (const element of pending) {
      pending.delete(element);
      if (!element.isConnected || !motion.matches || document.hidden) continue;
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 68 || rect.top > window.innerHeight) { observer.observe(element); continue; }
      reveal(element, start);
    }
  }
  /** @param {Node} node @returns {void} */
  function enqueue(node) {
    if (!(node instanceof Element)) return;
    if (node.matches(selector) && !seen.has(node)) { seen.add(node); pending.add(node); }
    node.querySelectorAll(selector).forEach((element) => {
      if (seen.has(element)) return;
      seen.add(element);
      pending.add(element);
    });
    if (pending.size && !scanFrame) scanFrame = requestAnimationFrame(flushPending);
  }
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(enqueue));
  }).observe(document.body, { childList: true, subtree: true });
  // Interaction immediately restores the full content and its focus outline.
  document.addEventListener("pointerdown", clear, { passive: true });
  document.addEventListener("focusin", clear);
  window.addEventListener("resize", clear, { passive: true });
  window.addEventListener("beforeprint", clear);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); });
  motion.addEventListener("change", () => { if (!motion.matches) clear(); });
})();
