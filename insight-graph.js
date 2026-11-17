/* ===== 全屏关系图谱 ===== */
const GF_CAT_DESC = {
  "赞美": "喜爱、支持、夸赞、感动，真实的正面声浪。",
  "贬低": "批评、嘲讽、质疑，假唱、修音、唐、孝。",
  "水军": "疑似组织化评论刷取、模板化控评与重复传播的文本特征，不认定付费身份。",
  "无意义": "灌水占楼、纯表情玩梗、显性引流广告。",
  "社区对骂": "评论者之间的互相攻击、拉踩、站队对线、人身攻击。",
  "中立": "客观陈述、提问求证、补充信息，没有明确褒贬情绪。"
};
GF_CAT_DESC["组织化刷评"] = GF_CAT_DESC["水军"];
const GF_KIND = { category: "情感类别", community: "社区", video: "视频", term: "网络用语", comment: "评论节点" };
const GF_BADGE = { "赞美": "praise", "贬低": "blame", "水军": "shui", "无意义": "noise", "社区对骂": "feud", "中立": "neutral" };
let gfData = null, gfChart = null, gfFilter = "全部", gfCur = "";
let gfLayers = { comment: true, sim: true, mention: true };
let gfPan = null, gfPanEndAt = 0;

function gfEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function gfLoad() {
  const el = document.getElementById("gfChart");
  if (!el || typeof echarts === "undefined") return;
  try {
    const lim = window.innerWidth <= 820 ? 240 : 520;
    const d = { success: true, data: await ResearchUI.request(`/api/graph?comments=${lim}`) };
    if (!d.success) throw new Error(d.error || "图谱数据不可用");
    gfData = d.data;
    gfData.nodes.forEach((node) => { if (node.kind === "category") node.label = ResearchUI.categoryLabel(node.label); });
    gfChips();
    gfMetrics();
    gfDraw();
    gfStat();
  } catch (e) {
    document.getElementById("gfStat").textContent = "NO DATA";
  }
}

function gfChips() {
  const box = document.getElementById("gfChips");
  const vids = gfData.nodes.filter(n => n.kind === "video");
  if (gfFilter !== "全部" && !vids.some(v => v.bvid === gfFilter)) gfFilter = "全部";
  const chips = [{ key: "全部", label: "全部" }].concat(
    vids.map(v => ({ key: v.bvid, label: v.label }))
  );
  box.innerHTML = chips.map(c =>
    `<button type="button" class="gf-chip${c.key === gfFilter ? " on" : ""}" data-v="${gfEsc(c.key)}">${gfEsc(c.label)}</button>`
  ).join("");
  document.getElementById("gfRailCount").textContent = vids.length + " 个视频";
}

function gfTopList(vis) {
  const box = document.getElementById("gfTop");
  if (!box) return;
  const top = vis.nodes.filter(n => n.kind === "term").sort((a, b) => b.weight - a.weight).slice(0, 5);
  box.innerHTML = top.map((n, i) =>
    `<button type="button" data-node="${gfEsc(n.id)}"><span class="r">${String(i + 1).padStart(2, "0")}</span><span class="t">${gfEsc(n.label)}</span><span class="v">${n.weight}</span></button>`
  ).join("");
}

function gfMetrics() {
  const nodes = gfData.nodes, edges = gfData.edges, s = gfData.stats;
  const rows = [
    [nodes.length, "节点 NODES"],
    [edges.length, "关系 EDGES"],
    [s.comments, "评论 COMMENTS"],
    [edges.filter(e => e.layer === "sim").length, "相似边 SIM"],
    [nodes.filter(n => n.kind === "term").length, "词条 TERMS"],
    [nodes.filter(n => n.kind === "video").length, "视频 VIDEOS"]
  ];
  document.getElementById("gfMetrics").innerHTML = rows.map(
    ([v, k]) => `<div class="gf-metric"><b>${v}</b><span>${k}</span></div>`
  ).join("");
  const box = document.getElementById("gfVerify");
  if (!box) return;
  const pct = s.corpus_unique ? (s.corpus_near_dup / s.corpus_unique * 100).toFixed(1) : "0.0";
  box.innerHTML =
    `<div>抽样 <b>${window.ResearchNumbers.commentCount(s.comments)}</b> / 全量 <b>${window.ResearchNumbers.commentCount(s.comment_corpus || s.corpus)}</b> 条评论</div>` +
    `<div>全量有相似邻居 <b>${s.corpus_near_dup}</b> 条（${pct}%）· 抽样 <b>${s.near_dup_nodes}</b> 条</div>` +
    `<div>阈值 <b>J ≥ ${s.threshold}</b> · 相似边 <b>${s.sim_edges}</b></div>` +
    `<div>平均相似度 <b>${s.avg_sim}</b> · 最高 <b>${s.max_sim}</b></div>`;
}

