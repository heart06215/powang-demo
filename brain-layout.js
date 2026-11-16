/* Code-native brain silhouette; guides are decorative, not evidence links. */
(() => {
  "use strict";
  /** @param {number} width @param {number} height @param {number} side @param {boolean} multi @returns {number[]} */
  function center(width, height, side, multi) {
    return [width * (multi ? (side === 0 ? 0.28 : 0.72) : 0.5), height * 0.47];
  }
  /** @param {number} width @param {number} height @param {number} side @param {boolean} multi @param {number} radius @param {number} angle @returns {number[]} */
  function point(width, height, side, multi, radius, angle) {
    const c = center(width, height, side, multi);
    const outward = side === 0 ? -1 : 1;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    const rx = width * (multi ? (cosine * outward > 0 ? 0.235 : 0.195) : 0.35);
    const ry = height * (sine < 0 ? 0.36 : 0.38);
    const fold = 1 + 0.045 * Math.sin(7 * angle + side * 0.5) + 0.022 * Math.cos(11 * angle);
    return [c[0] + rx * Math.sign(cosine) * Math.pow(Math.abs(cosine), 0.86) * radius * fold,
      c[1] + ry * Math.sign(sine) * Math.pow(Math.abs(sine), 0.9) * radius * fold];
  }
  /** @param {number} width @param {number} height @param {number} side @param {boolean} multi @param {number} x @param {number} y @returns {number[]} */
  function constrain(width, height, side, multi, x, y) {
    const c = center(width, height, side, multi);
    const dx = x - c[0], dy = y - c[1];
    const outward = side === 0 ? -1 : 1;
    const rx = width * (multi ? (dx * outward > 0 ? 0.216 : 0.18) : 0.325);
    const ry = height * (dy < 0 ? 0.33 : 0.35);
    const norm = Math.pow(Math.pow(Math.abs(dx / rx), 2.3) + Math.pow(Math.abs(dy / ry), 2.2), 1 / 2.25);
    return norm > 1 ? [c[0] + dx / norm, c[1] + dy / norm] : [x, y];
  }
  /** @param {number[]} a @param {number[]} b @param {number[]} c @param {number[]} d @param {number} t @returns {number[]} */
  function cubic(a, b, c, d, t) {
    const u = 1 - t;
    return [0, 1].map(i => u*u*u*a[i] + 3*u*u*t*b[i] + 3*u*t*t*c[i] + t*t*t*d[i]);
  }
  /** @param {number} width @param {number} height @param {boolean} multi @returns {Array<{side:number,outline:boolean,points:number[][]}>} */
  function guides(width, height, multi) {
    const paths = [];
    const folds = [
      [[.44,.16],[.36,.11],[.28,.16],[.34,.23],[.40,.30],[.27,.31],[.18,.26]],
      [[.12,.28],[.20,.20],[.27,.27],[.22,.35],[.18,.42],[.36,.30],[.43,.38]],
      [[.08,.43],[.17,.37],[.23,.43],[.19,.50],[.15,.59],[.32,.43],[.43,.49]],
      [[.10,.60],[.18,.50],[.31,.59],[.22,.65],[.15,.71],[.27,.74],[.36,.64]],
      [[.16,.76],[.23,.82],[.28,.70],[.35,.73],[.41,.76],[.34,.83],[.40,.84]],
      [[.44,.43],[.38,.45],[.40,.57],[.43,.63]]
    ];
    for (let side = 0; side < (multi ? 2 : 1); side++) {
      const outline = Array.from({length: 97}, (_, i) => point(width, height, side, multi, 1, i / 96 * Math.PI * 2));
      paths.push({side, outline:true, points:outline});
      for (const controls of folds) {
        const samples = [];
        for (let segment = 0; segment + 3 < controls.length; segment += 3) {
          for (let i = segment ? 1 : 0; i <= 10; i++) {
            const p = cubic(...controls.slice(segment, segment + 4), i / 10);
            const x = multi ? (side === 0 ? p[0] : 1 - p[0]) : 0.5 + (p[0] - 0.28) * 1.5;
            samples.push([width*x, height*p[1]]);
          }
        }
        paths.push({side, outline:false, points:samples});
      }
    }
    return paths;
  }
  window.BrainLayout = Object.freeze({center, point, constrain, guides});
})();
