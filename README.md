# Little Sweet Blog

新版是简洁个人博客，前台为 GitHub Pages，编辑后台为 Decap CMS。

## 文件说明

- 首页、分类文章列表（支持搜索）、旅行日记、关于我。
- 浅色 / 深色模式，手机布局。
- `content/articles/*.json`：文章，正文为 Markdown。
- `content/travel/*.json`：旅行日记，可包含地点、封面及正文图片。
- `content/settings.json`：首页标题、简介与关于我。
- `admin/`：中文网页编辑后台，GitHub 登录。
- `assets/uploads/`：后台上传的照片。仓库公开，内容及 Git 历史可被公众访问。
- 旧文章链接 `/posts/hello.html`、`/posts/network-note.html` 保留。

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

## 后台认证（尚待接通）

访问 `https://coffeee.xyz/admin/`。`admin/auth.json` 的 `base_url` 为空时，会明确提示登录服务未连接。

计划用 Cloudflare Worker 托管 GitHub OAuth 认证端点（`/auth`、`/callback`）。需要用户完成 Cloudflare 注册及 GitHub OAuth App 授权配置。密钥只能放在 Worker secrets 中，不能提交到仓库或配置 JSON。连接后将 Worker 的 HTTPS origin 写入 `base_url`。

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
