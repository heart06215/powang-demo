/* ===== 首页内嵌 AI 问答 ===== */
async function chatApi(url, opts) { return ResearchUI.request(url, opts); }
function chatEsc(s) { return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

async function chatLoadSnap() {
  try {
    const d = await chatApi("/api/videos");
    const c = ThemeKit.chartColors();
    const map = { "赞美": c.praise, "贬低": c.blame, "水军": c.shui, "无意义": c.noise, "社区对骂": c.feud, "中立": c.neutral };
    document.getElementById("chatSnap").innerHTML = d.videos.map(v => {
      const cs = v.analysis || {};
      const line = Object.keys(map).map(n => `<span style="font-weight:900;color:${map[n]}">${cs[n] || 0}</span>`).join(" / ");
      return `<div style="margin-bottom:12px"><b style="letter-spacing:1px">${chatEsc(v.name)} <span class="badge praise" style="${v.community === "饭圈" ? "background:var(--cat-blame)" : ""}">${chatEsc(v.community || "")}</span></b>
        <div class="small muted mt" style="margin-top:4px">${v.analyzed ? line : "未分析"}</div></div>`;
    }).join("");
  } catch (e) {}
}

function chatAddMsg(who, html) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = "msg " + who;
  const ts = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  div.innerHTML = `<div class="who">${who === "user" ? "YOU" : "破妄 AI"} <span style="opacity:.5;margin-left:6px" class="mono">${ts}</span></div><div class="bubble">${html}</div>`;
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

function chatInit() {
  document.querySelectorAll(".hint-q").forEach(q => {
    q.onmouseenter = () => q.style.color = "var(--cyan)";
    q.onmouseleave = () => q.style.color = "";
    q.onclick = () => {
      document.getElementById("chatQ").value = q.textContent.replace(/^·\s*/, "").replace(/？$/, "");
      chatSend();
    };
  });
  chatAddMsg("ai", "你好，我是破妄 AI 分析师。我可以基于已分析的评论数据回答六分类统计、双社区对比、趋势、网络用语含义等问题。先到「标注」页完成锚定集并触发分析，数据就绪后我就能给你洞察了。");
  chatLoadSnap();
}

chatInit();
ResearchUI.chartsReady().then(() => {
  dbInit();
  const graph = document.getElementById("graphFull");
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); gfLoad(); }
  }, { rootMargin: "240px" });
  observer.observe(graph);
}).catch((error) => {
  document.getElementById("summary").textContent = error.message;
  document.getElementById("gfStat").textContent = "图表资源加载失败，请刷新重试";
});
