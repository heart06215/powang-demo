/* Public Pages adapter: real research snapshots, local queries, no model credentials. */
(() => {
  "use strict";
  const base = new URL(".", document.currentScript.src);
  const nativeFetch = window.fetch.bind(window);
  let snapshotPromise;
  /** @returns {Promise<object>} */
  function snapshot() {
    if (!snapshotPromise) snapshotPromise = nativeFetch(new URL("data/site.json", base)).then((response) => {
      if (!response.ok) throw new Error("演示数据读取失败，请刷新页面");
      return response.json();
    });
    return snapshotPromise;
  }
  /** @param {string} pathname @returns {string} */
  function localPath(pathname) {
    return pathname.startsWith(base.pathname) ? "/" + pathname.slice(base.pathname.length) : pathname;
  }
  /** @param {URL} url @returns {string} */
  function downloadPath(url) {
    const format = url.searchParams.get("format") || "zip";
    const bvid = url.searchParams.get("bvid");
    const allowedVideo = ["BV1fy4y1L7Rq", "BV1h1kcBfEuJ"].includes(bvid);
    return new URL(`downloads/${allowedVideo ? bvid + "/" : ""}research.${format}`, base).href;
  }
  /** @param {unknown} data @param {number} [status] @returns {Response} */
  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(status === 200 ? {success: true, data} : {success: false, error: data}), {
      status, headers: {"Content-Type": "application/json; charset=utf-8"},
    });
  }
  /** @param {URL} url @returns {Promise<Response>} */
  async function query(url) {
    const path = localPath(url.pathname);
    if (path === "/api/research/export") return nativeFetch(downloadPath(url));
    if (path === "/api/graph") {
      const limit = Number(url.searchParams.get("comments") || 520) <= 240 ? 240 : 520;
      return nativeFetch(new URL(`data/graph-${limit}.json`, base));
    }
    const data = await snapshot();
    const params = url.searchParams;
    const bvid = params.get("bvid") || data.videos[0]?.bvid;
    const rows = data.comments[bvid] || [];
    const size = Math.max(1, Math.min(200, Number(params.get("size")) || 50));
    const category = params.get("category") || "";
    const anchors = data.anchors.filter((row) => row.bvid === bvid);
    const labeled = new Set(anchors.map((row) => String(row.rpid)));
    if (path === "/api/videos") return jsonResponse({videos: data.videos});
    if (path === "/api/research/report") return jsonResponse(data.report);
    if (path.startsWith("/api/analysis/")) {
      const analysis = data.analyses[path.split("/").pop()];
      return analysis ? jsonResponse(analysis) : jsonResponse("没有对应视频的数据", 404);
    }
    if (path === "/api/comments") {
      const text = (params.get("q") || "").trim().toLowerCase();
      const selected = rows.filter((row) => (!category || category === "all" || row.category === category) && (!text || row.text.toLowerCase().includes(text)));
      const order = params.get("order") === "like" ? "like" : "ctime";
      selected.sort((a, b) => (b[order] || 0) - (a[order] || 0));
      const page = Math.max(1, Number(params.get("page")) || 1);
      return jsonResponse({items: selected.slice((page - 1) * size, page * size), total: selected.length, page, size, analyzed: true, meta: data.analyses[bvid]?.meta || {}});
    }
    if (path === "/api/anchors") {
      const byVideo = Object.fromEntries(data.videos.map((video) => [video.bvid, data.anchors.filter((row) => row.bvid === video.bvid)]));
      return jsonResponse({anchors: data.anchors, by_video: byVideo, count: data.anchors.length, count_per_video: Object.fromEntries(Object.entries(byVideo).map(([key, items]) => [key, items.length]))});
    }
    if (path === "/api/label/queue") {
      const pool = rows.filter((row) => !labeled.has(String(row.rpid)));
      return jsonResponse({bvid, items: pool.slice(0, size), labeled: anchors.length, total_pool: pool.length});
    }
    if (path === "/api/review/queue") {
      const pool = rows.filter((row) => !labeled.has(String(row.rpid)) && (!category || row.category === category));
      return jsonResponse({bvid, total: pool.length, items: pool.slice(0, size).map((row) => ({...row, model_category: row.category}))});
    }
    return jsonResponse("公开演示没有此数据接口", 404);
  }
  /** @param {RequestInfo | URL} input @param {RequestInit} [options] @returns {Promise<Response>} */
  window.fetch = async (input, options = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin !== location.origin || !localPath(url.pathname).startsWith("/api/")) return nativeFetch(input, options);
    const method = (options.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method !== "GET") return jsonResponse(localPath(url.pathname) === "/api/agent/chat" ? "在线问答需连接模型服务。当前可浏览研究数据并下载报告。" : "公开演示为只读，可下载数据后在本地版继续标注。", 403);
    try { return await query(url); }
    catch (error) { return jsonResponse(error instanceof Error ? error.message : "演示数据读取失败", 503); }
  };
  /** @param {Element} element @returns {void} */
  function adaptLink(element) {
    for (const attr of ["href", "src"]) {
      const value = element.getAttribute(attr);
      if (!value?.startsWith("/") || value.startsWith("//")) continue;
      const url = new URL(value, location.origin);
      const path = localPath(url.pathname);
      if (path === "/api/research/export") {
        element.setAttribute(attr, downloadPath(url));
        continue;
      }
      if (value.startsWith(base.pathname)) continue;
      const file = path === "/" ? "index.html" : path.slice(1).replace(/^(comments|insight|label)$/, "$1.html");
      element.setAttribute(attr, new URL(file + url.search + url.hash, base).href);
    }
  }
  /** @returns {void} */
  function adaptControls() {
    document.querySelectorAll("a[href],img[src]").forEach(adaptLink);
    for (const id of ["btnAnalyze", "btnSubmit", "sendQuestion", "chatSendB", "chatQuestion", "chatQ"]) {
      const element = document.getElementById(id);
      if (!element) continue;
      if (!element.disabled) element.disabled = true;
      const text = id.startsWith("chat") || id === "sendQuestion" ? "在线问答需连接模型服务" : "公开演示为只读，可下载数据后在本地版操作";
      if (element.title !== text) element.title = text;
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") element.placeholder = text;
    }
    const hint = document.querySelector("#assistant .copilot-note, #qa .chat-hint");
    if (hint && hint.textContent !== "公开演示 · 浏览数据与下载报告") hint.textContent = "公开演示 · 浏览数据与下载报告";
  }
  const observer = new MutationObserver(adaptControls);
  document.addEventListener("DOMContentLoaded", () => {
    adaptControls();
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["href", "src", "disabled"]});
  });
})();
