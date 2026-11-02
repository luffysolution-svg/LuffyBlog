# 阅读与搜索

Hexo 主题支持阅读续读、文章收藏和组合搜索。开关和文案在 Notion 的「配置中心 → CONFIG-TABLE → 常用配置」中维护。

| 配置名 | 用途 | 默认值或填写示例 |
| --- | --- | --- |
| `READING_PROGRESS_ENABLE` | 保存文章阅读位置，再次打开时提供「继续上次阅读」和「从头阅读」 | `true` |
| `BOOKMARK_ENABLE` | 显示文章收藏按钮、导航收藏入口和 `/bookmarks` 页面 | `true` |
| `SEARCH_FILTER_ENABLE` | 组合关键词、分类和标签筛选 | `true` |
| `SEARCH_HIGHLIGHT_ENABLE` | 在搜索结果中高亮关键词 | `true` |
| `SEARCH_SHORTCUT_ENABLE` | 使用 `Ctrl / ⌘ K` 或 `/` 打开搜索 | `true` |
| `SEARCH_RECOMMEND_WORDS` | 搜索页推荐词，按填写顺序展示；`[]` 隐藏推荐词 | `["Obsidian","Zotero","AI","LaTeX"]` |
| `SEARCH_PLACEHOLDER` | 中文搜索框的提示 | `搜索标题、摘要、分类或标签` |
| `SEARCH_PLACEHOLDER_EN` | 英文搜索框的提示 | `Search titles, summaries, categories or tags` |
| `SEARCH_HINT` | 中文搜索说明，留空隐藏 | `输入关键词，也可以组合分类和标签缩小范围。` |
| `SEARCH_HINT_EN` | 英文搜索说明，留空隐藏 | `Enter a keyword, or combine a category and tag to narrow your search.` |

保持配置行「启用」已勾选，将配置值改为 `false` 即可关闭对应功能。取消勾选会恢复代码默认值。修改后等待站点缓存更新，再刷新页面。

在文章正文上方点击「收藏文章」，可从导航中的书签图标或 `/bookmarks` 找到收藏，并取消收藏。中英文版共用收藏的文章 ID，列表使用当前语言的标题和摘要。只有仍公开发布的文章会显示。

阅读位置按文章和语言分别保存。读到正文中途后离开，再次打开该文章时点击「继续上次阅读」即可恢复；已接近读完的文章不显示续读提示。收藏与进度保存在读者当前浏览器的本地存储中，清除网站数据后记录会消失。

搜索匹配标题、摘要、分类和标签，忽略英文大小写；分类与标签可单独筛选，也可与关键词组合。条件保存在网址中，例如 `/search?s=Obsidian&category=科研工具`，刷新和返回时仍可恢复。「清除搜索条件」会清空关键词与筛选。输入框内按 `Enter` 搜索，按 `Esc` 清空正在输入的文字；中文输入法选词时不会提前提交。

快捷键在输入框、评论框和可编辑内容中不触发。已有 `/search/关键词` 搜索网址及其分页仍可访问；新搜索统一使用 `/search?s=关键词`。