function gfVisible() {
  const drop = new Set();
  if (!gfLayers.comment) {
    gfData.nodes.forEach(n => { if (n.kind === "comment") drop.add(n.id); });
  }
  const edges = gfData.edges.filter(e => {
    if (drop.has(e.source) || drop.has(e.target)) return false;
    if (!gfLayers.sim && e.layer === "sim") return false;
    if (!gfLayers.mention && e.layer === "mention") return false;
    return true;
  });
  const nodes = gfData.nodes.filter(n => !drop.has(n.id));
  if (gfFilter === "全部") return { nodes, edges };
  const keep = new Set();
  nodes.forEach(n => {
    if (n.kind === "video" && n.bvid === gfFilter) keep.add(n.id);
    if (n.kind === "comment" && n.bvid === gfFilter) keep.add(n.id);
  });
  edges.forEach(e => {
    if (keep.has(e.source) && e.target.indexOf("term:") === 0) keep.add(e.target);
  });
  return {
    nodes: nodes.filter(n => keep.has(n.id)),
    edges: edges.filter(e => keep.has(e.source) && keep.has(e.target))
  };
}

function gfDraw() {
  const el = document.getElementById("gfChart");
  if (!el || !gfData) return;
  const C = ThemeKit.chartColors();
  const catColor = { "赞美": C.praise, "贬低": C.blame, "水军": C.shui, "无意义": C.noise,
                     "社区对骂": C.feud, "中立": C.neutral };
  const withAlpha = (hex, a) => {
    const h = String(hex || "").replace("#", "");
    if (h.length !== 6) return hex;
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const colorOf = n => n.kind === "category" ? (catColor[n.label] || C.violet)
    : n.kind === "term" ? C.muted
    : n.kind === "comment" ? ((n.category && catColor[n.category]) || n.color || C.violet)
    : (n.color || C.violet);
  const vis = gfVisible();
  const byId = new Map(vis.nodes.map(n => [n.id, n]));
  const termMax = Math.max(1, ...vis.nodes.filter(n => n.kind === "term").map(n => n.weight));
  const comMax = Math.max(1, ...vis.nodes.filter(n => n.kind === "comment").map(n => n.weight || 1));
  const edgeMax = Math.max(1, ...vis.edges.map(e => e.weight));

  // 版式：两个视频名作为左右总节点，词条与评论以两个视频为核向中间收拢，
  // 两半球在中央留下一条窄缝（共有词条压在缝里做桥接），整体形成大脑轮廓。
  const W = el.clientWidth || 1200, H = el.clientHeight || 900;
  const cx = W / 2, cy = H / 2;
  // 大节点的相对尺寸随画布宽度收放：宽屏保持夸张体量，窄屏不至于把评论云全部盖住
  const bigScale = Math.min(1, Math.max(0.78, W / 1100));
  const seed = new Map();
  const vids = vis.nodes.filter(n => n.kind === "video");
  const multi = vids.length > 1;
  const vidIndex = id => vids.findIndex(v => v.id === id);
  const videoCenter = i => BrainLayout.center(W, H, i, multi);
  // 两个视频节点放在各自半球的正中央，作为被大量节点包围的核心
  vids.forEach((n, i) => seed.set(n.id, videoCenter(i)));

  const firstVideo = {};
  vis.edges.forEach(e => {
    if (e.target.indexOf("term:") === 0 && e.source.indexOf("vid:") === 0 && !firstVideo[e.target]) {
      firstVideo[e.target] = e.source;
    }
  });
  const terms = vis.nodes.filter(n => n.kind === "term").sort((a, b) => b.weight - a.weight);
  const shared = multi ? terms.filter(n => (n.videos || []).length > 1) : [];
  const own = multi ? terms.filter(n => (n.videos || []).length <= 1) : terms;
  let rnd = 20261021;
  const rndNext = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;

  // Nodes and the cortical guides use the same hemisphere geometry.
  const placeInLobe = (vidId, frac, ang) => BrainLayout.point(W, H, Math.max(0, vidIndex(vidId)), multi, frac, ang);

  // 跨视频共有词条压在中央纵裂里做桥接
  shared.forEach((n, k) => {
    const t = shared.length <= 1 ? 0.5 : k / (shared.length - 1);
    seed.set(n.id, [
      W * (0.5 + (rndNext() - 0.5) * 0.03),
      H * (0.17 + 0.63 * t) + (rndNext() - 0.5) * 18
    ]);
  });

  // 词条：按频次从视频核心向外排，高频靠近中心，低频被推到外缘
  const termGroups = [[], []];
  own.forEach(n => {
    const gi = vidIndex(firstVideo[n.id]);
    termGroups[gi === 1 ? 1 : 0].push(n);
  });
  termGroups.forEach((arr, gi) => {
    const vidNode = vids[gi] || vids[0];
    if (!vidNode) return;
    arr.sort((a, b) => b.weight - a.weight);
    arr.forEach((n, k) => {
      const rank = arr.length <= 1 ? 0 : k / (arr.length - 1);
      const frac = 0.32 + 0.58 * Math.pow(rank, 0.8);
      const ang = ((k * 2.399963 + (gi === 0 ? 0.5 : 2.3)) % (Math.PI * 2)) + (rndNext() - 0.5) * 0.18;
      seed.set(n.id, placeInLobe(vidNode.id, frac, ang));
    });
  });

  // 评论：相关度 = 点赞 + 相似邻居 + 命中词条。相关度越高越靠近视频核心，
  // 最低的一批被推到半球外缘，也就是画面左右两侧。
  const commentNodes = vis.nodes.filter(n => n.kind === "comment");
  const likeMax = Math.max(1, ...commentNodes.map(n => Math.log1p(n.like || 0)));
  const relScore = n => (
    0.55 * (Math.log1p(n.like || 0) / likeMax) +
    0.35 * Math.min(1, (n.sim_degree || 0) / 6) +
    0.10 * Math.min(1, (n.terms || []).length / 4)
  );
  const rankedComments = commentNodes.slice().sort((a, b) => relScore(b) - relScore(a));
  const relRank = new Map(rankedComments.map((n, i) => [
    n.id, rankedComments.length <= 1 ? 0 : i / (rankedComments.length - 1)
  ]));

  // 胼胝体：挑一批命中“两视频共有词条”的评论，压到中央窄缝里横跨左右，
  // 让两个半球在中间连成一体，而不是两只分离的圆。
  const bridgeIds = new Set();
  if (multi && shared.length) {
    const sharedIds = new Set(shared.map(t => t.id));
    const cands = rankedComments.filter(n =>
      (n.terms || []).some(t => sharedIds.has(t.id)));
    const want = Math.min(44, Math.floor(commentNodes.length * 0.045));
    const step = Math.max(1, Math.floor(cands.length / Math.max(1, want)));
    const bridge = cands.filter((_, i) => i % step === 0).slice(0, want);
    bridge.forEach((n, i) => {
      const t = bridge.length <= 1 ? 0.5 : i / (bridge.length - 1);
      seed.set(n.id, [
        W * (0.445 + 0.11 * t) + (rndNext() - 0.5) * 10,
        H * (0.47 + 0.025 * Math.sin(t * Math.PI * 2)) + (rndNext() - 0.5) * 16
      ]);
      bridgeIds.add(n.id);
    });
  }

  commentNodes.forEach((n, k) => {
    if (bridgeIds.has(n.id)) return;
    const gi = vidIndex(n.vid);
    const vidNode = vids[gi >= 0 ? gi : 0] || vids[0];
    if (!vidNode) return;
    const rank = relRank.get(n.id) || 0;
    const frac = Math.max(0.20, Math.min(0.985,
      0.22 + 0.75 * Math.pow(rank, 0.85) + (rndNext() - 0.5) * 0.04));
    const c = seed.get(vidNode.id);
    const pterm = (n.terms || [])[0];
    const tp = pterm ? seed.get(pterm.id) : null;
    const ang = tp
      ? Math.atan2(tp[1] - c[1], tp[0] - c[0]) + (rndNext() - 0.5) * 0.55
      : ((k * 2.399963 + (gi === 1 ? 1.7 : 0)) % (Math.PI * 2)) + (rndNext() - 0.5) * 0.10;
    const p = placeInLobe(vidNode.id, frac, ang);
    seed.set(n.id, [p[0] + (rndNext() - 0.5) * 8, p[1] + (rndNext() - 0.5) * 8]);
  });

  const ids = vis.nodes.map(n => n.id);
  const px = ids.map(id => seed.get(id)[0]), py = ids.map(id => seed.get(id)[1]);
  const bigLim = Math.min(110, Math.max(62, Math.min(W, H) * 0.085));
  const termLim = Math.min(78, Math.max(46, Math.min(W, H) * 0.055));
  const limBase = vis.nodes.map(n => n.kind === "comment" ? 15
    : n.kind === "term" ? termLim : bigLim);
  for (let it = 0; it < 72; it++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const dx = px[j] - px[i], dy = py[j] - py[i];
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const lim = Math.max(limBase[i], limBase[j]);
        if (d < lim) {
          const f = (lim - d) / d * 0.5;
          px[i] -= dx * f; py[i] -= dy * f;
          px[j] += dx * f; py[j] += dy * f;
        }
      }
    }
  }
  for (let i = 0; i < ids.length; i++) {
    const n = vis.nodes[i];
    const anchor = seed.get(ids[i]) || [cx, cy];
    if ((n.kind === "comment" && !bridgeIds.has(n.id)) || (n.kind === "term" && !shared.some(t => t.id === n.id))) {
      const side = Math.max(0, vidIndex(n.vid || firstVideo[n.id]));
      const maxX = W * 0.035, maxY = H * 0.045;
      const x = anchor[0] + Math.max(-maxX, Math.min(maxX, px[i] - anchor[0]));
      const y = anchor[1] + Math.max(-maxY, Math.min(maxY, py[i] - anchor[1]));
      [px[i], py[i]] = BrainLayout.constrain(W, H, side, multi, x, y);
    } else {
      px[i] = anchor[0]; py[i] = anchor[1];
    }
  }
  const pos = new Map(ids.map((id, i) => [id, [px[i], py[i]]]));

  // 大节点后画、小节点先画：评论点做底纹，词条/视频/类别压在评论层之上
  const kindRank = { comment: 0, term: 1, video: 2, community: 3, category: 4 };
  const drawNodes = vis.nodes.slice().sort((a, b) => (kindRank[a.kind] || 0) - (kindRank[b.kind] || 0));
  const data = drawNodes.map(n => {
    const c = colorOf(n);
    const p = pos.get(n.id) || [cx, cy];
    const item = { id: n.id, name: n.label, category: n.kind, kind: n.kind, raw: n, x: p[0], y: p[1] };
    if (n.kind === "category") {
      Object.assign(item, { symbol: "circle", symbolSize: 84 * bigScale,
        itemStyle: { color: c, borderColor: C.line, borderWidth: 5 },
        label: { show: true, position: "bottom", distance: 14, color: c, fontSize: 25, fontWeight: 900 } });
    } else if (n.kind === "community") {
      Object.assign(item, { symbol: "circle", symbolSize: 64 * bigScale,
        itemStyle: { color: C.surface, borderColor: c, borderWidth: 5 },
        label: { show: true, position: "bottom", distance: 13, color: C.ink, fontSize: 23, fontWeight: 900 } });
    } else if (n.kind === "video") {
      Object.assign(item, {
        symbol: "circle", symbolSize: 88 * bigScale,
        itemStyle: { color: withAlpha(c, .24), borderColor: withAlpha(c, .7), borderWidth: 2.5 },
        label: { show: true, position: "inside", distance: 0, color: C.ink, fontSize: 18,
                 fontWeight: 900, textBorderColor: C.surface, textBorderWidth: 3.5 },
        emphasis: {
          itemStyle: { color: withAlpha(c, .85), borderColor: withAlpha(c, .95) },
          label: { fontSize: 19, textBorderWidth: 4 }
        }
      });
    } else if (n.kind === "comment") {
      Object.assign(item, {
        symbol: "circle", symbolSize: 3.6 + 13.2 * Math.sqrt((n.weight || 1) / comMax),
        itemStyle: { color: c, borderColor: C.surface, borderWidth: .4, opacity: .9 },
        label: { show: false },
        emphasis: {
          scale: 2.2,
          label: { show: true, position: "right", distance: 5, color: C.ink,
                   fontSize: 16, fontWeight: 700, formatter: () => n.label }
        }
      });
    } else {
      const tr = Math.max(0.0001, n.weight / termMax);
      Object.assign(item, { symbol: "circle", symbolSize: 8 + 34 * Math.pow(tr, 0.85),
        itemStyle: { color: C.surface, borderColor: c, borderWidth: 2.6,
                     shadowBlur: 5, shadowColor: withAlpha(c, .22) },
        label: { show: true, position: "bottom", distance: 7, color: C.ink,
                 fontSize: 16 + 4.5 * Math.pow(tr, 0.6),
                 fontWeight: tr >= 0.08 ? 900 : 700,
                 textBorderColor: C.surface, textBorderWidth: 2 } });
    }
    item.label = Object.assign({}, item.label, { formatter: () => n.kind === "video" ? n.label.replace("PV", "\nPV").replace("音乐会", "\n音乐会") : n.label });
    return item;
  });

  const links = vis.edges.map(e => {
    const t = byId.get(e.target), s = byId.get(e.source);
    let ls;
    if (e.layer === "sim") {
      const col = (s && s.category && catColor[s.category]) || (s && s.color) || C.muted;
      const sim = e.sim || e.weight || 0;
      ls = { color: col, opacity: .08 + .45 * sim, curveness: .18, type: [2, 3],
             width: .5 + 1.6 * Math.sqrt(sim) };
    } else if (e.layer === "mention") {
      const col = (t && t.sentiment && catColor[t.sentiment]) || C.cyan;
      ls = { color: col, opacity: .14, curveness: .12, type: "solid", width: .75 };
    } else if (e.layer === "comment") {
      ls = { color: C.muted, opacity: .022, curveness: 0, type: "solid", width: .4 };
    } else {
      const dash = !!e.pending;
      ls = {
        color: dash && t ? colorOf(t) : C.muted,
        opacity: dash ? 0.42 : 0.5,
        curveness: dash ? 0.22 : 0.06,
        type: dash ? [5, 5] : "solid",
        width: 1.0 + 3.0 * Math.sqrt(e.weight / edgeMax)
      };
    }
    return { source: e.source, target: e.target, relation: e.relation,
             layer: e.layer || "", sim: e.sim, lineStyle: ls };
  });

  // Decorative guide nodes share the graph transform, so the outline follows pan and zoom.
  const guideLinks = [];
  BrainLayout.guides(W, H, multi).forEach((path, pathIndex) => {
    const baseGuideColor = !multi ? (vids[0]?.color || C.blue) : (path.side === 0 ? C.blue : C.pink);
    const guideColor = document.documentElement.dataset.theme === "dark" && baseGuideColor.toLowerCase() === C.blue.toLowerCase() ? C.cyan : baseGuideColor;
    path.points.forEach((point, i) => {
      const id = `brain-guide:${pathIndex}:${i}`;
      data.push({id, name:"", kind:"guide", guide:true, x:point[0], y:point[1], symbolSize:0,
        label:{show:false}, tooltip:{show:false}, emphasis:{disabled:true}, itemStyle:{opacity:0}});
      if (i) guideLinks.push({source:`brain-guide:${pathIndex}:${i - 1}`, target:id, guide:true,
        tooltip:{show:false}, emphasis:{disabled:true}, lineStyle:{color:guideColor, opacity:path.outline ? 0.58 : 0.32, width:path.outline ? 2.5 : 2, curveness:0}});
    });
  });

  const option = {
    backgroundColor: "transparent",
    textStyle: { fontFamily: chartNumberFont },
    animation: false,
    tooltip: {
      backgroundColor: C.surface, borderColor: C.line, borderWidth: 2,
      textStyle: { color: C.ink, fontSize: 17 }, extraCssText: "border-radius:0;box-shadow:6px 6px 0 rgba(14,17,22,.15)",
      formatter: p => {
        if (p.data.guide) return "";
        if (p.dataType === "edge") {
          const s = byId.get(p.data.source), t = byId.get(p.data.target);
          if (p.data.layer === "sim") {
            return `<b>文本相似</b> · J=${(p.data.sim || 0).toFixed(3)}<br>` +
              `${gfEsc(s ? s.label : "")}<br>↔ ${gfEsc(t ? t.label : "")}`;
          }
          if (p.data.layer === "mention") return `评论提及词条 → <b>${gfEsc(t ? t.label : "")}</b>`;
          if (p.data.layer === "comment") return `视频 ← 评论`;
          return `${gfEsc(s ? s.label : "")} —${gfEsc(p.data.relation)}→ ${gfEsc(t ? t.label : "")}`;
        }
        const n = p.data.raw;
        if (n.kind === "term") return `<b>${gfEsc(n.label)}</b> · ${gfEsc(n.sentiment)}<br>命中 ${n.weight} 次`;
        if (n.kind === "video") return `<b>${gfEsc(n.label)}</b><br>${gfEsc(n.title || "")}`;
        if (n.kind === "comment") {
          const txt = (n.text || n.label || "");
          return `<b>${n.category ? gfEsc(n.category) + " · " : ""}${gfEsc(n.month || "")}</b><br>` +
            `${gfEsc(txt.length > 80 ? txt.slice(0, 80) + "…" : txt)}<br>` +
            `<span class="mono">♥${n.like} · 相似边 ${n.sim_degree || 0}</span>`;
        }
        return `<b>${gfEsc(n.label)}</b> · ${n.weight.toLocaleString()}`;
      }
    },
    series: [{
      type: "graph", layout: "none", roam: true, selectedMode: "single",
      center: [W / 2, H / 2], zoom: 1.136,  // 抵消 layout:none 的 0.88 内缩，让图谱真正铺满画布
      data: data, links: guideLinks.concat(links),
      labelLayout: { hideOverlap: true },
      lineStyle: { curveness: 0.08 },
      emphasis: { focus: "adjacency", scale: 1.12, lineStyle: { opacity: 1, width: 4 } },
      select: { itemStyle: { borderWidth: 5, shadowBlur: 18, shadowColor: "rgba(39,67,255,.35)" }, label: { fontSize: 21 } }
    }]
  };

  if (!gfChart) {
    const dpr = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));
    gfChart = echarts.init(el, null, { renderer: "canvas", devicePixelRatio: dpr, useDirtyRect: true });
    gfChart.on("click", p => {
      if (performance.now() - gfPanEndAt < 300) return;  // 拖拽结束后的误触 click
      if (p.dataType === "node" && !p.data.guide) gfSelect(p.data.id); else gfClose();
    });
    const zr = gfChart.getZr();

    // 平移交给 ECharts 原生 roam（内部直接改变视图变换，帧率高、不会抖）。
    // 这里仅跟踪拖拽，用于光标反馈和抑制拖拽结束后的误触 click。
    zr.on("mousedown", ev => {
      gfPan = { x: ev.offsetX, y: ev.offsetY, moved: false };
      zr.setCursorStyle("grabbing");
    });
    zr.on("mousemove", ev => {
      if (!gfPan) return;
      const dx = ev.offsetX - gfPan.x, dy = ev.offsetY - gfPan.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) gfPan.moved = true;
      gfPan.x = ev.offsetX;
      gfPan.y = ev.offsetY;
    });
    const endPan = () => {
      if (!gfPan) return;
      if (gfPan.moved) gfPanEndAt = performance.now();
      gfPan = null;
      zr.setCursorStyle("default");
    };
    zr.on("mouseup", endPan);
    zr.on("globalout", endPan);

    zr.on("click", ev => {
      if (performance.now() - gfPanEndAt < 300) return;  // 拖拽刚结束，不把这次 click 当空白点击
      if (!ev.target) gfClose();
    });
  }
  gfChart.setOption(option, true);
  // 放开 ECharts 原生 roam 的指针命中限制：从节点、边或画布外缘空白都能直接拖拽平移
  const gview = (gfChart._chartsViews || []).find(v => v && v.type === "graph" && v._controller);
  if (gview) gview._controller.setPointerChecker(() => true);
  gfTopList(vis);

  if (gfCur && byId.has(gfCur)) {
    const i = data.findIndex(d => d.id === gfCur);
    if (i >= 0) gfChart.dispatchAction({ type: "select", seriesIndex: 0, dataIndex: i });
  } else if (gfCur) {
    gfClose();
  }
}

