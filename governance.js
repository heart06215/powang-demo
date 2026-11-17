/* Native SVG charts keep public data readable without a CDN or chart runtime. */
(() => {
  "use strict";
  const data = window.GovernanceData;
  const commentCount = window.ResearchNumbers.commentCount;
  const categories = ["赞美", "贬低", "水军", "无意义", "社区对骂", "中立"];
  const categoryClasses = ["praise", "blame", "shui", "noise", "feud", "neutral"];
  const state = { year: 2024, trend: "scale", videos: [], loaded: false, chatController: undefined, toastTimer: undefined };

  /** @param {string} id @returns {HTMLElement} */
  function byId(id) { return document.getElementById(id); }
  /** @param {unknown} value @returns {string} */
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  /** @param {number} value @returns {string} */
  function number(value) { return new Intl.NumberFormat("zh-CN").format(value); }
  /** @param {number} days @returns {string} */
  function workDuration(days) {
    return `${number(days)} 天（约 ${(days / 365).toFixed(1)} 年）`;
  }
  /** @param {number} days @returns {string} */
  function workDurationHtml(days) {
    return `${number(days)} 天（约 <em>${(days / 365).toFixed(1)} 年</em>）`;
  }
  /** @param {string} message @returns {void} */
  function toast(message) {
    clearTimeout(state.toastTimer);
    byId("appToast").textContent = message;
    byId("appToast").hidden = false;
    state.toastTimer = setTimeout(() => { byId("appToast").hidden = true; }, 6000);
  }
  /** @param {string} url @param {RequestInit} [options] @returns {Promise<object>} */
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(15000) });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error("服务暂未返回可用数据");
    return payload.data;
  }
  /** @returns {void} */
  function renderEconomy() {
    const current = data.economy.find((row) => row.year === state.year);
    byId("gdpShare").innerHTML = `${current.share.toFixed(1)}<span>%</span>`;
    byId("donutFill").setAttribute("stroke-dasharray", `${current.share} 100`);
    byId("gdpDonut").setAttribute("aria-label", `${current.year}年数字经济占GDP的${current.share}%`);
    byId("donutYear").textContent = `${current.year} 年`;
    byId("digitalLegend").textContent = `${current.share.toFixed(1)}%`;
    byId("otherLegend").textContent = `${(100 - current.share).toFixed(1)}%`;
    byId("economyScale").textContent = current.scale.toFixed(1);
    byId("shareChange").innerHTML = `+${current.shareChange.toFixed(1)}<small> 个百分点</small>`;
    byId("shareSource").textContent = `来源：${current.source} ↗`;
    byId("shareSource").href = current.url;
    renderGrowth();
  }
  /** @returns {void} */
  function renderGrowth() {
    const isScale = state.trend === "scale";
    const current = data.economy.find((row) => row.year === state.year);
    const first = data.economy[0];
    const unit = isScale ? "万亿元" : "%";
    byId("growthValue").innerHTML = `${current[state.trend].toFixed(1)}<small> ${unit}</small>`;
    byId("growthDescription").textContent = `${current.year} 年${isScale ? "数字经济规模" : "占 GDP 比重"}`;
    byId("growthBadge").textContent = isScale
      ? `较 2020 年 +${((current.scale / first.scale - 1) * 100).toFixed(1)}%`
      : `较 2020 年 +${(current.share - first.share).toFixed(1)} 个百分点`;
    byId("trendLegend").textContent = isScale ? "数字经济规模（万亿元）" : "占 GDP 比重（%）";
    byId("growthChart").setAttribute("aria-label", data.economy.map((row) => `${row.year}年${row[state.trend]}${unit}`).join("；"));
    const chartWidth = Math.max(220, Math.round(byId("growthChart").clientWidth));
    const bounds = { left: 48, right: chartWidth - 28, top: 32, bottom: 212 };
    const minimum = isScale ? 30 : 35;
    const maximum = isScale ? 65 : 45;
    const axisValues = isScale ? [30, 40, 50, 60] : [35, 37.5, 40, 42.5, 45];
    const points = data.economy.map((row, index) => ({
      x: bounds.left + index * (bounds.right - bounds.left) / (data.economy.length - 1),
      y: bounds.bottom - (row[state.trend] - minimum) / (maximum - minimum) * (bounds.bottom - bounds.top),
      value: row[state.trend], year: row.year
    }));
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
    const grid = axisValues.map((value) => {
      const y = bounds.bottom - (value - minimum) / (maximum - minimum) * (bounds.bottom - bounds.top);
      return `<line class="chart-grid" x1="${bounds.left}" y1="${y}" x2="${bounds.right}" y2="${y}"/><text class="chart-label" x="36" y="${y + 4}" text-anchor="end">${value}</text>`;
    }).join("");
    byId("growthChart").innerHTML = `<svg viewBox="0 0 ${chartWidth} 250" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${grid}<path class="chart-area" d="${line} L${bounds.right},${bounds.bottom} L${bounds.left},${bounds.bottom} Z"/><path class="chart-line" d="${line}"/>${points.map((point, index) => {
      const showValue = chartWidth >= 420 || index === 0 || index === points.length - 1 || point.year === state.year;
      return `<circle class="chart-point${point.year === state.year ? " active" : ""}" cx="${point.x}" cy="${point.y}" r="${point.year === state.year ? 5 : 3.5}"/>${showValue ? `<text class="chart-value" x="${point.x}" y="${point.y - 14}" text-anchor="middle">${point.value.toFixed(1)}${isScale ? "" : "%"}</text>` : ""}<text class="chart-label" x="${point.x}" y="240" text-anchor="middle">${point.year}</text>`;
    }).join("")}</svg>`;
  }
  /** @param {number} count @param {number} seconds @param {number} efficiency @param {number} reviewRate @param {number} seedCount
   * @returns {{throughput:number, manualDays:number, manualCost:number, assistedLabels:number, assistedDays:number, assistedCost:number}}
   */
  function calculateAnnotationBudget(count, seconds, efficiency, reviewRate, seedCount) {
    const config = data.annotationBudget;
    const throughput = Math.floor(config.hoursPerDay * 3600 * efficiency / seconds);
    const seeds = Math.min(count, seedCount);
    const assistedLabels = seeds + Math.ceil((count - seeds) * reviewRate);
    const manualDays = Math.ceil(count / throughput);
    const assistedDays = Math.ceil(assistedLabels / throughput);
    return { throughput, manualDays, manualCost: manualDays * config.dayWage, assistedLabels, assistedDays, assistedCost: assistedDays * config.dayWage };
  }
  /** @returns {void} */
  function renderCosts() {
    const config = data.annotationBudget;
    const count = config.videos.reduce((sum, video) => sum + video.onlineCount, 0);
    const baseline = calculateAnnotationBudget(count, config.secondsPerItem, 1, config.reviewRate, config.seedCount);
    byId("heroThroughput").textContent = number(baseline.throughput);
    byId("heroOnlineCount").textContent = commentCount(count);
    byId("onlineScaleTotal").textContent = commentCount(count);
    byId("onlineVideoCounts").innerHTML = config.videos.map((video) => `<article class="online-video-count"><span>${escapeHtml(video.community)} · 线上评论数</span><h3><a href="${video.videoUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(video.name)} ↗</a></h3><div><strong>${commentCount(video.onlineCount)}</strong><span>条</span></div><small>${escapeHtml(video.bvid)}</small></article>`).join("");
    const ranking = config.rankingReference;
    byId("onlineRankingNote").textContent = `排名依据：UP 主${ranking.owner}公开榜单（${ranking.dataDate}，仅视频稿件），非官方实时排名；评论计数核对于 ${config.commentCountVerifiedAt}。`;
    byId("onlineRankingSource").href = ranking.url;
    byId("heroOnlineDays").innerHTML = `1 人工作 ${workDurationHtml(baseline.manualDays)}`;
    byId("heroOnlineCost").textContent = (baseline.manualCost / 10000).toFixed(1);
    const seconds = Number(byId("budgetSeconds").value);
    const efficiency = Number(byId("budgetEfficiency").value);
    const reviewRate = Number(byId("budgetReview").value);
    const result = calculateAnnotationBudget(count, seconds, efficiency, reviewRate, config.seedCount);
    state.budget = { ...result, count, seconds, efficiency, reviewRate };
    byId("budgetThroughput").textContent = number(result.throughput);
    byId("budgetManualCost").textContent = number(result.manualCost);
    byId("budgetManualDays").innerHTML = `元 · 1 人工作 ${workDurationHtml(result.manualDays)}`;
    byId("budgetAssistedCost").textContent = number(result.assistedCost);
    byId("budgetAssistedDays").innerHTML = `元 · 1 人工作 ${workDurationHtml(result.assistedDays)} · ${commentCount(result.assistedLabels)} 条人工任务`;
    byId("budgetScopeNote").textContent = `线上视频评论总数 ${commentCount(count)} 条：${config.videos.map((video) => `${video.name} ${commentCount(video.onlineCount)} 条`).join("；")}。核对时间：${config.commentCountVerifiedAt}。`;
    byId("budgetCountSources").innerHTML = `计数来源：${config.videos.map((video) => `<a href="${video.countUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(video.name)} · 平台公开接口 ↗</a>`).join(" / ")}；字段 ${escapeHtml(config.commentCountField)}。`;
    const difference = result.manualCost - result.assistedCost;
    const percent = result.manualCost ? difference / result.manualCost * 100 : 0;
    byId("budgetDifference").textContent = `本情景的人工预算差额：${number(difference)} 元（${percent.toFixed(1)}%）。仅比较人工部分，模型费用与达到目标质量的复核投入另计。`;
    byId("budgetVideoRows").innerHTML = config.videos.map((video) => {
      const videoBudget = calculateAnnotationBudget(video.onlineCount, seconds, efficiency, reviewRate, 0);
      return `<tr><th scope="row"><a href="${video.videoUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(video.name)}</a> / ${escapeHtml(video.community)}</th><td>${commentCount(video.onlineCount)}</td><td>1 人工作 ${workDuration(videoBudget.manualDays)}</td><td>${number(videoBudget.manualCost)}</td></tr>`;
    }).join("");
    byId("budgetFormula").textContent = `日通量 = 8 × 3,600 × ${(efficiency * 100).toFixed(0)}% ÷ ${seconds} = ${number(result.throughput)} 条。1 人所需工作天数 = 向上取整（${commentCount(count)} ÷ ${number(result.throughput)}）。模型辅助的人工任务 = ${config.seedCount} 条示范 + 向上取整〔（${commentCount(count)} − ${config.seedCount}）× ${(reviewRate * 100).toFixed(0)}%〕= ${commentCount(result.assistedLabels)} 条；人工工资 = 1 人 × 工作天数 × 150 元 / 人 / 天。`;
  }
  /** @returns {void} */
  function renderEconomyComparison() {
    const comparison = data.economyComparison;
    const share = data.economy.find((row) => row.year === comparison.year).share;
    const digitalUsd = comparison.chinaGdpUsd * share / 100;
    const { russia, ukraine } = comparison.militaryExpenditureUsd;
    const benchmarks = [
      ...comparison.comparisonGdpUsd,
      { name: "俄乌两国全年军费合计", amount: russia + ukraine }
    ];
    byId("comparisonFormula").textContent =
      `中国 GDP ${(comparison.chinaGdpUsd / 1e12).toFixed(2)} 万亿美元 × ${share.toFixed(1)}% ≈ ${(digitalUsd / 1e12).toFixed(2)} 万亿美元数字经济。`;
    byId("comparisonRatios").innerHTML = benchmarks.map(({ name, amount }) =>
      `<div><dt>${escapeHtml(name)}</dt><dd><strong>${(digitalUsd / amount).toFixed(2)}</strong> 倍</dd></div>`
    ).join("");
    byId("comparisonSources").innerHTML = `GDP 取世界银行名义美元。军费取 SIPRI 的 2024 年度估算，俄罗斯 ${number(russia / 1e8)} 亿美元、乌克兰 ${number(ukraine / 1e8)} 亿美元。军费为当年各自总军费，GDP 与军费仅作规模对照。<br><a class="text-link" href="${escapeHtml(comparison.gdpUrl)}" target="_blank" rel="noopener noreferrer">世界银行 GDP 原始数据 ↗</a> · <a class="text-link" href="${escapeHtml(comparison.militaryUrl)}" target="_blank" rel="noopener noreferrer">SIPRI 2024 年军费报告 ↗</a>`;
  }
  /** @returns {void} */
  function renderNews() {
    byId("newsCases").innerHTML = data.newsCases.map((item) => `<article class="news-card"><header><span class="tag neutral">${escapeHtml(item.kind)}</span><time datetime="${item.date}">报道日期：${item.date}</time></header><h3>${escapeHtml(item.title)}</h3><div class="news-analysis"><div><strong>事件简述</strong><p>${escapeHtml(item.facts)}</p></div><div><strong>语境不明的处置难点</strong><p>${escapeHtml(item.difficulty)}</p></div></div><a class="text-link" href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source)} · 阅读原文 ↗</a></article>`).join("");
  }
  /** @param {{title: string, url: string}[]} sources @returns {string} */
  function caseLinks(sources) {
    return sources.map(({ title, url }) =>
      `<a class="text-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)} ↗</a>`
    ).join("");
  }
  /** @returns {void} */
  function renderLegalEvidence() {
    byId("legalCases").innerHTML = data.legalCases.map((item) =>
      `<div><span class="tag neutral">${escapeHtml(item.label)}</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.facts)}</p><div class="legal-case-links">${caseLinks(item.sources)}</div></div>`
    ).join("");
    byId("architectureSteps").innerHTML = data.architecture.map((item) =>
      `<article><span>${escapeHtml(item.step)}</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.description)}</p><a href="${escapeHtml(item.href)}">${escapeHtml(item.action)} ↗</a></article>`
    ).join("");
    const evidence = data.officialLegalGaps;
    byId("officialGapStatus").textContent = evidence.draftStatus;
    byId("legalConflictCases").innerHTML = data.legalConflicts.map((item) => {
      const gap = item.decision - item.marketValue;
      const gapText = gap === 0 ? "与成交金额持平"
        : gap > 0 ? `比成交金额高 <strong>${number(gap)}</strong> 元`
        : `低于成交金额 <strong>${number(-gap)}</strong> 元`;
      return `<article>
      <h5>${escapeHtml(item.title)}</h5>
      <dl class="legal-comparison">
        <div><dt>${escapeHtml(item.marketLabel)}</dt><dd><strong>${number(item.marketValue)}</strong> 元</dd></div>
        <div><dt>${escapeHtml(item.decisionLabel)}</dt><dd><strong>${number(item.decision)}</strong> 元</dd></div>
      </dl>
      <p class="legal-difference">${gapText}</p>
      <p>${escapeHtml(item.reason)}</p>
      <div class="legal-case-links">${caseLinks(item.sources)}</div>
    </article>`;
    }).join("");
    byId("officialGapQuotes").innerHTML = evidence.quotes.map((quote) =>
      `<blockquote cite="${escapeHtml(evidence.url)}"><p>“${escapeHtml(quote)}”</p></blockquote>`
    ).join("");
    byId("officialGapSource").innerHTML = `<cite>${escapeHtml(evidence.publisher)} · ${escapeHtml(evidence.document)} · ${escapeHtml(evidence.locator)}</cite><a class="text-link" href="${evidence.url}" target="_blank" rel="noopener noreferrer">核对完整官方原文 ↗</a>`;
  }
  /** @returns {void} */
  function renderSources() {
    byId("economyTable").innerHTML = data.economy.map((row) => `<tr><th scope="row">${row.year}</th><td>${row.scale.toFixed(1)}</td><td>${row.share.toFixed(1)}%</td><td><a href="${row.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.source)} ↗</a></td></tr>`).join("");
    byId("lawList").innerHTML = data.laws.map((law) => `<article class="law-row"><div class="law-date">${law.date}<small>施行日期</small></div><div><h4>${law.title}</h4><div class="law-meta"><span class="tag">${law.topic}</span><span>${law.issuer} · ${law.articles}</span></div><p>${law.description}</p></div><a class="text-link" href="${law.url}" target="_blank" rel="noopener noreferrer" aria-label="阅读${law.title}官方原文">官方原文 ↗</a></article>`).join("");
    byId("competitionReferences").innerHTML = data.competitions.map((item) => `<article><span>${item.contest}</span><span class="tag">${item.award}</span><h4><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title} ↗</a></h4><p>${item.takeaway}</p></article>`).join("");
  }
  /** @param {object[]} videos @returns {Object<string, number>} */
  function countsFor(videos) {
    return Object.fromEntries(categories.map((category) => [category, videos.reduce((sum, video) => sum + (Number(video.analysis?.[category]) || 0), 0)]));
  }
  /** @returns {object[]} */
  function selectedVideos() {
    const selected = byId("communitySelect").value;
    return state.videos.filter((video) => selected === "all" || video.bvid === selected);
  }
  /** @returns {void} */
  function renderCommunities() {
    const videos = selectedVideos();
    const counts = countsFor(videos);
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const samples = videos.reduce((sum, video) => sum + (Number(video.corpus_count) || 0), 0);
    byId("communitySummary").textContent = `${videos.map((video) => video.community || video.name).join(" / ") || "尚未配置社区"} · 已分类 ${commentCount(total)} 条 / 按视频去重语料 ${commentCount(samples)} 条`;
    if (!total) {
      byId("categoryBars").innerHTML = '<div class="empty-state">尚无分类结果。<a href="/powang-demo/label.html">前往人工标注与分析</a>，建立研究样本。</div>';
      return;
    }
    byId("categoryBars").innerHTML = categories.map((category, index) => {
      const percent = counts[category] / total * 100;
      return `<div class="category-row category-${categoryClasses[index]}"><span>${ResearchUI.categoryLabel(category)}</span><div class="category-track" aria-hidden="true"><div class="category-fill" style="width:${percent.toFixed(2)}%"></div></div><strong>${commentCount(counts[category])}</strong><span>${percent.toFixed(1)}%</span></div>`;
    }).join("");
  }
  /** @returns {void} */
  function renderEvidence() {
    const videos = new Map(data.annotationBudget.videos.map((video) => [video.bvid, video]));
    byId("evidenceCards").innerHTML = data.hardComments.map(({ bvid, rpid, text, difficulty }) => {
      const video = videos.get(bvid);
      const query = new URLSearchParams({ bvid, q: text });
      return `<article class="evidence-card">
        <div class="evidence-top"><span class="tag neutral">${escapeHtml(video.community)} · 圈层原文</span></div>
        <blockquote>${escapeHtml(text)}</blockquote>
        <details><summary>为什么难标</summary><p>${escapeHtml(difficulty)}</p><p>样本标识：${escapeHtml(rpid)}</p></details>
        <a class="evidence-link" href="/powang-demo/comments.html?${escapeHtml(query.toString())}"><span>${escapeHtml(video.name)}</span><span>核对样本 ↗</span></a>
      </article>`;
    }).join("");
  }
  /** @returns {Promise<void>} */
  async function loadLocalData() {
    byId("retryData").disabled = true;
    byId("dataError").hidden = true;
    byId("connectionState").textContent = "正在连接数据";
    try {
      const result = await request("/api/videos");
      state.videos = result.videos || [];
      state.loaded = true;
      const sampleCount = state.videos.reduce((sum, video) => sum + (Number(video.corpus_count) || 0), 0);
      const analyzed = Object.values(countsFor(state.videos)).reduce((sum, value) => sum + value, 0);
      byId("sampleCount").textContent = commentCount(sampleCount);
      byId("analyzedCount").textContent = commentCount(analyzed);
      byId("anchorCount").textContent = commentCount(state.videos.reduce((sum, video) => sum + (Number(video.anchor_count) || 0), 0));
      byId("communityCount").textContent = number(new Set(state.videos.map((video) => video.community).filter(Boolean)).size);
      byId("communityNames").textContent = [...new Set(state.videos.map((video) => video.community).filter(Boolean))].join(" / ") || "尚未配置社区";
      byId("analysisCoverage").textContent = sampleCount ? `标签覆盖 ${(analyzed / sampleCount * 100).toFixed(1)}%` : "暂无采集样本";
      byId("connectionState").innerHTML = '<span class="status-dot"></span>本地数据已连接';
      const previousSelection = byId("communitySelect").value;
      byId("communitySelect").innerHTML = '<option value="all">全部研究社区</option>' + state.videos.map((video) => `<option value="${escapeHtml(video.bvid)}">${escapeHtml(video.community || "社区")} · ${escapeHtml(video.name)}</option>`).join("");
      if (state.videos.some((video) => video.bvid === previousSelection)) byId("communitySelect").value = previousSelection;
      renderCommunities();
    } catch {
      state.loaded = false;
      byId("connectionState").textContent = "本地数据连接失败";
      byId("dataError").hidden = false;
      byId("dataErrorText").textContent = "暂时无法读取本地评论数据，请确认项目服务运行后重新连接。公开经济数据仍可浏览。";
      byId("communitySummary").textContent = "本地评论数据暂不可用";
      byId("categoryBars").innerHTML = '<div class="empty-state">数据读取失败，请点击上方“重新连接”。</div>';
      for (const id of ["sampleCount", "analyzedCount", "anchorCount", "communityCount"]) byId(id).textContent = "—";
      byId("analysisCoverage").textContent = "数据暂不可用";
    } finally { byId("retryData").disabled = false; }
  }
  /** @param {string} filename @param {string} content @returns {void} */
  function downloadText(filename, content) {
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("已生成研究文件，可在浏览器下载记录中查看。");
  }
  /** @param {boolean} policyOnly @returns {void} */
  function exportResearch(policyOnly) {
    const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai" }).format(new Date());
    const lines = ["# 澄明 · 网络生态治理与立法研究", "", `导出日期：${date}（北京时间）`, "", "## 研究定位", "围绕反讽、圈层黑话与复读中的语境歧义，整理模型标签、原始评论与人工复核材料，支持我国网络治理规则细化与立法研究。", ""];
    const evidence = data.officialLegalGaps;
    lines.push("## 官方起草说明指出的制度问题", `${evidence.publisher}，${evidence.publishedOn} 发布。${evidence.document}，${evidence.locator}。`, ...evidence.quotes.flatMap((quote) => ["", `> ${quote}`]), "", `官方原文：${evidence.url}`, evidence.draftStatus, evidence.enforcementGap, "");
    if (!policyOnly) {
      lines.push("## 本地样本概况", state.loaded ? "数据来源：本项目本地语料与已保存的模型分析。" : "本地数据未成功加载，本次导出不包含样本统计。", "");
      if (state.loaded) lines.push(`精选后不重复评论样本语料 ${commentCount(state.videos.reduce((sum, video) => sum + (Number(video.corpus_count) || 0), 0))} 条，按视频内文本去重。`);
      if (state.loaded) for (const video of state.videos) lines.push(`- ${video.name}（${video.community || "研究社区"}，${video.bvid}）：去重语料 ${commentCount(video.corpus_count || 0)} 条；分类 ${commentCount(Object.values(countsFor([video])).reduce((sum, value) => sum + value, 0))} 条；人工锚定 ${commentCount(video.anchor_count || 0)} 条。`, `  分类统计：${categories.map((category) => `${category} ${commentCount(video.analysis?.[category] || 0)}`).join("；")}。`);
      lines.push("", "## 数字经济背景", "中国信通院测算口径（数字产业化与产业数字化），历年公开发布值，未作经济普查回溯调整。", ...data.economy.map((row) => `- ${row.year} 年：规模 ${row.scale} 万亿元，占 GDP ${row.share}%。来源：${row.source} ${row.url}`), "", "国家统计局口径：2024 年数字经济核心产业增加值 14.0891 万亿元，占 GDP 10.5%，与上述统计范围不同。", "来源：https://www.stats.gov.cn/sj/zxfbhjd/202512/t20251230_1962177.html", "");
    }
    lines.push("## 游戏账号估值与民间协作", ...data.legalCases.map((item) => `- ${item.title}。${item.facts} 来源：${item.sources.map(({ url }) => url).join("、")}`), "",
      "## 追责冲突案例",
      ...data.legalConflicts.map((item) => {
        const gap = item.decision - item.marketValue;
        const gapText = gap === 0 ? "与成交金额持平" : gap > 0 ? `比成交金额高 ${number(gap)} 元` : `低于成交金额 ${number(-gap)} 元`;
        return `- ${item.title}。${item.marketLabel} ${number(item.marketValue)} 元，${item.decisionLabel} ${number(item.decision)} 元，${gapText}。${item.reason} 来源：${item.sources.map(({ url }) => url).join("、")}`;
      }), "",
      "## 研究方法与系统实现", ...data.architecture.map((item) => `- ${item.step} ${item.title}。${item.description}`), "");
    lines.push("## 二次审查与立法研究材料用途", "分析报告与评论证据可导出 ZIP、CSV、JSON；保留原文来源、模型标签、理由和已有人工标注，供二次审查或作为立法研究材料数据集使用。模型标签不替代人工审查。", "", "## 待论证的研究问题", "1. 如何结合语境与人工复核，区分正常批评、玩梗与人身攻击？", "2. 疑似刷评需要哪些文本之外的证据，才能验证是否存在组织化操纵？", "3. 平台如何建立有解释、可复核的评论治理流程，保护用户合法表达？", "4. 现有规则在隐晦攻击、跨社区传播和证据留存方面有哪些需要进一步调研的难点？", "", "## 证据整理提纲", "- 界定样本范围、采集时间与去重方法；记录样本代表性和选择偏差。", "- 留存评论标识、来源视频、上下文、分类理由、人工复核意见和修订记录。", "- 逐项关联现行规则，明确事实缺口，开展实证与规范论证。", "- 提出研究建议，并评估对合法表达、隐私保护和申诉救济的影响。", "", "## 官方规则参考", ...data.laws.map((law) => `- ${law.title}（${law.date} 施行，参考 ${law.articles}）：${law.url}`), "", "## 研究边界", "本项目目前研究已配置的视频社区样本，不代表全网。模型标签与置信度不是违法认定、付费刷评证明或准确率。规则关联由研究人员整理，不是自动法律裁决。研究提纲需要人工核查与后续论证。", "", `公开经济资料核验日期：${data.verifiedOn}。`);
    lines.push("", "## 语境认定与制度细化", "迷惑性评论可能因反讽、圈层语义与上下文缺失而难以单句判读。当前没有独立测试结果支持识别准确率，不以标签覆盖率代替正确率。", "本项目提出的研究问题是认定尺度、证据要求和复核程序如何细化，不主张我国没有相关法律法规。", "", "## 立法进展资料（与现行规则区分）", `${data.legislation.title}：${data.legislation.date} 发布的${data.legislation.status}。${data.legislation.note}`, data.legislation.url, `法律资料核验：${data.legalVerifiedOn}。`, "模型参照人工锚定示例分类；参数微调增益、识别准确率与实际总成本仍需独立对照评测。");
    const practice = data.projectPractice;
    lines.push("", "## 本项目当前成本", "少量人工示范、圈层知识检索和批量模型分类复用人工经验；原文、理由与复核记录形成证据闭环。", `项目成本≈${practice.approxCost}元（${practice.basis}，${practice.verifiedOn}）；${practice.developers} 人独立完成，${practice.modelBasis}。${practice.note}`, "当前样本实践与线上全量工资估算为不同规模，不能将免费额度外推为全量无限免费。");
    if (!policyOnly && state.budget) {
      const budget = state.budget;
      lines.push("", "## 人工标注预算（假设情景）", `数据范围：两个线上视频评论总数，${commentCount(budget.count)} 条。核对时间：${data.annotationBudget.commentCountVerifiedAt}。`, ...data.annotationBudget.videos.map((video) => `- ${video.name}：${commentCount(video.onlineCount)} 条。来源：${video.countUrl}，字段 ${data.annotationBudget.commentCountField}。`), `按 ${budget.seconds} 秒/条、每天 8 小时中 ${(budget.efficiency * 100).toFixed(0)}% 为有效标注、日薪 150 元计算：${number(budget.throughput)} 条 / 人 / 天。`, `全人工：1 人工作 ${workDuration(budget.manualDays)}，${number(budget.manualCost)} 元。`, `全量雇工复核情景：107 条示范 + ${(budget.reviewRate * 100).toFixed(0)}% 剩余样本抽检：${commentCount(budget.assistedLabels)} 条人工任务，1 人工作 ${workDuration(budget.assistedDays)}，人工部分 ${number(budget.assistedCost)} 元。`, "费用按完整工作日向上取整，年数按 365 天换算且未扣休息日。后续更多预估立法评估用费用未纳入计算，包括标注后的数据整理、总结分析与研究论证；模型推理、招聘培训、术语维护、争议仲裁和额外质检也需要另行预算。抽检比例未经质量实测，人工差额不代表总成本节省。线上评论计数为公开接口返回的核对时快照，不等于本地采集量，实际可标注量还受删除、可访问性与去重影响。");
    }
    lines.push("", "## 样本在平台中的范围", `这只是 bilibili 一个视频平台的两个视频。UP 主${data.annotationBudget.rankingReference.owner}的公开榜单将其列为评论量前二，数据日期为 ${data.annotationBudget.rankingReference.dataDate}，非官方实时排名，且仅统计视频稿件。`, data.annotationBudget.rankingReference.url, "", "## 圈层知识与人才门槛", "圈内黑话、人物关系和事件沿革不是通用知识。标注人员需理解圈层语境并统一分类口径；研究人员还要兼具证据整理、数据分析、研究设计和治理规则知识，复合能力更难组织。模型方案旨在复用人工经验，减少全量逐条归类，把稀缺人力用于难例复核和研究论证。", "", "## 国内事件与语境核查", ...data.newsCases.map((item) => `- ${item.date} ${item.title}（${item.source}）。${item.url}\n  事件简述：${item.facts}\n  语境不明的处置难点：${item.difficulty}`), "新闻资料用于展示治理需求，识别成效以本项目已完成样本为准。");
    downloadText(`澄明-${policyOnly ? "立法研究提纲" : "治理研究摘要"}-${date}.md`, lines.join("\n"));
  }
  /** @param {string} role @param {string} message @returns {HTMLElement} */
  function addMessage(role, message) {
    byId("chatMessages").querySelector(".assistant-welcome")?.remove();
    const node = document.createElement("div"); node.className = `chat-message ${role}`;
    const label = document.createElement("small"); label.textContent = role === "user" ? "研究提问" : "澄明 · AI 助手";
    const body = document.createElement("span"); body.textContent = message;
    node.append(label, body); byId("chatMessages").append(node); byId("chatMessages").scrollTop = byId("chatMessages").scrollHeight;
    return node;
  }
  /** @param {SubmitEvent} event @returns {Promise<void>} */
  async function sendQuestion(event) {
    event.preventDefault();
    const question = byId("chatQuestion").value.trim();
    if (!question || state.chatController) return;
    addMessage("user", question);
    const reply = addMessage("assistant", "正在分析本地研究数据…");
    const controller = new AbortController(); state.chatController = controller;
    byId("sendQuestion").disabled = true; byId("stopQuestion").hidden = false;
    byId("chatForm").setAttribute("aria-busy", "true");
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
    try {
      const result = await request("/api/agent/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }), signal: controller.signal });
      ResearchUI.renderTrace(reply, result.trace || []);
      reply.querySelector("span").textContent = typeof result.answer === "string" ? result.answer : "模型未返回文本回答，请调整问题后重试。";
      byId("chatQuestion").value = "";
    } catch {
      reply.classList.add("error");
      reply.querySelector("span").textContent = controller.signal.aborted
        ? (timedOut ? "回答等待超时。问题已保留，可以重试或缩小问题范围。" : "已停止等待本次回答。问题已保留，可修改后重新发送。")
        : "暂时无法获取回答，请检查模型服务配置后重试。问题已保留。";
    } finally {
      clearTimeout(timeout); state.chatController = undefined;
      byId("sendQuestion").disabled = false; byId("stopQuestion").hidden = true; byId("chatForm").removeAttribute("aria-busy");
      byId("chatMessages").scrollTop = byId("chatMessages").scrollHeight;
    }
  }
  /** @returns {void} */
  function bindEvents() {
    ["budgetSeconds", "budgetEfficiency", "budgetReview"].forEach((id) => byId(id).addEventListener("change", renderCosts));
    byId("exportGapResearch").addEventListener("click", () => exportResearch(true));
    byId("economyYear").addEventListener("change", (event) => { state.year = Number(event.target.value); renderEconomy(); });
    document.querySelectorAll("[data-trend]").forEach((button) => button.addEventListener("click", () => {
      state.trend = button.dataset.trend;
      document.querySelectorAll("[data-trend]").forEach((item) => { item.classList.toggle("selected", item === button); item.setAttribute("aria-pressed", String(item === button)); });
      renderGrowth();
    }));
    byId("communitySelect").addEventListener("change", renderCommunities);
    byId("retryData").addEventListener("click", loadLocalData);
    byId("exportReport").addEventListener("click", () => exportResearch(false));
    byId("exportPolicy").addEventListener("click", () => exportResearch(true));
    document.querySelectorAll('a[href="#dataSources"]').forEach((link) => link.addEventListener("click", () => { byId("sourceDetails").open = true; }));
    byId("chatForm").addEventListener("submit", sendQuestion);
    byId("chatQuestion").addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); byId("chatForm").requestSubmit(); } });
    byId("stopQuestion").addEventListener("click", () => state.chatController?.abort());
    byId("clearChat").addEventListener("click", () => { state.chatController?.abort(); byId("chatMessages").replaceChildren(); byId("chatQuestion").focus(); });
    document.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => { byId("chatQuestion").value = button.dataset.prompt; byId("chatQuestion").focus(); }));

  }
  state.year = Number(byId("economyYear").value);
  renderCosts(); renderNews(); renderLegalEvidence(); renderEvidence();
  renderEconomy(); renderEconomyComparison(); renderSources(); bindEvents(); loadLocalData();
  new ResizeObserver(renderGrowth).observe(byId("growthChart"));
})();
