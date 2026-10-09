(function () {
  "use strict";

  var DATA_URL = "data/works.json";
  var THEME_KEY = "theme";
  var SWIPE_MIN = 40;

  var heroRow = document.getElementById("hero-row");
  var heroEl = document.getElementById("hero");
  var heroFrame = document.getElementById("hero-frame");
  var heroImg = document.getElementById("hero-img");
  var heroPrev = document.getElementById("hero-prev");
  var heroNext = document.getElementById("hero-next");
  var titleEl = document.getElementById("title");
  var metaEl = document.getElementById("meta");
  var stripSection = document.getElementById("strip-section");
  var stripEl = document.getElementById("strip");
  var stripTrack = document.getElementById("strip-track");
  var themeBtn = document.getElementById("theme-toggle");
  var pageEl = document.querySelector(".page");

  var works = [];
  var selectedId = null;
  var swapTimer = null;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchActive = false;

  function parseHash() {
    var raw = location.hash.replace(/^#/, "");
    var params = new URLSearchParams(raw);
    return {
      work: params.get("work") || null
    };
  }

  function writeHash(workId) {
    var next = workId ? "#work=" + encodeURIComponent(workId) : "";
    if ((location.hash || "") === next) return;
    if (next) {
      history.pushState(null, "", next);
    } else {
      history.pushState(null, "", location.pathname + location.search);
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  function formatStripDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  function timeline() {
    return works.slice().reverse();
  }

  function workById(id) {
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === id) return works[i];
    }
    return null;
  }

  function resolveSelection() {
    var hash = parseHash();
    if (!works.length) return null;
    if (hash.work) {
      var found = workById(hash.work);
      if (found) return found;
    }
    return works[0];
  }

  function isDark() {
    var theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function syncThemeButton() {
    var dark = isDark();
    themeBtn.textContent = dark ? "浅色" : "深色";
    themeBtn.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
  }

  function setTheme(next) {
    document.documentElement.classList.add("theme-transition");
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    syncThemeButton();
    window.setTimeout(function () {
      document.documentElement.classList.remove("theme-transition");
    }, 400);
  }

  function sizeHeroFrame() {
    if (!heroFrame || !heroImg || heroRow.hidden || !heroImg.naturalWidth) return;
    var boxW = heroEl.clientWidth;
    var boxH = heroEl.clientHeight;
    if (!boxW || !boxH) return;
    var scale = Math.min(boxW / heroImg.naturalWidth, boxH / heroImg.naturalHeight);
    heroFrame.style.width = Math.max(1, Math.round(heroImg.naturalWidth * scale)) + "px";
    heroFrame.style.height = Math.max(1, Math.round(heroImg.naturalHeight * scale)) + "px";
  }

  function isGalleryImage(target) {
    if (!target || !target.closest) return false;
    return !!(target.closest(".hero-frame") || target.closest(".strip-thumb"));
  }

  function showHero(work) {
    if (!work) {
      heroRow.hidden = true;
      heroImg.removeAttribute("src");
      heroImg.removeAttribute("data-id");
      return;
    }
    heroRow.hidden = false;
    var showArrows = works.length > 1;
    heroPrev.hidden = !showArrows;
    heroNext.hidden = !showArrows;
    if (heroImg.getAttribute("data-id") === work.id) {
      sizeHeroFrame();
      return;
    }

    var apply = function () {
      heroImg.alt = work.title;
      heroImg.src = work.file;
      heroImg.setAttribute("data-id", work.id);
      heroImg.classList.remove("is-swap");
      if (heroImg.complete && heroImg.naturalWidth) sizeHeroFrame();
    };

    if (!heroImg.getAttribute("src")) {
      apply();
      return;
    }

    heroImg.classList.add("is-swap");
    window.clearTimeout(swapTimer);
    var probe = new Image();
    probe.onload = function () {
      swapTimer = window.setTimeout(apply, 160);
    };
    probe.onerror = apply;
    probe.src = work.file;
  }

  function renderIntro(work) {
    titleEl.classList.remove("is-empty", "is-status");
    metaEl.replaceChildren();

    if (!works.length) {
      titleEl.classList.add("is-empty");
      titleEl.textContent = "还没有作品。";
      return;
    }

    if (!work) return;

    titleEl.textContent = work.title;

    if (work.date) {
      var date = document.createElement("span");
      date.textContent = formatDate(work.date);
      metaEl.appendChild(date);
    }

    (work.tags || []).forEach(function (tag, i) {
      if (i > 0 || work.date) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "·";
        metaEl.appendChild(sep);
      }
      var item = document.createElement("span");
      item.textContent = tag;
      metaEl.appendChild(item);
    });
  }

  function stripMatchesWorks() {
    var items = stripTrack.querySelectorAll(".strip-item");
    if (items.length !== works.length) return false;
    for (var i = 0; i < works.length; i++) {
      if (items[i].getAttribute("data-id") !== works[works.length - 1 - i].id) return false;
    }
    return true;
  }

  function scrollActiveIntoView() {
    var active = stripTrack.querySelector(".strip-item.is-active");
    if (active && stripEl) {
      var left = active.offsetLeft - (stripEl.clientWidth - active.offsetWidth) / 2;
      stripEl.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }

  function renderStrip() {
    if (!works.length) {
      stripTrack.replaceChildren();
      stripSection.hidden = true;
      return;
    }
    stripSection.hidden = false;
    stripSection.classList.toggle("is-single", works.length === 1);

    if (stripMatchesWorks()) {
      var items = stripTrack.querySelectorAll(".strip-item");
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle("is-active", items[i].getAttribute("data-id") === selectedId);
      }
      scrollActiveIntoView();
      return;
    }

    stripTrack.replaceChildren();
    works.slice().reverse().forEach(function (work) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "strip-item" + (work.id === selectedId ? " is-active" : "");
      btn.setAttribute("aria-label", work.title);
      btn.setAttribute("data-id", work.id);

      var when = document.createElement("div");
      when.className = "strip-when";
      when.textContent = formatStripDate(work.date);

      var thumb = document.createElement("div");
      thumb.className = "strip-thumb";
      var img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      img.loading = "lazy";
      img.decoding = "async";
      img.src = work.file;
      thumb.appendChild(img);

      var name = document.createElement("div");
      name.className = "strip-name";
      name.textContent = work.title;

      btn.appendChild(when);
      btn.appendChild(thumb);
      btn.appendChild(name);
      btn.addEventListener("click", function () {
        selectWork(work.id);
      });
      stripTrack.appendChild(btn);
    });

    scrollActiveIntoView();
  }

  function render() {
    var work = resolveSelection();
    selectedId = work ? work.id : null;
    pageEl.classList.toggle("is-empty", !works.length);
    showHero(work);
    renderIntro(work);
    renderStrip();
  }

  function selectWork(id) {
    var work = workById(id);
    if (!work) return;
    writeHash(id);
    render();
  }

  function moveSelection(delta) {
    var list = timeline();
    if (list.length < 2) return;
    var index = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === selectedId) {
        index = i;
        break;
      }
    }
    var next = list[(index + delta + list.length) % list.length];
    selectWork(next.id);
  }

  document.addEventListener("contextmenu", function (event) {
    if (isGalleryImage(event.target)) event.preventDefault();
  });

  document.addEventListener("dragstart", function (event) {
    if (isGalleryImage(event.target)) event.preventDefault();
  });

  heroImg.addEventListener("load", sizeHeroFrame);
  if (window.ResizeObserver) {
    new ResizeObserver(sizeHeroFrame).observe(heroEl);
  } else {
    window.addEventListener("resize", sizeHeroFrame);
  }

  themeBtn.addEventListener("click", function () {
    setTheme(isDark() ? "light" : "dark");
  });

  heroPrev.addEventListener("click", function () {
    moveSelection(-1);
  });
  heroNext.addEventListener("click", function () {
    moveSelection(1);
  });

  heroRow.addEventListener(
    "touchstart",
    function (event) {
      if (event.touches.length !== 1 || works.length < 2) {
        touchActive = false;
        return;
      }
      touchActive = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  heroRow.addEventListener(
    "touchend",
    function (event) {
      if (!touchActive || event.changedTouches.length !== 1) return;
      touchActive = false;
      var dx = event.changedTouches[0].clientX - touchStartX;
      var dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      moveSelection(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );

  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSelection(1);
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("popstate", render);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!document.documentElement.getAttribute("data-theme")) syncThemeButton();
  });

  syncThemeButton();

  fetch(DATA_URL, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      works = Array.isArray(data) ? data.slice() : [];
      works.sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      render();
    })
    .catch(function () {
      works = [];
      titleEl.classList.add("is-status");
      titleEl.textContent = "作品列表加载失败。";
      metaEl.replaceChildren();
      heroRow.hidden = true;
      stripSection.hidden = true;
    });
})();