function gfRow(k, v) {
  return `<div class="gf-row"><span>${gfEsc(k)}</span><b>${v}</b></div>`;
}

function gfBadge(s) {
  const cls = GF_BADGE[s];
  return cls ? `<span class="badge ${cls}">${gfEsc(s)}</span>` : gfEsc(s);
}

function gfVideoId(name) {
  const v = gfData.nodes.find(x => x.kind === "video" && x.label === name);
  return v ? v.id : "";
}

function gfChipList(items, limit) {
  return `<div class="gf-linklist">${items.slice(0, limit).map(t =>
    `<button type="button" data-node="${gfEsc(t.id)}">${gfEsc(t.label)} · ${t.weight}</button>`).join("")}</div>`;
}

function gfBody(n) {
  if (n.kind === "term") {
    const vids = (n.videos || []).map(gfVideoId).filter(Boolean);
    return gfRow("情感归类", gfBadge(n.sentiment)) +
      gfRow("命中次数", n.weight.toLocaleString()) +
      gfRow("出现视频", (n.videos || []).length + " / " + gfData.stats.videos) +
      (n.meaning ? `<p style="font-size:var(--type-body);line-height:1.8;margin-top:12px">${gfEsc(n.meaning)}</p>` : "") +
      ((n.aliases || []).length ? `<div style="margin-top:10px">${n.aliases.map(a => `<span class="gf-tag">${gfEsc(a)}</span>`).join("")}</div>` : "") +
      (n.examples || []).map(x => `<div class="gf-quote">${gfEsc(x)}</div>`).join("") +
      (n.note ? `<p class="muted" style="margin-top:10px;line-height:1.75">${gfEsc(n.note)}</p>` : "") +
      (vids.length ? `<div class="gf-linklist">${vids.map(id =>
        `<button type="button" data-node="${gfEsc(id)}">${gfEsc(gfData.nodes.find(x => x.id === id).label)}</button>`).join("")}</div>` : "");
  }
  if (n.kind === "category") {
    const terms = gfData.edges.filter(e => e.target === n.id)
      .map(e => gfData.nodes.find(x => x.id === e.source)).filter(Boolean)
      .sort((a, b) => b.weight - a.weight);
    return `<p style="font-size:var(--type-body);line-height:1.8">${gfEsc(GF_CAT_DESC[n.label] || "")}</p>` +
      gfRow("词典归类次数", n.weight.toLocaleString()) +
      gfRow("关联词条", terms.length + " 条") +
      gfChipList(terms, 10);
  }
  if (n.kind === "community") {
    const vids = gfData.nodes.filter(x => x.kind === "video" && x.community === n.label);
    return `<p style="font-size:var(--type-body);line-height:1.8">${gfEsc(n.community_full || "")}</p>` +
      gfRow("语料条数", window.ResearchNumbers.commentCount(n.weight || 0)) +
      gfRow("样本视频", vids.length + " 个") +
      `<div class="gf-linklist">${vids.map(v =>
        `<button type="button" data-node="${gfEsc(v.id)}">${gfEsc(v.label)}</button>`).join("")}</div>`;
  }
  if (n.kind === "comment") {
    const v = gfData.nodes.find(x => x.id === n.vid);
    const terms = n.terms || [], sims = n.sims || [];
    return `<p class="gf-quote" style="margin-top:0">${gfEsc(n.text || n.label)}</p><a class="gf-evidence-action" href="/powang-demo/comments.html?bvid=${encodeURIComponent(n.bvid || (v && v.bvid) || "")}&q=${encodeURIComponent(Array.from(n.text || n.label || "").slice(0,48).join(""))}">在证据库核对原文 ↗</a>` +
      gfRow("所属视频", gfEsc(v ? v.label : n.bvid || "—")) +
      gfRow("社区", gfEsc(n.community || "—")) +
      gfRow("归类", n.category ? gfBadge(n.category) : "未归类") +
      gfRow("归类依据", n.category ? gfEsc(n.category_source || "—") : "词典未命中，按社区底色显示") +
      gfRow("点赞", (n.like || 0).toLocaleString()) +
      gfRow("回复", window.ResearchNumbers.commentCount(n.rcount || 0)) +
      gfRow("发布时间", gfEsc(n.month || "—")) +
      gfRow("相似度核对", n.sim_degree ? `${n.sim_degree} 条 · max ${(n.max_sim || 0).toFixed(3)}` : "无相似邻居") +
      (terms.length ? `<div style="margin-top:10px">${terms.map(t =>
        `<button type="button" class="gf-tag" style="cursor:pointer;background:transparent" data-node="${gfEsc(t.id)}">${gfEsc(t.label)}</button>`).join("")}</div>` : "") +
      (sims.length ? `<div class="gf-block-h" style="margin-top:16px"><span>最相似评论</span><span>JACCARD</span></div>` +
        `<div class="gf-linklist">${sims.map(s =>
          `<button type="button" data-node="${gfEsc(s.id)}">${gfEsc(s.label)} · ${s.sim.toFixed(2)}</button>`).join("")}</div>` : "");
  }
  const terms = gfData.edges.filter(e => e.source === n.id)
    .map(e => gfData.nodes.find(x => x.id === e.target)).filter(Boolean)
    .sort((a, b) => b.weight - a.weight);
  return gfRow("社区", gfEsc(n.community || "—")) +
    gfRow("BV 号", gfEsc(n.bvid || "—")) +
    gfRow("UP 主", gfEsc(n.owner || "—")) +
    gfRow("语料条数", window.ResearchNumbers.commentCount(n.weight || 0)) +
    gfRow("总评论数", window.ResearchNumbers.commentCount(n.reply_count || 0)) +
    gfRow("锚定样本", n.anchor_count || 0) +
    gfRow("模型分析", n.analyzed ? "已完成" : "未分析") +
    (n.title ? `<p style="font-size:var(--type-small);line-height:1.75;margin-top:10px">${gfEsc(n.title)}</p>` : "") +
    gfChipList(terms, 10);
}

