# Little Sweet Blog

新版是简洁个人博客，前台为 GitHub Pages，编辑后台为 Decap CMS。

## 文件说明

- HOME 封面页、分类文章列表（支持搜索）、旅行日记、Coffeee本尊、关于我。
- 浅色 / 深色模式，手机布局。
- `content/articles/*.json`：文章，正文为 Markdown。
- `content/travel/*.json`：旅行日记，可包含地点、封面及正文图片。
- `content/settings.json`：首页标题、简介与关于我。
- `content/coffeee.json`：黑白猫 Coffeee 的照片与视频栏目；`assets/coffeee/` 是经过网页优化的素材。
- `admin/`：中文网页编辑后台，GitHub 登录。
- `assets/uploads/`：后台上传的照片。仓库公开，内容及 Git 历史可被公众访问。
- 两篇初始示例文章已移除；新文章在后台的“文章”栏目创建。

## 本地构建

需要 Node.js 22.12 或更新版本：

```sh
npm ci
npm test
npm run build
npm run preview
```

预览：`http://127.0.0.1:4173`。`dist/` 是生成目录，每次构建都会清理重建。根目录原来的 HTML 保留为历史源文件，不再是新版网站的发布入口。

## 自动发布

GitHub Pages 使用 **GitHub Actions** 作为发布来源。推送 main 后，`.github/workflows/publish.yml` 自动测试、构建并部署 `dist/`。自定义域名 `coffeee.xyz` 保存在 `CNAME`，HTTPS 保持开启。

## 后台认证

访问 `https://coffeee.xyz/admin/`。`admin/auth.json` 的 `base_url` 为空时，会明确提示登录服务未连接。

`auth-worker/` 是 Cloudflare Worker GitHub OAuth 认证服务，提供 `/auth`、`/callback`。部署前需在 Cloudflare 中配置 Worker 的 `GITHUB_OAUTH_ID` 和 `GITHUB_OAUTH_SECRET` 两个 Secret；GitHub OAuth App 的回调地址应为 Worker 的 `https://...workers.dev/callback`。密钥只能放在 Worker secrets 中，不能提交到仓库或配置 JSON。部署后将 Worker 的 HTTPS origin 写入 `admin/auth.json` 的 `base_url`。

后台仅允许有仓库写权限的 GitHub 账号。`publish_mode: editorial_workflow` 让新文章先存为草稿，发布时合并到 main 并触发部署。草稿不出现在网站首页，但存储在公开仓库的分支/PR 内，不是私密日记。

文章正文用 Markdown。封面与正文图片上传至 `/assets/uploads/`；构建器仅接受该站 `/assets/` 下的图片路径。不要上传身份证件等隐私文件，照片先移除定位信息。发布后需要等待 GitHub Actions 构建完成。

## 免费部署目标

GitHub Pages 仓库名：

```text
littlesweetdot122333.github.io
```

部署后地址：

```text
https://littlesweetdot122333.github.io
```

接通认证后，日常文章修改在网页后台完成，不再手工修改旧 HTML。

## 更新 Coffeee本尊

在后台左侧打开 **Coffeee本尊 → 猫咪相册与视频**，可以修改简介、栏目封面，以及添加、删除或调整照片与视频的顺序。每项选择“照片”或“视频”，填写标题并上传文件；视频建议使用 MP4，可另上传封面照片。缩略图和尺寸可留空，网页会直接显示上传的照片。保存草稿并发布后，等待 GitHub Actions 部署完成。

相册支持放大、方向键切换和照片/视频筛选；视频点击后播放，不自动下载全部视频。仅放 Coffeee 的实拍素材，不确定属于谁的猫先不要加入。

HOME 仅展示封面照片与 `Coffeee` 的输入、删除循环。封面跟随“Coffeee本尊”的栏目封面；若选择了相册缩略图，构建时会自动使用对应大图。开启系统“减少动态效果”时显示静态文字。
