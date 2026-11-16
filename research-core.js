// @ts-check
/* Shared data requests, category labels, chart loading and auditable tool traces. */
(() => {
  "use strict";
  /** @type {Map<string, {expires: number, promise: Promise<unknown>}>} */
  const requests = new Map();
  /** @type {Promise<void> | undefined} */
  let chartPromise;
  /** @type {Readonly<Record<string, string>>} */
  const toolNames = Object.freeze({ get_video_stats: "查询分类统计", get_trend: "读取时间趋势", get_top_slang: "检索高频话术", get_representative: "调取原文证据", compare_videos: "对比研究社区", search_slang: "检索圈层知识" });

  /** @param {string} value @returns {string} */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
  }
  /** @param {string} value @returns {string} */
  function categoryLabel(value) { return value === "水军" ? "组织化刷评" : value; }
  /** @param {string} url @param {RequestInit} [options] @returns {Promise<unknown>} */
  function request(url, options = {}) {
    const cacheable = (!options.method || options.method === "GET") && !options.signal;
    const cached = requests.get(url);
    if (cacheable && cached && cached.expires > Date.now()) return cached.promise;
    const promise = fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(65000) }).then(async (response) => {
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "数据读取失败，请重试");
      return body.data;
    });
    if (cacheable) {
      requests.set(url, { promise, expires: Date.now() + 30000 });
      promise.catch(() => requests.delete(url));
    }
    return promise;
  }
  /** @returns {Promise<void>} */
  function chartsReady() {
    if ("echarts" in window) return Promise.resolve();
    if (chartPromise) return chartPromise;
    chartPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js";
      script.onload = () => resolve();
      script.onerror = () => { chartPromise = undefined; script.remove(); reject(new Error("图表资源未加载，请检查网络后重试")); };
      document.head.append(script);
    });
    return chartPromise;
  }
  /** @param {HTMLElement} host @param {ToolTrace[]} trace @returns {void} */
  function renderTrace(host, trace) {
    host.querySelector(".tool-trace")?.remove();
    const details = document.createElement("details"); details.className = "tool-trace";
    const summary = document.createElement("summary");
    summary.textContent = trace.length ? `查看 ${trace.length} 次工具调用与数据依据` : "本次回答没有调用数据工具";
    details.append(summary);
    const list = document.createElement("ol");
    for (const step of trace) {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = (toolNames[step.name] ?? step.name) + (step.status === "complete" ? " · 完成" : " · " + step.status);
      const argumentsText = document.createElement("code"); argumentsText.textContent = JSON.stringify(step.arguments);
      const result = document.createElement("p"); result.textContent = step.result_preview ?? "未返回工具结果";
      item.append(name, argumentsText, result); list.append(item);
    }
    details.append(list); host.append(details);
    window.dispatchEvent(new CustomEvent("research:trace", { detail: trace }));
  }
  window.ResearchUI = Object.freeze({ request, categoryLabel, escapeHtml, chartsReady, renderTrace });
})();