function gfSelect(id) {
  const n = gfData.nodes.find(x => x.id === id);
  if (!n) return;
  gfCur = id;
  document.getElementById("gfPanelKind").textContent = GF_KIND[n.kind] || n.kind;
  document.getElementById("gfPanelTitle").textContent =
    n.kind === "comment" ? `评论 · ♥${(n.like || 0).toLocaleString()}` : n.label;
  document.getElementById("gfPanelBody").innerHTML = gfBody(n);
  document.getElementById("gfPanel").classList.add("on");
  if (gfChart) {
    const i = gfChart.getOption().series[0].data.findIndex(item => item.id === id);
    if (i >= 0) gfChart.dispatchAction({ type: "select", seriesIndex: 0, dataIndex: i });
  }
}

function gfClose() {
  gfCur = "";
  document.getElementById("gfPanel").classList.remove("on");
  if (gfChart) gfChart.dispatchAction({ type: "unselect", seriesIndex: 0 });
}

document.getElementById("gfChips").addEventListener("click", e => {
  const b = e.target.closest("[data-v]");
  if (!b) return;
  gfFilter = b.dataset.v;
  gfChips();
  gfDraw();
});

document.getElementById("gfLayers").addEventListener("click", e => {
  const b = e.target.closest("[data-layer]");
  if (!b) return;
  const key = b.dataset.layer;
  gfLayers[key] = !gfLayers[key];
  b.classList.toggle("on", gfLayers[key]);
  gfDraw();
});

