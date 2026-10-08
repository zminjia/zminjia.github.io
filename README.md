# 贴图

极简贴纸 / 表情包图库，作为 GitHub Pages 用户站（`zminjia.github.io`）从默认分支根目录直接发布。纯静态站点：HTML / CSS / 原生 JS，无构建步骤。

在线浏览：<https://zminjia.github.io>

## 结构

```
index.html        页面
css/style.css     样式
js/app.js         读取数据、标签筛选、灯箱
data/works.json   作品列表（页面唯一数据源）
images/           每件作品一张图片
.nojekyll         关闭 Jekyll 处理
```

页面启动时 `fetch('data/works.json')`，完全根据这份 JSON 渲染网格和标签栏。标签从各条目的 `tags` 汇总而来，不必单独维护标签表。

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
| `id` | 稳定唯一标识，建议用文件名（不含扩展名） |
| `file` | 相对站点根目录的图片路径 |
| `title` | 展示标题 |
| `tags` | 标签字符串数组；会出现在顶栏，并带数量 |
| `date` | `YYYY-MM-DD`，同日多条时按 `id` 排序 |

3. 提交并推送到默认分支。GitHub Pages 更新后即可看到。

本地预览需要起一个静态服务器（`file://` 下 `fetch` JSON 会被浏览器拦截），例如：

```bash
python3 -m http.server 8080
```

然后打开 <http://localhost:8080>。

## 浏览

- 顶栏「全部」和各个标签可筛选网格。
- 当前标签写入地址栏哈希，例如 `#tag=猫`，可分享、刷新后仍保持筛选。
- 点击作品打开灯箱：大图、标题、可点击的标签、日期。`Esc` 或点击空白处关闭。
