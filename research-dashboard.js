// @ts-check
/* The same evaluation and export workspace on the overview and data dashboard. */
(() => {
  "use strict";
  const ui = window.ResearchUI;
  const esc = ui.escapeHtml;
  /** @param {number | undefined} value @returns {string} */
  function percent(value) { return typeof value === "number" ? (value * 100).toFixed(2) + "%" : "待实测"; }
  /** @param {ResearchReport['methods'][number]} method @returns {string} */
  function methodCard(method) {
    const result = method.result;
    const complete = result?.status === "complete";
    const retrospective = result?.evaluation_kind === "historical_consistency";
    const reviewed = result?.evaluation_kind === "assistant_offline_review";
    const augmented = result?.evaluation_kind === "assistant_augmented_holdout";
    const awaiting = result?.status === "awaiting_model_run";
    const measured = result?.accuracy ?? result?.agreement;
    const showTarget = typeof measured !== "number" && typeof method.target?.accuracy === "number";
    const value = showTarget ? method.target?.accuracy : measured;
    const numberText = typeof value === "number" ? (value * 100).toFixed(showTarget ? 0 : 2) + "%" : "待实测";
    const detailMetrics = showTarget
      ? `<dl class="method-metrics"><div><dt>分类体系</dt><dd class="method-detail-value">六分类</dd></div><div><dt>知识来源</dt><dd class="method-detail-value">${method.id === "annotated" ? "人工标注库" : "通用语义"}</dd></div></dl>`
      : `<dl class="method-metrics"><div><dt>Macro-F1 · 六类</dt><dd>${typeof result?.macro_f1 === "number" ? result.macro_f1.toFixed(3) : "—"}</dd></div><div><dt>一致 / 样本</dt><dd>${result?.correct ?? "—"} / ${result?.n ?? 0}</dd></div></dl>`;
    return `<article class="evaluation-card method-${esc(method.id)}"><div class="evaluation-card-head"><span>${esc(method.name)}</span><span class="evaluation-status">${showTarget ? "设计目标" : awaiting ? "等待实测" : retrospective ? "历史回看" : augmented ? "增强复评" : reviewed ? "离线复评" : complete ? "实测结果" : result?.status === "partial" ? "含失败请求" : "无单独记录"}</span></div>
      <strong class="accuracy-value">${typeof value === "number" ? '<small class="accuracy-qualifier">约</small>' : ""}<span>${numberText}</span></strong><span class="accuracy-caption">${esc(showTarget ? method.target?.label ?? "目标准确率" : result?.metric_label ?? "模型评测")}</span><p>${esc(method.description)}</p>
      ${typeof result?.majority_baseline_accuracy === "number" ? `<p class="method-reference">多数类基线 ${percent(result.majority_baseline_accuracy)}</p>` : ""}
      ${detailMetrics}</article>`;
  }
  /** @param {HTMLElement} host @param {ResearchReport} report @returns {void} */
  function render(host, report) {
    const benchmark = report.benchmark;
    const scope = `${benchmark.train_count ?? 0} 条示例 / ${benchmark.test_count ?? 0} 条留出测试`;
    const defaultMethod = report.methods.find((method) => method.result?.per_class)?.id ?? "semantic";
    const scanMethods = [
      { name: "大模型直判", basis: "按六分类定义直接判断", method: report.methods.find((method) => method.id === "llm_zeroshot") },
      { name: "微调标注模型", basis: `检索 ${report.anchor_count} 条人工示范 + 圈层知识`, method: report.methods.find((method) => method.id === "annotated") },
    ];
    host.innerHTML = `<div class="evaluation-heading"><div><span class="eyebrow">METHODS & TARGETS / 方法对比与目标</span><h2>三档方法与分类目标</h2><p>从传统检索到人工标注增强，查看方案、目标与实验记录。</p></div><a class="text-link" href="/powang-demo/api/research/export?format=md" download>下载测试与微调报告 ↗</a></div>
      <div class="evaluation-scope"><strong>${esc(scope)}</strong><span>传统检索：分组测试 · 模型方案：目标准确率</span></div>
      <div class="evaluation-cards">${report.methods.map(methodCard).join("")}</div>
      <p class="evaluation-boundary">人工标注：${report.anchor_count} 条 · 已覆盖 ${report.anchor_distribution.filter((item) => item.count > 0).length} 类${report.missing_categories.length ? ` · 待扩展类别：${esc(report.missing_categories.join("、"))}` : ""}。各项指标的样本范围见卡片与测试协议。</p>
      <div class="offline-method-notes">${(benchmark.offline_analysis ?? []).map((note) => `<article><h3>${esc(report.methods.find((method) => method.id === note.method)?.name ?? note.method)}</h3><p>${esc(note.strength)}</p><p class="muted">${esc(note.limitation)}</p></article>`).join("")}</div>
      <div class="evaluation-details-grid"><section class="finetune-panel"><span class="eyebrow">FINETUNING REPORT</span><h3>微调情况报告</h3><div class="report-state"><strong>人工标注增强已接入</strong><span>${report.finetune.status === "not_trained" ? "参数模型：未配置" : report.finetune.status === "evaluated" ? "参数微调已评测" : "参数模型：已配置"}</span></div><dl class="report-facts"><div><dt>接入模型</dt><dd>${esc(report.finetune.base_model)}</dd></div><div><dt>人工标注</dt><dd>${report.anchor_count} 条 · ${report.anchor_distribution.filter((item) => item.count > 0).length} 类有样本</dd></div><div><dt>测试范围</dt><dd>${esc(scope)}</dd></div><div><dt>当前方式</dt><dd>${esc(report.finetune.current_approach)}</dd></div></dl><table class="finetune-scan"><caption>${report.anchor_count} 条人工标注逐条扫描结果</caption><thead><tr><th scope="col">方法</th><th scope="col">依据</th><th scope="col">结果</th></tr></thead><tbody>${scanMethods.map(({name, basis, method}) => {
      const accuracy = method?.result?.accuracy;
      const value = typeof accuracy === "number" ? (accuracy * 100).toFixed(2) + "%（实测）" : method?.target?.accuracy ? "设计目标 " + (method.target.accuracy * 100).toFixed(0) + "%（待实测）" : "待实测";
      return `<tr><th scope="row">${esc(name)}</th><td>${esc(basis)}</td><td>${value}</td></tr>`;
    }).join("")}${(() => {
      const review = report.benchmark.assistant_full_review;
      const semantic = report.methods.map((method) => method.result).find((result) => result?.status === "complete" && result?.evaluation_kind !== "assistant_offline_review");
      const rows = [];
      if (review) rows.push(`<tr><th scope="row">人工标注复评</th><td>${review.n} 条人工样本逐条重读</td><td>${(review.accuracy * 100).toFixed(2)}%（实测）</td></tr>`);
      if (typeof semantic?.accuracy === "number") rows.push(`<tr><th scope="row">传统检索</th><td>${semantic.n} 条留出测试</td><td>${(semantic.accuracy * 100).toFixed(2)}%（实测）</td></tr>`);
      return rows.join("");
    })()}</tbody></table><ul class="finetune-anchor-list">${report.anchor_distribution.map((item) => `<li><span>${esc(item.label)}</span><strong>${item.count}</strong></li>`).join("")}</ul><p>${report.missing_categories.length ? `${esc(report.missing_categories.join("、"))}暂无人工样本，扩样后才能补这两类；` : ""}参数微调没有真实训练记录，相关一格只写设计目标，不填实测值。</p>${(() => {
      const rows = report.benchmark.assistant_full_review?.rows ?? [];
      const wrong = rows.filter((row) => row.gold !== row.prediction);
      if (!wrong.length) return "";
      return `<details class="finetune-errors"><summary>复查看错分的 ${wrong.length} 条</summary><ul>${wrong.slice(0, 6).map((row) => `<li><span>${esc(row.gold)} → ${esc(row.prediction)}</span><small>${esc(row.reason)} · ${esc(row.rpid)}</small></li>`).join("")}</ul><p>逐条比对 ${rows.length} 条人工标签与复评结果，${rows.length - wrong.length} 条一致。</p></details>`;
    })()}<details><summary>查看测试协议与标注分布</summary><p>${esc(benchmark.protocol ?? "尚未运行测试")}</p><ul>${report.anchor_distribution.map((item) => `<li>${esc(item.label)}：${item.count} 条</li>`).join("")}</ul><p>${esc(benchmark.macro_f1_definition ?? "未生成指标")}</p><p>测试记录：${esc(benchmark.time ? new Date(benchmark.time).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "未生成")} · 随机种子 ${benchmark.seed ?? "—"}</p></details></section>
      <section class="class-results"><div class="class-result-head"><h3>分类明细</h3><label>选择方法<select class="evaluation-method">${report.methods.map((method) => `<option value="${esc(method.id)}" ${method.id === "annotated" ? "selected" : ""}>${esc(method.name)}</option>`).join("")}</select></label></div><div class="evaluation-table-wrap"><table><caption>精确率、召回率与 F1</caption><thead><tr><th scope="col">类别</th><th scope="col">样本</th><th scope="col">精确率</th><th scope="col">召回率</th><th scope="col">F1</th></tr></thead><tbody class="evaluation-class-body"></tbody></table></div></section></div>
      <section class="pipeline-panel"><div class="pipeline-heading"><div><span class="eyebrow">CALL FLOW / 调用流程</span><h3>从人工示范到可导出的研究报告</h3></div><span class="pipeline-caption">查看方法路径，核对实际调用</span></div><div class="pipeline-root">破妄 · 评论研究工作流</div><ol class="pipeline-branches"><li><h4>01 / 分类与标注</h4><ol><li>读取原文与视频来源</li><li>检索相近人工示例</li><li>补充圈层词条与语境</li><li>调用模型，校验六分类输出</li></ol></li><li><h4>02 / 数据问答</h4><ol><li>理解问题与选择数据工具</li><li>查询统计、趋势或话术</li><li>调取代表评论与原文</li><li>返回回答及工具调用记录</li></ol></li><li><h4>03 / 报告与研究</h4><ol><li>汇总分类与测试结果</li><li>保留标签、理由和来源</li><li>导出分析报告与证据数据集</li><li>供二次审查与立法研究使用</li></ol></li></ol><div class="pipeline-live" role="status">向 AI 助手提问后，可在回答下方展开本次真实工具调用。</div></section>
      <section class="research-export"><div><span class="eyebrow">RESEARCH OUTPUT</span><h3>分析报告可导出，研究证据可复用</h3><p>报告与原始评论、模型理由、已有人工标签一同交付。二次审查列留空，方便复核人员补充结论；也可作为立法研究材料数据集使用。</p></div><div class="export-actions"><a class="btn primary" href="/powang-demo/api/research/export?format=zip" download>导出报告与数据集 ZIP ↗</a><a class="btn ghost" href="/powang-demo/api/research/export?format=csv" download>导出二次审查 CSV</a><a class="text-link" href="/powang-demo/api/research/export?format=json" download>导出结构化 JSON ↗</a></div><p class="export-boundary">数据集字段：评论原文、视频与评论标识、来源链接、模型标签与理由、人工标签、二次审查填写栏。</p></section>`;
    const select = /** @type {HTMLSelectElement} */ (host.querySelector(".evaluation-method"));
    select.value = defaultMethod;
    /** @returns {void} */
    function renderClassResults() {
      const selectedMethod = report.methods.find((method) => method.id === select.value);
      const result = selectedMethod?.result;
      const body = host.querySelector(".evaluation-class-body");
      if (!body) return;
      if (!result?.per_class && selectedMethod?.target) {
        body.innerHTML = `<tr><td colspan="5" class="target-table-summary">目标准确率：约 ${(selectedMethod.target.accuracy * 100).toFixed(0)}% · 采用六分类体系</td></tr>`;
        return;
      }
      body.innerHTML = report.anchor_distribution.map((item) => {
        const row = result?.per_class?.[item.category];
        const available = Boolean(row?.support);
        return `<tr><th scope="row">${esc(item.label)}</th><td>${row?.support ?? "—"}</td><td>${available ? percent(row?.precision) : "无标注样本"}</td><td>${available ? percent(row?.recall) : "—"}</td><td>${available ? row?.f1.toFixed(3) : "—"}</td></tr>`;
      }).join("");
    }
    select.addEventListener("change", renderClassResults); renderClassResults();
  }
  /** @param {HTMLElement} host @returns {Promise<void>} */
  async function load(host) {
    host.setAttribute("aria-busy", "true");
    host.innerHTML = '<p class="evaluation-loading" role="status">正在读取三档测试与微调报告…</p>';
    try { render(host, /** @type {ResearchReport} */ (await ui.request("/api/research/report"))); }
    catch (error) {
      console.error("evaluation report render failed", error);
      host.innerHTML = '<div class="evaluation-error" role="alert"><h2>测试报告暂时无法读取</h2><p>请检查数据服务后重试。缺失结果不会显示为零分。</p><button class="btn ghost" type="button">重新读取报告</button></div>';
      host.querySelector("button")?.addEventListener("click", () => void load(host));
    } finally { host.setAttribute("aria-busy", "false"); }
  }
  document.querySelectorAll("[data-evaluation-dashboard]").forEach((host) => void load(/** @type {HTMLElement} */ (host)));
  window.addEventListener("research:trace", (event) => {
    const trace = /** @type {CustomEvent<ToolTrace[]>} */ (event).detail;
    document.querySelectorAll(".pipeline-live").forEach((node) => {
      node.textContent = trace.length ? `最近一次问答：实际调用 ${trace.length} 次工具，${trace.filter((step) => step.status === "complete").length} 次返回结果。详细依据见回答下方。` : "最近一次回答没有调用数据工具；请核验其中的数据依据。";
    });
  });
  document.querySelectorAll("[data-research-ticker]").forEach((host) => {
    const text = "圈层语义 · 三档方法对比 · 组织化刷评线索 · 人工标注增强 · 可追溯分析报告 · 二次审查与立法研究 · ";
    host.innerHTML = `<div class="research-ticker"><div class="ticker-window"><div class="ticker-track"><span>${text}</span><span aria-hidden="true">${text}</span></div></div></div>`;
  });
})();
