/* ===========================================================
   script.js: all interactive parts of the page.
   Every block is wrapped so one failure cannot break the rest.
   Without JavaScript the page still shows all of its content.

   1. Hero: drone-view plantation with a "detector lens" that follows
      your cursor or finger (and wanders by itself when idle)
   2. Reliability schematic in the Research section
   3. Count-up numbers, mobile menu, tabs, paper filters,
      active nav link, copy-email button
   =========================================================== */
(function () {
  "use strict";

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn("[portfolio]", e); } }

  /* ---------------------------------------------------------
     1. HERO FIELD
     --------------------------------------------------------- */
  safe(function () {
    var hero = $("#top"), cv = $("#field");
    if (!hero || !cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var lensEl = $("#lensN"), totalEl = $("#totalN"), hintEl = $("#hint");
    if (hintEl && coarse) hintEl.textContent = "drag your finger to scan";

    var W = 0, H = 0, dpr = 1, lensR = 130, layer = null, trees = [], totalFound = 0;
    var lens = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    var raf = 0, visible = true, idleTimer = 0, lastN = -1, inited = false;

    function drawPalm(c, x, y, r, rot, tone) {
      c.save(); c.translate(x, y);
      c.fillStyle = "rgba(0,0,0,0.30)";
      c.beginPath(); c.arc(r * 0.18, r * 0.22, r * 0.9, 0, 6.2832); c.fill();
      // feather-like fronds radiating from the crown, as seen from above
      var n = 14, i, a, len, bend;
      c.lineCap = "round"; c.lineWidth = Math.max(1.6, r * 0.17);
      for (i = 0; i < n; i++) {
        a = rot + i * 6.2832 / n;
        len = r * (0.88 + 0.14 * ((i * 7) % 3) / 2);
        bend = (i % 2 ? 0.28 : -0.28);
        c.strokeStyle = "hsl(" + (150 + tone * 12) + ",42%," + (24 + (i % 3) * 5 + tone * 4) + "%)";
        c.beginPath(); c.moveTo(0, 0);
        c.quadraticCurveTo(Math.cos(a + bend) * len * 0.55, Math.sin(a + bend) * len * 0.55, Math.cos(a) * len, Math.sin(a) * len);
        c.stroke();
      }
      c.fillStyle = "#6fd2a4"; c.beginPath(); c.arc(0, 0, r * 0.14, 0, 6.2832); c.fill();
      c.restore();
    }

    function build() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

      var sp = W < 600 ? 40 : W < 1100 ? 46 : 52;
      lensR = W < 600 ? 92 : W < 1100 ? 118 : 140;

      layer = document.createElement("canvas");
      layer.width = cv.width; layer.height = cv.height;
      var lc = layer.getContext("2d");
      lc.scale(dpr, dpr);
      var g = lc.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#0d2c24"); g.addColorStop(1, "#091c16");
      lc.fillStyle = g; lc.fillRect(0, 0, W, H);

      var rand = rng(11), rowH = sp * 0.87;
      var rows = Math.ceil(H / rowH) + 1, cols = Math.ceil(W / sp) + 1;
      trees = []; totalFound = 0;
      for (var ro = 0; ro < rows; ro++) {
        for (var co = 0; co < cols; co++) {
          var x = co * sp + (ro % 2 ? sp / 2 : 0) + (rand() - 0.5) * 3;
          var y = ro * rowH + (rand() - 0.5) * 3;
          if (rand() < 0.025) continue;               // gaps in the planting
          var rad = sp * 0.44 + rand() * sp * 0.05;
          var found = rand() > 0.05;                  // a few misses, like a real detector
          var t = { x: x, y: y, r: rad, found: found, conf: 0.9 + rand() * 0.09, label: ((ro * 3 + co * 5) % 11 === 0) };
          trees.push(t);
          if (found && x > -rad && x < W + rad && y > -rad && y < H + rad) totalFound++;
          drawPalm(lc, x, y, rad, rand() * 6.2832, rand());
        }
      }
      if (totalEl) totalEl.textContent = totalFound;
      if (!inited) { lens.x = lens.tx = W * 0.72; lens.y = lens.ty = H * 0.5; inited = true; }
      lens.x = clamp(lens.x, 0, W); lens.y = clamp(lens.y, 0, H);
    }

    function render() {
      if (!layer) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var g = ctx.createRadialGradient(lens.x, lens.y, lensR * 0.9, lens.x, lens.y, lensR * 2.4);
      g.addColorStop(0, "rgba(5,20,15,0)"); g.addColorStop(1, "rgba(5,20,15,0.58)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      var n = 0;
      ctx.lineWidth = 1.5; ctx.strokeStyle = "#e0a43a"; ctx.fillStyle = "#e0a43a";
      ctx.font = "10px ui-monospace, Menlo, Consolas, monospace";
      for (var i = 0; i < trees.length; i++) {
        var t = trees[i];
        if (!t.found) continue;
        var dx = t.x - lens.x, dy = t.y - lens.y;
        if (dx > lensR || dx < -lensR || dy > lensR || dy < -lensR) continue;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > lensR) continue;
        n++;
        ctx.globalAlpha = Math.min(1, (lensR - d) / (lensR * 0.3));
        var s = t.r * 2 + 4;
        ctx.strokeRect(t.x - s / 2, t.y - s / 2, s, s);
        if (t.label) ctx.fillText("palm " + t.conf.toFixed(2), t.x - s / 2, t.y - s / 2 - 3);
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(224,164,58,0.9)"; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lensR, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(lens.x - lensR - 8, lens.y); ctx.lineTo(lens.x - lensR + 10, lens.y);
      ctx.moveTo(lens.x + lensR - 10, lens.y); ctx.lineTo(lens.x + lensR + 8, lens.y);
      ctx.moveTo(lens.x, lens.y - lensR - 8); ctx.lineTo(lens.x, lens.y - lensR + 10);
      ctx.moveTo(lens.x, lens.y + lensR - 10); ctx.lineTo(lens.x, lens.y + lensR + 8);
      ctx.stroke();

      if (n !== lastN) { lastN = n; if (lensEl) lensEl.textContent = n; }
    }

    function tick(ts) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (!lens.active && !reduce) {
        var t = ts / 1000;
        lens.tx = W * (0.62 + 0.3 * Math.sin(t * 0.45));
        lens.ty = H * (0.5 + 0.3 * Math.sin(t * 0.31 + 1));
      }
      var k = lens.active ? 0.35 : 0.08;
      lens.x += (lens.tx - lens.x) * k; lens.y += (lens.ty - lens.y) * k;
      render();
      var moving = Math.abs(lens.tx - lens.x) > 0.4 || Math.abs(lens.ty - lens.y) > 0.4;
      if (!reduce || moving) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }

    function point(e) {
      var r = hero.getBoundingClientRect();
      lens.tx = clamp(e.clientX - r.left, 0, W);
      lens.ty = clamp(e.clientY - r.top, 0, H);
      lens.active = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { lens.active = false; kick(); }, 3500);
      kick();
    }
    hero.addEventListener("pointermove", point, { passive: true });
    hero.addEventListener("pointerdown", point, { passive: true });
    hero.addEventListener("pointerleave", function () {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { lens.active = false; kick(); }, 600);
    });

    var rto = 0;
    function onResize() {
      clearTimeout(rto);
      rto = setTimeout(function () { build(); render(); kick(); }, 150);
    }
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(hero);
    else window.addEventListener("resize", onResize);

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) kick();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });

    build(); render(); kick();
  });

  /* ---------------------------------------------------------
     2. RELIABILITY SCHEMATIC
     --------------------------------------------------------- */
  safe(function () {
    var cv = $("#lab"), slider = $("#shift");
    if (!cv || !slider || !cv.getContext) return;
    var outCount = $("#r-count"), outTiles = $("#r-tiles");
    var ctx = cv.getContext("2d");
    var LW = 640, LH = 360, TX = 8, TY = 5;
    var rand = rng(5);

    // layout A: regular triangular planting (the training region)
    var A = [], cols = 12, rows = 7, sx = (LW - 60) / (cols - 0.5), sy = (LH - 60) / (rows - 1);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      A.push({ x: 30 + c * sx + (r % 2 ? sx / 2 : 0), y: 30 + r * sy, r: 11 });
    }
    var N = A.length;

    // layout B: irregular, clumped scene with varied crown sizes (the new region)
    var B = [], minD = 24, attempts = 0;
    while (B.length < N) {
      var p = { x: 20 + rand() * (LW - 40), y: 20 + rand() * (LH - 40), r: 7 + rand() * 9 };
      var ok = true;
      for (var j = 0; j < B.length; j++) {
        var dx = B[j].x - p.x, dy = B[j].y - p.y;
        if (dx * dx + dy * dy < minD * minD) { ok = false; break; }
      }
      if (ok) B.push(p);
      if (++attempts % 400 === 0) minD = Math.max(10, minD - 1);
    }

    var noise = [];
    for (var i = 0; i < TX * TY; i++) noise.push(rand());

    var scale = 1, state = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(240, cv.clientWidth || 640);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * 9 / 16 * dpr);
      scale = cv.width / LW;
      draw(state);
    }

    function draw(s) {
      state = s;
      var e = s * s * (3 - 2 * s);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = "#0b231c"; ctx.fillRect(0, 0, LW, LH);

      for (var i = 0; i < N; i++) {
        var x = lerp(A[i].x, B[i].x, e), y = lerp(A[i].y, B[i].y, e), r = lerp(A[i].r, B[i].r, e);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, 6.2832); ctx.fill();
        var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
        g.addColorStop(0, e > 0.5 ? "#4a9a86" : "#4fb487");
        g.addColorStop(1, e > 0.5 ? "#1f5a58" : "#1f6b50");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }

      var tw = LW / TX, th = LH / TY, bad = 0;
      for (var ty = 0; ty < TY; ty++) for (var tx = 0; tx < TX; tx++) {
        var rel = clamp(0.97 - s * (0.12 + 0.82 * noise[ty * TX + tx]), 0, 1);
        var w = clamp((0.97 - rel) / 0.6, 0, 1);             // 0 = reliable, 1 = check
        var rr = Math.round(lerp(47, 224, w)), gg = Math.round(lerp(143, 164, w)), bb = Math.round(lerp(107, 58, w));
        ctx.fillStyle = "rgba(" + rr + "," + gg + "," + bb + "," + (0.16 + 0.26 * w) + ")";
        ctx.fillRect(tx * tw + 1, ty * th + 1, tw - 2, th - 2);
        if (rel < 0.6) {
          bad++;
          ctx.strokeStyle = "rgba(224,164,58,0.95)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
          ctx.strokeRect(tx * tw + 2, ty * th + 2, tw - 4, th - 4); ctx.setLineDash([]);
        }
      }

      var k = Math.round(N * (0.02 + 0.14 * s));
      if (outCount) outCount.textContent = N + " ± " + k;
      if (outTiles) outTiles.textContent = bad + " / " + (TX * TY);
    }

    slider.addEventListener("input", function () { touched = true; draw(slider.value / 100); });
    var touched = false;
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else window.addEventListener("resize", resize);
    resize();

    // one gentle demo move the first time the card is on screen
    if (!reduce && window.IntersectionObserver) {
      var played = false;
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting || played) return;
        played = true; obs.disconnect();
        var t0 = null, dur = 2600, to = 62;
        (function step(ts) {
          if (touched) return;
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
          slider.value = v; draw(v / 100);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      }, { threshold: 0.6 }).observe(cv);
    }
  });

  /* ---------------------------------------------------------
     3a. Count-up numbers
     --------------------------------------------------------- */
  safe(function () {
    var nodes = $$("[data-count]");
    function fmt(v, dec) { return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function run(el) {
      var end = parseFloat(el.getAttribute("data-count")), dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var suf = el.getAttribute("data-suffix") || "", t0 = null, dur = 1200;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(end * e, dec) + suf;
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end, dec) + suf;
      }
      requestAnimationFrame(step);
    }
    if (reduce || !window.IntersectionObserver) return;       // final values are already in the HTML
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  });

  /* ---------------------------------------------------------
     3b. Mobile menu
     --------------------------------------------------------- */
  safe(function () {
    var btn = $("#menuBtn"), menu = $("#menu");
    if (!btn || !menu) return;
    function set(open) {
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    }
    btn.addEventListener("click", function () { set(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.tagName === "A") set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (!menu.contains(e.target) && e.target !== btn) set(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) set(false); });
  });

  /* ---------------------------------------------------------
     3c. Tabs (Experience / Education / Honours)
     --------------------------------------------------------- */
  safe(function () {
    var root = $(".tabs");
    if (!root) return;
    var tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, k = e.key;
        if (k === "ArrowRight") { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === "ArrowLeft") { e.preventDefault(); select((i - 1 + n) % n, true); }
        else if (k === "Home") { e.preventDefault(); select(0, true); }
        else if (k === "End") { e.preventDefault(); select(n - 1, true); }
      });
    });
    select(0);
  });

  /* ---------------------------------------------------------
     3d. Paper filters
     --------------------------------------------------------- */
  safe(function () {
    var btns = $$(".filters .chip"), items = $$(".pub"), status = $("#filterStatus");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter"), shown = 0;
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (it) {
          var tags = (it.getAttribute("data-tags") || "").split(" ");
          var show = f === "all" || tags.indexOf(f) > -1;
          it.hidden = !show; if (show) shown++;
        });
        if (status) status.textContent = "Showing " + shown + (shown === 1 ? " paper" : " papers");
      });
    });
  });

  /* ---------------------------------------------------------
     3e. Active nav link
     --------------------------------------------------------- */
  safe(function () {
    if (!window.IntersectionObserver) return;
    var links = {};
    $$("#navlinks a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting || !links[x.target.id]) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); links[k].removeAttribute("aria-current"); });
        links[x.target.id].classList.add("active");
        links[x.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  });

  /* ---------------------------------------------------------
     3f. Copy email
     --------------------------------------------------------- */
  safe(function () {
    var btn = $("#copyBtn");
    if (!btn) return;
    var email = "er.farhan2000@gmail.com";
    function done() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy email"; }, 1800); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = email; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand("copy")) done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(done, fallback);
      else fallback();
    });
  });
})();
