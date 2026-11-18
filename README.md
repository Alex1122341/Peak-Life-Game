# 浮世一生 · 古风人生模拟游戏

**原创、免费、无广告的手机网页游戏**，支持 iPhone Safari、Android 和电脑浏览器。非《开局已是巅峰》的官方游戏，不复制其受版权保护的剧情与美术。

- 在线游戏地址（**GitHub Pages 发布成功后**）：https://alex1122341.github.io/Peak-Life-Game/
- 源码：`index.html`（单文件，包含 HTML、CSS 与 JavaScript）
- 免费，不需要登录、观看广告或安装 App。

## 主要玩法
- 四种出身与天赋，自定义姓名，六大职业和升级路线。
- 30 种带多种选择的随机事件；年度行动与数值成长。
- 产业、宅院、宝物、门客、婚姻子嗣、家族继承。
- 人生结局、成就图鉴、史书记录。
- 自动存档及 JSON 存档导入与导出。

## 首次启用 GitHub Pages（只需一次）

GitHub Actions 自动部署脚本已配置为 `.github/workflows/pages.yml`，**需要 Pages 发布来源设为 GitHub Actions**，不能选「Deploy from a branch」。

1. 打开 [仓库 Settings → Pages](https://github.com/Alex1122341/Peak-Life-Game/settings/pages)。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 访问 [Actions → Deploy game to GitHub Pages](https://github.com/Alex1122341/Peak-Life-Game/actions/workflows/pages.yml)，找到失败的运行，点 **Re-run jobs**。也可再次编辑并提交任意文件触发部署。
4. 看到绿色对勾后，在 iPhone Safari 打开 https://alex1122341.github.io/Peak-Life-Game/ 。

> 如果出现 “Get Pages site failed … Not Found”，说明 Pages 没有启用。仓库 GitHub App 连接器无法替代仓库管理员修改 Pages 设置。

## iPhone 使用
Safari 打开网站 →「分享」→「添加到主屏幕」。游戏进度保存在当前浏览器，本机清除 Safari 网站数据可能删除进度；可以在游戏设置中导出 JSON 备份。

## 验证与授权
通过 Node.js 语法检查和模拟 DOM 逻辑测试，尚未在真实 iPhone 上验证。原创新游戏；源码采用 MIT License，不含第三方统计、广告或外部 API。
