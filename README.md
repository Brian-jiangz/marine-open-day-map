# 2026 海洋科学开放日 · 网页地图

从小程序公众导览中独立出的静态网页版，可直接部署到 GitHub Pages。页面包含：

- 在线地图：<https://brian-jiangz.github.io/marine-open-day-map/guide/>
- GitHub 仓库：<https://github.com/Brian-jiangz/marine-open-day-map>
- 校园总览及周隆泉楼、希平楼、金泉楼三栋场馆地图
- 102 个可点击点位及分组点位详情
- 编号、名称、楼层、篇章大类搜索
- 地图滚轮/双击/双指缩放、拖动浏览、全屏模式和点位自动居中
- 与小程序独立公众地图 `pages/map-view/map-view` 对齐的浅蓝页头、吸顶搜索与切楼、纵向地图和卡片布局
- 临时医疗室标记
- 音乐盲盒：共享原始活动内容与时间规则，仅在当前页面内开启
- 地图下方的篇章大类筛选与可展开点位目录
- 中文 / English 切换
- 关怀版大字号与大触区
- 手机深链：`?building=xp&spot=43&lang=zh`

## 本地运行

```bash
npm install
npm run build:data
npm run build:release
npm run serve
```

浏览器打开 `http://127.0.0.1:4173/`。

## 同步小程序地图数据

默认读取同级目录：

```text
../volunteer-miniprogram/miniprogram
```

也可以显式指定：

```bash
MINIPROGRAM_ROOT=/path/to/volunteer-miniprogram/miniprogram npm run build:data
```

生成文件为 `data/map.json`，同时复制 8 张中英文校园与单楼总览图到 `assets/map/`。

## 二维码

默认指向：

```text
https://brian-jiangz.github.io/marine-open-day-map/guide/
```

重新生成：

```bash
QR_URL=https://example.com/path/ npm run build:qr
```

输出 `qr-code.png` 和 `qr-code.svg`，可在 [qr.html](qr.html) 中直接展示。

![地图二维码](qr-code.png)

## 验证

```bash
npm run test:e2e
```

使用本机 Google Chrome 对 320 / 390 / 768 / 1280px 视口进行渲染、搜索、楼栋切换、医疗标记、分类筛选、地图全屏与拖动、详情弹窗、中英文和关怀版回归，并检查音乐盲盒时序、二维码和点位深链。

所有浏览偏好及盲盒开启状态仅保留在当前页面内存；网页只读取随站点发布的公共资源，不接入小程序身份、留言、点赞、报名或统计写入。未接入的后台统计不显示。

校园高清图优先从小程序项目的 `docs/campus-map-20261112/` 读取，可用 `CAMPUS_MAP_ASSET_ROOT` 指定目录；不存在时使用包内校园图。已生成的 `data/map.json`、`music.js` 和图片均纳入仓库，线上运行不依赖小程序项目。

发布前运行 `npm run build:release`：生成 `/guide/` 独立入口与按内容命名的样式、脚本文件，避免内置浏览器把旧界面与新数据混用。原根地址在取得新页面后会跳转到新入口，并保留点位和语言参数；已经缓存的旧 HTML 无法由服务端即时替换，可直接使用 `/guide/` 链接打开。
