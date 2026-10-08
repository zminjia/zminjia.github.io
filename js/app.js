(function () {
  "use strict";

  var DATA_URL = "data/works.json";
  var ALL_LABEL = "全部";
  var THEME_KEY = "theme";

  var heroEl = document.getElementById("hero");
  var heroImg = document.getElementById("hero-img");
  var titleEl = document.getElementById("title");
  var metaEl = document.getElementById("meta");
  var tagsEl = document.getElementById("tags");
  var stripSection = document.getElementById("strip-section");
  var stripEl = document.getElementById("strip");
  var stripTrack = document.getElementById("strip-track");
  var themeBtn = document.getElementById("theme-toggle");
  var pageEl = document.querySelector(".page");

  var works = [];
  var selectedId = null;
  var swapTimer = null;

  function parseHash() {
    var raw = location.hash.replace(/^#/, "");
    var params = new URLSearchParams(raw);
    return {
      tag: params.get("tag") || null,
      work: params.get("work") || null
    };
  }

  function writeHash(tag, workId) {
    var parts = [];
    if (tag) parts.push("tag=" + encodeURIComponent(tag));
    if (workId) parts.push("work=" + encodeURIComponent(workId));
    var next = parts.length ? "#" + parts.join("&") : "";
    if ((location.hash || "") === next) return;
    if (next) {
      history.pushState(null, "", next);
    } else {
      history.pushState(null, "", location.pathname + location.search);
    }
  }

  function countTags(list) {
    var counts = {};
    list.forEach(function (work) {
      (work.tags || []).forEach(function (tag) {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort(function (a, b) {
        return counts[b] - counts[a] || a.localeCompare(b, "zh-CN");
      })
      .map(function (tag) {
        return { tag: tag, count: counts[tag] };
      });
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

  function filteredWorks() {
    var tag = parseHash().tag;
    if (!tag) return works;
    return works.filter(function (work) {
      return (work.tags || []).indexOf(tag) !== -1;
    });
  }

  function workById(id) {
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === id) return works[i];
    }
    return null;
  }

  function resolveSelection() {
    var hash = parseHash();
    var list = filteredWorks();
    if (!list.length) return null;
    if (hash.work) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === hash.work) return list[i];
      }
    }
    return list[0];
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

  function showHero(work) {
    if (!work) {
      heroEl.hidden = true;
      heroImg.removeAttribute("src");
      heroImg.removeAttribute("data-id");
      return;
    }
    heroEl.hidden = false;
    if (heroImg.getAttribute("data-id") === work.id) return;

    var apply = function () {
      heroImg.alt = work.title;
      heroImg.src = work.file;
      heroImg.setAttribute("data-id", work.id);
      heroImg.classList.remove("is-swap");
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

  function renderIntro(work, list) {
    titleEl.classList.remove("is-empty", "is-status");
    metaEl.replaceChildren();

    if (!works.length) {
      titleEl.classList.add("is-empty");
      titleEl.textContent = "还没有作品。";
      return;
    }

    if (!list.length) {
      titleEl.classList.add("is-empty");
      titleEl.textContent = "没有这个标签的作品。";
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
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = tag;
      btn.addEventListener("click", function () {
        selectTag(tag);
      });
      metaEl.appendChild(btn);
    });
  }

  function renderTags() {
    var selected = parseHash().tag;
    tagsEl.replaceChildren();

    if (!works.length) {
      tagsEl.hidden = true;
      return;
    }

    tagsEl.hidden = false;

    function addChip(label, count, tagValue) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + ((tagValue || null) === selected ? " is-active" : "");
      btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");
      var name = document.createElement("span");
      name.textContent = label;
      var num = document.createElement("span");
      num.className = "count";
      num.textContent = String(count);
      btn.appendChild(name);
      btn.appendChild(num);
      btn.addEventListener("click", function () {
        selectTag(tagValue);
      });
      tagsEl.appendChild(btn);
    }

    addChip(ALL_LABEL, works.length, null);
    countTags(works).forEach(function (item) {
      addChip(item.tag, item.count, item.tag);
    });
  }

  function renderStrip(list) {
    stripTrack.replaceChildren();
    if (!list.length) {
      stripSection.hidden = true;
      return;
    }
    stripSection.hidden = false;
    stripSection.classList.toggle("is-single", list.length === 1);

    list.slice().reverse().forEach(function (work) {
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

    var active = stripTrack.querySelector(".strip-item.is-active");
    if (active && stripEl) {
      var scroller = stripEl;
      var left = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }

  function render() {
    var list = filteredWorks();
    var work = resolveSelection();
    selectedId = work ? work.id : null;
    pageEl.classList.toggle("is-empty", !works.length);
    showHero(work);
    renderIntro(work, list);
    renderTags();
    renderStrip(list);
  }

  function selectTag(tag) {
    var nextTag = tag || null;
    var list = !nextTag
      ? works
      : works.filter(function (item) {
          return (item.tags || []).indexOf(nextTag) !== -1;
        });
    var keep = list.some(function (item) {
      return item.id === selectedId;
    });
    var nextWork = keep ? selectedId : list.length ? list[0].id : null;
    writeHash(nextTag, nextWork);
    render();
  }

  function selectWork(id) {
    var current = parseHash();
    var work = workById(id);
    if (!work) return;
    var tag = current.tag;
    if (tag && (work.tags || []).indexOf(tag) === -1) tag = null;
    writeHash(tag, id);
    render();
  }

  function moveSelection(delta) {
    var list = filteredWorks().slice().reverse();
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

  themeBtn.addEventListener("click", function () {
    setTheme(isDark() ? "light" : "dark");
  });

  document.addEventListener("keydown", function (event) {
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
      heroEl.hidden = true;
      tagsEl.hidden = true;
      stripSection.hidden = true;
    });
})();
