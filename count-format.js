/* Exact Chinese ten-thousand grouping for comment quantities. */
(() => {
  "use strict";
  /** @param {number} value @returns {string} */
  function commentCount(value) {
    const count = Math.trunc(Number(value));
    if (!Number.isFinite(count)) return "—";
    if (count < 10000) return String(count);
    const wan = Math.floor(count / 10000);
    const remainder = count % 10000;
    return `${wan}万${remainder ? String(remainder).padStart(4, "0") : ""}`;
  }
  window.ResearchNumbers = Object.freeze({ commentCount });
})();
