/* ===== 首页内嵌 AI 问答 ===== */
async function chatApi(url, opts) { return ResearchUI.request(url, opts); }
function chatEsc(s) { return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/** @returns {Promise<void>} */
async function chatLoadSnap() {
  try {
    const d = await chatApi("/api/videos");
    const c = ThemeKit.chartColors();
    const map = { "赞美": c.praise, "贬低": c.blame, "水军": c.shui, "无意义": c.noise, "社区对骂": c.feud, "中立": c.neutral };
    document.getElementById("chatSnap").innerHTML = d.videos.map(v => {
      const cs = v.analysis || {};
      const line = Object.keys(map).map(n => `<div><dt>${ResearchUI.categoryLabel(n)}</dt><dd style="color:${map[n]}">${cs[n] || 0}</dd></div>`).join("");
      return `<div class="snapshot-card"><div class="snapshot-heading"><b>${chatEsc(v.name)}</b><span class="badge praise" style="${v.community === "饭圈" ? "background:var(--cat-blame)" : ""}">${chatEsc(v.community || "")}</span></div>
        ${v.analyzed ? `<dl class="snapshot-metrics">${line}</dl>` : '<p class="small muted mt">未分析</p>'}</div>`;
    }).join("");
  } catch (e) {}
}

function chatAddMsg(who, html) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = "msg " + who;
  const ts = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  div.innerHTML = `<div class="who">${who === "user" ? "YOU" : "澄明 AI"} <span style="opacity:.5;margin-left:6px" class="mono">${ts}</span></div><div class="bubble">${html}</div>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

async function chatSend() {
  const inp = document.getElementById("chatQ");
  const q = inp.value.trim();
  if (!q) return;
  inp.value = "";
  chatAddMsg("user", chatEsc(q));
  const loading = chatAddMsg("ai", `<span class="typing">分析中</span>`);
  document.getElementById("chatSendB").disabled = true;
  try {
    const d = await chatApi("/api/agent/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
    loading.querySelector(".bubble").textContent = d.answer || "模型未返回回答，请重试。";
    ResearchUI.renderTrace(loading, d.trace || []);
  } catch (e) {
    loading.querySelector(".bubble").innerHTML = `<span style="color:var(--cat-blame)">请求失败：${chatEsc(e.message)}</span>`;
  }
  document.getElementById("chatSendB").disabled = false;
}

/** @returns {void} */
function chatInit() {
  document.querySelectorAll(".hint-q").forEach(q => {
    q.onclick = () => {
      document.getElementById("chatQ").value = q.textContent.replace(/^·\s*/, "").replace(/？$/, "");
      if (!document.getElementById("chatQ").disabled) document.getElementById("chatQ").focus();
    };
  });
  chatAddMsg("ai", "现有研究数据已就绪。可以围绕立法调研、执法核查和平台治理提问：比较社区差异，追溯评论原文与分类理由，整理需要补充的上下文和证据清单。左侧示例可直接填入提问框，分析报告与审查数据集可在本页导出。");
  chatLoadSnap();
}

chatInit();
// Render statistics immediately; the graph loads independently near the viewport.
dbInit();
const graphObserver = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  graphObserver.disconnect();
  ResearchUI.chartsReady().then(() => gfLoad()).catch((error) => {
    document.getElementById("gfStat").textContent = error.message;
  });
}, { rootMargin: "240px" });
graphObserver.observe(document.getElementById("graphFull"));
