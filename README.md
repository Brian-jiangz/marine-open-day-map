# 2026 海洋科学开放日 · 网页地图

从小程序公众导览中独立出的静态网页版，可直接部署到 GitHub Pages。页面包含：

- 周隆泉楼、希平楼、金泉楼三栋场馆地图
- 101 个可点击点位及分组点位详情
- 编号、名称、楼层、篇章大类搜索
- 中文 / English 切换
- 关怀版大字号与大触区
- 手机深链：`?building=xp&spot=43&lang=zh`

## 本地运行

```bash
npm install
npm run build:data
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

生成文件为 `data/map.json`，同时复制 6 张中英文单楼总览图到 `assets/map/`。

## 二维码

默认指向：

```text
https://brian-jiangz.github.io/marine-open-day-map/
```

重新生成：

```bash
QR_URL=https://example.com/path/ npm run build:qr
```

输出 `qr-code.png` 和 `qr-code.svg`，可在 [qr.html](qr.html) 中直接展示。

## 验证

```bash
npm run test:e2e
```

使用本机 Google Chrome 对手机与桌面视口进行渲染、搜索、楼栋切换、详情弹窗、中英文和关怀版回归。
