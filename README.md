# 贴图

极简贴纸 / 表情包图库，作为 GitHub Pages 用户站（`zminjia.github.io`）从默认分支根目录直接发布。纯静态站点：HTML / CSS / 原生 JS，无构建步骤。

在线浏览：<https://zminjia.github.io>

## 结构

```
index.html        页面
css/style.css     样式
js/app.js         读取数据、标签筛选、作品条、深色模式
data/works.json   作品列表（页面唯一数据源）
images/           每件作品一张图片
.nojekyll         关闭 Jekyll 处理
```

页面启动时 `fetch('data/works.json')`，完全根据这份 JSON 渲染。标签从各条目的 `tags` 汇总而来，不必单独维护标签表。默认选中日期最新的一件，大图居中显示。

## 添加一件作品

1. 把图片放到 `images/`，例如 `images/cat-wave.png`。支持 PNG / WebP / GIF / JPG，透明底也没问题。
2. 在 `data/works.json` **数组最前面**插入一条（按日期从新到旧）：

```json
[
  {
    "id": "cat-wave",
    "file": "images/cat-wave.png",
    "title": "挥手猫",
    "tags": ["猫", "日常"],
    "date": "2026-10-08"
  }
]
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定唯一标识，建议用文件名（不含扩展名）；会出现在 `#work=` 链接里 |
| `file` | 相对站点根目录的图片路径 |
| `title` | 展示标题 |
| `tags` | 标签字符串数组；会出现在「标签」列表，并带数量 |
| `date` | `YYYY-MM-DD`，同日多条时按 `id` 排序 |

3. 提交并推送到默认分支。GitHub Pages 更新后即可看到。

本地预览需要起一个静态服务器（`file://` 下 `fetch` JSON 会被浏览器拦截），例如：

```bash
python3 -m http.server 8080
```

然后打开 <http://localhost:8080>。

## 浏览

- 当前作品大图居中；下方是标题、日期，以及该作品的可点标签。
- 标签以横向一排显示（名称 + 灰色数量）。点选后作品条只显示该标签，地址栏变为 `#tag=猫`。
- 作品条与上方内容同一栏对齐，可用点击或左右方向键切换；选中作品写入 `#work=id`，可分享、刷新后仍保持。
- 可同时带标签与作品，例如 `#tag=猫&work=cat-wave`。
- 左下角「深色 / 浅色」切换主题；未手动选择时跟随系统 `prefers-color-scheme`。