document.getElementById("gfPanelBody").addEventListener("click", e => {
  const b = e.target.closest("[data-node]");
  if (b) gfSelect(b.dataset.node);
});

document.getElementById("gfTop").addEventListener("click", e => {
  const b = e.target.closest("[data-node]");
  if (b) gfSelect(b.dataset.node);
});

document.getElementById("gfClose").addEventListener("click", gfClose);

document.getElementById("gfSearchForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!gfData) return;
  const q = document.getElementById("gfSearch").value.trim().toLowerCase();
  if (!q) return;
  const hit = gfData.nodes.find(n => n.label.toLowerCase().indexOf(q) >= 0)
    || gfData.nodes.find(n => (n.text || "").toLowerCase().indexOf(q) >= 0)
    || gfData.nodes.find(n => (n.meaning || "").toLowerCase().indexOf(q) >= 0)
    || gfData.nodes.find(n => (n.note || "").toLowerCase().indexOf(q) >= 0);
  if (!hit) {
    const stat = document.getElementById("gfStat");
    stat.textContent = "没有匹配的节点";
    setTimeout(gfStat, 2200);
    return;
  }
  if (gfFilter !== "全部" && !gfVisible().nodes.some(n => n.id === hit.id)) {
    gfFilter = "全部"; gfChips(); gfDraw();
  }
  gfSelect(hit.id);
});

function gfStat() {
  if (!gfData) return;
  const s = gfData.stats;
  document.getElementById("gfStat").textContent =
    `NODES ${s.nodes} · EDGES ${s.edges} · 评论 ${window.ResearchNumbers.commentCount(s.comments)} · 相似边 ${s.sim_edges} · 语料 ${window.ResearchNumbers.commentCount(s.corpus)}`;
}

window.addEventListener("themechange", () => {
  if (gfData) gfDraw();
  if (dbCur) dbSelect(dbCur);
});
let gfResizeTimer = null;
window.addEventListener("resize", () => {
  dbResizeCharts();
  if (!gfChart) return;
  clearTimeout(gfResizeTimer);
  gfResizeTimer = setTimeout(() => {
    gfChart.resize();
    gfDraw();
  }, 160);
});
