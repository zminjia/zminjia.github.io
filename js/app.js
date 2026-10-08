(function () {
  "use strict";

  var DATA_URL = "data/works.json";
  var ALL_LABEL = "全部";

  var tagsEl = document.getElementById("tags");
  var statusEl = document.getElementById("status");
  var gridEl = document.getElementById("grid");
  var lightboxEl = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxTitle = document.getElementById("lightbox-title");
  var lightboxTags = document.getElementById("lightbox-tags");
  var lightboxDate = document.getElementById("lightbox-date");

  var works = [];
  var lastFocus = null;

  function getTagFromHash() {
    var raw = location.hash.replace(/^#/, "");
    if (!raw) return null;
    var tag = new URLSearchParams(raw).get("tag");
    return tag || null;
  }

  function setTagInUrl(tag) {
    var next = tag ? "#tag=" + encodeURIComponent(tag) : "";
    if ((location.hash || "") === next) return;
    if (next) {
      location.hash = next.slice(1);
    } else {
      history.pushState("", document.title, location.pathname + location.search);
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

  function filteredWorks() {
    var tag = getTagFromHash();
    if (!tag) return works;
    return works.filter(function (work) {
      return (work.tags || []).indexOf(tag) !== -1;
    });
  }

  function makeTagButton(label, count, active) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag" + (active ? " is-active" : "");
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.textContent = label;
    if (typeof count === "number") {
      var span = document.createElement("span");
      span.className = "count";
      span.textContent = String(count);
      btn.appendChild(span);
    }
    return btn;
  }

  function renderTags() {
    var selected = getTagFromHash();
    var items = countTags(works);
    tagsEl.replaceChildren();

    if (!works.length) {
      tagsEl.hidden = true;
      return;
    }

    tagsEl.hidden = false;

    var allBtn = makeTagButton(ALL_LABEL, works.length, !selected);
    allBtn.addEventListener("click", function () {
      setTagInUrl(null);
      render();
    });
    tagsEl.appendChild(allBtn);

    items.forEach(function (item) {
      var btn = makeTagButton(item.tag, item.count, selected === item.tag);
      btn.addEventListener("click", function () {
        setTagInUrl(item.tag);
        render();
      });
      tagsEl.appendChild(btn);
    });
  }

  function renderGrid() {
    var list = filteredWorks();
    var selected = getTagFromHash();
    gridEl.replaceChildren();

    if (!works.length) {
      gridEl.hidden = true;
      statusEl.hidden = false;
      statusEl.textContent = "还没有作品";
      return;
    }

    if (!list.length) {
      gridEl.hidden = true;
      statusEl.hidden = false;
      statusEl.textContent = selected
        ? "没有「" + selected + "」相关的作品"
        : "还没有作品";
      return;
    }

    statusEl.hidden = true;
    gridEl.hidden = false;

    list.forEach(function (work) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.setAttribute("aria-label", "查看「" + work.title + "」");

      var thumb = document.createElement("div");
      thumb.className = "thumb";

      var img = document.createElement("img");
      img.alt = work.title;
      img.loading = "lazy";
      img.decoding = "async";
      img.src = work.file;
      thumb.appendChild(img);

      var title = document.createElement("div");
      title.className = "card-title";
      title.textContent = work.title;

      card.appendChild(thumb);
      card.appendChild(title);
      card.addEventListener("click", function () {
        openLightbox(work, card);
      });
      gridEl.appendChild(card);
    });
  }

  function render() {
    renderTags();
    renderGrid();
  }

  function openLightbox(work, source) {
    lastFocus = source || document.activeElement;
    lightboxImg.src = work.file;
    lightboxImg.alt = work.title;
    lightboxTitle.textContent = work.title;
    lightboxDate.dateTime = work.date || "";
    lightboxDate.textContent = formatDate(work.date);

    lightboxTags.replaceChildren();
    (work.tags || []).forEach(function (tag) {
      var btn = makeTagButton(tag, null, false);
      btn.addEventListener("click", function () {
        closeLightbox();
        setTagInUrl(tag);
        render();
      });
      lightboxTags.appendChild(btn);
    });

    lightboxEl.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxEl.querySelector(".lightbox-close").focus();
  }

  function closeLightbox() {
    if (lightboxEl.hidden) return;
    lightboxEl.hidden = true;
    document.body.style.overflow = "";
    lightboxImg.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  lightboxEl.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-close")) closeLightbox();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeLightbox();
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("popstate", render);

  fetch(DATA_URL, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      works = Array.isArray(data) ? data.slice() : [];
      works.sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || "")) ||
          String(a.id || "").localeCompare(String(b.id || ""));
      });
      render();
    })
    .catch(function () {
      works = [];
      statusEl.hidden = false;
      statusEl.textContent = "作品列表加载失败";
      gridEl.hidden = true;
      tagsEl.hidden = true;
    });
})();
