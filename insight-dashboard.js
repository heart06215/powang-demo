/* ===== 首页内嵌洞察看板 ===== */
const DB_CATS = ["赞美", "贬低", "水军", "无意义", "社区对骂", "中立"];
const DB_CLS = { "赞美": "praise", "贬低": "blame", "水军": "shui", "无意义": "noise", "社区对骂": "feud", "中立": "neutral" };
let dbVideos = [], dbCur = null, dbCharts = [], dbCsPool = {};

const chartNumberFont = getComputedStyle(document.documentElement).getPropertyValue("--font-number").trim();
const dbC = () => ThemeKit.chartColors();
function dbCatColor(name) {
  const c = dbC();
  return { "赞美": c.praise, "贬低": c.blame, "水军": c.shui, "无意义": c.noise,
           "社区对骂": c.feud, "中立": c.neutral }[name] || c.muted;
}
function dbClean() { dbCharts.forEach(c => { try { c.dispose(); } catch (e) {} }); dbCharts = []; }
/** @returns {void} */
function dbResizeCharts() {
  dbCharts.forEach(chart => {
    chart.resize();
    if (chart.getDom().id === "cmpDiff") {
      chart.setOption({ xAxis: { axisLabel: { rotate: chart.getWidth() < 500 ? 40 : 0 } } });
    }
  });
}
function dbMk(id) {
  const el = document.getElementById(id);
  if (!el || typeof echarts === "undefined") return null;
  const chart = echarts.init(el);
  chart.setOption({ textStyle: { fontFamily: chartNumberFont, fontSize: 18 } });
  dbCharts.push(chart);
  return chart;
}
async function dbApi(url) { return ResearchUI.request(url); }
function dbEsc(s) { return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function dbBaseAxis() {
  const c = dbC();
  return {
    axisLine: { lineStyle: { color: c.line } },
    axisLabel: { color: c.muted, fontSize: 18 },
    splitLine: { lineStyle: { color: c.grid } },
    axisTick: { lineStyle: { color: c.line } }
  };
}

async function dbInit() {
  try {
    const d = await dbApi("/api/videos");
    dbVideos = d.videos || [];
    const tabs = document.getElementById("videoTabs");
    if (!dbVideos.length) {
      tabs.innerHTML = "";
      document.getElementById("summary").textContent = "尚未配置视频数据。";
      return;
    }
    tabs.innerHTML = dbVideos.map(v =>
      `<button type="button" class="tab" data-b="${v.bvid}">${dbEsc(v.name)}<span class="com-tag">${dbEsc(v.community || "")}</span></button>`).join("")
      + `<button type="button" class="tab" data-b="__cmp__">双社区对比<span class="com-tag">VS</span></button>`;
    tabs.querySelectorAll(".tab").forEach(t => t.onclick = () => dbSelect(t.dataset.b));
    dbSelect(dbVideos[0].bvid);
  } catch (e) {
    const box = document.getElementById("summary");
    if (box) box.innerHTML = `<span style="color:var(--cat-blame)">看板数据加载失败：${dbEsc(e.message)}</span>`;
  }
}

/** @param {string} b @returns {Promise<void>} */
async function dbSelect(b) {
  document.querySelectorAll("#videoTabs .tab").forEach(t => t.classList.toggle("active", t.dataset.b === b));
  dbCur = b;
  document.getElementById("commentEvidenceLink").href = b === "__cmp__" ? "/comments" : "/comments?" + new URLSearchParams({bvid: b});
  const isCmp = b === "__cmp__";
  document.getElementById("cmpBox").style.display = isCmp ? "" : "none";
  document.getElementById("singleBox").style.display = isCmp ? "none" : "";
  dbClean();
  dbRenderSummary(b);
  if (isCmp) dbRenderCompare(); else dbRenderSingle(b);
  try {
    await ResearchUI.chartsReady();
    if (dbCur !== b) return;
    dbClean();
    if (isCmp) dbRenderCompare(); else dbRenderSingle(b);
  } catch (error) {
    const summary = document.getElementById("summary");
    const retry = document.createElement("button");
    retry.className = "btn ghost";
    retry.textContent = "重新加载图表";
    retry.addEventListener("click", () => dbSelect(dbCur));
    const message = document.createElement("span");
    message.textContent = error.message;
    summary.append(message, retry);
  }
}

/** @param {string} b @returns {void} */
function dbRenderSummary(b) {
  const s = document.getElementById("summary");
  if (b === "__cmp__") {
    s.innerHTML = `<span class="comparison-summary">左 <b style="color:var(--cat-blame)">饭圈(TF家族音乐会)</b> · 右 <b style="color:var(--cat-praise)">二游(明日方舟PV)</b></span><span class="comparison-summary">观察「组织化刷评」「玩梗盖楼」「控评夸赞」「社区对骂」的社区差异</span>`;
    return;
  }
  const v = dbVideos.find(x => x.bvid === b);
  if (!v) return;
  s.innerHTML = `<span class="video-meta video-meta-title"><b>视频</b><span>${dbEsc(v.title || v.name || "")}</span></span>${v.owner ? `<span class="video-meta"><b>UP主</b><span>${dbEsc(v.owner)}</span></span>` : ""}<span class="video-meta"><b>全站评论</b><span>${window.ResearchNumbers.commentCount(v.reply_count)}</span></span><span class="video-meta"><b>样本</b><span>${window.ResearchNumbers.commentCount(v.corpus_count)} 条</span></span><span class="video-meta"><b>社区</b><span>${dbEsc(v.community_full || v.community || "")}</span></span>`;
}

/* ---------- 单视频 ---------- */
function dbRenderSingle(b) {
  const v = dbVideos.find(x => x.bvid === b);
  if (!v) return;
  const real = !!v.analysis;
  if (!real) {
    document.getElementById("overview").innerHTML = '<p class="tool-intro">该视频暂无分类结果，可切换至已有分析数据的视频查看。</p>';
    for (const id of ["pie1", "bar1", "trend1", "slangbar1"]) document.getElementById(id).replaceChildren();
    return;
  }
  const raw = v.analysis;
  const cs = {};
  DB_CATS.forEach(c => cs[c] = raw[c] || 0);
  dbCsPool = cs;
  const total = DB_CATS.reduce((s, c) => s + (cs[c] || 0), 0) || 1;
  const box = document.getElementById("overview");
  box.innerHTML = DB_CATS.map((c, i) => {
    const n = cs[c] || 0, p = ((n / total) * 100).toFixed(1);
    return `<div class="stat-cell"><div class="n" style="color:${dbCatColor(c)}">${window.ResearchNumbers.commentCount(n)}</div><div class="l">${ResearchUI.categoryLabel(c)}</div><div class="muted mono" style="font-size:var(--type-small);margin-top:2px">${p}%</div><div class="wm">${String(i + 1).padStart(2, "0")}</div></div>`;
  }).join("");
  dbDrawPie(cs); dbDrawBar(cs);
  dbDrawTrend("trend1", (v.trend || []));
  const slangSrc = (v.top_slang && v.top_slang.length) ? v.top_slang : [];
  dbDrawSlangBar(slangSrc);
}

function dbDrawPie(cs) {
  const p = dbMk("pie1"); if (!p) return;
  p.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: dbC().ink, fontSize: 18 }, itemGap: 12 },
    series: [{ type: "pie", radius: ["34%", "58%"], center: ["50%", "38%"],
      itemStyle: { borderColor: dbC().surface, borderWidth: 3 },
      label: { show: document.getElementById("pie1").clientWidth >= 420, color: dbC().ink, fontWeight: "bold", fontSize: 18 },
      data: DB_CATS.map(n => ({ name: ResearchUI.categoryLabel(n), value: cs[n] || 0, itemStyle: { color: dbCatColor(n) } })) }]
  });
}
/** @param {Record<string, number>} cs @returns {void} */
function dbDrawBar(cs) {
  const b = dbMk("bar1"); if (!b) return;
  b.setOption({ tooltip: {}, grid: { left: 8, right: 48, bottom: 16, top: 12, containLabel: true },
    xAxis: { type: "value", splitNumber: 2, ...dbBaseAxis() },
    yAxis: { type: "category", inverse: true, data: DB_CATS.map(ResearchUI.categoryLabel), ...dbBaseAxis(), axisLabel: { color: dbC().ink, interval: 0, fontSize: 18 } },
    series: [{ type: "bar", barWidth: "52%", label: { show: true, position: "right", color: dbC().ink, fontSize: 18 }, data: DB_CATS.map(n => ({ value: cs[n] || 0, itemStyle: { color: dbCatColor(n) } })) }] });
}
function dbDrawTrend(id, tr) {
  const t = dbMk(id); if (!t) return;
  tr = tr || [];
  t.setOption({ tooltip: { trigger: "axis" }, legend: { type: "scroll", data: DB_CATS.map(ResearchUI.categoryLabel), textStyle: { color: dbC().ink, fontSize: 18 } },
    grid: { left: 46, right: 24, bottom: 40, top: 48 },
    xAxis: { type: "category", data: tr.map(x => x.month), ...dbBaseAxis() },
    yAxis: { type: "value", ...dbBaseAxis() },
    series: DB_CATS.map(n => ({ name: ResearchUI.categoryLabel(n), type: "line", stack: "total", areaStyle: { opacity: .55 }, symbol: "none",
      data: tr.map(x => x[n] || 0), itemStyle: { color: dbCatColor(n) }, lineStyle: { width: 1 } })) });
}
function dbDrawSlangBar(words) {
  const b = dbMk("slangbar1"); if (!b) return;
  const ws = (words || []).slice(0, 15).slice().sort((a, z) => a.count - z.count);
  b.setOption({ tooltip: {}, grid: { left: 92, right: 48, bottom: 24, top: 12 },
    xAxis: { type: "value", ...dbBaseAxis() },
    yAxis: { type: "category", data: ws.map(w => w.term), ...dbBaseAxis(), axisLabel: { color: dbC().ink, fontSize: 17 } },
    series: [{ type: "bar", barWidth: "62%",
      data: ws.map((w, i) => ({ value: w.count, itemStyle: { color: i === ws.length - 1 ? dbC().blue : dbC().cyan } })),
      label: { show: true, position: "right", color: dbC().muted, fontSize: 16 } }] });
}
/* ---------- 对比 ---------- */
/** @returns {void} */
function dbRenderCompare() {
  const FANv = dbVideos.find(v => v.community === "饭圈") || dbVideos[1];
  const GAMv = dbVideos.find(v => v.community === "二游") || dbVideos[0];
  if (!FANv || !GAMv) {
    document.getElementById("cmpInsight").textContent = "需要两个社区的视频数据才能进行对比。";
    return;
  }
  if (!FANv.analysis || !GAMv.analysis) {
    for (const id of ["cmpTable", "cmpCols", "cmpDiff", "cmpRadar"]) document.getElementById(id).replaceChildren();
    document.getElementById("cmpInsight").textContent = "当前可查看已有社区的分类结果，双社区对照将在两组数据齐备后展示。";
    return;
  }
  const FAN = { meta: FANv, cs: FANv.analysis };
  const GAME = { meta: GAMv, cs: GAMv.analysis };
  const fanName = "饭圈", gameName = "二游";
  const norm = cs => { const o = {}; DB_CATS.forEach(c => o[c] = cs[c] || 0); return o; };
  FAN.cs = norm(FAN.cs); GAME.cs = norm(GAME.cs);

  const tF = DB_CATS.reduce((s, c) => s + (FAN.cs[c] || 0), 0) || 1;
  const tG = DB_CATS.reduce((s, c) => s + (GAME.cs[c] || 0), 0) || 1;
  document.getElementById("cmpTable").innerHTML =
    `<thead><tr><th>分类</th><th>饭圈 数量</th><th>饭圈 占比</th><th>二游 数量</th><th>二游 占比</th><th>占比差(pp)</th><th>更高</th></tr></thead><tbody>` +
    DB_CATS.map(c => {
      const f = FAN.cs[c] || 0, g = GAME.cs[c] || 0, fp = f / tF * 100, gp = g / tG * 100, d = (fp - gp);
      const win = Math.abs(d) < .05 ? "持平" : (d > 0 ? "饭圈" : "二游");
      const wcol = win === "饭圈" ? dbC().pink : win === "二游" ? dbC().blue : dbC().muted;
      return `<tr><td style="font-weight:900;color:${dbCatColor(c)}">${ResearchUI.categoryLabel(c)}</td>
        <td class="mono">${f}</td><td class="mono">${fp.toFixed(1)}%</td>
        <td class="mono">${g}</td><td class="mono">${gp.toFixed(1)}%</td>
        <td class="mono" style="color:${Math.abs(d) < .05 ? 'inherit' : (d > 0 ? dbC().pink : dbC().blue)};font-weight:900">${d > 0 ? "+" : ""}${d.toFixed(1)}</td>
        <td><span class="badge" style="background:${wcol};color:#fff">${win}</span></td></tr>`;
    }).join("") +
    `<tr><td style="font-weight:900">合计</td><td class="mono"><b>${tF}</b></td><td class="mono">100%</td><td class="mono"><b>${tG}</b></td><td class="mono">100%</td><td colspan="2" class="muted">样本基准</td></tr></tbody>`;

  document.getElementById("cmpCols").innerHTML = [FAN, GAME].map(o => {
    const total = DB_CATS.reduce((s, c) => s + (o.cs[c] || 0), 0) || 1;
    return `<div class="cmp-col">
      <div class="cmp-col-heading mb"><div class="cmp-community"><strong style="color:${o.meta.community === "饭圈" ? dbC().pink : dbC().blue}">${dbEsc(o.meta.community || "")}</strong><span class="muted">${dbEsc(o.meta.name || "")}</span></div>
      <span class="badge">样本 ${total}</span></div>
      ${DB_CATS.map(c => { const n = o.cs[c] || 0, p = ((n / total) * 100).toFixed(1); return `<div class="bar-row"><span class="cmp-category" style="color:${dbCatColor(c)}">${ResearchUI.categoryLabel(c)}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${dbCatColor(c)}"></div></div><span class="cmp-value mono">${n} · ${p}%</span></div>`; }).join("")}
    </div>`;
  }).join("");

  const diff = dbMk("cmpDiff");
  if (diff) diff.setOption({ tooltip: { trigger: "axis", valueFormatter: v => v + "%" },
    legend: { data: [fanName, gameName], textStyle: { color: dbC().ink } },
    grid: { left: 8, right: 16, bottom: 12, top: 48, containLabel: true },
    xAxis: { type: "category", data: DB_CATS.map(ResearchUI.categoryLabel), ...dbBaseAxis(), axisLabel: { color: dbC().muted, interval: 0, fontSize: 16, lineHeight: 22,
      rotate: document.getElementById("cmpDiff").clientWidth < 500 ? 40 : 0 } },
    yAxis: { type: "value", name: "%", ...dbBaseAxis() },
    series: [
      { name: fanName, type: "bar", barWidth: "30%", itemStyle: { color: dbC().pink },
        label: { show: true, hideOverlap: true, position: "top", color: dbC().ink, formatter: "{c}%" },
        data: DB_CATS.map(c => +(((FAN.cs[c] || 0) / tF) * 100).toFixed(1)) },
      { name: gameName, type: "bar", barWidth: "30%", itemStyle: { color: dbC().blue },
        label: { show: true, hideOverlap: true, position: "top", color: dbC().ink, formatter: "{c}%" },
        data: DB_CATS.map(c => +(((GAME.cs[c] || 0) / tG) * 100).toFixed(1)) }
    ] });

  const radar = dbMk("cmpRadar");
  if (radar) {
    const maxP = Math.max(1, Math.max(...DB_CATS.map(c => Math.max((FAN.cs[c] || 0) / tF, (GAME.cs[c] || 0) / tG))) * 100 * 1.25);
    radar.setOption({
      tooltip: {},
      legend: { data: [fanName, gameName], textStyle: { color: dbC().ink } },
      radar: { indicator: DB_CATS.map(c => ({ name: ResearchUI.categoryLabel(c), max: +maxP.toFixed(1) })),
        center: ["50%", "55%"], radius: "52%", nameGap: 8,
        axisName: { color: dbC().ink, fontWeight: "bold", fontSize: 16,
          formatter: value => document.getElementById("cmpRadar").clientWidth < 500 ? ({ "组织化刷评": "组织化\n刷评", "社区对骂": "社区\n对骂" }[value] || value) : value },
        splitLine: { lineStyle: { color: dbC().grid } }, splitArea: { show: false },
        axisLine: { lineStyle: { color: dbC().grid } } },
      series: [{ type: "radar", data: [
        { name: fanName, value: DB_CATS.map(c => +(((FAN.cs[c] || 0) / tF) * 100).toFixed(1)),
          lineStyle: { color: dbC().pink, width: 2.5 }, itemStyle: { color: dbC().pink }, areaStyle: { color: dbC().pink, opacity: .18 } },
        { name: gameName, value: DB_CATS.map(c => +(((GAME.cs[c] || 0) / tG) * 100).toFixed(1)),
          lineStyle: { color: dbC().blue, width: 2.5 }, itemStyle: { color: dbC().blue }, areaStyle: { color: dbC().blue, opacity: .18 } }
      ] }] });
  }

  const lines = DB_CATS.map(c => {
    const fp = (FAN.cs[c] || 0) / tF * 100, gp = (GAME.cs[c] || 0) / tG * 100, d = fp - gp;
    if (Math.abs(d) < .05) return `· <b>${ResearchUI.categoryLabel(c)}</b>：两社区基本持平`;
    const hi = d > 0 ? "<b style='color:" + dbC().pink + "'>饭圈</b>" : "<b style='color:" + dbC().blue + "'>二游</b>";
    const why = { "赞美": "真实喜爱/应援更盛", "贬低": "质疑嘲讽(假唱·修音·策划)更多",
                  "水军": "控评刷屏营销话术更明显", "无意义": "玩梗盖楼灌水更盛",
                  "社区对骂": "用户之间的站队与拉踩更激烈", "中立": "客观讨论与信息补充更多" }[c] || "";
    return `· <b>${ResearchUI.categoryLabel(c)}</b>：${hi}高 <span class="mono">${Math.abs(d).toFixed(1)}pp</span> —— ${why}`;
  });
  document.getElementById("cmpInsight").innerHTML = lines.join("<br>");
}
