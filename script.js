/* ─────────────────────────────────────────────────────────────────────
   Lichess Bot Controller — script.js
   Board renderers (data-fen / data-mini / data-pieces / data-strip)
   GSAP ScrollTrigger choreography: hero PGN pin/scrub, bento stack-flip,
   pricing piece stagger. Marquee = pure rAF.
   ───────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ─── Board glyphs ────────────────────────────────────────────────
  var G = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
  };

  function sqId(r, f) { return String.fromCharCode(97 + f) + (8 - r); }

  function buildCell(isLight, glyph, highlighted) {
    var sq = document.createElement("div");
    sq.className = "sq " + (isLight ? "light" : "dark");
    if (highlighted) sq.classList.add("hl");
    if (glyph) {
      var p = document.createElement("span");
      p.className = "piece " + (glyph === glyph.toUpperCase() ? "white" : "black");
      p.textContent = G[glyph];
      sq.appendChild(p);
    }
    return sq;
  }

  function renderBoard(el) {
    var fen = el.dataset.fen;
    if (!fen) return;
    var hi = (el.dataset.highlight || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var ranks = fen.split(" ")[0].split("/");
    // Preserve cross-stroke SVG and other absolute children when re-rendering
    var preserved = [];
    var children = el.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].tagName === "svg" || children[i].classList.contains("cross-stroke")) {
        preserved.push(children[i]);
      }
    }
    el.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "board-grid";
    for (var r = 0; r < 8; r++) {
      var f = 0;
      var rank = ranks[r] || "";
      for (var ci = 0; ci < rank.length; ci++) {
        var ch = rank[ci];
        if (/\d/.test(ch)) {
          var skip = parseInt(ch, 10);
          for (var k = 0; k < skip; k++) {
            var isLight = (r + f) % 2 === 0;
            grid.appendChild(buildCell(isLight, null, hi.indexOf(sqId(r, f)) >= 0));
            f++;
          }
        } else {
          var isLight2 = (r + f) % 2 === 0;
          grid.appendChild(buildCell(isLight2, ch, hi.indexOf(sqId(r, f)) >= 0));
          f++;
        }
      }
    }
    el.appendChild(grid);
    preserved.forEach(function (n) { el.appendChild(n); });
  }

  function renderMiniBoard(el) {
    var raw = el.dataset.mini;
    if (!raw) return;
    var rows = raw.split("/");
    el.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "board-grid-mini";
    for (var r = 0; r < 3; r++) {
      for (var f = 0; f < 3; f++) {
        var ch = (rows[r] && rows[r][f]) || "_";
        var isLight = (r + f) % 2 === 0;
        var glyph = ch === "_" ? null : ch;
        grid.appendChild(buildCell(isLight, glyph, false));
      }
    }
    el.appendChild(grid);
  }

  function renderPieceRow(el) {
    var pieces = el.dataset.pieces || "";
    el.innerHTML = "";
    var grid = document.createElement("div");
    grid.className = "piece-row-grid";
    Array.prototype.forEach.call(pieces, function (ch, i) {
      var isLight = i % 2 === 0;
      grid.appendChild(buildCell(isLight, ch, false));
    });
    el.appendChild(grid);
  }
  // Piece-row uses .sq inside a grid layout — we promote that grid to .piece-row's own grid
  function renderPieceRowInline(el) {
    var pieces = el.dataset.pieces || "";
    el.innerHTML = "";
    // .piece-row IS the grid (display:inline-grid). Append .sq directly.
    Array.prototype.forEach.call(pieces, function (ch, i) {
      var isLight = i % 2 === 0;
      el.appendChild(buildCell(isLight, ch, false));
    });
  }

  function renderStrip(el) {
    var n = parseInt(el.dataset.strip || "8", 10);
    el.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = i % 2 === 0 ? "light" : "dark";
      el.appendChild(s);
    }
  }

  // ─── Run renderers ───────────────────────────────────────────────
  document.querySelectorAll("[data-fen]").forEach(renderBoard);
  document.querySelectorAll("[data-mini]").forEach(renderMiniBoard);
  document.querySelectorAll("[data-pieces]").forEach(renderPieceRowInline);
  document.querySelectorAll("[data-strip]").forEach(renderStrip);

  // ─── Topbar scrolled state ──────────────────────────────────────
  (function initTopbar() {
    var topbar = document.querySelector(".topbar");
    if (!topbar) return;
    function check() {
      topbar.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
  }());

  // ─── Marquee — rAF-driven transform, pause on hover ─────────────
  (function initMarquee() {
    var track = document.getElementById("marqueeTrack");
    var wrap = document.getElementById("marquee");
    if (!track || !wrap) return;
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Duplicate content so the loop is seamless
    track.innerHTML = track.innerHTML + track.innerHTML;

    var x = 0;
    var paused = false;
    var lastT = 0;
    var speed = 38; // px/sec
    var halfWidth = 0;

    function measure() {
      halfWidth = track.scrollWidth / 2;
    }
    measure();
    window.addEventListener("resize", measure);

    function tick(t) {
      if (!lastT) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;
      if (!paused) {
        x -= speed * dt;
        if (x <= -halfWidth) x += halfWidth;
        track.style.transform = "translate3d(" + x + "px, 0, 0)";
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    wrap.addEventListener("mouseenter", function () { paused = true; });
    wrap.addEventListener("mouseleave", function () { paused = false; });
  }());

  // ─── Hero PGN pin + scrub (Ruy Lopez Morphy Defence) ────────────
  // 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5
  var HERO_PLY = [
    { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", hi: "",        san: "Starting position", line: "Ruy Lopez · Morphy Defence" },
    { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR", hi: "e2,e4",  san: "1. e4",              line: "King's pawn opens" },
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR", hi: "e7,e5", san: "1… e5",             line: "Symmetric reply" },
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R", hi: "g1,f3", san: "2. Nf3",          line: "Attacking e5" },
    { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R", hi: "b8,c6", san: "2… Nc6",         line: "Defending e5" },
    { fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R", hi: "f1,b5", san: "3. Bb5",         line: "Ruy Lopez" },
    { fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R", hi: "a7,a6", san: "3… a6",         line: "Morphy Defence" },
    { fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R", hi: "b5,a4", san: "4. Ba4",         line: "Retreats but holds pin" },
    { fen: "r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R", hi: "g8,f6", san: "4… Nf6",       line: "Closed main line" }
  ];

  function setHeroFen(idx) {
    var board = document.getElementById("heroBoard");
    var sanEl = document.getElementById("heroBoardSan");
    var subEl = document.querySelector(".hero-board__sub");
    var plyEl = document.querySelector(".hero-board__ply-current");
    if (!board) return;
    var step = HERO_PLY[idx];
    board.dataset.fen = step.fen;
    board.dataset.highlight = step.hi;
    renderBoard(board);
    if (sanEl) sanEl.textContent = idx === 0 ? step.san : "Position after " + step.san;
    if (subEl) subEl.textContent = step.line;
    if (plyEl) plyEl.textContent = String(idx).padStart(2, "0");
  }

  // ─── GSAP-based choreography (loaded after defer) ───────────────
  function initGsap() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return false;
    }
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return true;

    gsap.registerPlugin(ScrollTrigger);

    /* — Hero pin + PGN scrub ———————————————————————————————— */
    var heroSection = document.querySelector(".hero");
    var heroBoardWrap = document.querySelector(".hero-board__inner");
    var heroPlyTotal = document.querySelector(".hero-board__ply-total");
    if (heroSection && heroBoardWrap && window.innerWidth > 960) {
      if (heroPlyTotal) heroPlyTotal.textContent = String(HERO_PLY.length - 1).padStart(2, "0");
      // Seed initial state so page always boots at ply 0 (no flash of "final" state)
      setHeroFen(0);
      var lastIdx = 0;
      ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: "+=120%",
        scrub: 0.6,
        onUpdate: function (self) {
          var p = self.progress;
          var idx = Math.min(HERO_PLY.length - 1, Math.floor(p * HERO_PLY.length));
          if (idx !== lastIdx) {
            setHeroFen(idx);
            lastIdx = idx;
          }
        }
      });
      gsap.fromTo(heroBoardWrap,
        { y: 0 },
        {
          y: -32,
          ease: "none",
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "+=120%",
            scrub: true,
          }
        }
      );
    }

    /* — About: heading + body fade up ————————————————————— */
    var aboutHead = document.querySelector(".about-head");
    var aboutBody = document.querySelector(".about-body");
    if (aboutHead) {
      gsap.from(aboutHead, {
        opacity: 0, y: 32, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: aboutHead, start: "top 78%" }
      });
    }
    if (aboutBody) {
      gsap.from(aboutBody.children, {
        opacity: 0, y: 18, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: aboutBody, start: "top 78%" }
      });
    }

    /* — Bento stack-in (scrub-fan-out from stacked initial state) — */
    var bento = document.getElementById("bento");
    if (bento && window.innerWidth > 700) {
      var cards = Array.prototype.slice.call(bento.querySelectorAll(".move-card"));
      cards.forEach(function (card, i) {
        gsap.from(card, {
          y: 56,
          opacity: 0,
          rotate: (i % 2 === 0 ? -1.4 : 1.4),
          duration: 0.85,
          ease: "power3.out",
          delay: i * 0.06,
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            toggleActions: "play none none reverse"
          }
        });
      });
    }

    /* — Pricing piece stagger ————————————————————————————— */
    var crosstable = document.getElementById("crosstable");
    if (crosstable) {
      Array.prototype.forEach.call(crosstable.querySelectorAll("tbody tr"), function (tr, rowIdx) {
        var cells = tr.querySelectorAll(".piece-row .sq");
        if (cells.length === 0) return;
        gsap.from(cells, {
          opacity: 0,
          scale: 0.5,
          y: -8,
          duration: 0.55,
          ease: "back.out(1.7)",
          stagger: 0.06,
          delay: rowIdx * 0.08,
          scrollTrigger: {
            trigger: tr,
            start: "top 88%",
            toggleActions: "play none none reverse"
          }
        });
        gsap.from(tr.querySelector(".col-rn .rn"), {
          opacity: 0,
          scale: 0.7,
          duration: 0.4,
          ease: "power3.out",
          delay: rowIdx * 0.08,
          scrollTrigger: { trigger: tr, start: "top 88%" }
        });
      });
    }

    /* — Legality: SVG cross stroke draw + stamp tilt ——————— */
    var crossStroke = document.querySelector(".cross-stroke");
    if (crossStroke) {
      var paths = crossStroke.querySelectorAll("path");
      paths.forEach(function (p) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      });
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: "power2.inOut",
        stagger: 0.18,
        scrollTrigger: { trigger: ".verdict--no", start: "top 75%" }
      });
    }
    var okStamp = document.querySelector(".verdict--ok .verdict__stamp");
    var noStamp = document.querySelector(".verdict--no .verdict__stamp");
    if (okStamp) gsap.from(okStamp, {
      opacity: 0, scale: 0.7, rotate: 6, duration: 0.7, ease: "back.out(2)",
      scrollTrigger: { trigger: okStamp, start: "top 85%" }
    });
    if (noStamp) gsap.from(noStamp, {
      opacity: 0, scale: 0.7, rotate: -6, duration: 0.7, ease: "back.out(2)",
      scrollTrigger: { trigger: noStamp, start: "top 85%" }
    });

    /* — FAQ rows fade-up stagger ————————————————————————— */
    var faqRows = document.querySelectorAll(".faq-row");
    if (faqRows.length) {
      gsap.from(faqRows, {
        opacity: 0, y: 18, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: ".faq-list", start: "top 82%" }
      });
    }
    // Mini-board page-flip
    var miniBoards = document.querySelectorAll(".faq-mini .board");
    miniBoards.forEach(function (mb, i) {
      gsap.from(mb, {
        rotateY: 28, opacity: 0, duration: 0.5, ease: "power3.out", delay: i * 0.04,
        scrollTrigger: { trigger: mb, start: "top 90%" }
      });
    });

    /* — Endgame king micro-magnetic on hover ———————————————— */
    var king = document.getElementById("endgameKing");
    if (king) {
      gsap.from(king, {
        opacity: 0, y: 30, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: king, start: "top 85%" }
      });
      gsap.from(".endgame-resigns", {
        opacity: 0, duration: 0.8, delay: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: king, start: "top 85%" }
      });
      king.addEventListener("mousemove", function (e) {
        var rect = king.getBoundingClientRect();
        var dx = (e.clientX - rect.left - rect.width / 2) * 0.08;
        var dy = (e.clientY - rect.top - rect.height / 2) * 0.08;
        gsap.to(king, { x: dx, y: dy, duration: 0.4, ease: "power3.out" });
      });
      king.addEventListener("mouseleave", function () {
        gsap.to(king, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      });
    }

    /* — Section heads gentle fade-up ————————————————————— */
    var heads = document.querySelectorAll(".section-head, .moves-head, .pricing-head, .legality-head, .faq-head");
    heads.forEach(function (h) {
      gsap.from(h, {
        opacity: 0, y: 24, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: h, start: "top 85%" }
      });
    });

    return true;
  }

  // ─── Try GSAP after defer-loaded scripts have a chance to land ──
  (function bootGsap() {
    if (initGsap()) return;
    // Defer scripts run before DOMContentLoaded, but be defensive
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (initGsap()) { clearInterval(iv); return; }
      if (tries > 40) {
        clearInterval(iv);
        // Fallback: IntersectionObserver-based reveal
        initFallbackReveal();
      }
    }, 50);
  }());

  function initFallbackReveal() {
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    var targets = document.querySelectorAll(
      ".move-card, .faq-row, .verdict, .section-head, .moves-head, .pricing-head, .legality-head, .endgame-inner > *"
    );
    targets.forEach(function (el) { el.classList.add("sr-hidden"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("sr-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
