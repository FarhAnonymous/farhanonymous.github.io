/* Three small features, no libraries:
   1. Draws the illustrative "tree detection" picture in the hero.
   2. Counts the stat numbers up once, when they scroll into view.
   3. Highlights the current section in the top nav.
   If this file fails to load, the page still works; you just lose these effects. */

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. aerial detection illustration ---------- */
  var svg = document.getElementById("aerial");
  var counter = document.getElementById("count");
  if (svg && counter) {
    var NS = "http://www.w3.org/2000/svg";
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    // soft ground texture
    var defs = el("defs", {});
    var g = el("radialGradient", { id: "crown" });
    g.appendChild(el("stop", { offset: "0%", "stop-color": "#4fb487" }));
    g.appendChild(el("stop", { offset: "100%", "stop-color": "#1f6b50" }));
    defs.appendChild(g);
    svg.appendChild(defs);

    // trees on a jittered grid, like a managed plantation
    var trees = [];
    var cols = 11, rows = 8, dx = 400 / cols, dy = 300 / rows;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = dx * (c + 0.5 + (r % 2 ? 0.25 : -0.05)) + (rnd() - 0.5) * 8;
        var y = dy * (r + 0.5) + (rnd() - 0.5) * 8;
        if (x < 14 || x > 386 || y < 14 || y > 286) continue;
        trees.push({ x: x, y: y, rad: 12 + rnd() * 5, found: rnd() > 0.04, conf: 0.9 + rnd() * 0.09 });
      }
    }

    trees.forEach(function (t) {
      svg.appendChild(el("circle", { cx: t.x, cy: t.y, r: t.rad, fill: "url(#crown)", opacity: 0.95 }));
    });

    var boxes = [];
    trees.forEach(function (t, i) {
      if (!t.found) return;
      var s = t.rad * 2 + 4;
      var grp = el("g", { opacity: 0 });
      grp.appendChild(el("rect", {
        x: t.x - s / 2, y: t.y - s / 2, width: s, height: s,
        fill: "none", stroke: "#e0a43a", "stroke-width": 1.2, rx: 2
      }));
      if (i % 9 === 0) {
        var label = el("text", { x: t.x - s / 2, y: t.y - s / 2 - 2, "font-size": 7, fill: "#e0a43a", "font-family": "monospace" });
        label.textContent = "palm " + t.conf.toFixed(2);
        grp.appendChild(label);
      }
      svg.appendChild(grp);
      boxes.push(grp);
    });

    if (reduce) {
      boxes.forEach(function (b) { b.setAttribute("opacity", 1); });
      counter.textContent = boxes.length;
    } else {
      var shown = 0;
      var timer = setInterval(function () {
        for (var k = 0; k < 2 && shown < boxes.length; k++) {
          boxes[shown].setAttribute("opacity", 1);
          shown++;
        }
        counter.textContent = shown;
        if (shown >= boxes.length) clearInterval(timer);
      }, 28);
    }
  }

  /* ---------- 2. stat count-up ---------- */
  var stats = document.querySelectorAll("[data-count]");
  function fmt(v, dec) {
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function run(elm) {
    var end = parseFloat(elm.getAttribute("data-count"));
    var dec = parseInt(elm.getAttribute("data-dec") || "0", 10);
    var suffix = elm.getAttribute("data-suffix") || "";
    if (reduce) { elm.textContent = fmt(end, dec) + suffix; return; }
    var t0 = null, dur = 1200;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      elm.textContent = fmt(end * e, dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 3. active nav link ---------- */
  var links = {};
  document.querySelectorAll("#navlinks a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }
})();
